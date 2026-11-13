import React, { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  limit,
} from 'firebase/firestore';
import {
  Users,
  Lock,
  Unlock,
  Plus,
  LogIn,
  LogOut,
  Send,
  Trash2,
  VolumeX,
  Volume2,
  Shield,
  PenTool,
  Eraser,
  Copy,
  Check,
  KeyRound,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType, signInWithGoogle, signOutUser } from '../firebase';
import { MathRenderer } from './MathRenderer';

interface StudyRoom {
  id: string;
  title: string;
  subject: string;
  description?: string;
  visibility: 'public' | 'private';
  ownerId: string;
  ownerName: string;
  roomCode: string;
  whiteboardLocked: boolean;
  status: 'active' | 'closed';
}

interface RoomMember {
  uid: string;
  displayName: string;
  role: 'owner' | 'moderator' | 'member';
  muted: boolean;
}

interface RoomMessage {
  id: string;
  roomId: string;
  authorId: string;
  authorName: string;
  type: 'chat' | 'question' | 'solution';
  content: string;
  latex?: string;
}

interface WhiteboardStroke {
  id: string;
  roomId: string;
  authorId: string;
  authorName: string;
  tool: 'pen' | 'eraser' | 'line' | 'rect' | 'circle' | 'text';
  color: string;
  width: number;
  points: number[];
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function generateDocId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8).replace(/[^a-zA-Z0-9]/g, 'x')}`;
}

export const CollaborativeStudyRoomView: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');

  // Lobby state
  const [publicRooms, setPublicRooms] = useState<StudyRoom[]>([]);
  const [myRooms, setMyRooms] = useState<StudyRoom[]>([]);
  const [roomTitle, setRoomTitle] = useState<string>('');
  const [roomSubject, setRoomSubject] = useState<string>('Mathematics');
  const [roomDesc, setRoomDesc] = useState<string>('');
  const [roomVisibility, setRoomVisibility] = useState<'public' | 'private'>('public');
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [lobbyBusy, setLobbyBusy] = useState<boolean>(false);
  const [lobbyError, setLobbyError] = useState<string>('');

  // Active Room state
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [activeRoom, setActiveRoom] = useState<StudyRoom | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [strokes, setStrokes] = useState<WhiteboardStroke[]>([]);
  const [codeCopied, setCodeCopied] = useState<boolean>(false);

  // Composer state
  const [msgType, setMsgType] = useState<'chat' | 'question' | 'solution'>('question');
  const [msgText, setMsgText] = useState<string>('');
  const [msgLatex, setMsgLatex] = useState<string>('');
  const [roomError, setRoomError] = useState<string>('');

  // Collaborative Board state
  const boardRef = useRef<HTMLCanvasElement | null>(null);
  const currentPtsRef = useRef<number[]>([]);
  const isDrawingRef = useRef<boolean>(false);
  const [wbTool, setWbTool] = useState<'pen' | 'eraser'>('pen');
  const [wbColor, setWbColor] = useState<string>('#22C55E');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Lobby listeners (gated strictly on authReady && user)
  useEffect(() => {
    if (!authReady || !user) {
      setPublicRooms([]);
      setMyRooms([]);
      return;
    }

    const qPublic = query(
      collection(db, 'study_rooms'),
      where('visibility', '==', 'public'),
      limit(20)
    );
    const unsubPub = onSnapshot(
      qPublic,
      (snap) => {
        const list = snap.docs
          .map((d) => d.data() as StudyRoom)
          .filter((r) => r.status === 'active');
        setPublicRooms(list);
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, 'study_rooms');
        } catch (e: any) {
          setLobbyError('Unable to load public study rooms.');
        }
      }
    );

    const qMine = query(
      collection(db, 'study_rooms'),
      where('ownerId', '==', user.uid),
      limit(20)
    );
    const unsubMine = onSnapshot(
      qMine,
      (snap) => {
        setMyRooms(snap.docs.map((d) => d.data() as StudyRoom));
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, 'study_rooms');
        } catch {
          // handled above
        }
      }
    );

    return () => {
      unsubPub();
      unsubMine();
    };
  }, [authReady, user]);

  // Active Room Listeners
  useEffect(() => {
    if (!authReady || !user || !activeRoomId) {
      setActiveRoom(null);
      setMembers([]);
      setMessages([]);
      setStrokes([]);
      return;
    }

    const roomPath = `study_rooms/${activeRoomId}`;
    const unsubRoom = onSnapshot(
      doc(db, 'study_rooms', activeRoomId),
      (snap) => {
        if (!snap.exists()) {
          setActiveRoomId(null);
          return;
        }
        setActiveRoom(snap.data() as StudyRoom);
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.GET, roomPath);
        } catch {
          setRoomError('Access to room was denied or room no longer exists.');
          setActiveRoomId(null);
        }
      }
    );

    const unsubMembers = onSnapshot(
      collection(db, 'study_rooms', activeRoomId, 'members'),
      (snap) => {
        setMembers(snap.docs.map((d) => d.data() as RoomMember));
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, `${roomPath}/members`);
        } catch {
          // ignore
        }
      }
    );

    const qMsgs = query(
      collection(db, 'study_rooms', activeRoomId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(80)
    );
    const unsubMsgs = onSnapshot(
      qMsgs,
      (snap) => {
        setMessages(snap.docs.map((d) => d.data() as RoomMessage));
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, `${roomPath}/messages`);
        } catch {
          // ignore
        }
      }
    );

    const qStrokes = query(
      collection(db, 'study_rooms', activeRoomId, 'strokes'),
      orderBy('createdAt', 'asc'),
      limit(180)
    );
    const unsubStrokes = onSnapshot(
      qStrokes,
      (snap) => {
        setStrokes(snap.docs.map((d) => d.data() as WhiteboardStroke));
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, `${roomPath}/strokes`);
        } catch {
          // ignore
        }
      }
    );

    return () => {
      unsubRoom();
      unsubMembers();
      unsubMsgs();
      unsubStrokes();
    };
  }, [authReady, user, activeRoomId]);

  // Redraw collaborative whiteboard whenever synced strokes update
  useEffect(() => {
    const c = boardRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0B1117';
    ctx.fillRect(0, 0, c.width, c.height);

    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let x = 40; x < c.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, c.height);
      ctx.stroke();
    }
    for (let y = 40; y < c.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(c.width, y);
      ctx.stroke();
    }

    strokes.forEach((st) => {
      if (!Array.isArray(st.points) || st.points.length < 2) return;
      ctx.save();
      ctx.strokeStyle = st.tool === 'eraser' ? '#0B1117' : st.color || '#22C55E';
      ctx.lineWidth = st.tool === 'eraser' ? 18 : st.width || 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(st.points[0], st.points[1]);
      for (let i = 2; i < st.points.length; i += 2) {
        ctx.lineTo(st.points[i], st.points[i + 1]);
      }
      ctx.stroke();
      ctx.restore();
    });
  }, [strokes, activeRoomId]);

  const handleGoogleLogin = async () => {
    setAuthError('');
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setAuthError(err?.message || 'Sign-in was cancelled or failed.');
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !roomTitle.trim() || lobbyBusy) return;
    setLobbyBusy(true);
    setLobbyError('');

    const roomId = generateDocId('room');
    const code = generateRoomCode();
    const cleanName = (user.displayName || 'Student').slice(0, 90);

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'study_rooms', roomId), {
        id: roomId,
        title: roomTitle.trim().slice(0, 120),
        subject: roomSubject.trim().slice(0, 60),
        description: roomDesc.trim().slice(0, 400),
        visibility: roomVisibility,
        ownerId: user.uid,
        ownerName: cleanName,
        roomCode: code,
        whiteboardLocked: false,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      batch.set(doc(db, 'room_invites', code), {
        roomId,
        ownerId: user.uid,
        visibility: roomVisibility,
        title: roomTitle.trim().slice(0, 120),
        subject: roomSubject.trim().slice(0, 60),
        createdAt: serverTimestamp(),
      });
      await batch.commit();

      // Step 2: Create owner member doc after room doc commits so exists(roomPath) succeeds
      await setDoc(doc(db, 'study_rooms', roomId, 'members', user.uid), {
        uid: user.uid,
        displayName: cleanName,
        role: 'owner',
        muted: false,
        joinedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setRoomTitle('');
      setRoomDesc('');
      setActiveRoomId(roomId);
    } catch (err: any) {
      try {
        handleFirestoreError(err, OperationType.CREATE, `study_rooms/${roomId}`);
      } catch {
        setLobbyError(err?.message || 'Failed to create study room.');
      }
    } finally {
      setLobbyBusy(false);
    }
  };

  const handleJoinPublicRoom = async (room: StudyRoom) => {
    if (!user || lobbyBusy) return;
    setLobbyBusy(true);
    setLobbyError('');

    try {
      const memberRef = doc(db, 'study_rooms', room.id, 'members', user.uid);
      const existingMem = await getDoc(memberRef);
      if (!existingMem.exists()) {
        const cleanName = (user.displayName || 'Student').slice(0, 90);
        await setDoc(memberRef, {
          uid: user.uid,
          displayName: cleanName,
          role: room.ownerId === user.uid ? 'owner' : 'member',
          muted: false,
          joinedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      setActiveRoomId(room.id);
    } catch (err: any) {
      setLobbyError(err?.message || 'Could not join room.');
    } finally {
      setLobbyBusy(false);
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCodeInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!user || code.length < 4 || lobbyBusy) return;

    setLobbyBusy(true);
    setLobbyError('');
    try {
      const inviteSnap = await getDoc(doc(db, 'room_invites', code));
      if (!inviteSnap.exists()) {
        setLobbyError('Invalid or expired room invite code.');
        setLobbyBusy(false);
        return;
      }
      const { roomId, ownerId } = inviteSnap.data() as { roomId: string; ownerId: string };
      const memberRef = doc(db, 'study_rooms', roomId, 'members', user.uid);
      const memSnap = await getDoc(memberRef);
      if (!memSnap.exists()) {
        await setDoc(memberRef, {
          uid: user.uid,
          displayName: (user.displayName || 'Student').slice(0, 90),
          role: ownerId === user.uid ? 'owner' : 'member',
          muted: false,
          inviteCode: code,
          joinedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      setJoinCodeInput('');
      setActiveRoomId(roomId);
    } catch (err: any) {
      setLobbyError(err?.message || 'Unable to join room with that code.');
    } finally {
      setLobbyBusy(false);
    }
  };

  const myMember = members.find((m) => m.uid === user?.uid);
  const isOwner = Boolean(user && activeRoom && activeRoom.ownerId === user.uid);
  const isMod = Boolean(isOwner || myMember?.role === 'moderator');
  const isMuted = Boolean(myMember?.muted && !isOwner);
  const boardBlocked = Boolean(activeRoom?.whiteboardLocked && !isMod) || activeRoom?.status === 'closed' || isMuted;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeRoom || !msgText.trim() || isMuted || activeRoom.status === 'closed') return;
    setRoomError('');
    const msgId = generateDocId('msg');
    const cleanName = (user.displayName || 'Student').slice(0, 90);
    try {
      const payload: any = {
        id: msgId,
        roomId: activeRoom.id,
        authorId: user.uid,
        authorName: cleanName,
        type: msgType,
        content: msgText.trim().slice(0, 2000),
        createdAt: serverTimestamp(),
      };
      if (msgLatex.trim()) {
        payload.latex = msgLatex.trim().slice(0, 1000);
      }
      await setDoc(doc(db, 'study_rooms', activeRoom.id, 'messages', msgId), payload);
      setMsgText('');
      setMsgLatex('');
    } catch (err: any) {
      setRoomError(err?.message || 'Unable to post message (check permissions or mute state).');
    }
  };

  const handleToggleLockBoard = async () => {
    if (!activeRoom || !isMod) return;
    try {
      await updateDoc(doc(db, 'study_rooms', activeRoom.id), {
        whiteboardLocked: !activeRoom.whiteboardLocked,
        updatedAt: serverTimestamp(),
      });
    } catch (err: any) {
      setRoomError(err?.message || 'Failed to toggle whiteboard lock.');
    }
  };

  const handleToggleMuteMember = async (member: RoomMember) => {
    if (!activeRoom || !isMod || member.role === 'owner') return;
    try {
      await updateDoc(doc(db, 'study_rooms', activeRoom.id, 'members', member.uid), {
        muted: !member.muted,
        updatedAt: serverTimestamp(),
      });
    } catch (err: any) {
      setRoomError(err?.message || 'Failed to update mute status.');
    }
  };

  const handleToggleModerator = async (member: RoomMember) => {
    if (!activeRoom || !isOwner || member.role === 'owner') return;
    try {
      await updateDoc(doc(db, 'study_rooms', activeRoom.id, 'members', member.uid), {
        role: member.role === 'moderator' ? 'member' : 'moderator',
        updatedAt: serverTimestamp(),
      });
    } catch (err: any) {
      setRoomError(err?.message || 'Failed to change member role.');
    }
  };

  const handleKickMember = async (member: RoomMember) => {
    if (!activeRoom || !isMod || member.role === 'owner') return;
    try {
      await deleteDoc(doc(db, 'study_rooms', activeRoom.id, 'members', member.uid));
    } catch (err: any) {
      setRoomError(err?.message || 'Failed to remove participant.');
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!activeRoom) return;
    try {
      await deleteDoc(doc(db, 'study_rooms', activeRoom.id, 'messages', msgId));
    } catch (err: any) {
      setRoomError(err?.message || 'Failed to delete message.');
    }
  };

  const handleCloseRoom = async () => {
    if (!activeRoom || !isOwner) return;
    try {
      await updateDoc(doc(db, 'study_rooms', activeRoom.id), {
        status: 'closed',
        updatedAt: serverTimestamp(),
      });
    } catch (err: any) {
      setRoomError(err?.message || 'Failed to close room.');
    }
  };

  // Board drawing handlers synced to Firestore
  const getBoardPt = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = boardRef.current!;
    const rect = c.getBoundingClientRect();
    return [
      Math.round(((e.clientX - rect.left) / rect.width) * c.width),
      Math.round(((e.clientY - rect.top) / rect.height) * c.height),
    ];
  };

  const onBoardDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (boardBlocked || !boardRef.current) return;
    boardRef.current.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const [x, y] = getBoardPt(e);
    currentPtsRef.current = [x, y];
  };

  const onBoardMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || boardBlocked || !boardRef.current) return;
    const ctx = boardRef.current.getContext('2d');
    if (!ctx) return;
    const [x, y] = getBoardPt(e);
    const pts = currentPtsRef.current;
    if (pts.length >= 380) return; // stay under rule bound <= 400 numbers

    const px = pts[pts.length - 2];
    const py = pts[pts.length - 1];
    ctx.save();
    ctx.strokeStyle = wbTool === 'eraser' ? '#0B1117' : wbColor;
    ctx.lineWidth = wbTool === 'eraser' ? 18 : 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.restore();
    pts.push(x, y);
  };

  const onBoardUp = async (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    try {
      boardRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    const pts = currentPtsRef.current;
    currentPtsRef.current = [];
    if (!user || !activeRoom || pts.length < 2 || boardBlocked) return;

    const strokeId = generateDocId('stk');
    try {
      await setDoc(doc(db, 'study_rooms', activeRoom.id, 'strokes', strokeId), {
        id: strokeId,
        roomId: activeRoom.id,
        authorId: user.uid,
        authorName: (user.displayName || 'Student').slice(0, 90),
        tool: wbTool,
        color: wbColor,
        width: wbTool === 'eraser' ? 18 : 3,
        points: pts.slice(0, 400),
        createdAt: serverTimestamp(),
      });
    } catch (err: any) {
      setRoomError(err?.message || 'Unable to sync whiteboard stroke.');
    }
  };

  const handleClearSyncedBoard = async () => {
    if (!activeRoom || !isMod) return;
    try {
      const batch = writeBatch(db);
      strokes.forEach((s) => {
        batch.delete(doc(db, 'study_rooms', activeRoom.id, 'strokes', s.id));
      });
      await batch.commit();
    } catch (err: any) {
      setRoomError(err?.message || 'Unable to clear synced board strokes.');
    }
  };

  if (!authReady) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-12 flex items-center justify-center gap-2 text-sm text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin text-[#22C55E]" />
        <span>Initializing Collaborative Study Session...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-8 sm:p-10 max-w-xl mx-auto text-center space-y-5">
        <div className="w-12 h-12 rounded-2xl bg-[#22C55E]/15 border border-[#22C55E]/30 flex items-center justify-center mx-auto text-[#22C55E]">
          <Users className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Collaborative Study Rooms</h2>
          <p className="text-sm text-slate-500 dark:text-[#A1A1AA]">
            Sign in with your Google account to create public or private study rooms, share formatted math questions, draw on a real-time synchronized whiteboard, and manage room moderation.
          </p>
        </div>
        {authError && (
          <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs">
            {authError}
          </div>
        )}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="px-6 py-3 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          <span>Sign In with Google to Collaborate</span>
        </button>
      </div>
    );
  }

  // Active Room Workspace
  if (activeRoomId && activeRoom) {
    return (
      <div className="space-y-5">
        {/* Room Header */}
        <section className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-slate-500 dark:text-[#A1A1AA]">
              {activeRoom.subject} · {activeRoom.visibility === 'private' ? 'Private Room' : 'Public Room'} · Host: {activeRoom.ownerName}
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{activeRoom.title}</h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(activeRoom.roomCode);
                  setCodeCopied(true);
                  setTimeout(() => setCodeCopied(false), 1800);
                } catch {
                  // ignore
                }
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#27272A] text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
            >
              {codeCopied ? <Check className="w-3.5 h-3.5 text-[#22C55E]" /> : <Copy className="w-3.5 h-3.5 text-[#22C55E]" />}
              <span>Code: {activeRoom.roomCode}</span>
            </button>

            {isMod && (
              <button
                type="button"
                onClick={handleToggleLockBoard}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#27272A] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                {activeRoom.whiteboardLocked ? <Lock className="w-3.5 h-3.5 text-amber-500" /> : <Unlock className="w-3.5 h-3.5 text-[#22C55E]" />}
                <span>{activeRoom.whiteboardLocked ? 'Unlock Board' : 'Lock Board'}</span>
              </button>
            )}

            {isOwner && activeRoom.status === 'active' && (
              <button
                type="button"
                onClick={handleCloseRoom}
                className="px-3 py-2 rounded-xl border border-rose-500/40 text-rose-500 text-xs font-semibold cursor-pointer hover:bg-rose-500/10"
              >
                Close Room
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveRoomId(null)}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#18181B] text-xs font-semibold cursor-pointer"
            >
              Lobby
            </button>
          </div>
        </section>

        {roomError && (
          <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{roomError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          {/* Synchronized Collaborative Whiteboard */}
          <div className="xl:col-span-7 rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setWbTool('pen')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                    wbTool === 'pen' ? 'bg-[#22C55E] text-white' : 'border border-slate-200 dark:border-[#27272A]'
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Pen</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWbTool('eraser')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                    wbTool === 'eraser' ? 'bg-[#22C55E] text-white' : 'border border-slate-200 dark:border-[#27272A]'
                  }`}
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Eraser</span>
                </button>
                {['#22C55E', '#38BDF8', '#F59E0B', '#FFFFFF'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setWbColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-5 h-5 rounded-full border cursor-pointer ${
                      wbColor === c ? 'ring-2 ring-[#22C55E]' : 'border-slate-400'
                    }`}
                  />
                ))}
              </div>
              {isMod && (
                <button
                  type="button"
                  onClick={handleClearSyncedBoard}
                  className="text-xs font-semibold text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Board</span>
                </button>
              )}
            </div>

            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-[#27272A] relative">
              <canvas
                ref={boardRef}
                width={720}
                height={400}
                onPointerDown={onBoardDown}
                onPointerMove={onBoardMove}
                onPointerUp={onBoardUp}
                onPointerCancel={onBoardUp}
                className={`w-full h-auto block touch-none ${boardBlocked ? 'cursor-not-allowed' : 'cursor-crosshair'}`}
              />
            </div>

            <div className="text-xs text-slate-500 dark:text-[#A1A1AA]">
              {activeRoom.status === 'closed'
                ? 'This room is closed (read-only archive).'
                : activeRoom.whiteboardLocked && !isMod
                ? 'Whiteboard is locked by the host/moderator.'
                : isMuted
                ? 'You are muted by a moderator.'
                : `Shared Canvas Active · ${strokes.length} synced strokes`}
            </div>
          </div>

          {/* Right: Shared Questions, Chat & Participants Moderation */}
          <div className="xl:col-span-5 space-y-5">
            {/* Messages & Questions Stream */}
            <div className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-4 space-y-3">
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Shared Questions & Discussion ({messages.length})
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {messages.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">
                    No messages yet. Post a question or equation below to start collaborating!
                  </p>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className="rounded-xl border border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#121216] p-3 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {m.authorName} · <span className="text-[#22C55E] capitalize">{m.type}</span>
                        </span>
                        {(isMod || m.authorId === user.uid) && (
                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(m.id)}
                            className="text-slate-400 hover:text-rose-500 cursor-pointer"
                            title="Delete post"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-slate-700 dark:text-zinc-300">{m.content}</p>
                      {m.latex && (
                        <div className="pt-1 overflow-x-auto">
                          <MathRenderer content={`$$${m.latex.replace(/^\$\$|\$\$$/g, '')}$$`} />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {activeRoom.status === 'active' && !isMuted && (
                <form onSubmit={handleSendMessage} className="space-y-2 pt-2 border-t border-slate-200 dark:border-[#27272A]">
                  <div className="flex gap-1.5">
                    {(['question', 'solution', 'chat'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setMsgType(t)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize cursor-pointer ${
                          msgType === t ? 'bg-[#22C55E] text-white' : 'bg-slate-100 dark:bg-[#18181B]'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={msgText}
                    onChange={(e) => setMsgText(e.target.value)}
                    placeholder="Share a question, explanation, or discussion point..."
                    className="w-full rounded-xl border border-slate-200 dark:border-[#27272A] px-3 py-2 text-xs"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={msgLatex}
                      onChange={(e) => setMsgLatex(e.target.value)}
                      placeholder="Optional LaTeX formula (e.g. \frac{-b \pm \sqrt{b^2-4ac}}{2a})"
                      className="flex-1 rounded-xl border border-slate-200 dark:border-[#27272A] px-3 py-2 text-xs font-mono"
                    />
                    <button
                      type="submit"
                      disabled={!msgText.trim()}
                      className="px-4 py-2 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Post</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Participants & Moderation */}
            <div className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-4 space-y-3">
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#22C55E]" />
                <span>Participants ({members.length})</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {members.map((mem) => (
                  <div
                    key={mem.uid}
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-[#27272A] px-3 py-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 dark:text-white truncate">
                        {mem.displayName} {mem.uid === user.uid ? '(You)' : ''}
                      </div>
                      <div className="text-[11px] text-slate-500 capitalize">
                        {mem.role} {mem.muted ? '· Muted' : ''}
                      </div>
                    </div>
                    {isMod && mem.role !== 'owner' && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleMuteMember(mem)}
                          title={mem.muted ? 'Unmute' : 'Mute'}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-[#27272A] hover:bg-slate-100 dark:hover:bg-[#18181B] cursor-pointer"
                        >
                          {mem.muted ? <Volume2 className="w-3.5 h-3.5 text-[#22C55E]" /> : <VolumeX className="w-3.5 h-3.5 text-amber-500" />}
                        </button>
                        {isOwner && (
                          <button
                            type="button"
                            onClick={() => handleToggleModerator(mem)}
                            title={mem.role === 'moderator' ? 'Demote Moderator' : 'Make Moderator'}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-[#27272A] hover:bg-slate-100 dark:hover:bg-[#18181B] cursor-pointer"
                          >
                            <Shield className={`w-3.5 h-3.5 ${mem.role === 'moderator' ? 'text-[#22C55E]' : 'text-slate-400'}`} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleKickMember(mem)}
                          title="Remove from room"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-[#27272A] text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Lobby View
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Collaborative Study Rooms
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-[#A1A1AA] mt-0.5">
            Signed in as <strong>{user.displayName || 'Student'}</strong> · Create private or public rooms with synchronized whiteboards and moderation.
          </p>
        </div>
        <button
          type="button"
          onClick={() => signOutUser()}
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#27272A] text-xs font-semibold flex items-center gap-1.5 cursor-pointer self-start"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </section>

      {lobbyError && (
        <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{lobbyError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Create Room & Join by Invite Code */}
        <div className="lg:col-span-5 space-y-5">
          <form onSubmit={handleCreateRoom} className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-5 space-y-3.5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#22C55E]" />
              <span>Create Study Room</span>
            </h3>
            <input
              type="text"
              value={roomTitle}
              onChange={(e) => setRoomTitle(e.target.value)}
              placeholder="Room Title (e.g. JUPEB Physics Mechanics Drill)"
              className="w-full rounded-xl border border-slate-200 dark:border-[#27272A] px-3.5 py-2 text-xs sm:text-sm"
              required
            />
            <div className="grid grid-cols-2 gap-2.5">
              <select
                value={roomSubject}
                onChange={(e) => setRoomSubject(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-[#27272A] px-3 py-2 text-xs font-semibold"
              >
                <option>Mathematics</option>
                <option>Physics</option>
                <option>Chemistry</option>
                <option>Biology</option>
                <option>General STEM</option>
              </select>
              <select
                value={roomVisibility}
                onChange={(e) => setRoomVisibility(e.target.value as 'public' | 'private')}
                className="rounded-xl border border-slate-200 dark:border-[#27272A] px-3 py-2 text-xs font-semibold"
              >
                <option value="public">Public Room</option>
                <option value="private">Private (Invite Code)</option>
              </select>
            </div>
            <textarea
              rows={2}
              value={roomDesc}
              onChange={(e) => setRoomDesc(e.target.value)}
              placeholder="Optional study agenda..."
              className="w-full rounded-xl border border-slate-200 dark:border-[#27272A] px-3.5 py-2 text-xs"
            />
            <button
              type="submit"
              disabled={lobbyBusy || !roomTitle.trim()}
              className="w-full py-2.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] disabled:opacity-50 text-white text-xs sm:text-sm font-bold cursor-pointer"
            >
              {lobbyBusy ? 'Creating Room...' : 'Launch Study Room'}
            </button>
          </form>

          <form onSubmit={handleJoinByCode} className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#22C55E]" />
              <span>Join Private / Coded Room</span>
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                placeholder="Enter 6-char code (e.g. A7K9P2)"
                className="flex-1 rounded-xl border border-slate-200 dark:border-[#27272A] px-3.5 py-2 text-xs sm:text-sm font-mono uppercase"
              />
              <button
                type="submit"
                disabled={lobbyBusy || joinCodeInput.trim().length < 4}
                className="px-4 py-2 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] disabled:opacity-40 text-white text-xs font-bold cursor-pointer"
              >
                Join
              </button>
            </div>
          </form>
        </div>

        {/* Public & My Rooms Directory */}
        <div className="lg:col-span-7 space-y-5">
          {myRooms.length > 0 && (
            <div className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Your Hosted Rooms</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {myRooms.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleJoinPublicRoom(r)}
                    className="text-left rounded-xl border border-slate-200 dark:border-[#27272A] p-3.5 hover:border-[#22C55E] transition-colors cursor-pointer space-y-1"
                  >
                    <div className="text-[11px] font-mono text-[#22C55E]">
                      {r.subject} · {r.visibility} · Code {r.roomCode}
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white truncate">{r.title}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Public Study Rooms</h3>
            {publicRooms.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No active public rooms yet. Create the first room on the left!
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {publicRooms.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleJoinPublicRoom(r)}
                    className="text-left rounded-xl border border-slate-200 dark:border-[#27272A] p-3.5 hover:border-[#22C55E] transition-colors cursor-pointer space-y-1"
                  >
                    <div className="text-[11px] text-slate-500">
                      {r.subject} · Host: {r.ownerName}
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white truncate">{r.title}</div>
                    {r.description && <p className="text-xs text-slate-500 line-clamp-1">{r.description}</p>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
