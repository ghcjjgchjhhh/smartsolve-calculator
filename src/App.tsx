import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ScientificCalculator } from './components/ScientificCalculator';
import { MathHub } from './components/MathHub';
import { PhysicsHub } from './components/PhysicsHub';
import { EquationSolverView } from './components/EquationSolverView';
import { UnitConverterView } from './components/UnitConverterView';
import { JambPracticeView } from './components/JambPracticeView';
import { SmartInputView } from './components/SmartInputView';
import { GeminiAiSolverView } from './components/GeminiAiSolverView';
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
  ArrowLeft,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam && ['scientific', 'ai_solver', 'math', 'physics', 'equation', 'converter', 'jamb', 'smart_input'].includes(tabParam)) {
        return tabParam;
      }
      const savedTab = localStorage.getItem('smartsolve_active_tab');
      if (savedTab && ['scientific', 'ai_solver', 'math', 'physics', 'equation', 'converter', 'jamb', 'smart_input'].includes(savedTab)) {
        return savedTab;
      }
    } catch {
      // fallback
    }
    return 'scientific';
  });

  useEffect(() => {
    try {
      localStorage.setItem('smartsolve_active_tab', activeTab);
    } catch {
      // ignore
    }
  }, [activeTab]);

  const [tabHistory, setTabHistory] = useState<string[]>([activeTab]);
  const tabHistoryRef = useRef<string[]>([activeTab]);
  tabHistoryRef.current = tabHistory;

  const activeTabRef = useRef<string>(activeTab);
  activeTabRef.current = activeTab;

  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [aiSolverInitialPrompt, setAiSolverInitialPrompt] = useState<string>('');
  const [aiSolverInitialSubject, setAiSolverInitialSubject] = useState<string>('All');

  const isHistoryOpenRef = useRef<boolean>(isHistoryOpen);
  isHistoryOpenRef.current = isHistoryOpen;

  const isSearchOpenRef = useRef<boolean>(isSearchOpen);
  isSearchOpenRef.current = isSearchOpen;

  const isInstallModalOpenRef = useRef<boolean>(isInstallModalOpen);
  isInstallModalOpenRef.current = isInstallModalOpen;

  const navigateTab = (targetTab: string, replace = false) => {
    if (targetTab === activeTab) return;

    if (replace) {
      setTabHistory((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = targetTab;
        return copy;
      });
      try {
        window.history.replaceState({ tab: targetTab, time: Date.now() }, '', '?tab=' + targetTab);
      } catch {
        // ignore
      }
    } else {
      setTabHistory((prev) => [...prev, targetTab]);
      try {
        window.history.pushState({ tab: targetTab, time: Date.now() }, '', '?tab=' + targetTab);
      } catch {
        // ignore
      }
    }

    setActiveTab(targetTab);
  };

  const handleGoBack = () => {
    // 1. If search modal is open, close it
    if (isSearchOpenRef.current) {
      setIsSearchOpen(false);
      return;
    }
    // 2. If history drawer is open, close it
    if (isHistoryOpenRef.current) {
      setIsHistoryOpen(false);
      return;
    }
    // 3. If install modal is open, close it
    if (isInstallModalOpenRef.current) {
      setIsInstallModalOpen(false);
      return;
    }

    // 4. Return to previous tab if available
    if (tabHistoryRef.current.length > 1) {
      const updated = [...tabHistoryRef.current];
      updated.pop();
      const prevTab = updated[updated.length - 1];
      setTabHistory(updated);
      setActiveTab(prevTab);
      try {
        window.history.replaceState({ tab: prevTab }, '', '?tab=' + prevTab);
      } catch {
        // ignore
      }
      return;
    }

    // 5. If at root tab but not scientific, return to scientific
    if (activeTabRef.current !== 'scientific') {
      setTabHistory(['scientific']);
      setActiveTab('scientific');
      try {
        window.history.replaceState({ tab: 'scientific' }, '', '?tab=scientific');
      } catch {
        // ignore
      }
    }
  };

  // Seed history state & intercept back navigation so app never closes on side gesture
  useEffect(() => {
    try {
      window.history.replaceState({ tab: activeTab, root: true }, '', window.location.search || '?tab=' + activeTab);
      window.history.pushState({ tab: activeTab, root: false }, '', window.location.search || '?tab=' + activeTab);
    } catch {
      // ignore
    }

    const handlePopState = () => {
      // If modal is open, close it without exiting the app
      if (isSearchOpenRef.current) {
        setIsSearchOpen(false);
        try {
          window.history.pushState({ tab: activeTabRef.current }, '', '?tab=' + activeTabRef.current);
        } catch {
          // ignore
        }
        return;
      }
      if (isHistoryOpenRef.current) {
        setIsHistoryOpen(false);
        try {
          window.history.pushState({ tab: activeTabRef.current }, '', '?tab=' + activeTabRef.current);
        } catch {
          // ignore
        }
        return;
      }
      if (isInstallModalOpenRef.current) {
        setIsInstallModalOpen(false);
        try {
          window.history.pushState({ tab: activeTabRef.current }, '', '?tab=' + activeTabRef.current);
        } catch {
          // ignore
        }
        return;
      }

      // Check tab history
      if (tabHistoryRef.current.length > 1) {
        const updated = [...tabHistoryRef.current];
        updated.pop();
        const prevTab = updated[updated.length - 1];
        setTabHistory(updated);
        setActiveTab(prevTab);
      } else {
        // Root: re-push so user remains in the app
        try {
          window.history.pushState({ tab: activeTabRef.current, root: true }, '', '?tab=' + activeTabRef.current);
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Edge swipe touch listener: swiping from the left side goes back to previous screen
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;
    let isEdgeSwipeCandidate = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      // Touch starts within 50px of the left edge
      if (touch.clientX <= 50) {
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        isEdgeSwipeCandidate = true;
      } else {
        isEdgeSwipeCandidate = false;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isEdgeSwipeCandidate) return;
      if (e.changedTouches.length !== 1) return;
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = Math.abs(touch.clientY - touchStartY);

      // Distinct swipe right (>= 42px) with horizontal dominance
      if (deltaX > 42 && deltaY < deltaX * 0.8) {
        handleGoBack();
      }
      isEdgeSwipeCandidate = false;
    };

    const handleTouchCancel = () => {
      isEdgeSwipeCandidate = false;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, []);

  const handleOpenInGemini = (prompt: string, subject?: string) => {
    setAiSolverInitialPrompt(prompt);
    if (subject) setAiSolverInitialSubject(subject);
    navigateTab('ai_solver');
  };
  
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
    navigateTab(tab);
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
    { id: 'ai_solver', name: 'AI Solver', icon: Sparkles, badge: 'Smart AI' },
    { id: 'math', name: 'Mathematics', icon: FunctionSquare, badge: '19 Topics' },
    { id: 'physics', name: 'Physics', icon: Atom, badge: '44 Formulas' },
    { id: 'equation', name: 'Equation Solver', icon: Cpu, badge: 'Auto' },
    { id: 'converter', name: 'Unit Converter', icon: Scale, badge: '16 Types' },
    { id: 'jamb', name: 'Exam Tutor (CBT)', icon: GraduationCap, badge: 'JAMB · WAEC · JUPEB' },
    { id: 'smart_input', name: 'Smart Input', icon: MessageSquareCode, badge: 'AI Parser' },
  ];

  const getTabName = (tabId: string) => {
    const found = navigationTabs.find((t) => t.id === tabId);
    return found ? found.name : 'Previous';
  };

  return (
    <div className="min-h-screen w-full bg-[#000000] text-[#FFFFFF] flex flex-col font-sans">
      {/* Offline Status Toast */}
      {!isOnline && (
        <div className="bg-[#EF4444] text-[#FFFFFF] text-xs font-semibold py-1.5 px-4 text-center flex items-center justify-center space-x-2">
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
        setActiveTab={navigateTab}
      />

      {/* Main Tab Navigation Ribbon */}
      <div className="bg-[#0A0A0A] border-b border-[#27272A] sticky top-16 sm:top-18 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2.5 scrollbar-none">
            {navigationTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => navigateTab(tab.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-[#22C55E] text-[#FFFFFF] font-bold shadow-md shadow-emerald-500/25 scale-[1.02]'
                      : 'text-[#A1A1AA] hover:text-[#FFFFFF] hover:bg-[#18181B]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                  {tab.badge && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                        isActive
                          ? 'bg-black/25 text-[#FFFFFF]'
                          : 'bg-[#18181B] text-[#A1A1AA]'
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

      {/* Back Navigation Bar (shown when user navigated from another tab or feature) */}
      {tabHistory.length > 1 && (
        <div className="bg-[#0D0D0E] border-b border-[#27272A] px-4 py-1.5 transition-all">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <button
              onClick={handleGoBack}
              className="flex items-center space-x-1.5 text-xs font-bold text-[#22C55E] hover:text-[#4ADE80] bg-[#18181B] hover:bg-[#27272A] px-2.5 py-1 rounded-lg border border-[#22C55E]/30 transition-all active:scale-95 cursor-pointer shadow-sm"
              title="Slide from the left edge of your screen or tap here to go back"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>Back to {getTabName(tabHistory[tabHistory.length - 2])}</span>
            </button>
            <span className="text-[11px] text-[#71717A] hidden sm:inline">
              Slide from left screen edge or tap back to return
            </span>
          </div>
        </div>
      )}

      {/* Mobile Install Promotion Banner (if not installed and not dismissed) */}
      {!isInstalled && !isBannerDismissed && (
        <div className="bg-[#0A0A0A] text-[#FFFFFF] px-4 py-2.5 border-b border-[#27272A]">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#22C55E]/15 border border-[#22C55E]/30 flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-4 h-4 text-[#22C55E]" />
              </div>
              <div className="text-xs truncate text-[#A1A1AA]">
                <span className="font-bold text-[#FFFFFF]">Install as Phone App:</span>{' '}
                <span className="text-[#A1A1AA] hidden sm:inline">Add to home screen for fullscreen solver without browser bars!</span>
                <span className="text-[#A1A1AA] sm:hidden">Add to home screen!</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <button
                onClick={handleBannerInstallClick}
                className="px-3 py-1 rounded-lg bg-[#22C55E] hover:bg-[#16A34A] text-[#FFFFFF] font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center space-x-1.5 active:scale-95 transition-transform"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install</span>
              </button>
              <button
                onClick={handleDismissBanner}
                aria-label="Dismiss banner"
                className="p-1 rounded-lg text-[#A1A1AA] hover:text-[#FFFFFF] hover:bg-white/10"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area: Preserved tabs keep DOM state intact across navigation */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8">
        <div className={activeTab === 'scientific' ? 'block' : 'hidden'}>
          <ScientificCalculator />
        </div>
        <div className={activeTab === 'ai_solver' ? 'block' : 'hidden'}>
          <GeminiAiSolverView
            initialPrompt={aiSolverInitialPrompt}
            initialSubject={aiSolverInitialSubject}
            onClearInitialPrompt={() => setAiSolverInitialPrompt('')}
          />
        </div>
        <div className={activeTab === 'math' ? 'block' : 'hidden'}>
          <MathHub />
        </div>
        <div className={activeTab === 'physics' ? 'block' : 'hidden'}>
          <PhysicsHub />
        </div>
        <div className={activeTab === 'equation' ? 'block' : 'hidden'}>
          <EquationSolverView />
        </div>
        <div className={activeTab === 'converter' ? 'block' : 'hidden'}>
          <UnitConverterView />
        </div>
        <div className={activeTab === 'jamb' ? 'block' : 'hidden'}>
          <JambPracticeView onOpenInGemini={handleOpenInGemini} />
        </div>
        <div className={activeTab === 'smart_input' ? 'block' : 'hidden'}>
          <SmartInputView />
        </div>
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
      <footer className="border-t border-[#27272A] bg-[#000000] py-6 text-center text-xs text-[#A1A1AA]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-[#FFFFFF]">SmartSolve Calculator</span>
            <span>· All-in-one Mathematics & Physics Step-by-Step Engine</span>
          </div>
          <div className="flex items-center space-x-4">
            {!isInstalled && (
              <button
                onClick={() => setIsInstallModalOpen(true)}
                className="text-[#22C55E] hover:text-[#4ADE80] font-bold hover:underline flex items-center space-x-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install on Phone / PC</span>
              </button>
            )}
            <span className="text-[#22C55E] font-semibold flex items-center space-x-1">
              <Sparkles className="w-3 h-3 inline" />
              <span>Fast & Offline Ready</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
