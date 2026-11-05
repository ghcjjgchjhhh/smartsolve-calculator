import React, { useState, useEffect } from 'react';
import { HistoryItem, ChatSession } from '../types';
import { getHistory, deleteHistoryItem, clearHistory } from '../services/historyStorage';
import { loadChatSessions, deleteChatSession } from '../services/chatStorage';
import { StepSolutionCard } from './StepSolutionCard';
import { useTheme } from '../contexts/ThemeContext';
import { useAppLanguage } from '../contexts/LanguageContext';
import {
  History,
  Trash2,
  X,
  Clock,
  MessageSquare,
  Calculator,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectSolution?: (item: HistoryItem) => void;
}

export const HistoryDrawer: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'calculations' | 'chats'>('calculations');
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeItem, setActiveItem] = useState<HistoryItem | null>(null);

  const { resolvedTheme } = useTheme();
  const { t } = useAppLanguage();
  const isDark = resolvedTheme === 'dark';

  const loadData = () => {
    try {
      setHistoryList(getHistory());
      setChatSessions(loadChatSessions());
    } catch (e) {
      console.error('Error loading history data:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
    window.addEventListener('smartsolve_history_changed', loadData);
    return () => {
      window.removeEventListener('smartsolve_history_changed', loadData);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + d.toLocaleDateString();
  };

  const handleClearAllCalculations = () => {
    if (window.confirm('Are you sure you want to clear your calculation history?')) {
      clearHistory();
      setActiveItem(null);
      setHistoryList([]);
    }
  };

  const handleDeleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this conversation?')) {
      deleteChatSession(id);
      setChatSessions(loadChatSessions());
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-sm flex justify-end">
      <div
        className={`w-full max-w-lg h-full shadow-2xl flex flex-col border-l animate-in slide-in-from-right duration-200 transition-colors ${
          isDark
            ? 'bg-[#0A0A0A] text-white border-[#27272A]'
            : 'bg-white text-slate-900 border-slate-200'
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 sm:p-5 border-b flex items-center justify-between transition-colors ${
            isDark ? 'border-[#27272A] bg-[#0E0E12]' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-[#22C55E]" />
            <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {t('history', 'Activity History')}
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            {activeTab === 'calculations' && historyList.length > 0 && (
              <button
                onClick={handleClearAllCalculations}
                title={t('clear_history', 'Clear All Calculation History')}
                className="p-2 hover:bg-[#EF4444]/20 rounded-lg text-[#EF4444] transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                isDark
                  ? 'hover:bg-[#18181B] text-[#A1A1AA] hover:text-[#FFFFFF]'
                  : 'hover:bg-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dual Tabs: Calculations vs AI Chats */}
        <div
          className={`flex border-b px-4 pt-2 transition-colors ${
            isDark ? 'border-[#27272A] bg-[#0A0A0A]' : 'border-slate-200 bg-white'
          }`}
        >
          <button
            onClick={() => setActiveTab('calculations')}
            className={`flex items-center space-x-2 pb-2.5 px-3 border-b-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'calculations'
                ? 'border-[#22C55E] text-[#22C55E]'
                : isDark
                ? 'border-transparent text-zinc-400 hover:text-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>{t('calculator', 'Calculations')}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'calculations'
                  ? 'bg-[#22C55E]/20 text-[#22C55E]'
                  : isDark
                  ? 'bg-zinc-800 text-zinc-400'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {historyList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('chats')}
            className={`flex items-center space-x-2 pb-2.5 px-3 border-b-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'chats'
                ? 'border-[#22C55E] text-[#22C55E]'
                : isDark
                ? 'border-transparent text-zinc-400 hover:text-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{t('ai_chat', 'AI Chats')}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'chats'
                  ? 'bg-[#22C55E]/20 text-[#22C55E]'
                  : isDark
                  ? 'bg-zinc-800 text-zinc-400'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {chatSessions.length}
            </span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeTab === 'calculations' ? (
            historyList.length === 0 ? (
              <div
                className={`h-64 flex flex-col items-center justify-center text-center space-y-2 ${
                  isDark ? 'text-[#A1A1AA]' : 'text-slate-500'
                }`}
              >
                <Clock className="w-10 h-10 opacity-30" />
                <p
                  className={`text-sm font-semibold ${
                    isDark ? 'text-white' : 'text-slate-800'
                  }`}
                >
                  No calculation history yet
                </p>
                <p className="text-xs max-w-xs opacity-75">
                  Calculations from Scientific Calculator, Math Hub, Physics Hub, Equations, and Smart Input are automatically recorded here.
                </p>
              </div>
            ) : (
              historyList.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border transition-all space-y-2 group ${
                    isDark
                      ? 'bg-[#121216] border-[#27272A] hover:border-[#22C55E]/60 text-white'
                      : 'bg-slate-50 border-slate-200 hover:border-emerald-400 text-slate-900 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold uppercase tracking-wider text-[#22C55E]">
                      {item.category}
                    </span>
                    <span
                      className={`text-[11px] ${
                        isDark ? 'text-[#A1A1AA]' : 'text-slate-500'
                      }`}
                    >
                      {formatDate(item.timestamp)}
                    </span>
                  </div>

                  <div
                    className={`font-semibold text-sm line-clamp-1 ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {item.title}
                  </div>

                  {item.problemStatement && (
                    <div
                      className={`text-xs font-mono line-clamp-1 ${
                        isDark ? 'text-zinc-400' : 'text-slate-600'
                      }`}
                    >
                      {item.problemStatement}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <div className="font-mono text-sm font-bold text-[#22C55E]">
                      = {item.finalAnswer} {item.unit || ''}
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setActiveItem(item)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          isDark
                            ? 'bg-[#18181B] text-white hover:bg-[#22C55E] hover:text-white'
                            : 'bg-slate-200 text-slate-800 hover:bg-[#22C55E] hover:text-white'
                        }`}
                      >
                        View Steps
                      </button>
                      <button
                        onClick={() => deleteHistoryItem(item.id)}
                        className={`p-1.5 rounded transition-colors cursor-pointer ${
                          isDark
                            ? 'text-zinc-500 hover:text-red-400 hover:bg-zinc-800'
                            : 'text-slate-400 hover:text-red-600 hover:bg-slate-200'
                        }`}
                        title="Delete calculation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )
          ) : (
            /* AI Chats Tab */
            chatSessions.length === 0 ? (
              <div
                className={`h-64 flex flex-col items-center justify-center text-center space-y-2 ${
                  isDark ? 'text-[#A1A1AA]' : 'text-slate-500'
                }`}
              >
                <Sparkles className="w-10 h-10 opacity-30 text-[#22C55E]" />
                <p
                  className={`text-sm font-semibold ${
                    isDark ? 'text-white' : 'text-slate-800'
                  }`}
                >
                  No AI chat conversations yet
                </p>
                <p className="text-xs max-w-xs opacity-75">
                  Start a conversation in AI Chat to ask questions, solve homework, or analyze diagrams.
                </p>
              </div>
            ) : (
              chatSessions.map((session) => {
                const messageCount = session.messages?.length || 0;
                const lastMsg = session.messages && session.messages.length > 0
                  ? session.messages[session.messages.length - 1].content.slice(0, 80)
                  : 'Empty conversation';

                return (
                  <div
                    key={session.id}
                    className={`p-3.5 rounded-2xl border transition-all space-y-1.5 group ${
                      isDark
                        ? 'bg-[#121216] border-[#27272A] hover:border-[#22C55E]/60 text-white'
                        : 'bg-slate-50 border-slate-200 hover:border-emerald-400 text-slate-900 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold flex items-center space-x-1 text-[#22C55E]">
                        <MessageSquare className="w-3 h-3" />
                        <span>Chat Session</span>
                      </span>
                      <span
                        className={`text-[11px] ${
                          isDark ? 'text-zinc-400' : 'text-slate-500'
                        }`}
                      >
                        {formatDate(session.updatedAt || session.createdAt)}
                      </span>
                    </div>

                    <div
                      className={`font-semibold text-sm line-clamp-1 ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {session.title || 'Conversation'}
                    </div>

                    <p
                      className={`text-xs line-clamp-2 ${
                        isDark ? 'text-zinc-400' : 'text-slate-600'
                      }`}
                    >
                      {lastMsg}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <span
                        className={`text-[11px] font-mono ${
                          isDark ? 'text-zinc-500' : 'text-slate-500'
                        }`}
                      >
                        {messageCount} message{messageCount === 1 ? '' : 's'}
                      </span>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => {
                            try {
                              localStorage.setItem('smartsolve_active_session_id_v2', session.id);
                              window.dispatchEvent(new Event('smartsolve_session_selected'));
                              onClose();
                            } catch {
                              // ignore
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#22C55E] text-white text-xs font-bold hover:bg-[#16A34A] transition-all cursor-pointer flex items-center space-x-1"
                        >
                          <span>Open</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteChat(session.id, e)}
                          className={`p-1.5 rounded transition-colors cursor-pointer ${
                            isDark
                              ? 'text-zinc-500 hover:text-red-400 hover:bg-zinc-800'
                              : 'text-slate-400 hover:text-red-600 hover:bg-slate-200'
                          }`}
                          title="Delete conversation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>

        {/* Modal for viewing selected historic item */}
        {activeItem && (
          <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
            <div className="max-w-xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => setActiveItem(null)}
                  className={`p-1.5 rounded-full cursor-pointer transition-colors ${
                    isDark
                      ? 'bg-[#18181B] text-white hover:bg-[#22C55E]'
                      : 'bg-slate-200 text-slate-800 hover:bg-[#22C55E] hover:text-white'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <StepSolutionCard solution={activeItem} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
