import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Header } from './components/Header';
import { ScientificCalculator } from './components/ScientificCalculator';
import { AppOpeningCurtain } from './components/AppOpeningCurtain';
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
  UserCheck,
} from 'lucide-react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { LanguageProvider, useAppLanguage } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';

const MathHub = lazy(() => import('./components/MathHub').then((m) => ({ default: m.MathHub })));
const PhysicsHub = lazy(() => import('./components/PhysicsHub').then((m) => ({ default: m.PhysicsHub })));
const EquationSolverView = lazy(() => import('./components/EquationSolverView').then((m) => ({ default: m.EquationSolverView })));
const UnitConverterView = lazy(() => import('./components/UnitConverterView').then((m) => ({ default: m.UnitConverterView })));
const JambPracticeView = lazy(() => import('./components/JambPracticeView').then((m) => ({ default: m.JambPracticeView })));
const SmartInputView = lazy(() => import('./components/SmartInputView').then((m) => ({ default: m.SmartInputView })));
const GeminiAiSolverView = lazy(() => import('./components/GeminiAiSolverView').then((m) => ({ default: m.GeminiAiSolverView })));
const AiChatAssistantView = lazy(() => import('./components/AiChatAssistantView').then((m) => ({ default: m.AiChatAssistantView })));
const FunctionGrapherView = lazy(() => import('./components/FunctionGrapherView').then((m) => ({ default: m.FunctionGrapherView })));
const PeriodicTableView = lazy(() => import('./components/PeriodicTableView').then((m) => ({ default: m.PeriodicTableView })));
const PhysicsSimulatorView = lazy(() => import('./components/PhysicsSimulatorView').then((m) => ({ default: m.PhysicsSimulatorView })));
const FlashcardsView = lazy(() => import('./components/FlashcardsView').then((m) => ({ default: m.FlashcardsView })));
const CustomFormulaNotebookView = lazy(() => import('./components/CustomFormulaNotebookView').then((m) => ({ default: m.CustomFormulaNotebookView })));
const VectorLabView = lazy(() => import('./components/VectorLabView').then((m) => ({ default: m.VectorLabView })));
const CircuitLabView = lazy(() => import('./components/CircuitLabView').then((m) => ({ default: m.CircuitLabView })));
const OrganicChemistryView = lazy(() => import('./components/OrganicChemistryView').then((m) => ({ default: m.OrganicChemistryView })));
const ExamDiagnosticsView = lazy(() => import('./components/ExamDiagnosticsView').then((m) => ({ default: m.ExamDiagnosticsView })));
const OpticsLabView = lazy(() => import('./components/OpticsLabView').then((m) => ({ default: m.OpticsLabView })));
const GasLawsLabView = lazy(() => import('./components/GasLawsLabView').then((m) => ({ default: m.GasLawsLabView })));
const TitrationLabView = lazy(() => import('./components/TitrationLabView').then((m) => ({ default: m.TitrationLabView })));
const StatisticsLabView = lazy(() => import('./components/StatisticsLabView').then((m) => ({ default: m.StatisticsLabView })));
const MatrixLabView = lazy(() => import('./components/MatrixLabView').then((m) => ({ default: m.MatrixLabView })));
const ChemistrySolverView = lazy(() => import('./components/ChemistrySolverView').then((m) => ({ default: m.ChemistrySolverView })));
const RevisionSheetsView = lazy(() => import('./components/RevisionSheetsView').then((m) => ({ default: m.RevisionSheetsView })));
const LearnAnyTopicView = lazy(() => import('./components/LearnAnyTopicView').then((m) => ({ default: m.LearnAnyTopicView })));
const HistoryDrawer = lazy(() => import('./components/HistoryDrawer').then((m) => ({ default: m.HistoryDrawer })));
const SearchModal = lazy(() => import('./components/SearchModal').then((m) => ({ default: m.SearchModal })));
const InstallAppModal = lazy(() => import('./components/InstallAppModal').then((m) => ({ default: m.InstallAppModal })));
const LanguageSettingsModal = lazy(() => import('./components/LanguageSettingsModal').then((m) => ({ default: m.LanguageSettingsModal })));
const AuthModal = lazy(() => import('./components/AuthModal').then((m) => ({ default: m.AuthModal })));
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute').then((m) => ({ default: m.ProtectedRoute })));
const UserProfileView = lazy(() => import('./components/UserProfileView').then((m) => ({ default: m.UserProfileView })));

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
const CalculusLabView = lazy(() => import('./components/CalculusLabView').then((m) => ({ default: m.CalculusLabView })));

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
        'calculus_lab',
        'profile',
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

  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(() => new Set([activeTab]));

  useEffect(() => {
    setVisitedTabs((prev) => {
      if (prev.has(activeTab)) return prev;
      const next = new Set(prev);
      next.add(activeTab);
      return next;
    });
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
    if (typeof window !== 'undefined' && window.scrollY > 80) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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

  const [navGroup, setNavGroup] = useState<'all' | 'core' | 'studio'>('all');
  const navRibbonRef = useRef<HTMLElement | null>(null);
  const activeTabBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const navEl = navRibbonRef.current;
    const btnEl = activeTabBtnRef.current;
    if (!navEl || !btnEl) return;
    const targetLeft = btnEl.offsetLeft - navEl.clientWidth / 2 + btnEl.clientWidth / 2;
    navEl.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
  }, [activeTab, navGroup]);

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
    'calculus_lab',
  ]);

  const navigationTabs = [
    { id: 'scientific', name: t('scientific', 'Scientific'), icon: Calculator, badge: 'FX' },
    { id: 'learn_topic', name: 'Learn Any Topic', icon: GraduationCap, badge: 'AI Tutor' },
    { id: 'ai_solver', name: t('ai_solver', 'AI Solver'), icon: Sparkles, badge: 'Step Solver' },
    { id: 'ai_chat', name: t('ai_chat', 'AI Chat'), icon: MessageSquare, badge: 'Multimodal' },
    { id: 'ai_whiteboard', name: 'AI Whiteboard', icon: PenTool, badge: 'Studio' },
    { id: 'physics_3d', name: '3D Physics', icon: Box, badge: 'WebGL 3D' },
    { id: 'voice_math', name: 'Voice-to-Math', icon: Mic, badge: 'Voice' },
    { id: 'handwriting', name: 'Handwriting OCR', icon: ScanLine, badge: 'OCR' },
    { id: 'socratic_tutor', name: 'Socratic Tutor', icon: HelpCircle, badge: 'Guided' },
    { id: 'scientific_research', name: 'Research Mode', icon: Microscope, badge: 'Consensus' },
    { id: 'formula_explorer', name: 'Formula Explorer', icon: SlidersHorizontal, badge: 'Sliders' },
    { id: 'document_tutor', name: 'Document Tutor', icon: FileText, badge: 'PDF Q&A' },
    { id: 'past_questions', name: 'Past Questions', icon: Search, badge: 'Verified' },
    { id: 'biology_lab', name: 'Biology Lab', icon: Dna, badge: '3D Anatomy' },
    { id: 'calculus_lab', name: 'Calculus Lab', icon: TrendingUp, badge: 'Symbolic + Area' },
    { id: 'equation_editor', name: 'Equation Editor', icon: Sigma, badge: 'LaTeX' },
    { id: 'study_rooms', name: 'Study Rooms', icon: Users, badge: 'Quiz + Sync' },
    { id: 'grapher', name: t('grapher', '2D Grapher'), icon: TrendingUp, badge: 'Canvas' },
    { id: 'periodic_table', name: t('periodic_table', 'Periodic Table'), icon: FlaskConical, badge: 'Chemistry' },
    { id: 'physics_sim', name: t('physics_sim', 'Physics Lab'), icon: Activity, badge: 'Simulations' },
    { id: 'flashcards', name: t('flashcards', 'Flashcards'), icon: Layers, badge: 'Memory' },
    { id: 'notebook', name: t('notebook', 'My Formulas'), icon: BookOpen, badge: 'Notebook' },
    { id: 'math', name: t('math_hub', 'Mathematics'), icon: FunctionSquare, badge: '19 Topics' },
    { id: 'physics', name: t('physics_hub', 'Physics'), icon: Atom, badge: '44 Formulas' },
    { id: 'equation', name: t('equations', 'Equations'), icon: Cpu, badge: 'Auto' },
    { id: 'converter', name: t('converter', 'Converter'), icon: Scale, badge: '16 Types' },
    { id: 'jamb', name: t('exam_prep', 'JAMB / WAEC'), icon: GraduationCap, badge: 'JAMB · WAEC' },
    { id: 'smart_input', name: t('smart_input', 'Smart Input'), icon: MessageSquareCode, badge: 'AI Parser' },
    { id: 'vectors', name: t('vectors', 'Vector Lab'), icon: Compass, badge: '2D Forces' },
    { id: 'circuits', name: t('circuits', 'Circuit Lab'), icon: Zap, badge: 'DC Ohm' },
    { id: 'organic', name: t('organic', 'Organic Chemistry'), icon: FlaskConical, badge: '2D Molecules' },
    { id: 'diagnostics', name: t('diagnostics', 'Exam Radar'), icon: Award, badge: 'Diagnostics' },
    { id: 'optics', name: t('optics', 'Optics Lab'), icon: Eye, badge: 'Ray Tracer' },
    { id: 'gas_laws', name: t('gas_laws', 'Gas Lab'), icon: Gauge, badge: 'PV = nRT' },
    { id: 'titration', name: t('titration', 'Titration Lab'), icon: FlaskConical, badge: 'pH Curve' },
    { id: 'chem_balancer', name: t('chemistry_solver', 'Chemistry Solver'), icon: FlaskConical, badge: 'AI Tutor & Lab' },
    { id: 'statistics', name: t('statistics', 'Stats & Ogive'), icon: BarChart2, badge: 'Ogive' },
    { id: 'matrix', name: t('matrix', 'Matrix Lab'), icon: Cpu, badge: '3x3 Gauss' },
    { id: 'revision', name: t('revision', 'Cheat-Sheets'), icon: BookOpen, badge: 'Print PDF' },
    { id: 'profile', name: 'Profile & Vault', icon: UserCheck, badge: 'Protected' },
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
      className={`min-h-screen w-full max-w-full overflow-x-clip flex flex-col font-sans ${
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

      {/* Sticky Header + Sideways-Scrollable Navigation Ribbon */}
      <div
        style={{ position: 'sticky', top: 0, zIndex: 1000 }}
        className="sticky top-0 z-[1000] w-full transform-gpu will-change-transform"
      >
        <Header
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenHistory={() => setIsHistoryOpen(true)}
          activeTab={activeTab}
          setActiveTab={navigateTab}
        />

        {/* Main Tab Navigation Ribbon */}
        <div
          className={`border-b shadow-xs ${
            isDark ? 'bg-[#0A0A0A] border-[#27272A]' : 'bg-white border-slate-200'
          }`}
        >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1 pr-2 border-r border-slate-200 dark:border-[#27272A] shrink-0">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'studio', label: 'AI & 3D Studio' },
                { id: 'core', label: 'Calc & Labs' },
              ] as const
            ).map((grp) => (
              <button
                key={grp.id}
                type="button"
                onClick={() => setNavGroup(grp.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap cursor-pointer transition-colors ${
                  navGroup === grp.id
                    ? 'bg-[#22C55E]/15 text-[#22C55E]'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {grp.label}
              </button>
            ))}
          </div>
          <nav
            ref={navRibbonRef}
            className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2.5 scrollbar-none flex-1 scroll-smooth"
          >
            {visibleNavigationTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={isActive ? activeTabBtnRef : null}
                  onClick={() => navigateTab(tab.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#22C55E] text-[#FFFFFF] font-bold shadow-md shadow-emerald-500/25'
                      : isDark
                      ? 'text-[#A1A1AA] hover:text-[#FFFFFF] hover:bg-[#18181B]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                  {tab.badge && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                        isActive
                          ? 'bg-black/25 text-[#FFFFFF]'
                          : isDark
                          ? 'bg-[#18181B] text-[#A1A1AA]'
                          : 'bg-slate-200 text-slate-700'
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
      </div>

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

      {/* Main Content Area: Lazy-mounted on first visit and preserved across navigation */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8">
        {visitedTabs.has('scientific') && (
          <div className={activeTab === 'scientific' ? 'block animate-tabEnter' : 'hidden'}>
            <ScientificCalculator
              onOpenHistory={() => setIsHistoryOpen(true)}
              onOpenSearch={() => setIsSearchOpen(true)}
              onNavigateTab={navigateTab}
            />
          </div>
        )}
        {visitedTabs.has('ai_chat') && (
          <div className={activeTab === 'ai_chat' ? 'block animate-tabEnter' : 'hidden'}>
            <Suspense fallback={<ModuleLoader />}>
              <AiChatAssistantView />
            </Suspense>
          </div>
        )}
        {visitedTabs.has('ai_solver') && (
          <div className={activeTab === 'ai_solver' ? 'block animate-tabEnter' : 'hidden'}>
            <Suspense fallback={<ModuleLoader />}>
              <GeminiAiSolverView
                initialPrompt={aiSolverInitialPrompt}
                initialSubject={aiSolverInitialSubject}
                onClearInitialPrompt={() => setAiSolverInitialPrompt('')}
              />
            </Suspense>
          </div>
        )}
        {visitedTabs.has('learn_topic') && (
          <div className={activeTab === 'learn_topic' ? 'block animate-tabEnter' : 'hidden'}>
            <Suspense fallback={<ModuleLoader />}>
              <LearnAnyTopicView />
            </Suspense>
          </div>
        )}
        {visitedTabs.has('grapher') && (
          <div className={activeTab === 'grapher' ? 'block animate-tabEnter' : 'hidden'}>
            <Suspense fallback={<ModuleLoader />}>
              <FunctionGrapherView />
            </Suspense>
          </div>
        )}
        {visitedTabs.has('periodic_table') && (
          <div className={activeTab === 'periodic_table' ? 'block animate-tabEnter' : 'hidden'}>
            <Suspense fallback={<ModuleLoader />}>
              <PeriodicTableView />
            </Suspense>
          </div>
        )}
        {visitedTabs.has('physics_sim') && (
          <div className={activeTab === 'physics_sim' ? 'block animate-tabEnter' : 'hidden'}>
            <Suspense fallback={<ModuleLoader />}>
              <PhysicsSimulatorView />
            </Suspense>
          </div>
        )}
        {visitedTabs.has('flashcards') && (
          <div className={activeTab === 'flashcards' ? 'block animate-tabEnter' : 'hidden'}>
            <Suspense fallback={<ModuleLoader />}>
              <FlashcardsView />
            </Suspense>
          </div>
        )}
        {visitedTabs.has('notebook') && (
          <div className={activeTab === 'notebook' ? 'block animate-tabEnter' : 'hidden'}>
            <Suspense fallback={<ModuleLoader />}>
              <CustomFormulaNotebookView />
            </Suspense>
          </div>
        )}
        {visitedTabs.has('math') && (
          <div className={activeTab === 'math' ? 'block animate-tabEnter' : 'hidden'}>
            <Suspense fallback={<ModuleLoader />}>
              <MathHub />
            </Suspense>
          </div>
        )}
        {visitedTabs.has('physics') && (
          <div className={activeTab === 'physics' ? 'block animate-tabEnter' : 'hidden'}>
            <Suspense fallback={<ModuleLoader />}>
              <PhysicsHub />
            </Suspense>
          </div>
        )}
        {visitedTabs.has('equation') && (
          <div className={activeTab === 'equation' ? 'block animate-tabEnter' : 'hidden'}>
            <Suspense fallback={<ModuleLoader />}>
              <EquationSolverView />
            </Suspense>
          </div>
        )}
        {visitedTabs.has('converter') && (
          <div className={activeTab === 'converter' ? 'block animate-tabEnter' : 'hidden'}>
            <Suspense fallback={<ModuleLoader />}>
              <UnitConverterView />
            </Suspense>
          </div>
        )}
        {visitedTabs.has('jamb') && (
          <div className={activeTab === 'jamb' ? 'block animate-tabEnter' : 'hidden'}>
            <Suspense fallback={<ModuleLoader />}>
              <JambPracticeView onOpenInGemini={handleOpenInGemini} />
            </Suspense>
          </div>
        )}
        {visitedTabs.has('smart_input') && (
          <div className={activeTab === 'smart_input' ? 'block animate-tabEnter' : 'hidden'}>
            <Suspense fallback={<ModuleLoader />}>
              <SmartInputView />
            </Suspense>
          </div>
        )}
        {visitedTabs.has('vectors') && (
          <div className={activeTab === 'vectors' ? 'block animate-tabEnter' : 'hidden'}>
            <Suspense fallback={<ModuleLoader />}>
              <VectorLabView />
            </Suspense>
          </div>
        )}
        {visitedTabs.has('circuits') && (
          <div className={activeTab === 'circuits' ? 'block animate-tabEnter' : 'hidden'}>
            <Suspense fallback={<ModuleLoader />}>
              <CircuitLabView />
            </Suspense>
          </div>
        )}
        {visitedTabs.has('organic') && (
          <div className={activeTab === 'organic' ? 'block animate-tabEnter' : 'hidden'}>
            <Suspense fallback={<ModuleLoader />}>
              <OrganicChemistryView />
            </Suspense>
          </div>
        )}
        {visitedTabs.has('diagnostics') && (
          <div className={activeTab === 'diagnostics' ? 'block animate-tabEnter' : 'hidden'}>
            <Suspense fallback={<ModuleLoader />}>
              <ExamDiagnosticsView onNavigateTab={navigateTab} />
            </Suspense>
          </div>
        )}
        {visitedTabs.has('optics') && (
          <div className={activeTab === 'optics' ? 'block animate-tabEnter' : 'hidden'}>
            <Suspense fallback={<ModuleLoader />}>
              <OpticsLabView />
            </Suspense>
          </div>
        )}
        {visitedTabs.has('gas_laws') && (
          <div className={activeTab === 'gas_laws' ? 'block animate-tabEnter' : 'hidden'}>
            <Suspense fallback={<ModuleLoader />}>
              <GasLawsLabView />
            </Suspense>
          </div>
        )}
        {visitedTabs.has('titration') && (
          <div className={activeTab === 'titration' ? 'block animate-tabEnter' : 'hidden'}>
            <Suspense fallback={<ModuleLoader />}>
              <TitrationLabView />
            </Suspense>
          </div>
        )}
        {visitedTabs.has('chem_balancer') && (
          <div className={activeTab === 'chem_balancer' ? 'block animate-tabEnter' : 'hidden'}>
            <Suspense fallback={<ModuleLoader />}>
              <ChemistrySolverView onOpenInGemini={handleOpenInGemini} />
            </Suspense>
          </div>
        )}
        {visitedTabs.has('statistics') && (
          <div className={activeTab === 'statistics' ? 'block animate-tabEnter' : 'hidden'}>
            <Suspense fallback={<ModuleLoader />}>
              <StatisticsLabView />
            </Suspense>
          </div>
        )}
        {visitedTabs.has('matrix') && (
          <div className={activeTab === 'matrix' ? 'block animate-tabEnter' : 'hidden'}>
            <Suspense fallback={<ModuleLoader />}>
              <MatrixLabView />
            </Suspense>
          </div>
        )}
        {visitedTabs.has('revision') && (
          <div className={activeTab === 'revision' ? 'block animate-tabEnter' : 'hidden'}>
            <Suspense fallback={<ModuleLoader />}>
              <RevisionSheetsView />
            </Suspense>
          </div>
        )}
        {visitedTabs.has('profile') && (
          <div className={activeTab === 'profile' ? 'block animate-tabEnter' : 'hidden'}>
            <Suspense fallback={<ModuleLoader />}>
              <ProtectedRoute
                routeTitle="Student Profile & Private Vault"
                routeDescription="Sign in with your Google account to sync your academic profile and store private study vault notes secured by Auth.js and encrypted HTTP-only cookie sessions."
                onBackToCalculator={() => navigateTab('scientific')}
              >
                <UserProfileView onNavigateTab={navigateTab} />
              </ProtectedRoute>
            </Suspense>
          </div>
        )}

        {/* 12 Lazy-Loaded SmartSolve Studio Modules */}
        {studioTabIds.has(activeTab) && (
          <Suspense fallback={<ModuleLoader />}>
            <div key={activeTab} className="animate-tabEnter">
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
              {activeTab === 'calculus_lab' && <CalculusLabView />}
              {activeTab === 'equation_editor' && <EquationEditorView onOpenInGemini={handleOpenInGemini} />}
              {activeTab === 'study_rooms' && <CollaborativeStudyRoomView />}
            </div>
          </Suspense>
        )}
      </main>

      {/* Floating Quick-Access AI Chat Assistant Button (visible across all tabs except ai_chat) */}
      {activeTab !== 'ai_chat' && (
        <aside aria-label="AI Assistant" className="fixed bottom-6 right-5 z-40 transform-gpu">
          <button
            type="button"
            onClick={() => navigateTab('ai_chat')}
            className="flex items-center space-x-2 bg-[#22C55E] hover:bg-[#16A34A] text-white px-4 py-3 rounded-2xl shadow-xl shadow-emerald-500/35 font-bold text-xs sm:text-sm cursor-pointer transition-transform duration-150 hover:scale-105 active:scale-95 border border-emerald-400/30 group"
            title="Chat with AI Assistant (Voice, Vision & Text)"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden xs:inline">AI Chat</span>
          </button>
        </aside>
      )}

      {/* Global Modals / Drawers (lazy-loaded so initial boot stays fast) */}
      <Suspense fallback={null}>
        {isHistoryOpen && (
          <HistoryDrawer isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
        )}
        {isSearchOpen && (
          <SearchModal
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            onSelectAction={handleSelectFromSearch}
          />
        )}
        {isInstallModalOpen && (
          <InstallAppModal
            isOpen={isInstallModalOpen}
            onClose={() => setIsInstallModalOpen(false)}
          />
        )}
        <LanguageSettingsModal />
        <AuthModal
          onAuthenticated={(redirectTab) => {
            if (redirectTab) navigateTab(redirectTab);
          }}
        />
      </Suspense>

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
        <AuthProvider>
          <AppOpeningCurtain />
          <MainApp />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
