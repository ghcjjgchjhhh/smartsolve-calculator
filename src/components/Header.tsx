import React, { useState } from 'react';
import {
  Calculator,
  Moon,
  Sun,
  Search,
  History,
  Download,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { InstallAppModal } from './InstallAppModal';

interface Props {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenSearch: () => void;
  onOpenHistory: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<Props> = ({
  darkMode,
  onToggleDarkMode,
  onOpenSearch,
  onOpenHistory,
  activeTab,
  setActiveTab,
}) => {
  const { isInstalled, canInstall, triggerInstall } = usePWAInstall();
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

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
      <header className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[#27272A] transition-colors">
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
              {/* Direct AI Solver Button */}
              <button
                onClick={() => setActiveTab('ai_solver')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'ai_solver'
                    ? 'bg-[#22C55E] text-[#FFFFFF] shadow-md shadow-emerald-500/25'
                    : 'bg-[#18181B] hover:bg-[#27272A] text-[#22C55E] border border-[#22C55E]/30'
                }`}
                title="Open AI Solver for Mathematics, Physics & Chemistry"
              >
                <Sparkles className="w-3.5 h-3.5 text-inherit" />
                <span className="hidden sm:inline">AI Solver</span>
                <span className="sm:hidden">AI</span>
              </button>

              {/* Install App Button */}
              {!isInstalled ? (
                <button
                  onClick={handleInstallClick}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-[#FFFFFF] text-xs font-bold shadow-md shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
                  title="Install SmartSolve as a phone or desktop app"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Install App</span>
                </button>
              ) : (
                <div className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#22C55E]/15 text-[#22C55E] text-[11px] font-semibold border border-[#22C55E]/30">
                  <CheckCircle2 className="w-3 h-3 text-[#22C55E]" />
                  <span>Installed</span>
                </div>
              )}

              {/* Quick Search Button */}
              <button
                onClick={onOpenSearch}
                className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-[#18181B] hover:bg-[#2F3542] text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors text-xs font-semibold border border-white/5 cursor-pointer"
              >
                <Search className="w-4 h-4 text-[#22C55E]" />
                <span className="hidden md:inline">Quick Search (60+ tools)</span>
              </button>

              {/* History Button */}
              <button
                onClick={onOpenHistory}
                title="Calculation History"
                className="p-2.5 rounded-xl bg-[#18181B] hover:bg-[#2F3542] text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors border border-white/5 cursor-pointer"
              >
                <History className="w-4 h-4" />
              </button>

              {/* Theme Indicator / Toggle */}
              <button
                onClick={onToggleDarkMode}
                title={darkMode ? 'Dark Mode active' : 'Switch theme'}
                className="p-2.5 rounded-xl bg-[#18181B] hover:bg-[#2F3542] text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors border border-white/5 cursor-pointer"
              >
                {darkMode ? <Moon className="w-4 h-4 text-[#22C55E]" /> : <Sun className="w-4 h-4 text-amber-400" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Install Guidance Modal */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </>
  );
};
