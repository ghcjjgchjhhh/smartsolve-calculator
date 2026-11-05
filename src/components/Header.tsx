import React, { useState, useEffect } from 'react';
import {
  Calculator,
  Moon,
  Sun,
  Monitor,
  Search,
  History,
  Download,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  Check,
  X,
  Globe,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { InstallAppModal } from './InstallAppModal';
import { useTheme, ThemePreference } from '../contexts/ThemeContext';
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
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const { currentLanguage, setIsLanguageModalOpen, t } = useAppLanguage();
  const [historyCount, setHistoryCount] = useState<number>(() => {
    try {
      return getHistory().length;
    } catch {
      return 0;
    }
  });

  const { themePreference, resolvedTheme, setThemePreference } = useTheme();
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

    const handleOpenTheme = () => setIsThemeModalOpen(true);
    window.addEventListener('smartsolve_open_theme_modal', handleOpenTheme);

    return () => {
      window.removeEventListener('smartsolve_history_changed', updateCount);
      window.removeEventListener('smartsolve_open_theme_modal', handleOpenTheme);
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

  const themeOptions: {
    id: ThemePreference;
    name: string;
    description: string;
    icon: typeof Moon;
  }[] = [
    {
      id: 'system',
      name: 'System Default',
      description: 'Automatically follows your phone or computer appearance',
      icon: Monitor,
    },
    {
      id: 'dark',
      name: 'Dark Mode',
      description: 'Pure OLED black background with crisp high contrast',
      icon: Moon,
    },
    {
      id: 'light',
      name: 'Light Mode',
      description: 'Clean, bright layout optimized for daylight and reading',
      icon: Sun,
    },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors ${
          isDark
            ? 'bg-[#0A0A0A]/95 text-white border-[#27272A]'
            : 'bg-white/95 text-slate-900 border-slate-200 shadow-xs'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-15 sm:h-18">
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
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
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

              {/* Install App Button */}
              {!isInstalled && (
                <button
                  onClick={handleInstallClick}
                  className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-[#FFFFFF] text-xs font-bold shadow-md shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
                  title="Install SmartSolve as a phone or desktop app"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">{t('install', 'Install')}</span>
                </button>
              )}

              {/* Quick Search Button */}
              <button
                onClick={onOpenSearch}
                className={`flex items-center space-x-1.5 p-2 sm:px-3 sm:py-2 rounded-xl transition-colors text-xs font-semibold border cursor-pointer ${
                  isDark
                    ? 'bg-[#18181B] hover:bg-[#27272A] text-[#A1A1AA] hover:text-[#FFFFFF] border-white/5'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border-slate-200'
                }`}
                title="Search formula and tools"
              >
                <Search className="w-4 h-4 text-[#22C55E]" />
                <span className="hidden lg:inline">{t('search', 'Quick Search')}</span>
              </button>

              {/* History Button - Prominent on both mobile and desktop with counter badge */}
              <button
                onClick={onOpenHistory}
                title="Calculation & Chat History"
                className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl transition-all border cursor-pointer shadow-xs active:scale-95 ${
                  isDark
                    ? 'bg-[#18181B] hover:bg-[#27272A] text-white border-[#27272A]'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-200'
                }`}
              >
                <History className="w-4 h-4 text-[#22C55E]" />
                <span className="text-xs font-bold hidden xs:inline">{t('history', 'History')}</span>
                {historyCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#22C55E] text-white text-[10px] font-black">
                    {historyCount > 99 ? '99+' : historyCount}
                  </span>
                )}
              </button>

              {/* Appearance / Theme Setting Modal Trigger */}
              <button
                onClick={() => setIsThemeModalOpen(true)}
                title={`Appearance: ${themePreference === 'system' ? 'System (' + resolvedTheme + ')' : themePreference}`}
                className={`flex items-center space-x-1.5 p-2 sm:px-2.5 sm:py-2 rounded-xl transition-colors border cursor-pointer relative group ${
                  isDark
                    ? 'bg-[#18181B] hover:bg-[#27272A] text-white border-[#27272A]'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-200'
                }`}
              >
                {themePreference === 'system' ? (
                  <Monitor className={`w-4 h-4 ${isDark ? 'text-white' : 'text-slate-800'}`} />
                ) : resolvedTheme === 'dark' ? (
                  <Moon className="w-4 h-4 text-white" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-500" />
                )}
                <span className="text-xs font-bold hidden md:inline capitalize">
                  {themePreference === 'system' ? t('theme', 'Theme') : themePreference}
                </span>
                {themePreference === 'system' && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#22C55E] ring-2 ring-black/50" />
                )}
              </button>

              {/* App Language & Writing Selector */}
              <button
                onClick={() => setIsLanguageModalOpen(true)}
                title={`App Language & Writing: ${currentLanguage.name} (${currentLanguage.nativeName})`}
                className={`flex items-center space-x-1 sm:space-x-1.5 p-1.5 sm:px-2.5 sm:py-2 rounded-xl transition-colors border cursor-pointer active:scale-95 ${
                  isDark
                    ? 'bg-[#18181B] hover:bg-[#27272A] text-white border-[#27272A]'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-200'
                }`}
              >
                <span className="text-sm leading-none" role="img" aria-label={currentLanguage.name}>
                  {currentLanguage.flag}
                </span>
                <span className="text-xs font-bold hidden sm:inline">
                  {currentLanguage.nativeName}
                </span>
                <Globe className="w-3.5 h-3.5 text-[#22C55E]" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Appearance Setting Modal */}
      {isThemeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-2xl space-y-4 animate-scaleUp border transition-all ${
              isDark
                ? 'bg-[#121216] border-[#27272A] text-white'
                : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
            }`}
          >
            <div
              className={`flex items-center justify-between border-b pb-3 ${
                isDark ? 'border-[#27272A]' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Monitor className="w-5 h-5 text-[#22C55E]" />
                <div>
                  <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Appearance & Theme
                  </h3>
                  <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    System appearance detection & manual mode
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsThemeModalOpen(false)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-[#27272A] hover:bg-[#3F3F46] text-zinc-400 hover:text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {themeOptions.map((opt) => {
                const isSelected = themePreference === opt.id;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setThemePreference(opt.id);
                    }}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-start space-x-3 transition-all cursor-pointer ${
                      isSelected
                        ? isDark
                          ? 'bg-[#22C55E]/15 border-[#22C55E] text-white shadow-md shadow-emerald-500/10'
                          : 'bg-emerald-50 border-[#22C55E] text-slate-900 shadow-md shadow-emerald-600/10'
                        : isDark
                        ? 'bg-[#18181D] border-[#27272A] text-zinc-300 hover:text-white hover:bg-[#27272A]'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl mt-0.5 ${
                        isSelected
                          ? 'bg-[#22C55E] text-white'
                          : isDark
                          ? 'bg-[#27272A] text-zinc-400'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          {opt.name}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-[#22C55E]" />}
                      </div>
                      <p
                        className={`text-[11px] mt-0.5 leading-snug ${
                          isDark ? 'text-zinc-400' : 'text-slate-500'
                        }`}
                      >
                        {opt.description}
                      </p>
                      {opt.id === 'system' && (
                        <div
                          className={`mt-1 text-[10px] font-mono ${
                            isDark ? 'text-zinc-400' : 'text-slate-500'
                          }`}
                        >
                          Currently detected:{' '}
                          <strong
                            className={`capitalize ${
                              isDark ? 'text-white' : 'text-slate-900'
                            }`}
                          >
                            {resolvedTheme}
                          </strong>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setIsThemeModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-emerald-500/20 text-center"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Install Guidance Modal */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </>
  );
};
