import React, { useState } from 'react';
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
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { InstallAppModal } from './InstallAppModal';
import { useTheme, ThemePreference } from '../contexts/ThemeContext';

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

  const { themePreference, resolvedTheme, setThemePreference } = useTheme();

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
      <header className="sticky top-0 z-40 bg-[#0A0A0A]/95 dark:bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[#27272A] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            {/* Logo & Branding */}
            <div
              className="flex items-center space-x-3 cursor-pointer select-none"
              onClick={() => setActiveTab('scientific')}
            >
              <div className="w-10 h-10 rounded-2xl bg-[#18181B] border border-[#22C55E]/40 flex items-center justify-center shadow-lg shadow-emerald-500/15 text-[#22C55E] flex-shrink-0">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-lg font-black tracking-tight text-[#FFFFFF]">
                    Smart<span className="text-[#22C55E]">Solve</span>
                  </span>
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30">
                    PRO
                  </span>
                </div>
                <p className="text-[11px] text-[#A1A1AA] font-medium hidden sm:block">
                  Mathematics, Physics & Chemistry Tutor
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              {/* Direct AI Chat Button */}
              <button
                onClick={() => setActiveTab('ai_chat')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'ai_chat'
                    ? 'bg-[#22C55E] text-[#FFFFFF] shadow-md shadow-emerald-500/25'
                    : 'bg-[#18181B] hover:bg-[#27272A] text-white border border-[#27272A]'
                }`}
                title="Chat with AI Assistant (Voice, Vision & Text)"
              >
                <MessageSquare className="w-3.5 h-3.5 text-inherit" />
                <span className="hidden sm:inline">AI Chat</span>
                <span className="sm:hidden">Chat</span>
              </button>

              {/* Direct AI Solver Button */}
              <button
                onClick={() => setActiveTab('ai_solver')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'ai_solver'
                    ? 'bg-[#22C55E] text-[#FFFFFF] shadow-md shadow-emerald-500/25'
                    : 'bg-[#18181B] hover:bg-[#27272A] text-white border border-[#27272A]'
                }`}
                title="Open AI Solver for Mathematics, Physics & Chemistry"
              >
                <Sparkles className="w-3.5 h-3.5 text-inherit" />
                <span className="hidden sm:inline">AI Solver</span>
                <span className="sm:hidden">Solver</span>
              </button>

              {/* Install App Button */}
              {!isInstalled ? (
                <button
                  onClick={handleInstallClick}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-[#FFFFFF] text-xs font-bold shadow-md shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
                  title="Install SmartSolve as a phone or desktop app"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Install</span>
                </button>
              ) : (
                <div className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#22C55E]/15 text-white text-[11px] font-semibold border border-[#22C55E]/30">
                  <CheckCircle2 className="w-3 h-3 text-[#22C55E]" />
                  <span>Installed</span>
                </div>
              )}

              {/* Quick Search Button */}
              <button
                onClick={onOpenSearch}
                className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors text-xs font-semibold border border-white/5 cursor-pointer"
              >
                <Search className="w-4 h-4 text-[#22C55E]" />
                <span className="hidden md:inline">Quick Search (60+ tools)</span>
              </button>

              {/* History Button */}
              <button
                onClick={onOpenHistory}
                title="Calculation History"
                className="p-2.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors border border-white/5 cursor-pointer"
              >
                <History className="w-4 h-4" />
              </button>

              {/* Appearance / Theme Setting Modal Trigger */}
              <button
                onClick={() => setIsThemeModalOpen(true)}
                title={`Theme: ${themePreference === 'system' ? 'System (' + resolvedTheme + ')' : themePreference}`}
                className="p-2.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors border border-white/5 cursor-pointer relative group"
              >
                {themePreference === 'system' ? (
                  <Monitor className="w-4 h-4 text-white" />
                ) : resolvedTheme === 'dark' ? (
                  <Moon className="w-4 h-4 text-white" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-500" />
                )}
                {themePreference === 'system' && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#22C55E]" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Appearance Setting Modal */}
      {isThemeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121216] border border-[#27272A] rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
              <div className="flex items-center space-x-2">
                <Monitor className="w-5 h-5 text-white" />
                <div>
                  <h3 className="text-sm font-bold text-white">Appearance & Theme</h3>
                  <p className="text-[11px] text-zinc-400">System appearance detection & manual mode</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsThemeModalOpen(false)}
                className="p-1.5 rounded-lg bg-[#27272A] hover:bg-[#3F3F46] text-zinc-400 hover:text-white transition-colors cursor-pointer"
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
                        ? 'bg-[#22C55E]/15 border-[#22C55E] text-white shadow-md shadow-emerald-500/10'
                        : 'bg-[#18181D] border-[#27272A] text-zinc-300 hover:text-white hover:bg-[#27272A]'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl mt-0.5 ${
                        isSelected
                          ? 'bg-[#22C55E] text-white'
                          : 'bg-[#27272A] text-zinc-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{opt.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-[#22C55E]" />}
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                        {opt.description}
                      </p>
                      {opt.id === 'system' && (
                        <div className="mt-1 text-[10px] font-mono text-zinc-400">
                          Currently detected: <strong className="text-white capitalize">{resolvedTheme}</strong>
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
