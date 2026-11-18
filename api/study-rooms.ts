import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { decode } from '@auth/core/jwt';

interface VerifiedUser {
  id: string;
  email: string | null;
  name: string | null;
}

export interface StudyRoomData {
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
  createdAtMs: number;
}

export interface RoomMemberData {
  uid: string;
  displayName: string;
  role: 'owner' | 'moderator' | 'member';
  muted: boolean;
}

export interface RoomMessageData {
  id: string;
  roomId: string;
  authorId: string;
  authorName: string;
  type: 'chat' | 'question' | 'solution';
  content: string;
  latex?: string;
  createdAtMs: number;
}

export interface WhiteboardStrokeData {
  id: string;
  roomId: string;
  authorId: string;
  authorName: string;
  tool: 'pen' | 'eraser' | 'line' | 'rect' | 'circle' | 'text';
  color: string;
  width: number;
  points: number[];
  createdAtMs: number;
}

export interface RoomQuizData {
  id: string;
  roomId: string;
  authorId: string;
  authorName: string;
  subject: string;
  topic: string;
  status: 'active' | 'finished';
  questions: any[];
  createdAtMs: number;
}

export interface QuizSubmissionData {
  uid: string;
  displayName: string;
  score: number;
  totalQuestions: number;
  timeTakenSec: number;
  answers: string[];
}

interface StoredRoomBundle {
  room: StudyRoomData;
  members: RoomMemberData[];
  messages: RoomMessageData[];
  strokes: WhiteboardStrokeData[];
  quizzes: RoomQuizData[];
  submissionsByQuiz: Record<string, QuizSubmissionData[]>;
}

interface RoomsStoreState {
  rooms: Record<string, StoredRoomBundle>;
  invites: Record<string, string>; // roomCode -> roomId
}

const EPHEMERAL_DEV_SECRET = crypto
  .createHash('sha256')
  .update(`smartsolve-local-dev-${process.cwd()}`)
  .digest('hex');

function getAuthSecret(): string {
  const configured =
    (process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || '').trim();
  if (configured) return configured;
  const isProd =
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL_ENV === 'production';
  return isProd ? '' : EPHEMERAL_DEV_SECRET;
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = v;
  }
  return out;
}

async function verifySessionUser(req: any): Promise<VerifiedUser | null> {
  const secret = getAuthSecret();
  if (!secret) return null;

  const cookies = parseCookies(typeof req?.headers?.cookie === 'string' ? req.headers.cookie : '');
  const names = [
    '__Secure-authjs.session-token',
    'authjs.session-token',
    '__Secure-next-auth.session-token',
    'next-auth.session-token',
  ];

  for (const name of names) {
    const raw = cookies[name];
    if (!raw) continue;
    let token = raw;
    try {
      token = decodeURIComponent(raw);
    } catch {
      token = raw;
    }
    try {
      const payload = await decode({ token, secret, salt: name });
      if (!payload) continue;
      const id = String(payload.id || payload.sub || payload.email || '').trim();
      if (!id) continue;
      return {
        id,
        email: typeof payload.email === 'string' ? payload.email : null,
        name: typeof payload.name === 'string' ? payload.name : null,
      };
    } catch {
      // try next
    }
  }
  return null;
}

let memoryState: RoomsStoreState | null = null;
const KV_ROOMS_KEY = 'smartsolve:study_rooms:v1';

function getRoomsFilePath(): string {
  if (process.env.VERCEL) return path.join('/tmp', 'smartsolve-study-rooms.json');
  return path.join(process.cwd(), '.data', 'smartsolve-study-rooms.json');
}

async function loadState(): Promise<RoomsStoreState> {
  const url = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '').trim();
  const token = (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
  if (url && token) {
    try {
      const resp = await fetch(`${url.replace(/\/+$/, '')}/get/${encodeURIComponent(KV_ROOMS_KEY)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.ok) {
        const data = (await resp.json()) as { result?: string | null };
        if (data?.result) {
          const parsed = JSON.parse(data.result);
          if (parsed && parsed.rooms) {
            memoryState = parsed;
            return parsed;
          }
        }
      }
    } catch {
      // fallback to local/memory
    }
  }

  try {
    const filePath = getRoomsFilePath();
    if (fs.existsSync(filePath)) {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (parsed && parsed.rooms) {
        memoryState = parsed;
        return parsed;
      }
    }
  } catch {
    // ignore
  }

  if (!memoryState) {
    memoryState = { rooms: {}, invites: {} };
  }
  return memoryState;
}

async function saveState(state: RoomsStoreState): Promise<void> {
  memoryState = state;
  try {
    const filePath = getRoomsFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(state), 'utf8');
  } catch {
    // ignore read-only fs errors
  }

  const url = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '').trim();
  const token = (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
  if (url && token) {
    try {
      await fetch(`${url.replace(/\/+$/, '')}/set/${encodeURIComponent(KV_ROOMS_KEY)}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(JSON.stringify(state)),
      });
    } catch {
      // ignore
    }
  }
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
}

