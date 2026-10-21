import React, { useState } from 'react';
import {
  Calculator,
  Moon,
  Sun,
  Search,
  History,
  Download,
  CheckCircle2,
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
  activeTab: _activeTab,
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
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-black/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            {/* Logo & Branding */}
            <div
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => setActiveTab('scientific')}
            >
              <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-500/15 text-emerald-400 flex-shrink-0">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-lg font-black tracking-tight text-zinc-900 dark:text-white">
                    Smart<span className="text-emerald-500">Solve</span>
                  </span>
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    PRO
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium hidden sm:block">
                  Mathematics & Physics Solver
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              {/* Install App Button */}
              {!isInstalled ? (
                <button
                  onClick={handleInstallClick}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black shadow-md shadow-emerald-500/20 transition-all active:scale-95 animate-pulse hover:animate-none"
                  title="Install SmartSolve as a phone or desktop app"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Install App</span>
                </button>
              ) : (
                <div className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  <span>App Active</span>
                </div>
              )}

              {/* Quick Search Button */}
              <button
                onClick={onOpenSearch}
                className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors text-xs font-semibold border border-zinc-200 dark:border-zinc-800"
              >
                <Search className="w-4 h-4 text-emerald-500" />
                <span className="hidden md:inline">Quick Search (60+ tools)</span>
              </button>

              {/* History Button */}
              <button
                onClick={onOpenHistory}
                title="Calculation History"
                className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors border border-zinc-200 dark:border-zinc-800"
              >
                <History className="w-4 h-4" />
              </button>

              {/* Dark / Light Toggle */}
              <button
                onClick={onToggleDarkMode}
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors border border-zinc-200 dark:border-zinc-800"
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-emerald-500" />}
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
