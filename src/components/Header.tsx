import React, { useState, useEffect } from 'react';
import {
  Calculator,
  Search,
  History,
  Download,
  Sparkles,
  MessageSquare,
  GraduationCap,
  Globe,
  Cloud,
  Settings,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { InstallAppModal } from './InstallAppModal';
import { CloudSyncModal } from './CloudSyncModal';
import { SettingsModal } from './SettingsModal';
import { useTheme } from '../contexts/ThemeContext';
import { useAppLanguage } from '../contexts/LanguageContext';
import { getHistory } from '../services/historyStorage';

interface Props {
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  onOpenSearch: () => void;
  onOpenHistory: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<Props> = ({
  onOpenSearch,
  onOpenHistory,
  activeTab,
  setActiveTab,
}) => {
  const { isInstalled, canInstall, triggerInstall } = usePWAInstall();
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false);
  const { currentLanguage, setIsLanguageModalOpen, t } = useAppLanguage();
  const [historyCount, setHistoryCount] = useState<number>(() => {
    try {
      return getHistory().length;
    } catch {
      return 0;
    }
  });

  const { themePreference, resolvedTheme, accentPalette } = useTheme();
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    const updateCount = () => {
      try {
        setHistoryCount(getHistory().length);
      } catch {
        // ignore
      }
    };
    updateCount();
    window.addEventListener('smartsolve_history_changed', updateCount);

    const handleOpenSettings = () => setIsSettingsOpen(true);
    window.addEventListener('smartsolve_open_theme_modal', handleOpenSettings);
    window.addEventListener('smartsolve_open_settings_modal', handleOpenSettings);

    return () => {
      window.removeEventListener('smartsolve_history_changed', updateCount);
      window.removeEventListener('smartsolve_open_theme_modal', handleOpenSettings);
      window.removeEventListener('smartsolve_open_settings_modal', handleOpenSettings);
    };
  }, []);

  const handleInstallClick = async () => {
    if (canInstall) {
      const installed = await triggerInstall();
      if (!installed) {
        setIsInstallModalOpen(true);
      }
    } else {
      setIsInstallModalOpen(true);
    }
  };

  return (
    <>
      <header
        className={`border-b transform-gpu ${
          isDark
            ? 'bg-[#0A0A0A] text-white border-[#27272A]'
            : 'bg-white text-slate-900 border-slate-200 shadow-xs'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-15 sm:h-18 gap-2">
            {/* Logo & Branding */}
            <div
              className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer select-none flex-shrink-0"
              onClick={() => setActiveTab('scientific')}
            >
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl border flex items-center justify-center shadow-lg text-[#22C55E] flex-shrink-0 transition-colors ${
                  isDark
                    ? 'bg-[#18181B] border-[#22C55E]/40 shadow-emerald-500/15'
                    : 'bg-emerald-50 border-emerald-300 shadow-emerald-600/10'
                }`}
              >
                <Calculator className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span
                    className={`text-base sm:text-lg font-black tracking-tight ${
                      isDark ? 'text-[#FFFFFF]' : 'text-slate-900'
                    }`}
                  >
                    Smart<span className="text-[#22C55E]">Solve</span>
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30">
                    PRO
                  </span>
                </div>
                <p
                  className={`text-[10px] sm:text-[11px] font-medium hidden sm:block ${
                    isDark ? 'text-[#A1A1AA]' : 'text-slate-500'
                  }`}
                >
                  Mathematics, Physics & Chemistry Tutor
                </p>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Learn Any Topic Button (desktop/tablet) */}
              <button
                onClick={() => setActiveTab('learn_topic')}
                className={`hidden lg:flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'learn_topic'
                    ? 'bg-[#22C55E] text-[#FFFFFF] shadow-md shadow-emerald-500/25'
                    : isDark
                    ? 'bg-[#18181B] hover:bg-[#27272A] text-white border border-[#27272A]'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                }`}
                title="Learn Any Academic Topic with AI Master Tutor"
              >
                <GraduationCap className="w-3.5 h-3.5 text-inherit" />
                <span>Learn Topic</span>
              </button>

              {/* Direct AI Chat Button (desktop/tablet) */}
              <button
                onClick={() => setActiveTab('ai_chat')}
                className={`hidden sm:flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'ai_chat'
                    ? 'bg-[#22C55E] text-[#FFFFFF] shadow-md shadow-emerald-500/25'
                    : isDark
                    ? 'bg-[#18181B] hover:bg-[#27272A] text-white border border-[#27272A]'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                }`}
                title="Chat with AI Assistant (Voice, Vision & Text)"
              >
                <MessageSquare className="w-3.5 h-3.5 text-inherit" />
                <span>{t('ai_chat', 'AI Chat')}</span>
              </button>

              {/* Direct AI Solver Button (desktop/tablet) */}
              <button
                onClick={() => setActiveTab('ai_solver')}
                className={`hidden md:flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'ai_solver'
                    ? 'bg-[#22C55E] text-[#FFFFFF] shadow-md shadow-emerald-500/25'
                    : isDark
                    ? 'bg-[#18181B] hover:bg-[#27272A] text-white border border-[#27272A]'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                }`}
                title="Open AI Solver for Mathematics, Physics & Chemistry"
              >
                <Sparkles className="w-3.5 h-3.5 text-inherit" />
                <span>{t('ai_solver', 'AI Solver')}</span>
              </button>

              {/* Install App Button (desktop/tablet) */}
              {!isInstalled && (
                <button
                  onClick={handleInstallClick}
                  className="hidden sm:flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-[#FFFFFF] text-xs font-bold shadow-md shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer shrink-0"
                  title="Install SmartSolve as a phone or desktop app"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t('install', 'Install')}</span>
                </button>
              )}

              {/* Quick Search Button */}
              <button
                onClick={onOpenSearch}
                className={`flex items-center space-x-1.5 p-2 sm:px-3 sm:py-2 rounded-xl transition-colors text-xs font-semibold border cursor-pointer shrink-0 ${
                  isDark
                    ? 'bg-[#18181B] hover:bg-[#27272A] text-[#A1A1AA] hover:text-[#FFFFFF] border-white/5'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border-slate-200'
                }`}
                title="Search formula and tools"
              >
                <Search className="w-4 h-4 text-[#22C55E]" />
                <span className="hidden lg:inline">{t('search', 'Quick Search')}</span>
              </button>

              {/* History Button */}
              <button
                onClick={onOpenHistory}
                title="Calculation & Chat History"
                className={`flex items-center space-x-1.5 p-2 sm:px-3 sm:py-2 rounded-xl transition-all border cursor-pointer shadow-xs active:scale-95 shrink-0 ${
                  isDark
                    ? 'bg-[#18181B] hover:bg-[#27272A] text-white border-[#27272A]'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-200'
                }`}
              >
                <History className="w-4 h-4 text-[#22C55E]" />
                <span className="text-xs font-bold hidden sm:inline">{t('history', 'History')}</span>
                {historyCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#22C55E] text-white text-[10px] font-black">
                    {historyCount > 99 ? '99+' : historyCount}
                  </span>
                )}
              </button>

              {/* Cloud Sync Button (desktop/tablet; also inside Settings Room on mobile) */}
              <button
                onClick={() => setIsCloudSyncOpen(true)}
                title="Cloud Workspace Sync, Pinned Formulas & Exam Countdowns"
                className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-2 rounded-xl transition-all border cursor-pointer shadow-xs active:scale-95 shrink-0 ${
                  isDark
                    ? 'bg-[#18181B] hover:bg-[#27272A] text-white border-[#27272A]'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-200'
                }`}
              >
                <Cloud className="w-4 h-4 text-[#22C55E]" />
                <span className="text-xs font-bold hidden lg:inline">Cloud Sync</span>
              </button>

              {/* Prominent Settings Room Button (always clearly visible on mobile & desktop) */}
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                title={`Settings Room · Mode: ${themePreference} · Color: ${accentPalette.name}`}
                aria-label="Open Settings Room"
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl transition-all border cursor-pointer active:scale-95 shrink-0 ${
                  isDark
                    ? 'bg-[#18181B] hover:bg-[#27272A] text-white border-[#22C55E]/50 shadow-sm shadow-emerald-500/10'
                    : 'bg-emerald-50/70 hover:bg-emerald-100 text-slate-900 border-[#22C55E]/50 shadow-xs'
                }`}
              >
                <Settings className="w-4 h-4 text-[#22C55E]" />
                <span className="text-xs font-extrabold">Settings</span>
                <span
                  className={`w-2.5 h-2.5 rounded-full ring-1 ring-white/40 ${accentPalette.swatchClass}`}
                />
              </button>

              {/* App Language & Writing Selector (desktop; also inside Settings Room) */}
              <button
                onClick={() => setIsLanguageModalOpen(true)}
                title={`App Language & Writing: ${currentLanguage.name} (${currentLanguage.nativeName})`}
                className={`hidden md:flex items-center space-x-1.5 px-2.5 py-2 rounded-xl transition-colors border cursor-pointer active:scale-95 shrink-0 ${
                  isDark
                    ? 'bg-[#18181B] hover:bg-[#27272A] text-white border-[#27272A]'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-200'
                }`}
              >
                <span className="text-sm leading-none" role="img" aria-label={currentLanguage.name}>
                  {currentLanguage.flag}
                </span>
                <Globe className="w-3.5 h-3.5 text-[#22C55E]" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Unified Settings Room Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenCloudSync={() => setIsCloudSyncOpen(true)}
        isInstalled={isInstalled}
        onTriggerInstall={handleInstallClick}
      />

      {/* Install Guidance Modal */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      {/* Cloud Workspace Sync & Exam Countdowns Modal */}
      <CloudSyncModal
        isOpen={isCloudSyncOpen}
        onClose={() => setIsCloudSyncOpen(false)}
      />
    </>
  );
};
