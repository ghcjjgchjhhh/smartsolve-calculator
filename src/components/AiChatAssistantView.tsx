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
  VOICE_PERSONAS,
  VoicePersona,
  scoreAndSelectVoice,
  splitSpeechChunks,
  convertTextToConversationalSpeech,
} from '../services/voicePersonaEngine';
import { useAppLanguage } from '../contexts/LanguageContext';
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
  RotateCw,
  Sliders,
  Headphones,
  Paperclip,
  Play,
  Pause,
  AlertCircle,
  FolderOpen,
  History,
  MessageSquare,
  FileAudio,
  Maximize2,
  ChevronDown,
  Globe,
} from 'lucide-react';

// Helper to compress/resize high-resolution camera images client-side before sending
const compressImageFile = (
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.80
): Promise<{ dataUrl: string; size: string; mimeType: string }> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => {
      resolve({
        dataUrl: '',
        size: `${(file.size / 1024).toFixed(1)} KB`,
        mimeType: file.type || 'image/jpeg',
      });
    };
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => {
        const rawUrl = (e.target?.result as string) || '';
        resolve({
          dataUrl: rawUrl,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          mimeType: file.type || 'image/jpeg',
        });
      };
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const rawUrl = (e.target?.result as string) || '';
          resolve({
            dataUrl: rawUrl,
            size: `${(file.size / 1024).toFixed(1)} KB`,
            mimeType: file.type || 'image/jpeg',
          });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const compressedDataUrl = canvas.toDataURL(mimeType, quality);
        const approxSizeKb = (compressedDataUrl.length * 0.75) / 1024;

        resolve({
          dataUrl: compressedDataUrl,
          size: `${approxSizeKb.toFixed(1)} KB`,
          mimeType,
        });
      };
      img.src = (e.target?.result as string) || '';
    };
    reader.readAsDataURL(file);
  });
};

