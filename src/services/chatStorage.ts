import { ChatSession, ChatMessage } from '../types';

const STORAGE_KEY = 'smartsolve_chat_sessions_v2';
const ACTIVE_SESSION_KEY = 'smartsolve_active_session_id_v2';

const DEFAULT_WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome-msg',
  role: 'assistant',
  content: `I am your multimodal AI assistant. Ask me anything—from coding, technology, Mathematics, Physics, Chemistry, Biology, and English to everyday questions, writing, and logic.

You can **type**, **snap or upload photos** 📷 of handwritten equations, diagrams, and questions, or **record / upload voice notes** 🎙️ in any accent (including Nigerian English). How can we get started?`,
  timestamp: Date.now(),
};

export function createNewSession(customTitle?: string): ChatSession {
  const now = Date.now();
  const session: ChatSession = {
    id: `session_${now}_${Math.random().toString(36).substring(2, 7)}`,
    title: customTitle || 'New Conversation',
    createdAt: now,
    updatedAt: now,
    messages: [DEFAULT_WELCOME_MESSAGE],
  };
  return session;
}

export function loadChatSessions(): ChatSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = createNewSession();
      saveChatSessions([initial]);
      setActiveSessionId(initial.id);
      return [initial];
    }
    const sessions = JSON.parse(raw);
    if (!Array.isArray(sessions) || sessions.length === 0) {
      const initial = createNewSession();
      saveChatSessions([initial]);
      setActiveSessionId(initial.id);
      return [initial];
    }
    return sessions;
  } catch (err) {
    console.error('Failed to load chat sessions:', err);
    const initial = createNewSession();
    return [initial];
  }
}

export function saveChatSessions(sessions: ChatSession[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.error('Failed to save chat sessions to localStorage:', err);
  }
}

export function getActiveSessionId(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(ACTIVE_SESSION_KEY) || '';
}

export function setActiveSessionId(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ACTIVE_SESSION_KEY, id);
  } catch {}
}

export function saveSingleSession(updated: ChatSession): ChatSession[] {
  const sessions = loadChatSessions();
  const index = sessions.findIndex((s) => s.id === updated.id);
  if (index >= 0) {
    sessions[index] = { ...updated, updatedAt: Date.now() };
  } else {
    sessions.unshift({ ...updated, updatedAt: Date.now() });
  }
  saveChatSessions(sessions);
  return sessions;
}

export function deleteChatSession(sessionId: string): ChatSession[] {
  const sessions = loadChatSessions().filter((s) => s.id !== sessionId);
  if (sessions.length === 0) {
    const fresh = createNewSession();
    sessions.push(fresh);
    setActiveSessionId(fresh.id);
  } else {
    const currentActive = getActiveSessionId();
    if (currentActive === sessionId) {
      setActiveSessionId(sessions[0].id);
    }
  }
  saveChatSessions(sessions);
  return sessions;
}

export function renameChatSession(sessionId: string, newTitle: string): ChatSession[] {
  const sessions = loadChatSessions();
  const session = sessions.find((s) => s.id === sessionId);
  if (session) {
    session.title = newTitle.trim() || 'Untitled Chat';
    session.updatedAt = Date.now();
    saveChatSessions(sessions);
  }
  return sessions;
}