function applyCors(req: any, res: any): boolean {
  const origin = typeof req?.headers?.origin === 'string' ? req.headers.origin : '';
  if (origin) {
    try {
      const parsed = new URL(origin);
      const host = parsed.hostname.toLowerCase();
      if (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        (parsed.protocol === 'https:' &&
          (host.endsWith('.vercel.app') || host.endsWith('.run.app')))
      ) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }
    } catch {
      // ignore
    }
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req?.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return true;
  }
  return false;
}

function isRoomMemberOrOwner(bundle: StoredRoomBundle, uid: string): boolean {
  return (
    bundle.room.ownerId === uid ||
    bundle.members.some((m) => m.uid === uid)
  );
}

function getMemberRole(bundle: StoredRoomBundle, uid: string): 'owner' | 'moderator' | 'member' | null {
  if (bundle.room.ownerId === uid) return 'owner';
  const mem = bundle.members.find((m) => m.uid === uid);
  return mem ? mem.role : null;
}

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  const user = await verifySessionUser(req);
  if (!user) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    return res.end(
      JSON.stringify({ error: 'Authentication required. Please sign in with Google.' })
    );
  }

  try {
    const state = await loadState();
    const method = String(req?.method || 'GET').toUpperCase();
    const displayName = (user.name || user.email?.split('@')[0] || 'Student').slice(0, 90);

    if (method === 'GET') {
      const urlObj = new URL(String(req?.originalUrl || req?.url || '/api/study-rooms'), 'http://localhost');
      const roomId = urlObj.searchParams.get('roomId') || (typeof req?.query?.roomId === 'string' ? req.query.roomId : '');

      if (roomId) {
        const bundle = state.rooms[roomId];
        if (!bundle) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Study room no longer exists.' }));
        }
        if (bundle.room.visibility === 'private' && !isRoomMemberOrOwner(bundle, user.id)) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Private room requires an invite code.' }));
        }

        const latestQuiz = bundle.quizzes[0] || null;
        const submissions = latestQuiz
          ? [...(bundle.submissionsByQuiz[latestQuiz.id] || [])].sort(
              (a, b) => b.score - a.score || a.timeTakenSec - b.timeTakenSec
            )
          : [];

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        return res.end(
          JSON.stringify({
            success: true,
            room: bundle.room,
            members: bundle.members,
            messages: bundle.messages,
            strokes: bundle.strokes,
            quizzes: bundle.quizzes,
            submissions,
          })
        );
      }

      const allBundles = Object.values(state.rooms);
      const publicRooms = allBundles
        .map((b) => b.room)
        .filter((r) => r.visibility === 'public' && r.status === 'active')
        .sort((a, b) => b.createdAtMs - a.createdAtMs)
        .slice(0, 20);
      const myRooms = allBundles
        .map((b) => b.room)
        .filter((r) => r.ownerId === user.id)
        .sort((a, b) => b.createdAtMs - a.createdAtMs)
        .slice(0, 20);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      return res.end(JSON.stringify({ success: true, publicRooms, myRooms }));
    }

    if (method === 'POST') {
      const body = req?.body || {};
      const action = String(body.action || '');

      if (action === 'create_room') {
        const title = String(body.title || '').trim().slice(0, 120);
        if (!title) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Room title is required.' }));
        }

        const roomId = generateId('room');
        let code = generateRoomCode();
        while (state.invites[code]) code = generateRoomCode();

        const visibility = body.visibility === 'private' ? 'private' : 'public';
        const room: StudyRoomData = {
          id: roomId,
          title,
          subject: String(body.subject || 'Mathematics').trim().slice(0, 60),
          description: String(body.description || '').trim().slice(0, 400),
          visibility,
          ownerId: user.id,
          ownerName: displayName,
          roomCode: code,
          whiteboardLocked: false,
          status: 'active',
          createdAtMs: Date.now(),
        };

        state.rooms[roomId] = {
          room,
          members: [{ uid: user.id, displayName, role: 'owner', muted: false }],
          messages: [],
          strokes: [],
          quizzes: [],
          submissionsByQuiz: {},
        };
        state.invites[code] = roomId;
        await saveState(state);

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true, room }));
      }

      if (action === 'join_room') {
        const roomId = String(body.roomId || '');
        const bundle = state.rooms[roomId];
        if (!bundle) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Study room not found.' }));
        }
        if (bundle.room.visibility === 'private' && !isRoomMemberOrOwner(bundle, user.id)) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Private room requires an invite code.' }));
        }
        if (!bundle.members.some((m) => m.uid === user.id)) {
          bundle.members.push({
            uid: user.id,
            displayName,
            role: bundle.room.ownerId === user.id ? 'owner' : 'member',
            muted: false,
          });
          await saveState(state);
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true, room: bundle.room }));
      }

      if (action === 'join_by_code') {
        const code = String(body.code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        const roomId = state.invites[code];
        if (!roomId || !state.rooms[roomId]) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Invalid or expired room invite code.' }));
        }
        const bundle = state.rooms[roomId];
        if (!bundle.members.some((m) => m.uid === user.id)) {
          bundle.members.push({
            uid: user.id,
            displayName,
            role: bundle.room.ownerId === user.id ? 'owner' : 'member',
            muted: false,
          });
          await saveState(state);
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true, roomId, room: bundle.room }));
      }

      const roomId = String(body.roomId || '');
      const bundle = state.rooms[roomId];
      if (!bundle) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: 'Study room not found.' }));
      }
      if (!isRoomMemberOrOwner(bundle, user.id)) {
        res.statusCode = 403;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: 'You are not a participant in this room.' }));
      }

      const role = getMemberRole(bundle, user.id);
      const isOwner = role === 'owner';
      const isMod = isOwner || role === 'moderator';
      const myMem = bundle.members.find((m) => m.uid === user.id);
      const isMuted = Boolean(myMem?.muted && !isOwner);

      if (action === 'post_message') {
        if (bundle.room.status === 'closed' || isMuted) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Posting is disabled (room closed or muted).' }));
        }
        const content = String(body.content || '').trim().slice(0, 2000);
        if (!content) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Message content is required.' }));
        }
        const msg: RoomMessageData = {
          id: generateId('msg'),
          roomId,
          authorId: user.id,
          authorName: displayName,
          type: ['chat', 'question', 'solution'].includes(body.type) ? body.type : 'question',
          content,
          latex: body.latex ? String(body.latex).trim().slice(0, 1000) : undefined,
          createdAtMs: Date.now(),
        };
        bundle.messages = [...bundle.messages, msg].slice(-80);
        await saveState(state);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true, message: msg }));
      }

      if (action === 'delete_message') {
        const msgId = String(body.msgId || '');
        const target = bundle.messages.find((m) => m.id === msgId);
        if (!target || (!isMod && target.authorId !== user.id)) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Permission denied.' }));
        }
        bundle.messages = bundle.messages.filter((m) => m.id !== msgId);
        await saveState(state);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true }));
      }

      if (action === 'add_stroke') {
        if (bundle.room.status === 'closed' || isMuted || (bundle.room.whiteboardLocked && !isMod)) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Whiteboard is locked or you are muted.' }));
        }
        const rawPoints = Array.isArray(body.points) ? body.points : [];
        const points = rawPoints
          .slice(0, 400)
          .map((n: any) => Number(n))
          .filter((n: number) => Number.isFinite(n));
        if (points.length < 2) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Invalid stroke points.' }));
        }
        const stroke: WhiteboardStrokeData = {
          id: generateId('stk'),
          roomId,
          authorId: user.id,
          authorName: displayName,
          tool: body.tool === 'eraser' ? 'eraser' : 'pen',
          color: String(body.color || '#22C55E').slice(0, 20),
          width: body.tool === 'eraser' ? 18 : 3,
          points,
          createdAtMs: Date.now(),
        };
        bundle.strokes = [...bundle.strokes, stroke].slice(-180);
        await saveState(state);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true, stroke }));
      }

      if (action === 'clear_board') {
        if (!isMod) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Only host or moderators can clear the board.' }));
        }
        bundle.strokes = [];
        await saveState(state);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true }));
      }

      if (action === 'toggle_lock_board') {
        if (!isMod) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Moderator permission required.' }));
        }
        bundle.room.whiteboardLocked = !bundle.room.whiteboardLocked;
        await saveState(state);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true, whiteboardLocked: bundle.room.whiteboardLocked }));
      }

      if (action === 'toggle_mute_member') {
        if (!isMod) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Moderator permission required.' }));
        }
        const targetUid = String(body.targetUid || '');
        const mem = bundle.members.find((m) => m.uid === targetUid);
        if (!mem || mem.role === 'owner') {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Cannot mute host.' }));
        }
        mem.muted = !mem.muted;
        await saveState(state);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true }));
      }

      if (action === 'toggle_moderator') {
        if (!isOwner) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Only host can promote moderators.' }));
        }
        const targetUid = String(body.targetUid || '');
        const mem = bundle.members.find((m) => m.uid === targetUid);
        if (!mem || mem.role === 'owner') {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Invalid member.' }));
        }
        mem.role = mem.role === 'moderator' ? 'member' : 'moderator';
        await saveState(state);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true }));
      }

      if (action === 'kick_member') {
        if (!isMod) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Moderator permission required.' }));
        }
        const targetUid = String(body.targetUid || '');
        const mem = bundle.members.find((m) => m.uid === targetUid);
        if (!mem || mem.role === 'owner') {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Cannot remove host.' }));
        }
        bundle.members = bundle.members.filter((m) => m.uid !== targetUid);
        await saveState(state);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true }));
      }

      if (action === 'close_room') {
        if (!isOwner) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Only host can close this room.' }));
        }
        bundle.room.status = 'closed';
        await saveState(state);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true }));
      }

      if (action === 'launch_quiz') {
        if (!isMod || bundle.room.status === 'closed') {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Moderator permission required.' }));
        }
        const questions = Array.isArray(body.questions) ? body.questions.slice(0, 10) : [];
        const quiz: RoomQuizData = {
          id: generateId('quiz'),
          roomId,
          authorId: user.id,
          authorName: displayName,
          subject: String(body.subject || 'Mathematics').slice(0, 60),
          topic: String(body.topic || 'Study Quiz').slice(0, 120),
          status: 'active',
          questions,
          createdAtMs: Date.now(),
        };
        bundle.quizzes = [quiz, ...bundle.quizzes].slice(0, 5);
        bundle.submissionsByQuiz[quiz.id] = [];
        await saveState(state);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true, quiz }));
      }

      if (action === 'submit_quiz') {
        const quizId = String(body.quizId || '');
        const quiz = bundle.quizzes.find((q) => q.id === quizId);
        if (!quiz || quiz.status !== 'active' || isMuted) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Quiz round is no longer active.' }));
        }
        const existingSubs = bundle.submissionsByQuiz[quizId] || [];
        if (existingSubs.some((s) => s.uid === user.id)) {
          res.statusCode = 409;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'You already submitted this round.' }));
        }

        const answers = Array.isArray(body.answers)
          ? body.answers.map((a: any) => String(a || '-').slice(0, 2))
          : [];
        const score = quiz.questions.reduce(
          (acc, q, idx) => acc + (answers[idx] === q.correctAnswer ? 1 : 0),
          0
        );
        const sub: QuizSubmissionData = {
          uid: user.id,
          displayName,
          score,
          totalQuestions: quiz.questions.length,
          timeTakenSec: Math.max(1, Number(body.timeTakenSec) || 1),
          answers,
        };
        bundle.submissionsByQuiz[quizId] = [...existingSubs, sub];
        await saveState(state);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true, submission: sub }));
      }

      if (action === 'finish_quiz') {
        if (!isMod) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Moderator permission required.' }));
        }
        const quizId = String(body.quizId || '');
        const quiz = bundle.quizzes.find((q) => q.id === quizId);
        if (quiz) {
          quiz.status = 'finished';
          await saveState(state);
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true }));
      }

      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'Unknown study room action.' }));
    }

    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Method not allowed.' }));
  } catch (err: any) {
    console.error('[study-rooms API Error]:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: err?.message || 'Study room server error.' }));
  }
}
