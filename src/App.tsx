import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ScientificCalculator } from './components/ScientificCalculator';
import { MathHub } from './components/MathHub';
import { PhysicsHub } from './components/PhysicsHub';
import { EquationSolverView } from './components/EquationSolverView';
import { UnitConverterView } from './components/UnitConverterView';
import { JambPracticeView } from './components/JambPracticeView';
import { SmartInputView } from './components/SmartInputView';
import { HistoryDrawer } from './components/HistoryDrawer';
import { SearchModal } from './components/SearchModal';
import { InstallAppModal } from './components/InstallAppModal';
import { usePWAInstall } from './hooks/usePWAInstall';
import {
  Calculator,
  FunctionSquare,
  Atom,
  Cpu,
  Scale,
  GraduationCap,
  MessageSquareCode,
  WifiOff,
  Download,
  X,
  Smartphone,
  Sparkles,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam && ['scientific', 'math', 'physics', 'equation', 'converter', 'jamb', 'smart_input'].includes(tabParam)) {
        return tabParam;
      }
    } catch {
      // fallback
    }
    return 'scientific';
  });

  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  
  // Track if mobile banner was dismissed in this session
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('smartsolve_banner_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  const { isInstalled, canInstall, triggerInstall } = usePWAInstall();

  // Dark mode state: default to dark (optimal for scientific calculators)
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('smartsolve_dark_mode');
      if (saved !== null) return saved === 'true';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('smartsolve_dark_mode', darkMode.toString());
    } catch (e) {
      console.error(e);
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  const handleSelectFromSearch = (tab: string) => {
    setActiveTab(tab);
  };

  const handleDismissBanner = () => {
    setIsBannerDismissed(true);
    try {
      sessionStorage.setItem('smartsolve_banner_dismissed', 'true');
    } catch {
      // ignore
    }
  };

  const handleBannerInstallClick = async () => {
    if (canInstall) {
      const installed = await triggerInstall();
      if (!installed) {
        setIsInstallModalOpen(true);
      }
    } else {
      setIsInstallModalOpen(true);
    }
  };

  const navigationTabs = [
    { id: 'scientific', name: 'Scientific', icon: Calculator, badge: 'FX' },
    { id: 'math', name: 'Mathematics', icon: FunctionSquare, badge: '15 Topics' },
    { id: 'physics', name: 'Physics', icon: Atom, badge: '29 Formulas' },
    { id: 'equation', name: 'Equation Solver', icon: Cpu, badge: 'Auto' },
    { id: 'converter', name: 'Unit Converter', icon: Scale, badge: '16 Types' },
    { id: 'jamb', name: 'JAMB / WAEC', icon: GraduationCap, badge: 'Exam Mode' },
    { id: 'smart_input', name: 'Smart Input', icon: MessageSquareCode, badge: 'AI Parser' },
  ];

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-black text-zinc-900 dark:text-zinc-100 transition-colors flex flex-col font-sans">
      {/* Offline Status Toast */}
      {!isOnline && (
        <div className="bg-amber-600 text-white text-xs font-semibold py-1.5 px-4 text-center flex items-center justify-center space-x-2">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline Mode — SmartSolve is fully operational offline without internet.</span>
        </div>
      )}

      {/* Sticky Header */}
      <Header
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Tab Navigation Ribbon */}
      <div className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-850 sticky top-16 sm:top-18 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2.5 scrollbar-none">
            {navigationTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-emerald-500 text-black font-black shadow-md shadow-emerald-500/25 scale-[1.02]'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                  {tab.badge && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                        isActive
                          ? 'bg-black/20 text-black'
                          : 'bg-zinc-200 dark:bg-zinc-850 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Install Promotion Banner (if not installed and not dismissed) */}
      {!isInstalled && !isBannerDismissed && (
        <div className="bg-zinc-900 dark:bg-zinc-950 text-emerald-400 px-4 py-2.5 border-b border-emerald-500/30">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xs truncate text-zinc-200">
                <span className="font-bold text-emerald-400">Install as Phone App:</span>{' '}
                <span className="text-zinc-300 hidden sm:inline">Add to home screen for fullscreen solver without browser bars!</span>
                <span className="text-zinc-300 sm:hidden">Add to home screen!</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <button
                onClick={handleBannerInstallClick}
                className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs shadow-md shadow-emerald-500/20 flex items-center space-x-1.5 active:scale-95 transition-transform"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install</span>
              </button>
              <button
                onClick={handleDismissBanner}
                aria-label="Dismiss banner"
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'scientific' && <ScientificCalculator />}
        {activeTab === 'math' && <MathHub />}
        {activeTab === 'physics' && <PhysicsHub />}
        {activeTab === 'equation' && <EquationSolverView />}
        {activeTab === 'converter' && <UnitConverterView />}
        {activeTab === 'jamb' && <JambPracticeView />}
        {activeTab === 'smart_input' && <SmartInputView />}
      </main>

      {/* Global Modals / Drawers */}
      <HistoryDrawer isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectAction={handleSelectFromSearch}
      />
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-black py-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-zinc-800 dark:text-zinc-200">SmartSolve Calculator</span>
            <span>· All-in-one Mathematics & Physics Step-by-Step Engine</span>
          </div>
          <div className="flex items-center space-x-4">
            {!isInstalled && (
              <button
                onClick={() => setIsInstallModalOpen(true)}
                className="text-emerald-500 dark:text-emerald-400 font-bold hover:underline flex items-center space-x-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install on Phone / PC</span>
              </button>
            )}
            <span className="text-emerald-500 font-semibold flex items-center space-x-1">
              <Sparkles className="w-3 h-3 inline" />
              <span>Fast & Offline Ready</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