// WhatsApp-style Voice Note Audio Player with backwards/forwards seeking and speed control
export const VoiceNotePlayer: React.FC<{
  audioUrl: string;
  title?: string;
  duration?: number;
}> = ({ audioUrl, title, duration: initialDuration }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(initialDuration || 0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const onMeta = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setTotalDuration(Math.round(audio.duration));
      }
    };
    const onTime = () => setCurrentTime(audio.currentTime);
    const onEnd = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const onErr = () => setIsPlaying(false);

    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnd);
    audio.addEventListener('error', onErr);

    return () => {
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnd);
      audio.removeEventListener('error', onErr);
      audio.pause();
      audioRef.current = null;
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const seek = (seconds: number) => {
    if (!audioRef.current) return;
    const target = Math.max(0, Math.min(seconds, totalDuration || 100));
    audioRef.current.currentTime = target;
    setCurrentTime(target);
  };

  // Skip backwards 5 seconds
  const skipBackward5 = () => {
    if (!audioRef.current) return;
    seek(audioRef.current.currentTime - 5);
  };

  // Skip forward 5 seconds
  const skipForward5 = () => {
    if (!audioRef.current) return;
    seek(audioRef.current.currentTime + 5);
  };

  const cycleSpeed = () => {
    const nextRate = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const formatTime = (secs: number) => {
    const safeSecs = Math.max(0, Math.floor(secs || 0));
    const m = Math.floor(safeSecs / 60);
    const s = Math.floor(safeSecs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="rounded-2xl bg-[#1C1C22] border border-[#27272A] p-3 space-y-2 max-w-sm sm:max-w-md w-full shadow-md">
      <div className="flex items-center justify-between text-xs font-semibold text-white px-0.5">
        <span className="truncate flex items-center space-x-1.5">
          <Mic className="w-3.5 h-3.5 text-[#22C55E] shrink-0" />
          <span className="truncate">{title || 'Voice Note'}</span>
        </span>
        <span className="text-[10px] text-zinc-400 font-mono">
          {formatTime(currentTime)} / {formatTime(totalDuration)}
        </span>
      </div>

      {/* Scrubbable Range Slider (Backwards and Forwards Seeking) */}
      <div className="flex items-center space-x-2">
        <input
          type="range"
          min="0"
          max={totalDuration || 1}
          step="0.1"
          value={currentTime}
          onChange={(e) => seek(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#22C55E]"
          aria-label="Seek voice note backwards and forwards"
        />
      </div>

      {/* Playback Controls Row */}
      <div className="flex items-center justify-between pt-0.5">
        <div className="flex items-center space-x-1.5">
          {/* Play / Pause */}
          <button
            type="button"
            onClick={togglePlay}
            className="w-7 h-7 rounded-full bg-[#22C55E] hover:bg-[#16A34A] text-white flex items-center justify-center transition-all cursor-pointer shadow-sm"
            title={isPlaying ? 'Pause voice note' : 'Play voice note'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </button>

          {/* Rewind 5s (Backward) */}
          <button
            type="button"
            onClick={skipBackward5}
            className="px-2 py-1 rounded-lg bg-[#27272A] hover:bg-[#3F3F46] text-zinc-300 hover:text-white flex items-center space-x-0.5 text-[10px] font-mono cursor-pointer transition-colors"
            title="Rewind 5 seconds"
          >
            <RotateCcw className="w-3 h-3 text-[#22C55E]" />
            <span>-5s</span>
          </button>

          {/* Forward 5s (Forward) */}
          <button
            type="button"
            onClick={skipForward5}
            className="px-2 py-1 rounded-lg bg-[#27272A] hover:bg-[#3F3F46] text-zinc-300 hover:text-white flex items-center space-x-0.5 text-[10px] font-mono cursor-pointer transition-colors"
            title="Fast forward 5 seconds"
          >
            <RotateCw className="w-3 h-3 text-[#22C55E]" />
            <span>+5s</span>
          </button>
        </div>

        {/* Speed button */}
        <button
          type="button"
          onClick={cycleSpeed}
          className="px-2 py-1 rounded-md bg-[#27272A] hover:bg-[#3F3F46] text-[10px] font-bold text-zinc-300 hover:text-white cursor-pointer font-mono"
          title="Change playback speed"
        >
          {playbackRate}x
        </button>
      </div>
    </div>
  );
};

export interface LanguageOption {
  code: string;
  label: string;
  short: string;
  flag: string;
  greeting: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en-NG', label: 'English (Nigerian)', short: 'Nigerian', flag: '🇳🇬', greeting: 'Kedu! How you dey? I am ready to help you solve any question with step-by-step working.' },
  { code: 'en-US', label: 'English (United States)', short: 'US English', flag: '🇺🇸', greeting: 'Hello! I am your SmartSolve AI tutor. What would you like to explore or solve today?' },
  { code: 'en-GB', label: 'English (British)', short: 'British', flag: '🇬🇧', greeting: 'Good day! I am delighted to help you explore any academic or technical problem.' },
  { code: 'yo-NG', label: 'Èdè Yorùbá (Nigeria)', short: 'Yorùbá', flag: '🇳🇬', greeting: 'Báwo ni! Mo wà níbí láti ràn ọ́ lọ́wọ́ pẹ̀lú gbogbo ẹ̀kọ́ àti ìbéèrè rẹ.' },
  { code: 'ig-NG', label: 'Asụsụ Igbo (Nigeria)', short: 'Igbo', flag: '🇳🇬', greeting: 'Ndewo! Abụ m onye inyeaka SmartSolve gị. Kedu ajụjụ anyị ga-aza taa?' },
  { code: 'ha-NG', label: 'Harshen Hausa (Nigeria)', short: 'Hausa', flag: '🇳🇬', greeting: 'Sannu! Ina nan don in taimaka maka da lissafi da duk abin da kake buƙata.' },
  { code: 'fr-FR', label: 'Français (French)', short: 'Français', flag: '🇫🇷', greeting: 'Bonjour ! Je suis votre tuteur SmartSolve. Comment puis-je vous aider aujourd’hui ?' },
  { code: 'es-ES', label: 'Español (Spanish)', short: 'Español', flag: '🇪🇸', greeting: '¡Hola! Soy tu tutor SmartSolve. ¿En qué problema te puedo ayudar hoy?' },
  { code: 'de-DE', label: 'Deutsch (German)', short: 'Deutsch', flag: '🇩🇪', greeting: 'Hallo! Ich bin dein SmartSolve Assistent. Wie kann ich dir heute helfen?' },
  { code: 'ar-SA', label: 'العربية (Arabic)', short: 'العربية', flag: '🇸🇦', greeting: 'مرحباً بك! أنا مساعدك الذكي في سمارت سولف، كيف أساعدك اليوم؟' },
  { code: 'pt-BR', label: 'Português (Portuguese)', short: 'Português', flag: '🇧🇷', greeting: 'Olá! Sou o seu tutor SmartSolve. Como posso te ajudar hoje?' },
  { code: 'zh-CN', label: '中文 (Mandarin)', short: '中文', flag: '🇨🇳', greeting: '你好！我是你的 SmartSolve 智能导师，今天有什么问题想解答？' },
];

export interface AiSpeechState {
  messageId: string;
  sentences: string[];
  currentIndex: number;
  isPlaying: boolean;
  isPaused: boolean;
  playbackRate: number;
  fullText: string;
}

export interface VoiceSettings {
  personaId: string;
  language: string;
  gender: 'female' | 'male';
  voiceURI: string;
  rate: number;
  pitch: number;
  autoSpeak: boolean;
}

const findBestVoice = (
  voices: SpeechSynthesisVoice[],
  languageCode: string,
  gender: 'female' | 'male',
  preferredVoiceURI?: string,
  personaId?: string
): SpeechSynthesisVoice | null => {
  const persona =
    (personaId && VOICE_PERSONAS.find((p) => p.id === personaId)) ||
    VOICE_PERSONAS.find((p) => p.gender === gender) ||
    VOICE_PERSONAS[0];
  return scoreAndSelectVoice(voices, persona, preferredVoiceURI, languageCode);
};

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
  });

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

  // Synchronized AI Voice Playback State (Sentence-accurate seeking, -5s rewind, +5s forward)
  const [aiSpeech, setAiSpeech] = useState<AiSpeechState | null>(null);
  const aiSpeechRef = useRef<AiSpeechState | null>(null);
  aiSpeechRef.current = aiSpeech;

  // Voice Settings & TTS State
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const speechTimeoutRef = useRef<any>(null);

  const { currentLanguage, setIsLanguageModalOpen, t } = useAppLanguage();

  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => {
    try {
      const saved = localStorage.getItem('smartsolve_chat_voice_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        const resolvedPersona =
          parsed.personaId || (parsed.gender === 'male' ? 'cove' : 'breeze');
        return {
          personaId: resolvedPersona,
          language: parsed.language || currentLanguage?.voiceCode || 'en-US',
          gender: parsed.gender === 'male' ? 'male' : 'female',
          voiceURI: parsed.voiceURI || '',
          rate: typeof parsed.rate === 'number' ? parsed.rate : 1.0,
          pitch: typeof parsed.pitch === 'number' ? parsed.pitch : 1.0,
          autoSpeak: Boolean(parsed.autoSpeak),
        };
      }
    } catch {}
    return {
      personaId: 'breeze',
      language: currentLanguage?.voiceCode || 'en-US',
      gender: 'female',
      voiceURI: '',
      rate: 1.0,
      pitch: 1.0,
      autoSpeak: false,
    };
  });

  // Sync voiceSettings when user changes app language
  useEffect(() => {
    if (currentLanguage?.voiceCode) {
      setVoiceSettings((prev) => {
        if (prev.language === currentLanguage.voiceCode) return prev;
        const updated = { ...prev, language: currentLanguage.voiceCode };
        try {
          localStorage.setItem('smartsolve_chat_voice_settings', JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }
  }, [currentLanguage]);

  const currentPersona: VoicePersona =
    VOICE_PERSONAS.find((p) => p.id === voiceSettings.personaId) ||
    VOICE_PERSONAS.find((p) => p.gender === voiceSettings.gender) ||
    VOICE_PERSONAS[0];

  // DOM Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);

  // Load available browser voices & cleanup speech on unmount
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

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
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
      if (audioBlob.size < 200) {
        setChatError('Voice note was too short or empty. Please speak clearly while recording.');
        return;
      }
      const audioUrl = URL.createObjectURL(audioBlob);

      setPendingAudioPreview({
        url: audioUrl,
        blob: audioBlob,
        duration: Math.max(finalSeconds, 1),
        mimeType,
        name: `Voice_Note_${new Date().toLocaleTimeString().replace(/:/g, '-')}.webm`,
      });
    };

    if (mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.requestData();
      } catch {}
      mediaRecorderRef.current.stop();
    }
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

  // Image Upload & Snap with client-side compression for high-res camera photos
  const handleImageSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setChatError('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setChatError('Image file is too large (maximum 25MB).');
      return;
    }

    try {
      const { dataUrl, size, mimeType } = await compressImageFile(file);
      if (!dataUrl) throw new Error('Could not read image file.');
      const newAttachment: ChatAttachment = {
        type: 'image',
        data: dataUrl,
        mimeType,
        name: file.name,
        size,
      };
      setAttachments((prev) => [...prev, newAttachment]);
    } catch {
      setChatError('Failed to process image. Please try again with another photo.');
    }
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
            if (att.data) {
              const cleanData = att.data.includes(';base64,')
                ? att.data.split(';base64,')[1]
                : att.data;
              let mime = (att.mimeType || 'image/jpeg').trim();
              if (mime.includes(';')) mime = mime.split(';')[0].trim();
              if (cleanData) {
                parts.push({
                  inlineData: {
                    mimeType: mime,
                    data: cleanData,
                  },
                });
              }
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
    const addedHashes = new Set<string>();

    for (const att of attachments) {
      if (att.data) {
        const cleanData = att.data.includes(';base64,')
          ? att.data.split(';base64,')[1]
          : att.data;
        if (!cleanData || addedHashes.has(cleanData)) continue;
        addedHashes.add(cleanData);

        let mime = (att.mimeType || 'image/jpeg').trim();
        if (mime.includes(';')) mime = mime.split(';')[0].trim();

        currentParts.push({
          inlineData: {
            mimeType: mime,
            data: cleanData,
          },
        });
      }
    }
    const hasAudio = attachments.some((a) => a.type === 'audio');
    const textPrompt = userText || (hasAudio ? 'Please listen to this voice note carefully, transcribe what was asked, and write out the complete, step-by-step written answer in full detail.' : (attachments.length > 0 ? 'Please inspect this file and provide an accurate step-by-step written answer.' : 'Hello'));
    currentParts.push({ text: textPrompt });
    chatContents.push({ role: 'user', parts: currentParts });

    const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
    let lastErr: any = null;
    for (const model of candidateModels) {
      try {
        const config: any = {
          systemInstruction: systemPrompt,
        };
        if (model === 'gemini-3.8-flash') {
          config.thinkingConfig = { thinkingLevel: 'LOW' };
        } else if (model === 'gemini-3.1-flash-lite') {
          config.thinkingConfig = { thinkingLevel: 'MINIMAL' };
          config.temperature = 0.75;
        }
        const resp = await ai.models.generateContent({
          model,
          contents: chatContents,
          config,
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

    // Retrieve fresh current messages for history payload (prune heavy base64 from past turns for speed)
    const activeSess = sessionsRef.current.find((s) => s.id === currentSessionId);
    const historyPayload = (activeSess?.messages || [])
      .filter((m) => m.id !== 'welcome-msg' && !m.error && m.id !== assistantMessageId)
      .slice(-6)
      .map((m) => ({
        role: m.role,
        content: m.content,
        // Send lightweight metadata for past attachments to avoid megabytes of redundant base64 re-uploads
        attachments: m.attachments?.map((a) => ({ name: a.name, type: a.type })),
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
      preferredLanguage: currentLanguage.name,
      languageCode: voiceSettings.language || currentLanguage.voiceCode,
      preferredGender: voiceSettings.gender,
      persona: currentPersona.name,
      voicePersona: currentPersona.name,
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
            'Cannot connect to the AI server. Please check your internet connection and tap Retry.'
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
        let lastRenderTime = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          lineBuffer += decoder.decode(value, { stream: true });
          const lines = lineBuffer.split('\n');
          lineBuffer = lines.pop() || '';

          let hadNewTokens = false;
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const dataStr = trimmed.slice(5).trim();
            if (dataStr === '[DONE]') break;

            try {
              const dataObj = JSON.parse(dataStr);
              if (dataObj.text) {
                accumulatedText += dataObj.text;
                hadNewTokens = true;
              }
              if (dataObj.error) {
                console.warn('Stream received server error:', dataObj.error);
              }
            } catch {
              if (dataStr) {
                accumulatedText += dataStr;
                hadNewTokens = true;
              }
            }
          }

          // Smooth throttled UI update (~30ms) so main thread stays responsive while streaming
          const now = Date.now();
          if (hadNewTokens && now - lastRenderTime > 30) {
            lastRenderTime = now;
            updateSessionMessages(currentSessionId, (msgs) =>
              msgs.map((m) =>
                m.id === assistantMessageId ? { ...m, content: accumulatedText, isStreaming: true } : m
              )
            );
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

  // Clean text and split into sentences for synchronized audio playback & seeking
  const splitSpeechSentences = (rawText: string): string[] => {
    return splitSpeechChunks(rawText);
  };

  // Play a specific sentence in the sequence
  const playAiSpeechSentence = (
    msgId: string,
    sentences: string[],
    targetIndex: number,
    rateOverride?: number
  ) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }

    const validIndex = Math.max(0, Math.min(targetIndex, sentences.length - 1));
    const sentence = sentences[validIndex];
    if (!sentence) {
      setAiSpeech(null);
      setSpeakingMessageId(null);
      return;
    }

    const currentRate =
      rateOverride ?? aiSpeechRef.current?.playbackRate ?? voiceSettings.rate ?? currentPersona.rate ?? 1.0;

    // Cancel any active utterance before starting the next
    window.speechSynthesis.cancel();

    const updatedState: AiSpeechState = {
      messageId: msgId,
      sentences,
      currentIndex: validIndex,
      isPlaying: true,
      isPaused: false,
      playbackRate: currentRate,
      fullText: sentences.join(' '),
    };
    aiSpeechRef.current = updatedState;
    setAiSpeech(updatedState);
    setSpeakingMessageId(msgId);

    const targetLangCode = voiceSettings.language || currentLanguage.voiceCode || 'en-US';
    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.lang = targetLangCode;

    // Use natural persona pitch without artificial multiplier distortions
    utterance.pitch = currentPersona.pitch * (voiceSettings.pitch || 1.0);
    utterance.rate = Math.max(0.7, Math.min(2.0, currentRate));

    if (availableVoices.length > 0) {
      const bestVoice = scoreAndSelectVoice(
        availableVoices,
        currentPersona,
        voiceSettings.voiceURI,
        targetLangCode
      );
      if (bestVoice) {
        utterance.voice = bestVoice;
        utterance.lang = bestVoice.lang || targetLangCode;
      }
    }

    utterance.onend = () => {
      const latest = aiSpeechRef.current;
      if (latest && latest.messageId === msgId && latest.isPlaying && !latest.isPaused) {
        if (validIndex + 1 < sentences.length) {
          // Human-like inter-sentence breathing pause (110ms)
          speechTimeoutRef.current = setTimeout(() => {
            playAiSpeechSentence(msgId, sentences, validIndex + 1, currentRate);
          }, 110);
        } else {
          setAiSpeech(null);
          setSpeakingMessageId(null);
        }
      }
    };

    utterance.onerror = (e) => {
      // Don't kill state on user interrupts (e.g. paused or jumped to next sentence)
      if (e.error === 'interrupted' || e.error === 'canceled') {
        return;
      }
      setAiSpeech(null);
      setSpeakingMessageId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Pause AI voice playback
  const handlePauseAiSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
    window.speechSynthesis.cancel();
    if (aiSpeechRef.current) {
      const paused = { ...aiSpeechRef.current, isPlaying: false, isPaused: true };
      aiSpeechRef.current = paused;
      setAiSpeech(paused);
    }
  };

  // Resume AI voice playback from the exact active sentence
  const handleResumeAiSpeech = () => {
    const current = aiSpeechRef.current;
    if (!current) return;
    playAiSpeechSentence(
      current.messageId,
      current.sentences,
      current.currentIndex,
      current.playbackRate
    );
  };

  // Rewind / Backward (-5s / previous sentence)
  const handleRewindAiSpeech = () => {
    const current = aiSpeechRef.current;
    if (!current) return;
    const target = Math.max(0, current.currentIndex - 1);
    playAiSpeechSentence(current.messageId, current.sentences, target, current.playbackRate);
  };

  // Forward / Fast-Forward (+5s / next sentence)
  const handleForwardAiSpeech = () => {
    const current = aiSpeechRef.current;
    if (!current) return;
    const target = Math.min(current.sentences.length - 1, current.currentIndex + 1);
    playAiSpeechSentence(current.messageId, current.sentences, target, current.playbackRate);
  };

  // Stop AI voice playback
  const handleStopAiSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
    window.speechSynthesis.cancel();
    aiSpeechRef.current = null;
    setAiSpeech(null);
    setSpeakingMessageId(null);
  };

  // Cycle playback speed (1.0x -> 1.25x -> 1.5x -> 2.0x -> 0.8x -> 1.0x)
  const handleCycleAiSpeechSpeed = () => {
    const current = aiSpeechRef.current;
    if (!current) return;
    const speeds = [0.8, 1.0, 1.25, 1.5, 2.0];
    const nextIdx = (speeds.indexOf(current.playbackRate) + 1) % speeds.length;
    const newRate = speeds[nextIdx] || 1.0;

    const updated = { ...current, playbackRate: newRate };
    aiSpeechRef.current = updated;
    setAiSpeech(updated);

    if (current.isPlaying) {
      playAiSpeechSentence(current.messageId, current.sentences, current.currentIndex, newRate);
    }
  };

  // Seek directly to a sentence index
  const handleSeekAiSpeech = (sentenceIndex: number) => {
    const current = aiSpeechRef.current;
    if (!current) return;
    playAiSpeechSentence(current.messageId, current.sentences, sentenceIndex, current.playbackRate);
  };

  // Trigger speech on an AI message
  const handleSpeakMessage = (msgId: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    // If already active on this message, toggle play / pause
    if (aiSpeechRef.current && aiSpeechRef.current.messageId === msgId) {
      if (aiSpeechRef.current.isPlaying) {
        handlePauseAiSpeech();
      } else {
        handleResumeAiSpeech();
      }
      return;
    }

    const sentences = splitSpeechSentences(text);
    if (sentences.length === 0) return;

    playAiSpeechSentence(msgId, sentences, 0, voiceSettings.rate);
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
    <div className="flex h-[calc(100dvh-125px)] sm:h-[calc(100vh-140px)] min-h-[460px] sm:min-h-[580px] max-w-6xl mx-auto rounded-2xl sm:rounded-3xl overflow-hidden border border-[#27272A] bg-[#0A0A0C] shadow-2xl relative font-sans w-full">
      {/* 1. SESSIONS SIDEBAR (DESKTOP) & DRAWER (MOBILE) */}
      <aside
        className={`${
          isSessionsDrawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } fixed md:static inset-y-0 left-0 z-[1100] md:z-auto w-72 sm:w-80 bg-[#0F0F12] border-r border-[#27272A] flex flex-col transition-transform duration-300 ease-in-out`}
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
            className="flex items-center space-x-1 text-xs text-white hover:text-zinc-300 hover:underline font-semibold"
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
          className="fixed inset-0 bg-black/70 z-[1090] md:hidden backdrop-blur-xs"
        />
      )}

      {/* 2. MAIN CHAT AREA */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0A0A0C]">
        {/* Chat Top Bar */}
        <header className="px-3 sm:px-4 py-2.5 sm:py-3 bg-[#111115] border-b border-[#27272A] flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 shrink">
            {/* Chat History Button (Clear, prominent, with counter) */}
            <button
              type="button"
              onClick={() => setIsSessionsDrawerOpen((prev) => !prev)}
              className="flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#1C1C22] hover:bg-[#27272A] text-white border border-[#27272A] hover:border-[#22C55E]/60 transition-all cursor-pointer shadow-sm group shrink-0"
              title="Open Chat History"
            >
              <History className="w-4 h-4 text-white group-hover:rotate-[-20deg] transition-transform" />
              <span className="text-xs font-bold text-white hidden xs:inline">History</span>
              <span className="px-1.5 py-0.2 rounded-full bg-[#22C55E]/20 text-white text-[10px] font-mono font-bold">
                {sessions.length}
              </span>
            </button>

            <div className="min-w-0">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <h1 className="text-xs sm:text-sm font-bold text-white truncate max-w-[120px] xs:max-w-[160px] sm:max-w-none">
                  {activeSession?.title || 'SmartSolve Assistant'}
                </h1>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#22C55E]/15 text-white border border-[#22C55E]/30 shrink-0">
                  Multimodal
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-zinc-400 truncate hidden md:block">
                Type, snap photo 📷, record voice note 🎙️, or upload files
              </p>
            </div>
          </div>

          {/* Chat Header Actions */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Auto Voice Toggle */}
            <button
              type="button"
              onClick={() => {
                const updated = { ...voiceSettings, autoSpeak: !voiceSettings.autoSpeak };
                handleSaveVoiceSettings(updated);
              }}
              className={`p-1.5 xs:px-2.5 xs:py-1.5 rounded-xl text-xs font-semibold border flex items-center space-x-1 transition-all cursor-pointer shrink-0 ${
                voiceSettings.autoSpeak
                  ? 'bg-[#22C55E]/20 text-white border-[#22C55E]/40 font-bold'
                  : 'bg-[#18181B] text-zinc-400 hover:text-white border-[#27272A]'
              }`}
              title="Automatically read aloud AI replies"
            >
              <Headphones className="w-3.5 h-3.5 text-inherit" />
              <span className="text-[10px] xs:text-xs font-bold">{voiceSettings.autoSpeak ? 'ON' : 'OFF'}</span>
            </button>

            {/* Active Language Selector Pill */}
            <button
              type="button"
              onClick={() => setIsLanguageModalOpen(true)}
              className="p-1.5 xs:px-2.5 xs:py-1.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-zinc-200 hover:text-white border border-[#27272A] hover:border-[#22C55E]/60 transition-all cursor-pointer flex items-center space-x-1 text-xs font-semibold shadow-xs shrink-0"
              title={`Active Language: ${currentLanguage.nativeName} (${currentLanguage.name}). Tap to change language.`}
            >
              <span className="text-sm leading-none">{currentLanguage.flag}</span>
              <span className="font-bold text-white hidden sm:inline">{currentLanguage.nativeName}</span>
              <ChevronDown className="w-3 h-3 text-[#22C55E]" />
            </button>

            {/* ChatGPT Voice Persona Pill */}
            <button
              type="button"
              onClick={() => setIsVoiceModalOpen(true)}
              className="p-1.5 xs:px-2.5 xs:py-1.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-zinc-200 hover:text-white border border-[#27272A] hover:border-[#22C55E]/60 transition-all cursor-pointer flex items-center space-x-1 text-xs font-semibold shadow-xs shrink-0"
              title={`Active Voice Persona: ${currentPersona.name} (${currentPersona.tagline}). Tap to customize voice.`}
            >
              <span className="text-sm">{currentPersona.emoji}</span>
              <span className="font-bold text-white hidden xs:inline">{currentPersona.name}</span>
              <Sliders className="w-3 h-3 text-[#22C55E]" />
            </button>

            {/* New Chat Button */}
            <button
              type="button"
              onClick={handleCreateNewSession}
              className="p-1.5 xs:px-2.5 xs:py-1.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center space-x-1 transition-all cursor-pointer shrink-0"
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
                      : 'bg-[#1C1C22] text-white border border-[#22C55E]/40'
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
                          return (
                            <div key={aIdx} className="my-1.5">
                              <VoiceNotePlayer
                                audioUrl={att.data}
                                title={att.name || 'Voice Note'}
                                duration={att.duration}
                              />
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

                  {/* Synchronized Voice Playback Indicator inside message bubble */}
                  {aiSpeech && aiSpeech.messageId === msg.id && (
                    <div className="mt-3 p-3 rounded-2xl bg-[#1C1C24] border border-[#22C55E]/40 shadow-sm space-y-2 animate-fadeIn">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <Volume2 className="w-4 h-4 text-white animate-pulse shrink-0" />
                          <span className="font-bold text-white text-xs truncate">
                            {aiSpeech.isPlaying ? 'Speaking aloud' : 'Speech paused'} (sentence {aiSpeech.currentIndex + 1}/{aiSpeech.sentences.length})
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-400 font-mono shrink-0 ml-1">
                          {Math.round(((aiSpeech.currentIndex + 1) / aiSpeech.sentences.length) * 100)}%
                        </span>
                      </div>
                      <div className="text-xs text-white bg-black/40 p-2.5 rounded-xl italic border border-white/5">
                        "{aiSpeech.sentences[aiSpeech.currentIndex]}"
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={handleRewindAiSpeech}
                            disabled={aiSpeech.currentIndex === 0}
                            className="px-2 py-1 rounded-lg bg-[#27272A] hover:bg-[#3F3F46] disabled:opacity-30 text-white flex items-center space-x-0.5 text-[11px] font-mono cursor-pointer transition-colors"
                            title="Rewind 5s / previous sentence"
                          >
                            <RotateCcw className="w-3 h-3 text-white" />
                            <span>-5s</span>
                          </button>
                          <button
                            type="button"
                            onClick={aiSpeech.isPlaying ? handlePauseAiSpeech : handleResumeAiSpeech}
                            className="px-2.5 py-1 rounded-lg bg-[#22C55E] hover:bg-[#16A34A] text-white flex items-center space-x-1 text-xs font-bold cursor-pointer transition-colors"
                            title={aiSpeech.isPlaying ? 'Pause' : 'Resume'}
                          >
                            {aiSpeech.isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                            <span>{aiSpeech.isPlaying ? 'Pause' : 'Play'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleForwardAiSpeech}
                            disabled={aiSpeech.currentIndex >= aiSpeech.sentences.length - 1}
                            className="px-2 py-1 rounded-lg bg-[#27272A] hover:bg-[#3F3F46] disabled:opacity-30 text-white flex items-center space-x-0.5 text-[11px] font-mono cursor-pointer transition-colors"
                            title="Forward 5s / next sentence"
                          >
                            <RotateCw className="w-3 h-3 text-white" />
                            <span>+5s</span>
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={handleStopAiSpeech}
                          className="px-2 py-1 rounded-lg bg-[#27272A] hover:bg-rose-500/20 text-zinc-300 hover:text-rose-400 text-xs font-semibold cursor-pointer transition-colors"
                          title="Stop speaking"
                        >
                          Stop
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Actions Bar for Assistant Bubble */}
                  {!isUser && !msg.isStreaming && msg.id !== 'welcome-msg' && (
                    <div className="mt-4 pt-3 border-t border-[#27272A] flex items-center justify-between text-xs text-zinc-400">
                      <div className="flex items-center space-x-2">
                        {/* Voice Listen Button */}
                        <button
                          type="button"
                          onClick={() => handleSpeakMessage(msg.id, msg.content)}
                          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg hover:bg-[#27272A] text-zinc-300 hover:text-white transition-colors cursor-pointer"
                          title={aiSpeech?.messageId === msg.id ? (aiSpeech.isPlaying ? 'Pause voice playback' : 'Resume voice playback') : 'Listen to Voice'}
                        >
                          {aiSpeech?.messageId === msg.id ? (
                            aiSpeech.isPlaying ? (
                              <>
                                <Pause className="w-3.5 h-3.5 text-white" />
                                <span className="text-white font-bold">Pause</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5 text-white" />
                                <span className="text-white font-bold">Resume</span>
                              </>
                            )
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5 text-white" />
                              <span className="text-white">Listen</span>
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
                  <span className="text-[10px] text-white font-bold group-hover:translate-x-0.5 transition-transform ml-2">
                    Ask →
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* DOCKED AI VOICE CONTROLS BAR (Mobile & Desktop with Rewind, Forward, Pause, Resume, Stop, Speed, & Scrub Slider) */}
        {aiSpeech && (
          <div className="bg-[#15151A] border-t border-[#27272A] p-3 sm:px-4 sm:py-3 shadow-2xl animate-fadeIn space-y-2.5">
            <div className="flex items-center justify-between text-xs text-white">
              <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                <div className="w-7 h-7 rounded-xl bg-[#22C55E]/20 border border-[#22C55E]/40 flex items-center justify-center shrink-0">
                  {aiSpeech.isPlaying ? (
                    <Volume2 className="w-4 h-4 text-white animate-pulse" />
                  ) : (
                    <Pause className="w-4 h-4 text-zinc-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-white">
                      {aiSpeech.isPlaying ? 'AI Voice Speaking Aloud' : 'AI Voice Paused'}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      Sentence {aiSpeech.currentIndex + 1} of {aiSpeech.sentences.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-300 truncate italic max-w-md sm:max-w-xl">
                    "{aiSpeech.sentences[aiSpeech.currentIndex]}"
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0 ml-2">
                {/* Playback Speed Cycle */}
                <button
                  type="button"
                  onClick={handleCycleAiSpeechSpeed}
                  className="px-2 py-1 rounded-lg bg-[#27272A] hover:bg-[#3F3F46] text-white font-mono text-[11px] font-bold cursor-pointer transition-colors"
                  title="Cycle playback speed (0.8x, 1x, 1.25x, 1.5x, 2x)"
                >
                  {aiSpeech.playbackRate.toFixed(1)}x
                </button>
                {/* Close / Stop */}
                <button
                  type="button"
                  onClick={handleStopAiSpeech}
                  className="p-1.5 rounded-lg bg-[#27272A] hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Stop voice playback"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrub Slider across sentences */}
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="0"
                max={Math.max(0, aiSpeech.sentences.length - 1)}
                value={aiSpeech.currentIndex}
                onChange={(e) => handleSeekAiSpeech(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#22C55E]"
                aria-label="Seek AI voice playback backwards and forwards"
              />
            </div>

            {/* AI Voice Playback Controls Row: Backward (-5s), Play/Pause, Forward (+5s), Stop */}
            <div className="flex items-center justify-between pt-0.5">
              <div className="flex items-center space-x-2">
                {/* Backward / Rewind -5s (Previous sentence) */}
                <button
                  type="button"
                  onClick={handleRewindAiSpeech}
                  disabled={aiSpeech.currentIndex === 0}
                  className="px-2.5 py-1.5 rounded-xl bg-[#27272A] hover:bg-[#3F3F46] disabled:opacity-30 disabled:hover:bg-[#27272A] text-white flex items-center space-x-1 text-xs font-mono font-bold cursor-pointer transition-colors active:scale-95"
                  title="Rewind to previous sentence (-5s)"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-white" />
                  <span>-5s</span>
                </button>

                {/* Pause / Resume */}
                <button
                  type="button"
                  onClick={aiSpeech.isPlaying ? handlePauseAiSpeech : handleResumeAiSpeech}
                  className="px-3.5 py-1.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white flex items-center space-x-1.5 text-xs font-bold cursor-pointer transition-all shadow-md shadow-emerald-500/20 active:scale-95"
                  title={aiSpeech.isPlaying ? 'Pause speech' : 'Resume speech'}
                >
                  {aiSpeech.isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Resume</span>
                    </>
                  )}
                </button>

                {/* Forward / Fast-Forward +5s (Next sentence) */}
                <button
                  type="button"
                  onClick={handleForwardAiSpeech}
                  disabled={aiSpeech.currentIndex >= aiSpeech.sentences.length - 1}
                  className="px-2.5 py-1.5 rounded-xl bg-[#27272A] hover:bg-[#3F3F46] disabled:opacity-30 disabled:hover:bg-[#27272A] text-white flex items-center space-x-1 text-xs font-mono font-bold cursor-pointer transition-colors active:scale-95"
                  title="Fast forward to next sentence (+5s)"
                >
                  <RotateCw className="w-3.5 h-3.5 text-white" />
                  <span>+5s</span>
                </button>
              </div>

              {/* Stop button */}
              <button
                type="button"
                onClick={handleStopAiSpeech}
                className="px-3 py-1.5 rounded-xl bg-[#27272A] hover:bg-rose-500/20 text-zinc-300 hover:text-rose-400 flex items-center space-x-1.5 text-xs font-bold cursor-pointer transition-colors active:scale-95"
                title="Stop voice playback"
              >
                <Square className="w-3 h-3 text-rose-400" />
                <span>Stop</span>
              </button>
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

              {/* Pending Audio Preview with Full Scrubbing & Playback Controls */}
              {pendingAudioPreview && (
                <div className="w-full flex items-center justify-between gap-2 p-1.5 rounded-2xl bg-[#141418] border border-[#22C55E]/40">
                  <div className="flex-1 min-w-0">
                    <VoiceNotePlayer
                      audioUrl={pendingAudioPreview.url}
                      title={pendingAudioPreview.name || 'Voice Note (Ready to Send)'}
                      duration={pendingAudioPreview.duration}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setPendingAudioPreview(null)}
                    className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-white/10 transition-colors shrink-0"
                    title="Remove audio recording"
                  >
                    <X className="w-4 h-4" />
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
            <div className="flex items-end space-x-1.5 sm:space-x-2">
              {/* Media Action Buttons */}
              <div className="flex items-center space-x-1 pb-1 shrink-0">
                {/* Gallery Image Upload */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 rounded-xl bg-[#18181D] hover:bg-[#27272A] text-zinc-300 hover:text-white border border-[#27272A] transition-colors cursor-pointer"
                  title="Upload Image (PNG, JPG, WEBP)"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>

                {/* Camera Snap */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="p-2.5 rounded-xl bg-[#18181D] hover:bg-[#27272A] text-zinc-300 hover:text-white border border-[#27272A] transition-colors cursor-pointer"
                  title="Take Photo with Camera"
                >
                  <Camera className="w-4 h-4" />
                </button>

                {/* Audio File Upload */}
                <button
                  type="button"
                  onClick={() => audioFileInputRef.current?.click()}
                  className="p-2.5 rounded-xl bg-[#18181D] hover:bg-[#27272A] text-zinc-300 hover:text-white border border-[#27272A] transition-colors cursor-pointer hidden sm:block"
                  title="Upload Audio File (MP3, WAV, M4A, WebM)"
                >
                  <FileAudio className="w-4 h-4" />
                </button>

                {/* Record Voice Note */}
                <button
                  type="button"
                  onClick={startVoiceRecording}
                  className="p-2.5 rounded-xl bg-[#18181D] hover:bg-[#22C55E]/20 text-zinc-300 hover:text-white border border-[#27272A] transition-colors cursor-pointer"
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
                      ? t('type_message', 'Add text or question about these attachments...')
                      : t('ask_anything', 'Ask anything, code, math, essays, or send a voice note...')
                  }
                  className="w-full bg-[#0A0A0C] border border-[#27272A] focus:border-[#22C55E] rounded-2xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors resize-none max-h-36 scrollbar-thin"
                />
              </div>

              {/* Send or Stop Button */}
              <div className="pb-1 shrink-0">
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
          className="fixed inset-0 z-[1100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
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

      {/* 5. VOICE & LANGUAGE CUSTOMIZATION MODAL */}
      {isVoiceModalOpen && (
        <div className="fixed inset-0 z-[1100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121216] border border-[#27272A] rounded-3xl p-5 sm:p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto scrollbar-thin animate-scaleUp">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#22C55E]/15 border border-[#22C55E]/40 flex items-center justify-center text-[#22C55E]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <span>ChatGPT Voice Mode</span>
                    <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30">
                      PRO
                    </span>
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Lifelike conversational personas with expressive pacing, natural intonation & neural audio
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsVoiceModalOpen(false)}
                className="p-1.5 rounded-lg bg-[#27272A] hover:bg-[#3F3F46] text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1. Voice Persona Selection (ChatGPT Advanced Voice Mode Personas) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <Headphones className="w-3.5 h-3.5 text-[#22C55E]" />
                  <span>Choose Voice Persona:</span>
                </label>
                <span className="text-[11px] text-zinc-400">
                  Active: <strong className="text-[#22C55E]">{currentPersona.name}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {VOICE_PERSONAS.map((p) => {
                  const isSelected = voiceSettings.personaId === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        const updated: VoiceSettings = {
                          ...voiceSettings,
                          personaId: p.id,
                          gender: p.gender,
                          language: p.accentCode,
                          voiceURI: '',
                        };
                        handleSaveVoiceSettings(updated);
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 text-left relative ${
                        isSelected
                          ? 'bg-[#22C55E]/15 border-[#22C55E] shadow-md shadow-emerald-500/10'
                          : 'bg-[#0A0A0C] border-[#27272A] hover:border-[#3F3F46] hover:bg-[#18181D]'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{p.emoji}</span>
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-bold text-sm text-white">{p.name}</span>
                              {isSelected && (
                                <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                              )}
                            </div>
                            <span className="text-[10px] text-zinc-400 font-medium">{p.accent}</span>
                          </div>
                        </div>

                        {/* Test Sample Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const sample = p.sampleGreeting;
                            // Temporarily play with this persona
                            handleSpeakMessage(`sample-${p.id}`, sample);
                          }}
                          className="px-2 py-1 rounded-lg bg-[#27272A] hover:bg-[#22C55E] hover:text-white text-zinc-300 text-[10px] font-bold transition-all cursor-pointer flex items-center space-x-1 shrink-0"
                          title={`Listen to ${p.name}'s voice`}
                        >
                          <Play className="w-2.5 h-2.5" />
                          <span>Sample</span>
                        </button>
                      </div>

                      <p className="text-[11px] text-zinc-300 leading-snug line-clamp-2">
                        {p.description}
                      </p>

                      <div className="flex items-center justify-between text-[10px] pt-0.5 border-t border-white/5">
                        <span className="text-zinc-500 capitalize">{p.gender} voice</span>
                        <span className="text-zinc-400 font-medium italic">{p.tagline}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Voice Language & Accent */}
            <div className="p-3.5 rounded-2xl bg-[#0A0A0C] border border-[#27272A] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300 flex items-center space-x-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#22C55E]" />
                  <span>Voice Language & Accent:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsLanguageModalOpen(true)}
                  className="text-[11px] text-[#22C55E] hover:underline font-bold cursor-pointer"
                >
                  Change Language
                </button>
              </div>
              <button
                type="button"
                onClick={() => setIsLanguageModalOpen(true)}
                className="w-full bg-[#18181D] hover:bg-[#22222A] border border-[#27272A] hover:border-[#22C55E]/50 rounded-xl px-3 py-2.5 text-xs text-white flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="text-xl leading-none">{currentLanguage.flag}</span>
                  <div className="text-left">
                    <div className="font-bold text-white">{currentLanguage.nativeName}</div>
                    <div className="text-[11px] text-zinc-400">{currentLanguage.name}</div>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#22C55E]/15 text-[#22C55E] font-bold border border-[#22C55E]/30 uppercase font-mono">
                  {currentLanguage.voiceCode}
                </span>
              </button>
            </div>

            {/* 3. Detected Neural Engine & Hardware Voice */}
            <div className="p-3.5 rounded-2xl bg-[#0A0A0C] border border-[#27272A] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300 flex items-center space-x-1.5">
                  <Bot className="w-3.5 h-3.5 text-[#22C55E]" />
                  <span>Device Neural Engine:</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#22C55E]/15 text-[#22C55E] font-bold border border-[#22C55E]/30">
                  Neural Active
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Using optimal neural synthesis with conversational math-to-speech pronunciation, natural pauses & pacing.
              </p>
              <select
                value={voiceSettings.voiceURI}
                onChange={(e) => {
                  const updated: VoiceSettings = { ...voiceSettings, voiceURI: e.target.value };
                  handleSaveVoiceSettings(updated);
                }}
                className="w-full bg-[#18181D] border border-[#27272A] focus:border-[#22C55E] rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value="">
                  ✨ Auto-Select Best Neural Voice (Recommended for {currentPersona.name})
                </option>
                {availableVoices.map((v, i) => (
                  <option key={i} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Speaking Speed Controls */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-300">Speaking Pacing & Speed:</span>
                <span className="text-[#22C55E] font-mono font-bold text-sm">
                  {voiceSettings.rate.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.5"
                step="0.05"
                value={voiceSettings.rate}
                onChange={(e) => {
                  const updated: VoiceSettings = {
                    ...voiceSettings,
                    rate: parseFloat(e.target.value),
                  };
                  handleSaveVoiceSettings(updated);
                }}
                className="w-full accent-[#22C55E] cursor-pointer"
              />
              <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                <span>0.8x (Relaxed)</span>
                <span>1.0x (Natural Human)</span>
                <span>1.25x (Fast)</span>
                <span>1.5x (Speed)</span>
              </div>
            </div>

            {/* 4. Auto Voice Responses Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#0A0A0C] border border-[#27272A]">
              <div>
                <div className="text-xs font-semibold text-white">Auto Voice Readout</div>
                <div className="text-[11px] text-zinc-400">
                  Automatically speak AI responses with {currentPersona.name}'s voice
                </div>
              </div>
              <input
                type="checkbox"
                checked={voiceSettings.autoSpeak}
                onChange={(e) => {
                  const updated: VoiceSettings = { ...voiceSettings, autoSpeak: e.target.checked };
                  handleSaveVoiceSettings(updated);
                }}
                className="w-4 h-4 accent-[#22C55E] rounded cursor-pointer"
              />
            </div>

            {/* 5. Footer Buttons */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  const sampleText = currentPersona.sampleGreeting;
                  handleSpeakMessage('test-voice', sampleText);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#27272A] hover:bg-[#3F3F46] text-white text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer transition-colors"
              >
                <Volume2 className="w-3.5 h-3.5 text-[#22C55E]" />
                <span>Test {currentPersona.name}'s Voice</span>
              </button>
              <button
                type="button"
                onClick={() => setIsVoiceModalOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold cursor-pointer transition-colors shadow-md shadow-emerald-500/20"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
