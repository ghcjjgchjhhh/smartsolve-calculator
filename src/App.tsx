import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Header, NavigationTabItem, NavGroupFilter } from './components/Header';
import { ScientificCalculator } from './components/ScientificCalculator';
import { MathHub } from './components/MathHub';
import { PhysicsHub } from './components/PhysicsHub';
import { EquationSolverView } from './components/EquationSolverView';
import { UnitConverterView } from './components/UnitConverterView';
import { JambPracticeView } from './components/JambPracticeView';
import { SmartInputView } from './components/SmartInputView';
import { GeminiAiSolverView } from './components/GeminiAiSolverView';
import { AiChatAssistantView } from './components/AiChatAssistantView';
import { FunctionGrapherView } from './components/FunctionGrapherView';
import { PeriodicTableView } from './components/PeriodicTableView';
import { PhysicsSimulatorView } from './components/PhysicsSimulatorView';
import { FlashcardsView } from './components/FlashcardsView';
import { CustomFormulaNotebookView } from './components/CustomFormulaNotebookView';
import { VectorLabView } from './components/VectorLabView';
import { CircuitLabView } from './components/CircuitLabView';
import { OrganicChemistryView } from './components/OrganicChemistryView';
import { ExamDiagnosticsView } from './components/ExamDiagnosticsView';
import { OpticsLabView } from './components/OpticsLabView';
import { GasLawsLabView } from './components/GasLawsLabView';
import { TitrationLabView } from './components/TitrationLabView';
import { StatisticsLabView } from './components/StatisticsLabView';
import { MatrixLabView } from './components/MatrixLabView';
import { ChemistrySolverView } from './components/ChemistrySolverView';
import { RevisionSheetsView } from './components/RevisionSheetsView';
import { LearnAnyTopicView } from './components/LearnAnyTopicView';
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
  MessageSquare,
  TrendingUp,
  FlaskConical,
  Activity,
  Layers,
  BookOpen,
  Compass,
  Zap,
  Award,
  Eye,
  Gauge,
  BarChart2,
  FileText,
  PenTool,
  Box,
  Mic,
  ScanLine,
  HelpCircle,
  Microscope,
  SlidersHorizontal,
  Search,
  Dna,
  Sigma,
  Users,
  Loader2,
} from 'lucide-react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { LanguageProvider, useAppLanguage } from './contexts/LanguageContext';
import { LanguageSettingsModal } from './components/LanguageSettingsModal';

const AiWhiteboardView = lazy(() => import('./components/AiWhiteboardView').then((m) => ({ default: m.AiWhiteboardView })));
const ThreePhysicsLabView = lazy(() => import('./components/ThreePhysicsLabView').then((m) => ({ default: m.ThreePhysicsLabView })));
const VoiceToMathView = lazy(() => import('./components/VoiceToMathView').then((m) => ({ default: m.VoiceToMathView })));
const HandwritingSolverView = lazy(() => import('./components/HandwritingSolverView').then((m) => ({ default: m.HandwritingSolverView })));
const SocraticTutorView = lazy(() => import('./components/SocraticTutorView').then((m) => ({ default: m.SocraticTutorView })));
const ScientificResearchView = lazy(() => import('./components/ScientificResearchView').then((m) => ({ default: m.ScientificResearchView })));
const FormulaExplorerView = lazy(() => import('./components/FormulaExplorerView').then((m) => ({ default: m.FormulaExplorerView })));
const DocumentTutorView = lazy(() => import('./components/DocumentTutorView').then((m) => ({ default: m.DocumentTutorView })));
const PastQuestionSearchView = lazy(() => import('./components/PastQuestionSearchView').then((m) => ({ default: m.PastQuestionSearchView })));
const BiologyLabView = lazy(() => import('./components/BiologyLabView').then((m) => ({ default: m.BiologyLabView })));
const EquationEditorView = lazy(() => import('./components/EquationEditorView').then((m) => ({ default: m.EquationEditorView })));
const CollaborativeStudyRoomView = lazy(() => import('./components/CollaborativeStudyRoomView').then((m) => ({ default: m.CollaborativeStudyRoomView })));

const ModuleLoader = () => (
  <div className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-12 flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-500">
    <Loader2 className="w-5 h-5 animate-spin text-[#22C55E]" />
    <span>Loading SmartSolve Studio module...</span>
  </div>
);

