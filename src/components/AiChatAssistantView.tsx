import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { ChatMessage, ChatAttachment, ChatSession } from '../types';
import {
  loadChatSessions,
  saveSingleSession,
  createNewSession,
  deleteChatSession,
  renameChatSession,
  getActiveSessionId,
  setActiveSessionId,
} from '../services/chatStorage';
import { ChatMessageRenderer } from './ChatMessageRenderer';
import {
  Send,
  Square,
  Sparkles,
  Bot,
  User,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Camera,
  Image as ImageIcon,
  Mic,
  Volume2,
  VolumeX,
  RotateCcw,
  Sliders,
  Headphones,
  Paperclip,
  Play,
  Pause,
  AlertCircle,
  FolderOpen,
  MessageSquare,
  FileAudio,
  Maximize2,
  ChevronDown,
  Key,
} from 'lucide-react';

interface Props {
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
}

export const AiChatAssistantView: React.FC<Props> = ({
  initialPrompt,
  onClearInitialPrompt,
}) => {
  // Session State
  const [sessions, setSessions] = useState<ChatSession[]>(() => loadChatSessions());
  const [activeSessionId, setActiveSessionState] = useState<string>(() => {
    const saved = getActiveSessionId();
    const loaded = loadChatSessions();
    if (saved && loaded.some((s) => s.id === saved)) {
      return saved;
    }
    return loaded[0]?.id || '';
  });

  // Fresh refs to prevent stale closure bugs in asynchronous stream processing
  const sessionsRef = useRef(sessions);
  sessionsRef.current = sessions;
  const activeSessionIdRef = useRef(activeSessionId);
  activeSessionIdRef.current = activeSessionId;

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  // Optional user Gemini API key (for static GitHub Pages hosting or direct access)
  const [userApiKey, setUserApiKey] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const urlKey = new URLSearchParams(window.location.search).get('key');
      if (urlKey) {
        try {
          localStorage.setItem('gemini_user_api_key', urlKey);
        } catch {}
        return urlKey;
      }
      return (
        (import.meta as any).env?.VITE_GEMINI_API_KEY ||
        localStorage.getItem('gemini_user_api_key') ||
        ''
      );
    }
    return '';
  });
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [apiKeyInputValue, setApiKeyInputValue] = useState(userApiKey);

  // Input & Messaging State
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Attached Image Preview Modal
  const [fullViewImage, setFullViewImage] = useState<string | null>(null);

  // Sessions Drawer / Sidebar Modal (Mobile & Desktop)
  const [isSessionsDrawerOpen, setIsSessionsDrawerOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitleText, setEditingTitleText] = useState('');

  // Voice Note Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  // Audio Preview Before Sending State
  const [pendingAudioPreview, setPendingAudioPreview] = useState<{
    url: string;
    blob: Blob;
    duration: number;
    mimeType: string;
    name?: string;
  } | null>(null);
  const [isPlayingPendingAudio, setIsPlayingPendingAudio] = useState(false);
  const pendingAudioRef = useRef<HTMLAudioElement | null>(null);

  // Active playing audio for message attachments
  const [playingAttachmentUrl, setPlayingAttachmentUrl] = useState<string | null>(null);
  const messageAudioElementRef = useRef<HTMLAudioElement | null>(null);

  // Voice Settings & TTS State
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceSettings, setVoiceSettings] = useState<{
    voiceURI: string;
    rate: number;
    pitch: number;
    autoSpeak: boolean;
  }>(() => {
    try {
      const saved = localStorage.getItem('smartsolve_chat_voice_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      voiceURI: '',
      rate: 1.0,
      pitch: 1.0,
      autoSpeak: false,
    };
  });

  // DOM Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);

  // Load available browser voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
      }
    };
    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
  }, []);

  // Auto-scroll on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages, isGenerating]);

  // Handle external initial prompt if passed
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSendMessage(initialPrompt.trim());
      onClearInitialPrompt?.();
    }
  }, [initialPrompt]);

  // Atomically update messages for a specific session without stale closures
  const updateSessionMessages = (
    targetSessionId: string,
    updater: (currentMessages: ChatMessage[]) => ChatMessage[],
    explicitTitle?: string
  ) => {
    setSessions((prevSessions) => {
      const sessionIndex = prevSessions.findIndex((s) => s.id === targetSessionId);
      if (sessionIndex === -1) return prevSessions;

      const currentSession = prevSessions[sessionIndex];
      const newMessages = updater(currentSession.messages);

      let title = explicitTitle || currentSession.title;
      if (
        !explicitTitle &&
        (title === 'New Conversation' || title === 'Untitled Chat') &&
        newMessages.length > 1
      ) {
        const firstUserMsg = newMessages.find((m) => m.role === 'user');
        if (firstUserMsg && firstUserMsg.content) {
          title =
            firstUserMsg.content.slice(0, 36) +
            (firstUserMsg.content.length > 36 ? '...' : '');
        }
      }

      const updatedSession: ChatSession = {
        ...currentSession,
        title,
        messages: newMessages,
        updatedAt: Date.now(),
      };

      saveSingleSession(updatedSession);

      const next = [...prevSessions];
      next[sessionIndex] = updatedSession;
      return next;
    });
  };

  const updateCurrentSession = (messages: ChatMessage[], newTitle?: string) => {
    const targetId = activeSessionIdRef.current;
    updateSessionMessages(targetId, () => messages, newTitle);
  };

  // Switch session
  const handleSelectSession = (id: string) => {
    if (isGenerating) handleStopGeneration();
    setActiveSessionId(id);
    setActiveSessionState(id);
    setIsSessionsDrawerOpen(false);
    setChatError(null);
  };

  // Create new session
  const handleCreateNewSession = () => {
    if (isGenerating) handleStopGeneration();
    const fresh = createNewSession();
    const updatedSessions = [fresh, ...sessions];
    setSessions(updatedSessions);
    saveSingleSession(fresh);
    setActiveSessionId(fresh.id);
    setActiveSessionState(fresh.id);
    setIsSessionsDrawerOpen(false);
    setChatError(null);
    setInputText('');
    setAttachments([]);
    setPendingAudioPreview(null);
  };

  // Delete session
  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      handleCreateNewSession();
      return;
    }
    const updated = deleteChatSession(id);
    setSessions(updated);
    if (activeSessionId === id) {
      const nextActive = updated[0]?.id || '';
      setActiveSessionId(nextActive);
      setActiveSessionState(nextActive);
    }
  };

  // Start rename
  const handleStartRename = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(id);
    setEditingTitleText(currentTitle);
  };

  // Commit rename
  const handleSaveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = renameChatSession(id, editingTitleText);
    setSessions(updated);
    setEditingSessionId(null);
  };

  // Voice Recording Handlers
  const startVoiceRecording = async () => {
    if (typeof window === 'undefined') return;
    try {
      setRecordingSeconds(0);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.start(100);
      setIsRecording(true);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied:', err);
      setChatError('Microphone permission is required to record voice notes. Please grant access.');
    }
  };

  const cancelVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setRecordingSeconds(0);
    audioChunksRef.current = [];
  };

  const finishVoiceRecording = () => {
    if (!mediaRecorderRef.current) return;
    const finalSeconds = recordingSeconds;

    mediaRecorderRef.current.onstop = async () => {
      const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      const audioUrl = URL.createObjectURL(audioBlob);

      setPendingAudioPreview({
        url: audioUrl,
        blob: audioBlob,
        duration: Math.max(finalSeconds, 1),
        mimeType,
        name: `Voice_Note_${new Date().toLocaleTimeString().replace(/:/g, '-')}.webm`,
      });
    };

    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  // Audio file upload (MP3, WAV, M4A, WebM, OGG)
  const handleAudioFileUpload = (file: File) => {
    const validMimes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/m4a', 'audio/x-m4a', 'audio/aac', 'audio/ogg'];
    if (!validMimes.some((m) => file.type.toLowerCase().includes(m.split('/')[1]))) {
      setChatError('Please upload a supported audio format (MP3, WAV, M4A, WebM, OGG).');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setChatError('Audio file is too large. Please select a recording under 25MB.');
      return;
    }

    const audioUrl = URL.createObjectURL(file);
    // Estimate audio duration
    const tempAudio = new Audio(audioUrl);
    tempAudio.onloadedmetadata = () => {
      const dur = Math.round(tempAudio.duration) || 5;
      setPendingAudioPreview({
        url: audioUrl,
        blob: file,
        duration: dur,
        mimeType: file.type || 'audio/mp3',
        name: file.name,
      });
    };
    tempAudio.onerror = () => {
      setPendingAudioPreview({
        url: audioUrl,
        blob: file,
        duration: 10,
        mimeType: file.type || 'audio/mp3',
        name: file.name,
      });
    };
  };

  // Image Upload & Snap
  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setChatError('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setChatError('Image file is too large (maximum 15MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const newAttachment: ChatAttachment = {
        type: 'image',
        data: dataUrl,
        mimeType: file.type || 'image/jpeg',
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
      };
      setAttachments((prev) => [...prev, newAttachment]);
    };
    reader.readAsDataURL(file);
  };

  // Convert Blob to Base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Helper to call direct client-side Gemini if backend server is unreachable
  const callDirectGeminiClient = async (
    apiKey: string,
    history: any[],
    userText: string,
    attachments: ChatAttachment[]
  ): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey });
    const systemPrompt = `You are a brilliant, friendly, and natural conversational partner and master academic tutor, with the conversational flexibility of ChatGPT and world-class problem-solving capabilities.

CONVERSATIONAL BEHAVIOR & TONE:
- Be authentic, thoughtful, concise, and direct. Never sound like a scripted corporate customer-service bot.
- CRITICAL: DO NOT introduce yourself. Do not state your name, title, or what you can do. Never give a welcome monologue or a bullet list of your capabilities.
- When the user sends a casual greeting (like "Hi", "Hello", "Hey", "Good morning", or "Sup"), reply like a real person in ONE short, friendly sentence.
- If the user cracks a joke or shares casual thoughts, banter naturally with warmth and humor.
- Adjust response length strictly to the prompt: keep simple chats brief and punchy, and make complex math/physics/chemistry derivations deeply detailed with LaTeX ($...$ and $$...$$).

MULTIMODAL AUDIO & VOICE RECOGNITION:
- You genuinely listen to and comprehend user voice notes and audio clips.
- CRITICAL: ALWAYS WRITE OUT THE COMPLETE ANSWER IN FULL TEXT. Even when the user speaks via a voice note or audio recording, you MUST write out the complete, comprehensive written answer on screen with all steps, formulas ($...$ and $$...$$), equations, and explanations clearly visible so the user can read and study it.
- When answering a voice note, briefly note the question heard (e.g., 🎙️ *Heard:* "...") and immediately provide the complete, step-by-step written solution.
- Never respond with an audio-only or partial reply. Every response MUST be written out in full text.`;

    const chatContents: any[] = [];
    if (Array.isArray(history) && history.length > 0) {
      for (const h of history.slice(-8)) {
        if (!h.content && (!h.attachments || h.attachments.length === 0)) continue;
        const parts: any[] = [];
        if (Array.isArray(h.attachments)) {
          for (const att of h.attachments) {
            if (att.data && att.mimeType) {
              const cleanData = att.data.replace(/^data:[a-zA-Z0-9+.-]+\/[a-zA-Z0-9+.-]+;base64,/, '');
              parts.push({
                inlineData: {
                  mimeType: att.mimeType,
                  data: cleanData,
                },
              });
            }
          }
        }
        if (h.content) parts.push({ text: h.content });
        if (parts.length > 0) {
          chatContents.push({
            role: h.role === 'user' ? 'user' : 'model',
            parts,
          });
        }
      }
    }

    const currentParts: any[] = [];
    for (const att of attachments) {
      if (att.data && att.mimeType) {
        const cleanData = att.data.replace(/^data:[a-zA-Z0-9+.-]+\/[a-zA-Z0-9+.-]+;base64,/, '');
        currentParts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: cleanData,
          },
        });
      }
    }
    const hasAudio = attachments.some((a) => a.type === 'audio');
    const textPrompt = userText || (hasAudio ? 'Please listen to this voice note carefully, transcribe what was asked, and write out the complete, step-by-step written answer in full detail.' : (attachments.length > 0 ? 'Please inspect this file and provide an accurate step-by-step written answer.' : 'Hello'));
    currentParts.push({ text: textPrompt });
    chatContents.push({ role: 'user', parts: currentParts });

    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
    let lastErr: any = null;
    for (const model of candidateModels) {
      try {
        const resp = await ai.models.generateContent({
          model,
          contents: chatContents,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.75,
          },
        });
        const reply = resp?.text?.trim();
        if (reply) return reply;
      } catch (err: any) {
        lastErr = err;
      }
    }
    throw lastErr || new Error('Failed to generate response from Gemini model');
  };

  // Send Message
  const handleSendMessage = async (customMessageText?: string, customAttachments?: ChatAttachment[]) => {
    const text = (customMessageText !== undefined ? customMessageText : inputText).trim();

    // Check if we have pending audio to attach
    let messageAttachments = customAttachments ? [...customAttachments] : [...attachments];
    if (pendingAudioPreview && !customAttachments) {
      const audioBase64 = await blobToBase64(pendingAudioPreview.blob);
      messageAttachments.push({
        type: 'audio',
        data: audioBase64,
        mimeType: pendingAudioPreview.mimeType,
        name: pendingAudioPreview.name || 'Voice Note',
        duration: pendingAudioPreview.duration,
      });
    }

    if (!text && messageAttachments.length === 0) return;
    if (isGenerating) return;

    // Stop active audio / voice playback
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
    }

    const currentSessionId = activeSessionIdRef.current;
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      attachments: messageAttachments.length > 0 ? messageAttachments : undefined,
    };

    const assistantMessageId = `assistant_${Date.now() + 1}`;
    const initialAssistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now() + 1,
      isStreaming: true,
    };

    // Atomically append both user message and assistant placeholder to the active session
    updateSessionMessages(currentSessionId, (msgs) => [...msgs, userMessage, initialAssistantMessage]);

    // Reset input states
    setInputText('');
    setAttachments([]);
    setPendingAudioPreview(null);
    setChatError(null);
    setIsGenerating(true);

    // Setup abort controller
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Retrieve fresh current messages for history payload
    const activeSess = sessionsRef.current.find((s) => s.id === currentSessionId);
    const historyPayload = (activeSess?.messages || [])
      .filter((m) => m.id !== 'welcome-msg' && !m.error && m.id !== assistantMessageId)
      .slice(-10)
      .map((m) => ({
        role: m.role,
        content: m.content,
        attachments: m.attachments,
      }));

    const primaryImage = messageAttachments.find((a) => a.type === 'image');
    const primaryAudio = messageAttachments.find((a) => a.type === 'audio');

    const requestPayload = {
      message: text,
      history: historyPayload,
      imageData: primaryImage?.data,
      mimeType: primaryImage?.mimeType,
      audioData: primaryAudio?.data,
      audioMimeType: primaryAudio?.mimeType,
      attachments: messageAttachments,
      stream: true,
    };

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (userApiKey) {
      requestHeaders['x-gemini-key'] = userApiKey;
    }

    let accumulatedText = '';

    try {
      // 1. Attempt POST to /api/chat
      let response: Response | null = null;
      let usedEndpoint = '/api/chat';

      try {
        response = await fetch('/api/chat', {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify(requestPayload),
          signal: abortController.signal,
        });
      } catch (networkErr: any) {
        if (networkErr.name === 'AbortError') throw networkErr;
        console.warn('/api/chat fetch failed, trying /api/ai/chat...', networkErr);
      }

      // 2. Fall back to /api/ai/chat if /api/chat is 404 or failed
      if (!response || response.status === 404) {
        usedEndpoint = '/api/ai/chat';
        try {
          response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: requestHeaders,
            body: JSON.stringify(requestPayload),
            signal: abortController.signal,
          });
        } catch (networkErr2: any) {
          if (networkErr2.name === 'AbortError') throw networkErr2;
          console.warn('/api/ai/chat fetch failed:', networkErr2);
        }
      }

      // 3. Fall back to direct client-side Gemini if server is unavailable (e.g. GitHub Pages static deployment)
      if (!response || !response.ok) {
        const isServerUnavailable = !response || response.status === 404 || response.status === 502 || response.status === 503;
        if (isServerUnavailable && userApiKey) {
          try {
            accumulatedText = await callDirectGeminiClient(userApiKey, historyPayload, text, messageAttachments);
            updateSessionMessages(currentSessionId, (msgs) =>
              msgs.map((m) =>
                m.id === assistantMessageId
                  ? { ...m, content: accumulatedText, isStreaming: false, error: false }
                  : m
              )
            );
            if (voiceSettings.autoSpeak && accumulatedText) {
              setTimeout(() => handleSpeakMessage(assistantMessageId, accumulatedText), 300);
            }
            return;
          } catch (directErr: any) {
            console.error('Client-side Gemini failed:', directErr);
          }
        }

        if (!response) {
          throw new Error(
            'Cannot connect to the AI server. If running on GitHub Pages, tap the 🔑 API Key button in the top bar to connect your Gemini API key.'
          );
        }

        const errorText = await response.text();
        let parsedError = errorText;
        try {
          const jsonErr = JSON.parse(errorText);
          parsedError = jsonErr.error || jsonErr.message || errorText;
        } catch {}
        throw new Error(parsedError || `Server error (${response.status}) on ${usedEndpoint}`);
      }

      // Check if response is streaming SSE
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/event-stream') && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let lineBuffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          lineBuffer += decoder.decode(value, { stream: true });
          const lines = lineBuffer.split('\n');
          lineBuffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const dataStr = trimmed.slice(5).trim();
            if (dataStr === '[DONE]') break;

            try {
              const dataObj = JSON.parse(dataStr);
              if (dataObj.text) {
                accumulatedText += dataObj.text;
                updateSessionMessages(currentSessionId, (msgs) =>
                  msgs.map((m) =>
                    m.id === assistantMessageId ? { ...m, content: accumulatedText, isStreaming: true } : m
                  )
                );
              }
              if (dataObj.error) {
                console.warn('Stream received server error:', dataObj.error);
              }
            } catch {
              if (dataStr) {
                accumulatedText += dataStr;
                updateSessionMessages(currentSessionId, (msgs) =>
                  msgs.map((m) =>
                    m.id === assistantMessageId ? { ...m, content: accumulatedText, isStreaming: true } : m
                  )
                );
              }
            }
          }
        }
      } else {
        // Standard JSON response
        const data = await response.json();
        accumulatedText = data.reply || data.text || 'I have analyzed your request.';
      }

      // Finalize assistant message
      const finalText = accumulatedText || 'I processed your question.';
      updateSessionMessages(currentSessionId, (msgs) =>
        msgs.map((m) =>
          m.id === assistantMessageId ? { ...m, content: finalText, isStreaming: false, error: false } : m
        )
      );

      // Auto-speak if enabled
      if (voiceSettings.autoSpeak && finalText) {
        setTimeout(() => {
          handleSpeakMessage(assistantMessageId, finalText);
        }, 300);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        updateSessionMessages(currentSessionId, (msgs) =>
          msgs.map((m) =>
            m.id === assistantMessageId
              ? { ...m, content: accumulatedText || 'Generation stopped.', isStreaming: false }
              : m
          )
        );
      } else {
        console.error('Chat error:', err);
        const errMessage = err.message || 'The AI assistant encountered an issue. Please tap Retry.';
        setChatError(errMessage);
        updateSessionMessages(currentSessionId, (msgs) =>
          msgs.map((m) =>
            m.id === assistantMessageId
              ? {
                  ...m,
                  content: accumulatedText ? accumulatedText + '\n\n*(Generation interrupted)*' : errMessage,
                  isStreaming: false,
                  error: !accumulatedText,
                }
              : m
          )
        );
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  // Stop generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsGenerating(false);
  };

  // Regenerate Response
  const handleRegenerate = () => {
    if (isGenerating) return;
    const currentSessionId = activeSessionIdRef.current;
    const currentSession = sessionsRef.current.find((s) => s.id === currentSessionId);
    if (!currentSession) return;

    const msgs = currentSession.messages;
    const lastUserIdx = msgs.reduce((idx, m, i) => (m.role === 'user' ? i : idx), -1);
    if (lastUserIdx >= 0) {
      const userMsg = msgs[lastUserIdx];
      // Trim messages to exclude the last assistant response
      const trimmed = msgs.slice(0, lastUserIdx);
      updateSessionMessages(currentSessionId, () => trimmed);
      handleSendMessage(userMsg.content, userMsg.attachments);
    }
  };

  // Text-to-Speech (speak aloud)
  const handleSpeakMessage = (msgId: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (speakingMessageId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();

    // Clean text for natural speech
    const cleanSpeech = text
      .replace(/\$\$(.*?)\$\$/g, ' equation: $1 ')
      .replace(/\$(.*?)\$/g, ' $1 ')
      .replace(/\\frac\{(.*?)\}\{(.*?)\}/g, '$1 over $2')
      .replace(/\\sqrt\{(.*?)\}/g, 'square root of $1')
      .replace(/\\times/g, 'times')
      .replace(/\\pm/g, 'plus or minus')
      .replace(/\\boxed\{(.*?)\}/g, '$1')
      .replace(/```[\s\S]*?```/g, 'Code block omitted for voice.')
      .replace(/[*#_`]/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.rate = voiceSettings.rate;
    utterance.pitch = voiceSettings.pitch;

    if (voiceSettings.voiceURI && availableVoices.length > 0) {
      const selected = availableVoices.find((v) => v.voiceURI === voiceSettings.voiceURI);
      if (selected) utterance.voice = selected;
    }

    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    setSpeakingMessageId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // Play audio attachment in message bubble
  const handleToggleAttachmentAudio = (dataUrl: string) => {
    if (playingAttachmentUrl === dataUrl && messageAudioElementRef.current) {
      messageAudioElementRef.current.pause();
      setPlayingAttachmentUrl(null);
      return;
    }

    if (messageAudioElementRef.current) {
      messageAudioElementRef.current.pause();
    }

    const audio = new Audio(dataUrl);
    messageAudioElementRef.current = audio;
    audio.play();
    setPlayingAttachmentUrl(dataUrl);

    audio.onended = () => setPlayingAttachmentUrl(null);
    audio.onerror = () => setPlayingAttachmentUrl(null);
  };

  // Play pending audio preview
  const handleTogglePendingAudio = () => {
    if (!pendingAudioPreview) return;
    if (isPlayingPendingAudio && pendingAudioRef.current) {
      pendingAudioRef.current.pause();
      setIsPlayingPendingAudio(false);
      return;
    }

    const audio = new Audio(pendingAudioPreview.url);
    pendingAudioRef.current = audio;
    audio.play();
    setIsPlayingPendingAudio(true);

    audio.onended = () => setIsPlayingPendingAudio(false);
    audio.onerror = () => setIsPlayingPendingAudio(false);
  };

  // Save Voice Settings
  const handleSaveVoiceSettings = (newSettings: typeof voiceSettings) => {
    setVoiceSettings(newSettings);
    try {
      localStorage.setItem('smartsolve_chat_voice_settings', JSON.stringify(newSettings));
    } catch {}
  };

  // Quick Inspiration Prompts
  const quickPrompts = [
    { label: '🚀 Code: Python Script', prompt: 'Write a Python script to calculate projectile motion trajectories and plot them.' },
    { label: '⚡ Physics: Quantum Tunneling', prompt: 'Explain quantum tunneling in simple terms with a real-life analogy.' },
    { label: '🧪 Chemistry: Mole Calculation', prompt: 'How do I calculate the empirical formula of a compound from percent composition?' },
    { label: '📚 JAMB: CBT Exam Strategy', prompt: 'Give me top strategies for scoring 300+ in JAMB UTME across Physics and Chemistry.' },
  ];

  return (
    <div className="flex h-[calc(100vh-140px)] min-h-[600px] max-w-6xl mx-auto rounded-3xl overflow-hidden border border-[#27272A] bg-[#0A0A0C] shadow-2xl relative font-sans">
      {/* 1. SESSIONS SIDEBAR (DESKTOP) & DRAWER (MOBILE) */}
      <aside
        className={`${
          isSessionsDrawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } fixed md:static inset-y-0 left-0 z-50 md:z-auto w-72 sm:w-80 bg-[#0F0F12] border-r border-[#27272A] flex flex-col transition-transform duration-300 ease-in-out`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-[#27272A] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#22C55E]/15 border border-[#22C55E]/40 flex items-center justify-center text-[#22C55E]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Chat History</h2>
              <p className="text-[10px] text-[#A1A1AA]">{sessions.length} conversation{sessions.length > 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={handleCreateNewSession}
              className="p-1.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white transition-all cursor-pointer shadow-sm"
              title="New Chat"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsSessionsDrawerOpen(false)}
              className="md:hidden p-1.5 rounded-xl hover:bg-[#27272A] text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
          {sessions.map((s) => {
            const isActive = s.id === activeSessionId;
            const isEditing = editingSessionId === s.id;

            return (
              <div
                key={s.id}
                onClick={() => handleSelectSession(s.id)}
                className={`group relative flex items-center justify-between p-3 rounded-2xl text-xs transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#1C1C22] text-white border border-[#22C55E]/40 shadow-sm'
                    : 'text-[#A1A1AA] hover:bg-[#151518] hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0 flex-1 pr-2">
                  <MessageSquare
                    className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#22C55E]' : 'text-zinc-500'}`}
                  />
                  {isEditing ? (
                    <input
                      type="text"
                      value={editingTitleText}
                      onChange={(e) => setEditingTitleText(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRename(s.id, e as any);
                        if (e.key === 'Escape') setEditingSessionId(null);
                      }}
                      autoFocus
                      className="w-full bg-black border border-[#22C55E] rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                    />
                  ) : (
                    <div className="truncate">
                      <div className="font-semibold truncate">{s.title}</div>
                      <div className="text-[10px] text-zinc-500">
                        {new Date(s.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} · {s.messages.length} msg{s.messages.length > 1 ? 's' : ''}
                      </div>
                    </div>
                  )}
                </div>

                {/* Session Actions */}
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isEditing ? (
                    <button
                      type="button"
                      onClick={(e) => handleSaveRename(s.id, e)}
                      className="p-1 rounded-lg hover:bg-[#27272A] text-[#22C55E]"
                      title="Save Title"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={(e) => handleStartRename(s.id, s.title, e)}
                        className="p-1 rounded-lg hover:bg-[#27272A] text-zinc-400 hover:text-white"
                        title="Rename Chat"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSession(s.id, e)}
                        className="p-1 rounded-lg hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400"
                        title="Delete Chat"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[#27272A] flex items-center justify-between text-xs text-zinc-400">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
            <span className="text-[11px] font-mono text-zinc-400">Gemini 3.8 Flash</span>
          </span>
          <button
            type="button"
            onClick={handleCreateNewSession}
            className="flex items-center space-x-1 text-xs text-[#22C55E] hover:underline font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile drawer */}
      {isSessionsDrawerOpen && (
        <div
          onClick={() => setIsSessionsDrawerOpen(false)}
          className="fixed inset-0 bg-black/70 z-40 md:hidden backdrop-blur-xs"
        />
      )}

      {/* 2. MAIN CHAT AREA */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0A0A0C]">
        {/* Chat Top Bar */}
        <header className="px-4 py-3 bg-[#111115] border-b border-[#27272A] flex items-center justify-between gap-2">
          <div className="flex items-center space-x-3 min-w-0">
            {/* Drawer Toggle (Mobile & Desktop) */}
            <button
              type="button"
              onClick={() => setIsSessionsDrawerOpen((prev) => !prev)}
              className="p-2 rounded-xl bg-[#1C1C22] hover:bg-[#27272A] text-white border border-[#27272A] transition-colors cursor-pointer"
              title="Open Chat History"
            >
              <FolderOpen className="w-4 h-4 text-[#22C55E]" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h1 className="text-sm font-bold text-white truncate">
                  {activeSession?.title || 'SmartSolve Assistant'}
                </h1>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30">
                  Multimodal
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 truncate hidden xs:block">
                Type, snap photo 📷, record voice note 🎙️, or upload files
              </p>
            </div>
          </div>

          {/* Chat Header Actions */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {/* Auto Voice Toggle */}
            <button
              type="button"
              onClick={() => {
                const updated = { ...voiceSettings, autoSpeak: !voiceSettings.autoSpeak };
                handleSaveVoiceSettings(updated);
              }}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center space-x-1.5 transition-all cursor-pointer ${
                voiceSettings.autoSpeak
                  ? 'bg-[#22C55E]/20 text-[#22C55E] border-[#22C55E]/40'
                  : 'bg-[#18181B] text-zinc-400 hover:text-white border-[#27272A]'
              }`}
              title="Automatically read aloud AI replies"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Auto Voice:</span>
              <span className="font-bold">{voiceSettings.autoSpeak ? 'ON' : 'OFF'}</span>
            </button>

            {/* Voice Changer / Settings */}
            <button
              type="button"
              onClick={() => setIsVoiceModalOpen(true)}
              className="p-2 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-zinc-300 hover:text-white border border-[#27272A] transition-colors cursor-pointer"
              title="Change Voice & Accents (Nigerian, US, UK)"
            >
              <Sliders className="w-4 h-4 text-[#22C55E]" />
            </button>

            {/* Gemini API Key Config */}
            <button
              type="button"
              onClick={() => {
                setApiKeyInputValue(userApiKey);
                setIsApiKeyModalOpen(true);
              }}
              className={`p-2 rounded-xl border transition-colors cursor-pointer relative ${
                userApiKey
                  ? 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/40'
                  : 'bg-[#18181B] hover:bg-[#27272A] text-zinc-300 hover:text-white border-[#27272A]'
              }`}
              title={userApiKey ? 'Gemini API Key Connected' : 'Configure Gemini API Key'}
            >
              <Key className="w-4 h-4 text-[#22C55E]" />
              {userApiKey && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#22C55E] border-2 border-[#111115]" />
              )}
            </button>

            {/* New Chat Button */}
            <button
              type="button"
              onClick={handleCreateNewSession}
              className="px-3 py-1.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center space-x-1 transition-all cursor-pointer"
              title="Start a fresh conversation"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        </header>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 scrollbar-thin">
          {activeSession?.messages.map((msg, idx) => {
            const isUser = msg.role === 'user';

            return (
              <div
                key={msg.id}
                className={`flex items-start space-x-3 animate-fadeIn ${
                  isUser ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 text-xs font-bold shadow-sm ${
                    isUser
                      ? 'bg-[#22C55E] text-white'
                      : 'bg-[#1C1C22] text-[#22C55E] border border-[#22C55E]/40'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-3xl p-4 sm:p-5 text-sm leading-relaxed shadow-lg ${
                    isUser
                      ? 'bg-[#18181D] text-white rounded-tr-none border border-[#27272A]'
                      : 'bg-[#111115] text-[#F4F4F5] rounded-tl-none border border-[#27272A]'
                  }`}
                >
                  {/* Attachments Section */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mb-3 space-y-2">
                      {msg.attachments.map((att, aIdx) => {
                        if (att.type === 'image') {
                          return (
                            <div
                              key={aIdx}
                              className="relative group rounded-2xl overflow-hidden border border-white/10 bg-black/50 max-w-sm"
                            >
                              <img
                                src={att.data}
                                alt={att.name || 'Attached picture'}
                                className="w-full max-h-60 object-contain cursor-pointer hover:opacity-95 transition-opacity"
                                onClick={() => setFullViewImage(att.data)}
                              />
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => setFullViewImage(att.data)}
                                  className="p-1.5 rounded-lg bg-black/70 text-white hover:bg-black transition-colors"
                                  title="View Full Size"
                                >
                                  <Maximize2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        }

                        if (att.type === 'audio') {
                          const isPlayingThis = playingAttachmentUrl === att.data;
                          return (
                            <div
                              key={aIdx}
                              className="flex items-center space-x-3 p-3 rounded-2xl bg-[#1C1C22] border border-[#27272A] max-w-sm"
                            >
                              <button
                                type="button"
                                onClick={() => handleToggleAttachmentAudio(att.data)}
                                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 cursor-pointer shadow-md transition-all ${
                                  isPlayingThis
                                    ? 'bg-[#22C55E] text-white'
                                    : 'bg-white text-zinc-900 hover:bg-zinc-200'
                                }`}
                              >
                                {isPlayingThis ? (
                                  <Pause className="w-4 h-4" />
                                ) : (
                                  <Play className="w-4 h-4 ml-0.5" />
                                )}
                              </button>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold text-white truncate">
                                  {att.name || 'Spoken Voice Note'}
                                </div>
                                <div className="flex items-center space-x-2 text-[10px] text-zinc-400 mt-0.5 font-mono">
                                  <span>Audio Note</span>
                                  <span>·</span>
                                  <span>{att.duration ? `${att.duration}s` : 'Recording'}</span>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        return null;
                      })}
                    </div>
                  )}

                  {/* Message Content */}
                  {msg.error ? (
                    <div className="space-y-3">
                      <div className="flex items-start space-x-2 text-rose-400 font-medium text-xs leading-relaxed">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                        <div>{msg.content}</div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRegenerate}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-emerald-500/20"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Retry</span>
                      </button>
                    </div>
                  ) : (
                    <ChatMessageRenderer content={msg.content} isStreaming={msg.isStreaming} />
                  )}

                  {/* Actions Bar for Assistant Bubble */}
                  {!isUser && !msg.isStreaming && msg.id !== 'welcome-msg' && (
                    <div className="mt-4 pt-3 border-t border-[#27272A] flex items-center justify-between text-xs text-zinc-400">
                      <div className="flex items-center space-x-2">
                        {/* Voice Listen Button */}
                        <button
                          type="button"
                          onClick={() => handleSpeakMessage(msg.id, msg.content)}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg hover:bg-[#27272A] text-zinc-300 hover:text-[#22C55E] transition-colors cursor-pointer"
                          title={speakingMessageId === msg.id ? 'Stop Voice Note' : 'Listen to Voice'}
                        >
                          {speakingMessageId === msg.id ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                              <span className="text-rose-400">Stop Voice</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5 text-[#22C55E]" />
                              <span>Listen</span>
                            </>
                          )}
                        </button>

                        {/* Regenerate Button */}
                        {idx === activeSession.messages.length - 1 && (
                          <button
                            type="button"
                            onClick={handleRegenerate}
                            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg hover:bg-[#27272A] text-zinc-300 hover:text-white transition-colors cursor-pointer"
                            title="Regenerate this response"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Regenerate</span>
                          </button>
                        )}
                      </div>

                      <span className="text-[10px] text-zinc-500">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Generating Indicator (if not streaming yet) */}
          {isGenerating && !activeSession?.messages.some((m) => m.isStreaming && m.content) && (
            <div className="flex items-start space-x-3 animate-fadeIn">
              <div className="w-8 h-8 rounded-2xl bg-[#1C1C22] text-[#22C55E] border border-[#22C55E]/40 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-[#111115] border border-[#27272A] rounded-3xl rounded-tl-none p-4 flex items-center space-x-2 text-xs text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-ping" />
                <span>SmartSolve AI is thinking and formulating response...</span>
              </div>
            </div>
          )}

          {/* Error Notice with Retry */}
          {chatError && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center space-x-2 min-w-0">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span className="truncate">{chatError}</span>
              </div>
              <button
                type="button"
                onClick={() => handleSendMessage()}
                className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs cursor-pointer shrink-0 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Starter Inspiration Pills (shown when chat is new) */}
        {activeSession?.messages.length <= 1 && (
          <div className="px-4 py-2 border-t border-[#27272A]/40 bg-[#0E0E12]/50">
            <div className="text-[11px] font-semibold text-zinc-400 mb-2">
              Try asking about anything:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickPrompts.map((q, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendMessage(q.prompt)}
                  className="p-2.5 rounded-xl bg-[#141418] hover:bg-[#1C1C22] border border-[#27272A] text-left text-xs text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center justify-between group"
                >
                  <span className="truncate">{q.label}</span>
                  <span className="text-[10px] text-[#22C55E] group-hover:translate-x-0.5 transition-transform ml-2">
                    Ask →
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3. MULTIMODAL INPUT DOCK */}
        <div className="p-3 sm:p-4 bg-[#111115] border-t border-[#27272A] space-y-2.5">
          {/* Previews Bar: Attached Photos & Audio */}
          {(attachments.length > 0 || pendingAudioPreview) && (
            <div className="flex flex-wrap gap-2 p-2.5 rounded-2xl bg-[#0A0A0C] border border-[#27272A] animate-fadeIn">
              {/* Photo Previews */}
              {attachments.map((att, idx) => (
                <div
                  key={idx}
                  className="relative group w-14 h-14 rounded-xl overflow-hidden border border-[#3F3F46] bg-black flex-shrink-0"
                >
                  <img
                    src={att.data}
                    alt={att.name || 'Preview'}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 p-0.5 rounded-full bg-black/80 text-white hover:bg-rose-500 transition-colors cursor-pointer"
                    title="Remove Image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Pending Audio Preview */}
              {pendingAudioPreview && (
                <div className="flex items-center space-x-2.5 px-3 py-2 rounded-xl bg-[#18181D] border border-[#22C55E]/40 text-xs">
                  <button
                    type="button"
                    onClick={handleTogglePendingAudio}
                    className="w-7 h-7 rounded-full bg-[#22C55E] text-white flex items-center justify-center shrink-0 cursor-pointer shadow-sm"
                  >
                    {isPlayingPendingAudio ? (
                      <Pause className="w-3.5 h-3.5" />
                    ) : (
                      <Play className="w-3.5 h-3.5 ml-0.5" />
                    )}
                  </button>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-white truncate max-w-[140px]">
                      {pendingAudioPreview.name || 'Voice Note'}
                    </div>
                    <div className="text-[10px] text-[#22C55E]">
                      {pendingAudioPreview.duration}s · Ready to listen & solve
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPendingAudioPreview(null)}
                    className="p-1 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-white/10"
                    title="Remove audio recording"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Hidden File Inputs */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleImageSelect(e.target.files[0]);
              }
            }}
          />
          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={cameraInputRef}
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleImageSelect(e.target.files[0]);
              }
            }}
          />
          <input
            type="file"
            accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg"
            ref={audioFileInputRef}
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleAudioFileUpload(e.target.files[0]);
              }
            }}
          />

          {/* Live Voice Recording Bar (WhatsApp / Live voice note interface) */}
          {isRecording ? (
            <div className="flex items-center space-x-3 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/40 animate-pulse">
              <button
                type="button"
                onClick={cancelVoiceRecording}
                className="p-2 rounded-xl bg-[#1C1C22] hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                title="Cancel voice recording"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span className="text-xs font-mono font-bold text-rose-400">
                  {Math.floor(recordingSeconds / 60)}:{String(recordingSeconds % 60).padStart(2, '0')}
                </span>

                {/* Animated Voice Waveform */}
                <div className="flex items-center space-x-1 h-5 flex-1">
                  {[40, 70, 100, 50, 85, 30, 95, 60, 80, 45, 90, 65, 35, 100, 75, 50].map((h, i) => (
                    <div
                      key={i}
                      style={{ height: `${h}%` }}
                      className="w-1 bg-rose-400 rounded-full animate-pulse"
                    />
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={finishVoiceRecording}
                className="px-4 py-2 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
                title="Preview Voice Note"
              >
                <Check className="w-4 h-4" />
                <span>Done</span>
              </button>
            </div>
          ) : (
            /* Standard Multimodal Input Controls */
            <div className="flex items-end space-x-2">
              {/* Media Action Buttons */}
              <div className="flex items-center space-x-1 pb-1">
                {/* Gallery Image Upload */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 rounded-xl bg-[#18181D] hover:bg-[#27272A] text-zinc-300 hover:text-[#22C55E] border border-[#27272A] transition-colors cursor-pointer"
                  title="Upload Image (PNG, JPG, WEBP)"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>

                {/* Camera Snap */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="p-2.5 rounded-xl bg-[#18181D] hover:bg-[#27272A] text-zinc-300 hover:text-[#22C55E] border border-[#27272A] transition-colors cursor-pointer"
                  title="Take Photo with Camera"
                >
                  <Camera className="w-4 h-4" />
                </button>

                {/* Audio File Upload */}
                <button
                  type="button"
                  onClick={() => audioFileInputRef.current?.click()}
                  className="p-2.5 rounded-xl bg-[#18181D] hover:bg-[#27272A] text-zinc-300 hover:text-[#22C55E] border border-[#27272A] transition-colors cursor-pointer hidden sm:block"
                  title="Upload Audio File (MP3, WAV, M4A, WebM)"
                >
                  <FileAudio className="w-4 h-4" />
                </button>

                {/* Record Voice Note */}
                <button
                  type="button"
                  onClick={startVoiceRecording}
                  className="p-2.5 rounded-xl bg-[#18181D] hover:bg-[#22C55E]/20 text-zinc-300 hover:text-[#22C55E] border border-[#27272A] transition-colors cursor-pointer"
                  title="Record Spoken Voice Note"
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>

              {/* Textarea */}
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={1}
                  placeholder={
                    attachments.length > 0 || pendingAudioPreview
                      ? 'Add text or question about these attachments (optional)...'
                      : 'Ask anything, code, math, essays, or send a voice note...'
                  }
                  className="w-full bg-[#0A0A0C] border border-[#27272A] focus:border-[#22C55E] rounded-2xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors resize-none max-h-36 scrollbar-thin"
                />
              </div>

              {/* Send or Stop Button */}
              <div className="pb-1">
                {isGenerating ? (
                  <button
                    type="button"
                    onClick={handleStopGeneration}
                    className="p-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-500/30 flex items-center justify-center transition-all cursor-pointer"
                    title="Stop Generating"
                  >
                    <Square className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendMessage()}
                    disabled={!inputText.trim() && attachments.length === 0 && !pendingAudioPreview}
                    className="p-3 rounded-2xl bg-[#22C55E] hover:bg-[#16A34A] disabled:opacity-40 disabled:hover:bg-[#22C55E] text-white font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center transition-all cursor-pointer"
                    title="Send Message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 4. FULL IMAGE MODAL VIEWER */}
      {fullViewImage && (
        <div
          onClick={() => setFullViewImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={fullViewImage}
              alt="Full size view"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />
            <button
              type="button"
              onClick={() => setFullViewImage(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/80 text-white hover:bg-rose-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* 5. VOICE CUSTOMIZATION & ACCENT MODAL */}
      {isVoiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121216] border border-[#27272A] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
              <div className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-[#22C55E]" />
                <h3 className="text-base font-bold text-white">Customize AI Voice & Speech</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsVoiceModalOpen(false)}
                className="p-1.5 rounded-lg bg-[#27272A] hover:bg-[#3F3F46] text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Voice Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 block">
                Choose Voice / Accent:
              </label>
              <select
                value={voiceSettings.voiceURI}
                onChange={(e) => {
                  const updated = { ...voiceSettings, voiceURI: e.target.value };
                  handleSaveVoiceSettings(updated);
                }}
                className="w-full bg-[#0A0A0C] border border-[#27272A] focus:border-[#22C55E] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value="">Default Natural Voice</option>
                {availableVoices.map((v, i) => (
                  <option key={i} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>

            {/* Speech Rate Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-300">Speaking Speed:</span>
                <span className="text-[#22C55E] font-mono">{voiceSettings.rate.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.5"
                step="0.1"
                value={voiceSettings.rate}
                onChange={(e) => {
                  const updated = { ...voiceSettings, rate: parseFloat(e.target.value) };
                  handleSaveVoiceSettings(updated);
                }}
                className="w-full accent-[#22C55E] cursor-pointer"
              />
            </div>

            {/* Pitch Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-300">Voice Pitch:</span>
                <span className="text-[#22C55E] font-mono">{voiceSettings.pitch.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.3"
                step="0.1"
                value={voiceSettings.pitch}
                onChange={(e) => {
                  const updated = { ...voiceSettings, pitch: parseFloat(e.target.value) };
                  handleSaveVoiceSettings(updated);
                }}
                className="w-full accent-[#22C55E] cursor-pointer"
              />
            </div>

            {/* Auto-Speak Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#0A0A0C] border border-[#27272A]">
              <div>
                <div className="text-xs font-semibold text-white">Auto Voice Responses</div>
                <div className="text-[11px] text-zinc-400">Play AI answer aloud automatically when it replies</div>
              </div>
              <input
                type="checkbox"
                checked={voiceSettings.autoSpeak}
                onChange={(e) => {
                  const updated = { ...voiceSettings, autoSpeak: e.target.checked };
                  handleSaveVoiceSettings(updated);
                }}
                className="w-4 h-4 accent-[#22C55E] rounded cursor-pointer"
              />
            </div>

            {/* Test Voice & Done Buttons */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  handleSpeakMessage(
                    'test-voice',
                    "Hello! I am your SmartSolve AI assistant. How does this voice sound to you?"
                  );
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#27272A] hover:bg-[#3F3F46] text-white text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer transition-colors"
              >
                <Volume2 className="w-3.5 h-3.5 text-[#22C55E]" />
                <span>Test Voice Sample</span>
              </button>
              <button
                type="button"
                onClick={() => setIsVoiceModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold cursor-pointer transition-colors"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. GEMINI API KEY MODAL (Essential for GitHub Pages & Custom Keys) */}
      {isApiKeyModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#111115] border border-[#27272A] w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#27272A] pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#22C55E]/20 text-[#22C55E] flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Gemini API Key</h3>
                  <p className="text-[11px] text-zinc-400">Configure client-side key for static hosting</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsApiKeyModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-[#27272A] text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-zinc-300 leading-relaxed">
                When deployed on static hosting like <strong>GitHub Pages</strong>, SmartSolve uses this key to talk directly to Gemini in your browser without requiring a backend server.
              </p>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1.5">
                  Google AI Studio API Key:
                </label>
                <input
                  type="password"
                  value={apiKeyInputValue}
                  onChange={(e) => setApiKeyInputValue(e.target.value)}
                  placeholder="Paste AIzaSy... API key"
                  className="w-full bg-[#18181D] border border-[#27272A] focus:border-[#22C55E] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#22C55E] hover:underline flex items-center space-x-1"
                >
                  <span>Get a free API key from Google AI Studio</span>
                </a>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              {userApiKey && (
                <button
                  type="button"
                  onClick={() => {
                    try {
                      localStorage.removeItem('gemini_user_api_key');
                    } catch {}
                    setUserApiKey('');
                    setApiKeyInputValue('');
                    setIsApiKeyModalOpen(false);
                  }}
                  className="py-2.5 px-4 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-xs font-bold transition-colors cursor-pointer"
                >
                  Clear Key
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const trimmed = apiKeyInputValue.trim();
                  if (trimmed) {
                    try {
                      localStorage.setItem('gemini_user_api_key', trimmed);
                    } catch {}
                    setUserApiKey(trimmed);
                  }
                  setIsApiKeyModalOpen(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-emerald-500/20 text-center"
              >
                Save & Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