function MainApp() {
  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      const validTabs = [
        'scientific',
        'ai_chat',
        'ai_solver',
        'learn_topic',
        'grapher',
        'periodic_table',
        'physics_sim',
        'flashcards',
        'notebook',
        'math',
        'physics',
        'equation',
        'converter',
        'jamb',
        'smart_input',
        'vectors',
        'circuits',
        'organic',
        'diagnostics',
        'optics',
        'gas_laws',
        'titration',
        'statistics',
        'matrix',
        'chem_balancer',
        'revision',
        'ai_whiteboard',
        'physics_3d',
        'voice_math',
        'handwriting',
        'socratic_tutor',
        'scientific_research',
        'formula_explorer',
        'document_tutor',
        'past_questions',
        'biology_lab',
        'equation_editor',
        'study_rooms',
      ];
      if (tabParam && validTabs.includes(tabParam)) {
        return tabParam;
      }
      const savedTab = localStorage.getItem('smartsolve_active_tab');
      if (savedTab && validTabs.includes(savedTab)) {
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
  const { isDark } = useTheme();
  const { t } = useAppLanguage();

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

  const [navGroup, setNavGroup] = useState<NavGroupFilter>('all');

  const studioTabIds = new Set([
    'ai_whiteboard',
    'physics_3d',
    'voice_math',
    'handwriting',
    'socratic_tutor',
    'scientific_research',
    'formula_explorer',
    'document_tutor',
    'past_questions',
    'biology_lab',
    'equation_editor',
    'study_rooms',
  ]);

  const navigationTabs: NavigationTabItem[] = [
    { id: 'scientific', name: t('scientific', 'Scientific'), icon: Calculator, badge: 'FX', category: 'Core & Calculators' },
    { id: 'learn_topic', name: 'Learn Any Topic', icon: GraduationCap, badge: 'AI Tutor', category: 'AI Tutors & Solvers' },
    { id: 'ai_solver', name: t('ai_solver', 'AI Solver'), icon: Sparkles, badge: 'Step Solver', category: 'AI Tutors & Solvers' },
    { id: 'ai_chat', name: t('ai_chat', 'AI Chat'), icon: MessageSquare, badge: 'Multimodal', category: 'AI Tutors & Solvers' },
    { id: 'ai_whiteboard', name: 'AI Whiteboard', icon: PenTool, badge: 'Studio', category: 'AI & 3D Studio' },
    { id: 'physics_3d', name: '3D Physics', icon: Box, badge: 'WebGL 3D', category: 'AI & 3D Studio' },
    { id: 'voice_math', name: 'Voice-to-Math', icon: Mic, badge: 'Voice', category: 'AI & 3D Studio' },
    { id: 'handwriting', name: 'Handwriting OCR', icon: ScanLine, badge: 'OCR', category: 'AI & 3D Studio' },
    { id: 'socratic_tutor', name: 'Socratic Tutor', icon: HelpCircle, badge: 'Guided', category: 'AI Tutors & Solvers' },
    { id: 'scientific_research', name: 'Research Mode', icon: Microscope, badge: 'Consensus', category: 'AI & 3D Studio' },
    { id: 'formula_explorer', name: 'Formula Explorer', icon: SlidersHorizontal, badge: 'Sliders', category: 'AI & 3D Studio' },
    { id: 'document_tutor', name: 'Document Tutor', icon: FileText, badge: 'PDF Q&A', category: 'AI Tutors & Solvers' },
    { id: 'past_questions', name: 'Past Questions', icon: Search, badge: 'Verified', category: 'Exam Prep & Study Rooms' },
    { id: 'biology_lab', name: 'Biology Lab', icon: Dna, badge: 'Anatomy', category: 'Physics, Chem & Labs' },
    { id: 'equation_editor', name: 'Equation Editor', icon: Sigma, badge: 'LaTeX', category: 'Core & Calculators' },
    { id: 'study_rooms', name: 'Study Rooms', icon: Users, badge: 'Live Sync', category: 'Exam Prep & Study Rooms' },
    { id: 'grapher', name: t('grapher', '2D Grapher'), icon: TrendingUp, badge: 'Canvas', category: 'Core & Calculators' },
    { id: 'periodic_table', name: t('periodic_table', 'Periodic Table'), icon: FlaskConical, badge: 'Chemistry', category: 'Physics, Chem & Labs' },
    { id: 'physics_sim', name: t('physics_sim', 'Physics Lab'), icon: Activity, badge: 'Simulations', category: 'Physics, Chem & Labs' },
    { id: 'flashcards', name: t('flashcards', 'Flashcards'), icon: Layers, badge: 'Memory', category: 'Exam Prep & Study Rooms' },
    { id: 'notebook', name: t('notebook', 'My Formulas'), icon: BookOpen, badge: 'Notebook', category: 'Core & Calculators' },
    { id: 'math', name: t('math_hub', 'Mathematics'), icon: FunctionSquare, badge: '19 Topics', category: 'Core & Calculators' },
    { id: 'physics', name: t('physics_hub', 'Physics'), icon: Atom, badge: '44 Formulas', category: 'Physics, Chem & Labs' },
    { id: 'equation', name: t('equations', 'Equations'), icon: Cpu, badge: 'Auto', category: 'Core & Calculators' },
    { id: 'converter', name: t('converter', 'Converter'), icon: Scale, badge: '16 Types', category: 'Core & Calculators' },
    { id: 'jamb', name: t('exam_prep', 'JAMB / WAEC'), icon: GraduationCap, badge: 'JAMB · WAEC', category: 'Exam Prep & Study Rooms' },
    { id: 'smart_input', name: t('smart_input', 'Smart Input'), icon: MessageSquareCode, badge: 'AI Parser', category: 'AI Tutors & Solvers' },
    { id: 'vectors', name: t('vectors', 'Vector Lab'), icon: Compass, badge: '2D Forces', category: 'Physics, Chem & Labs' },
    { id: 'circuits', name: t('circuits', 'Circuit Lab'), icon: Zap, badge: 'DC Ohm', category: 'Physics, Chem & Labs' },
    { id: 'organic', name: t('organic', 'Organic Chemistry'), icon: FlaskConical, badge: '2D Molecules', category: 'Physics, Chem & Labs' },
    { id: 'diagnostics', name: t('diagnostics', 'Exam Radar'), icon: Award, badge: 'Diagnostics', category: 'Exam Prep & Study Rooms' },
    { id: 'optics', name: t('optics', 'Optics Lab'), icon: Eye, badge: 'Ray Tracer', category: 'Physics, Chem & Labs' },
    { id: 'gas_laws', name: t('gas_laws', 'Gas Lab'), icon: Gauge, badge: 'PV = nRT', category: 'Physics, Chem & Labs' },
    { id: 'titration', name: t('titration', 'Titration Lab'), icon: FlaskConical, badge: 'pH Curve', category: 'Physics, Chem & Labs' },
    { id: 'chem_balancer', name: t('chemistry_solver', 'Chemistry Solver'), icon: FlaskConical, badge: 'AI Tutor & Lab', category: 'Physics, Chem & Labs' },
    { id: 'statistics', name: t('statistics', 'Stats & Ogive'), icon: BarChart2, badge: 'Ogive', category: 'Core & Calculators' },
    { id: 'matrix', name: t('matrix', 'Matrix Lab'), icon: Cpu, badge: '3x3 Gauss', category: 'Core & Calculators' },
    { id: 'revision', name: t('revision', 'Cheat-Sheets'), icon: BookOpen, badge: 'Print PDF', category: 'Exam Prep & Study Rooms' },
  ];

  const visibleNavigationTabs =
    navGroup === 'all'
      ? navigationTabs
      : navGroup === 'studio'
      ? navigationTabs.filter((tab) => studioTabIds.has(tab.id))
      : navigationTabs.filter((tab) => !studioTabIds.has(tab.id));

  const getTabName = (tabId: string) => {
    const found = navigationTabs.find((t) => t.id === tabId);
    return found ? found.name : 'Previous';
  };

  return (
    <div
      className={`min-h-screen w-full max-w-full overflow-x-clip flex flex-col font-sans transition-colors duration-200 ${
        isDark ? 'bg-[#000000] text-[#FFFFFF]' : 'bg-[#F8FAFC] text-[#0F172A]'
      }`}
    >
      {/* Offline Status Toast */}
      {!isOnline && (
        <div className="bg-[#EF4444] text-[#FFFFFF] text-xs font-semibold py-1.5 px-4 text-center flex items-center justify-center space-x-2">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline Mode — SmartSolve is fully operational offline without internet.</span>
        </div>
      )}

      {/* Unified Sticky Header & Full Navigation (position: sticky; top: 0; z-index: 1000) */}
      <Header
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        activeTab={activeTab}
        setActiveTab={navigateTab}
        navigationTabs={navigationTabs}
        visibleNavigationTabs={visibleNavigationTabs}
        navGroup={navGroup}
        setNavGroup={setNavGroup}
      />

      {/* Back Navigation Bar (shown when user navigated from another tab or feature) */}
      {tabHistory.length > 1 && (
        <div
          className={`border-b px-4 py-1.5 transition-all ${
            isDark ? 'bg-[#0D0D0E] border-[#27272A]' : 'bg-white border-slate-200'
          }`}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <button
              onClick={handleGoBack}
              className={`flex items-center space-x-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border transition-all active:scale-95 cursor-pointer shadow-sm ${
                isDark
                  ? 'bg-[#18181B] hover:bg-[#27272A] text-white border-[#27272A]'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300'
              }`}
              title="Slide from the left edge of your screen or tap here to go back"
            >
              <ArrowLeft className={`w-3.5 h-3.5 ${isDark ? 'text-white' : 'text-slate-900'}`} />
              <span>Back to {getTabName(tabHistory[tabHistory.length - 2])}</span>
            </button>
            <span className={`text-[11px] hidden sm:inline ${isDark ? 'text-[#71717A]' : 'text-slate-500'}`}>
              Slide from left screen edge or tap back to return
            </span>
          </div>
        </div>
      )}

      {/* Mobile Install Promotion Banner (if not installed and not dismissed) */}
      {!isInstalled && !isBannerDismissed && (
        <div
          className={`px-4 py-2.5 border-b transition-colors ${
            isDark ? 'bg-[#0A0A0A] text-[#FFFFFF] border-[#27272A]' : 'bg-slate-100 text-slate-900 border-slate-200'
          }`}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#22C55E]/15 border border-[#22C55E]/30 flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-4 h-4 text-[#22C55E]" />
              </div>
              <div className={`text-xs truncate ${isDark ? 'text-[#A1A1AA]' : 'text-slate-600'}`}>
                <span className={`font-bold ${isDark ? 'text-[#FFFFFF]' : 'text-slate-900'}`}>Install as Phone App:</span>{' '}
                <span className={`${isDark ? 'text-[#A1A1AA]' : 'text-slate-600'} hidden sm:inline`}>Add to home screen for fullscreen solver without browser bars!</span>
                <span className={`${isDark ? 'text-[#A1A1AA]' : 'text-slate-600'} sm:hidden`}>Add to home screen!</span>
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
                className={`p-1 rounded-lg ${isDark ? 'text-[#A1A1AA] hover:text-[#FFFFFF]' : 'text-slate-500 hover:text-slate-900'} hover:bg-black/10`}
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
          <ScientificCalculator
            onOpenHistory={() => setIsHistoryOpen(true)}
            onOpenSearch={() => setIsSearchOpen(true)}
            onNavigateTab={navigateTab}
          />
        </div>
        <div className={activeTab === 'ai_chat' ? 'block' : 'hidden'}>
          <AiChatAssistantView />
        </div>
        <div className={activeTab === 'ai_solver' ? 'block' : 'hidden'}>
          <GeminiAiSolverView
            initialPrompt={aiSolverInitialPrompt}
            initialSubject={aiSolverInitialSubject}
            onClearInitialPrompt={() => setAiSolverInitialPrompt('')}
          />
        </div>
        <div className={activeTab === 'learn_topic' ? 'block' : 'hidden'}>
          <LearnAnyTopicView />
        </div>
        <div className={activeTab === 'grapher' ? 'block' : 'hidden'}>
          <FunctionGrapherView />
        </div>
        <div className={activeTab === 'periodic_table' ? 'block' : 'hidden'}>
          <PeriodicTableView />
        </div>
        <div className={activeTab === 'physics_sim' ? 'block' : 'hidden'}>
          <PhysicsSimulatorView />
        </div>
        <div className={activeTab === 'flashcards' ? 'block' : 'hidden'}>
          <FlashcardsView />
        </div>
        <div className={activeTab === 'notebook' ? 'block' : 'hidden'}>
          <CustomFormulaNotebookView />
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
        <div className={activeTab === 'vectors' ? 'block' : 'hidden'}>
          <VectorLabView />
        </div>
        <div className={activeTab === 'circuits' ? 'block' : 'hidden'}>
          <CircuitLabView />
        </div>
        <div className={activeTab === 'organic' ? 'block' : 'hidden'}>
          <OrganicChemistryView />
        </div>
        <div className={activeTab === 'diagnostics' ? 'block' : 'hidden'}>
          <ExamDiagnosticsView onNavigateTab={navigateTab} />
        </div>
        <div className={activeTab === 'optics' ? 'block' : 'hidden'}>
          <OpticsLabView />
        </div>
        <div className={activeTab === 'gas_laws' ? 'block' : 'hidden'}>
          <GasLawsLabView />
        </div>
        <div className={activeTab === 'titration' ? 'block' : 'hidden'}>
          <TitrationLabView />
        </div>
        <div className={activeTab === 'chem_balancer' ? 'block' : 'hidden'}>
          <ChemistrySolverView onOpenInGemini={handleOpenInGemini} />
        </div>
        <div className={activeTab === 'statistics' ? 'block' : 'hidden'}>
          <StatisticsLabView />
        </div>
        <div className={activeTab === 'matrix' ? 'block' : 'hidden'}>
          <MatrixLabView />
        </div>
        <div className={activeTab === 'revision' ? 'block' : 'hidden'}>
          <RevisionSheetsView />
        </div>

        {/* 12 Lazy-Loaded SmartSolve Studio Modules */}
        {studioTabIds.has(activeTab) && (
          <Suspense fallback={<ModuleLoader />}>
            {activeTab === 'ai_whiteboard' && <AiWhiteboardView />}
            {activeTab === 'physics_3d' && <ThreePhysicsLabView />}
            {activeTab === 'voice_math' && <VoiceToMathView onOpenInGemini={handleOpenInGemini} />}
            {activeTab === 'handwriting' && <HandwritingSolverView onOpenInGemini={handleOpenInGemini} />}
            {activeTab === 'socratic_tutor' && <SocraticTutorView />}
            {activeTab === 'scientific_research' && <ScientificResearchView />}
            {activeTab === 'formula_explorer' && <FormulaExplorerView />}
            {activeTab === 'document_tutor' && <DocumentTutorView />}
            {activeTab === 'past_questions' && <PastQuestionSearchView />}
            {activeTab === 'biology_lab' && <BiologyLabView />}
            {activeTab === 'equation_editor' && <EquationEditorView onOpenInGemini={handleOpenInGemini} />}
            {activeTab === 'study_rooms' && <CollaborativeStudyRoomView />}
          </Suspense>
        )}
      </main>

      {/* Floating Quick-Access AI Chat Assistant Button (visible across all tabs except ai_chat) */}
      {activeTab !== 'ai_chat' && (
        <aside aria-label="AI Assistant" className="fixed bottom-6 right-5 z-40 animate-bounce-subtle">
          <button
            type="button"
            onClick={() => navigateTab('ai_chat')}
            className="flex items-center space-x-2 bg-[#22C55E] hover:bg-[#16A34A] text-white px-4 py-3 rounded-2xl shadow-xl shadow-emerald-500/35 font-bold text-xs sm:text-sm cursor-pointer transition-all active:scale-95 border border-emerald-400/30 group"
            title="Chat with AI Assistant (Voice, Vision & Text)"
          >
            <div className="relative">
              <MessageSquare className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white animate-ping" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white" />
            </div>
            <span className="hidden xs:inline">AI Chat</span>
          </button>
        </aside>
      )}

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
      <LanguageSettingsModal />

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
                className="text-white hover:underline font-bold flex items-center space-x-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install on Phone / PC</span>
              </button>
            )}
            <span className="text-zinc-300 font-semibold flex items-center space-x-1">
              <Sparkles className="w-3 h-3 inline text-white" />
              <span>Fast & Offline Ready</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <MainApp />
      </LanguageProvider>
    </ThemeProvider>
  );
}
