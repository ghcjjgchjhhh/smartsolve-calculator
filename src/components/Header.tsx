import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Calculator,
  Moon,
  Sun,
  Monitor,
  Search,
  History,
  Download,
  Sparkles,
  MessageSquare,
  GraduationCap,
  Check,
  X,
  Globe,
  LayoutGrid,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LucideIcon,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { InstallAppModal } from './InstallAppModal';
import { useTheme, ThemePreference } from '../contexts/ThemeContext';
import { useAppLanguage } from '../contexts/LanguageContext';
import { getHistory } from '../services/historyStorage';

export type NavGroupFilter = 'all' | 'studio' | 'core';

export type NavSectionCategory =
  | 'Core & Calculators'
  | 'AI Tutors & Solvers'
  | 'AI & 3D Studio'
  | 'Physics, Chem & Labs'
  | 'Exam Prep & Study Rooms';

export interface NavigationTabItem {
  id: string;
  name: string;
  icon: LucideIcon;
  badge?: string;
  category: NavSectionCategory;
}

interface Props {
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  onOpenSearch: () => void;
  onOpenHistory: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  navigationTabs: NavigationTabItem[];
  visibleNavigationTabs: NavigationTabItem[];
  navGroup: NavGroupFilter;
  setNavGroup: (group: NavGroupFilter) => void;
}

const SECTION_ORDER: NavSectionCategory[] = [
  'Core & Calculators',
  'AI Tutors & Solvers',
  'AI & 3D Studio',
  'Physics, Chem & Labs',
  'Exam Prep & Study Rooms',
];

export const Header: React.FC<Props> = ({
  onOpenSearch,
  onOpenHistory,
  activeTab,
  setActiveTab,
  navigationTabs,
  visibleNavigationTabs,
  navGroup,
  setNavGroup,
}) => {
  const { isInstalled, canInstall, triggerInstall } = usePWAInstall();
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isAllRoomsOpen, setIsAllRoomsOpen] = useState(false);
  const [roomFilterQuery, setRoomFilterQuery] = useState('');
  const [selectedDirectorySection, setSelectedDirectorySection] = useState<NavSectionCategory | 'All'>('All');

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

  const headerWrapperRef = useRef<HTMLElement | null>(null);
  const tabRibbonRef = useRef<HTMLElement | null>(null);
  const activeTabBtnRef = useRef<HTMLButtonElement | null>(null);
  const roomSearchInputRef = useRef<HTMLInputElement | null>(null);

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

  // Horizontally center the active tab in the sticky ribbon without altering vertical page scroll
  useEffect(() => {
    const navEl = tabRibbonRef.current;
    const btnEl = activeTabBtnRef.current;
    if (!navEl || !btnEl) return;

    const targetLeft =
      btnEl.offsetLeft - navEl.clientWidth / 2 + btnEl.clientWidth / 2;
    navEl.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: 'smooth',
    });
  }, [activeTab, navGroup]);

  // Close All Rooms directory on Escape or click outside
  useEffect(() => {
    if (!isAllRoomsOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAllRoomsOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        headerWrapperRef.current &&
        !headerWrapperRef.current.contains(e.target as Node)
      ) {
        setIsAllRoomsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });

    const focusTimer = window.setTimeout(() => {
      roomSearchInputRef.current?.focus();
    }, 60);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isAllRoomsOpen]);

  const handleSelectRoom = (tabId: string) => {
    setActiveTab(tabId);
    setIsAllRoomsOpen(false);
    setRoomFilterQuery('');
    // When switching tools from a scrolled position, scroll smoothly to the top of the workspace
    if (typeof window !== 'undefined' && window.scrollY > 80) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleScrollRibbon = (direction: 'left' | 'right') => {
    const navEl = tabRibbonRef.current;
    if (!navEl) return;
    const delta = Math.max(220, navEl.clientWidth * 0.65);
    navEl.scrollBy({
      left: direction === 'left' ? -delta : delta,
      behavior: 'smooth',
    });
  };

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

  const activeTabItem = useMemo(
    () => navigationTabs.find((tab) => tab.id === activeTab) || navigationTabs[0],
    [navigationTabs, activeTab]
  );

  const groupedDirectoryTabs = useMemo(() => {
    const q = roomFilterQuery.trim().toLowerCase();
    const filtered = navigationTabs.filter((tab) => {
      const matchesSection =
        selectedDirectorySection === 'All' || tab.category === selectedDirectorySection;
      if (!matchesSection) return false;
      if (!q) return true;
      return (
        tab.name.toLowerCase().includes(q) ||
        tab.category.toLowerCase().includes(q) ||
        (tab.badge && tab.badge.toLowerCase().includes(q)) ||
        tab.id.toLowerCase().includes(q)
      );
    });

    const groups: { category: NavSectionCategory; items: NavigationTabItem[] }[] = [];
    for (const section of SECTION_ORDER) {
      const items = filtered.filter((item) => item.category === section);
      if (items.length > 0) {
        groups.push({ category: section, items });
      }
    }
    return groups;
  }, [navigationTabs, roomFilterQuery, selectedDirectorySection]);

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

  const categoryGroups: { id: NavGroupFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'studio', label: 'AI & 3D Studio' },
    { id: 'core', label: 'Calc & Labs' },
  ];

  return (
    <>
      <header
        ref={headerWrapperRef}
        style={{ position: 'sticky', top: 0, zIndex: 1000 }}
        className={`sticky top-0 z-[1000] w-full backdrop-blur-md border-b transition-colors ${
          isDark
            ? 'bg-[#0A0A0A]/95 text-white border-[#27272A]'
            : 'bg-white/95 text-slate-900 border-slate-200 shadow-xs'
        }`}
      >
        {/* Row 1: Brand & Primary Quick Actions */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-2 h-14 sm:h-16">
            {/* Logo & Branding */}
            <div
              className="flex items-center space-x-2 sm:space-x-3 cursor-pointer select-none flex-shrink-0 min-w-0"
              onClick={() => handleSelectRoom('scientific')}
            >
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl border flex items-center justify-center shadow-lg text-[#22C55E] flex-shrink-0 transition-colors ${
                  isDark
                    ? 'bg-[#18181B] border-[#22C55E]/40 shadow-emerald-500/15'
                    : 'bg-emerald-50 border-emerald-300 shadow-emerald-600/10'
                }`}
              >
                <Calculator className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5">
                  <span
                    className={`text-sm sm:text-lg font-black tracking-tight whitespace-nowrap ${
                      isDark ? 'text-[#FFFFFF]' : 'text-slate-900'
                    }`}
                  >
                    Smart<span className="text-[#22C55E]">Solve</span>
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30 shrink-0">
                    PRO
                  </span>
                </div>
                <p
                  className={`text-[10px] sm:text-[11px] font-medium hidden md:block truncate ${
                    isDark ? 'text-[#A1A1AA]' : 'text-slate-500'
                  }`}
                >
                  Mathematics, Physics & Chemistry Tutor
                </p>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
              {/* All Rooms & Categories Menu Button (Always visible on mobile & desktop) */}
              <button
                type="button"
                onClick={() => setIsAllRoomsOpen((prev) => !prev)}
                aria-expanded={isAllRoomsOpen}
                aria-haspopup="true"
                className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border shrink-0 whitespace-nowrap ${
                  isAllRoomsOpen
                    ? 'bg-[#22C55E] text-white border-[#22C55E] shadow-md shadow-emerald-500/25'
                    : isDark
                    ? 'bg-[#18181B] hover:bg-[#27272A] text-white border-[#27272A]'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-200'
                }`}
                title="Browse and select any room, category, or tool"
              >
                <LayoutGrid className={`w-3.5 h-3.5 ${isAllRoomsOpen ? 'text-white' : 'text-[#22C55E]'}`} />
                <span className="hidden xs:inline max-w-[100px] sm:max-w-none truncate">
                  {activeTabItem ? activeTabItem.name : 'All Rooms'}
                </span>
                <span className="xs:hidden">Rooms</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isAllRoomsOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Learn Any Topic Button (desktop/tablet) */}
              <button
                type="button"
                onClick={() => handleSelectRoom('learn_topic')}
                className={`hidden lg:flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
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
                type="button"
                onClick={() => handleSelectRoom('ai_chat')}
                className={`hidden sm:flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
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
                type="button"
                onClick={() => handleSelectRoom('ai_solver')}
                className={`hidden md:flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
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
                  type="button"
                  onClick={handleInstallClick}
                  className="flex items-center space-x-1.5 p-2 sm:px-3 sm:py-2 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-[#FFFFFF] text-xs font-bold shadow-md shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
                  title="Install SmartSolve as a phone or desktop app"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('install', 'Install')}</span>
                </button>
              )}

              {/* Quick Search Button */}
              <button
                type="button"
                onClick={onOpenSearch}
                className={`flex items-center space-x-1.5 p-2 sm:px-3 sm:py-2 rounded-xl transition-colors text-xs font-semibold border cursor-pointer shrink-0 whitespace-nowrap ${
                  isDark
                    ? 'bg-[#18181B] hover:bg-[#27272A] text-[#A1A1AA] hover:text-[#FFFFFF] border-white/5'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border-slate-200'
                }`}
                title="Search formula and tools"
              >
                <Search className="w-4 h-4 text-[#22C55E]" />
                <span className="hidden xl:inline">{t('search', 'Quick Search')}</span>
              </button>

              {/* History Button */}
              <button
                type="button"
                onClick={onOpenHistory}
                title="Calculation & Chat History"
                className={`flex items-center space-x-1.5 p-2 sm:px-3 sm:py-2 rounded-xl transition-all border cursor-pointer shadow-xs active:scale-95 shrink-0 whitespace-nowrap ${
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

              {/* Appearance / Theme Setting Modal Trigger */}
              <button
                type="button"
                onClick={() => setIsThemeModalOpen(true)}
                title={`Appearance: ${themePreference === 'system' ? 'System (' + resolvedTheme + ')' : themePreference}`}
                className={`flex items-center space-x-1.5 p-2 sm:px-2.5 sm:py-2 rounded-xl transition-colors border cursor-pointer relative group shrink-0 whitespace-nowrap ${
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
                <span className="text-xs font-bold hidden xl:inline capitalize">
                  {themePreference === 'system' ? t('theme', 'Theme') : themePreference}
                </span>
                {themePreference === 'system' && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#22C55E] ring-2 ring-black/50" />
                )}
              </button>

              {/* App Language & Writing Selector */}
              <button
                type="button"
                onClick={() => setIsLanguageModalOpen(true)}
                title={`App Language & Writing: ${currentLanguage.name} (${currentLanguage.nativeName})`}
                className={`flex items-center space-x-1 sm:space-x-1.5 p-2 sm:px-2.5 sm:py-2 rounded-xl transition-colors border cursor-pointer active:scale-95 shrink-0 whitespace-nowrap ${
                  isDark
                    ? 'bg-[#18181B] hover:bg-[#27272A] text-white border-[#27272A]'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-200'
                }`}
              >
                <span className="text-sm leading-none" role="img" aria-label={currentLanguage.name}>
                  {currentLanguage.flag}
                </span>
                <span className="text-xs font-bold hidden lg:inline">
                  {currentLanguage.nativeName}
                </span>
                <Globe className="w-3.5 h-3.5 text-[#22C55E]" />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Unified Sticky Category & Room Navigation Strip */}
        <div
          className={`border-t transition-colors ${
            isDark ? 'border-[#27272A]/90 bg-[#0A0A0A]/90' : 'border-slate-200/90 bg-white/90'
          }`}
        >
          <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 flex items-center gap-1.5 sm:gap-2">
            {/* Category Filter Pills — Responsive on both mobile and desktop */}
            <div
              className={`flex items-center gap-1 pr-2 border-r shrink-0 py-1.5 ${
                isDark ? 'border-[#27272A]' : 'border-slate-200'
              }`}
              role="group"
              aria-label="Filter navigation by category"
            >
              {categoryGroups.map((grp) => (
                <button
                  key={grp.id}
                  type="button"
                  onClick={() => setNavGroup(grp.id)}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                    navGroup === grp.id
                      ? 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30'
                      : isDark
                      ? 'text-zinc-400 hover:text-white hover:bg-[#18181B]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {grp.label}
                </button>
              ))}
            </div>

            {/* Scroll Left Button (Desktop) */}
            <button
              type="button"
              onClick={() => handleScrollRibbon('left')}
              aria-label="Scroll navigation tabs left"
              className={`hidden md:flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-colors cursor-pointer ${
                isDark
                  ? 'text-zinc-400 hover:text-white hover:bg-[#18181B]'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Horizontally Scrollable Navigation Ribbon */}
            <nav
              ref={tabRibbonRef}
              aria-label="Primary app navigation"
              className="flex space-x-1 sm:space-x-1.5 overflow-x-auto py-1.5 sm:py-2 scrollbar-none flex-1 min-w-0"
            >
              {visibleNavigationTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    ref={isActive ? activeTabBtnRef : null}
                    type="button"
                    onClick={() => handleSelectRoom(tab.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center space-x-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#22C55E] text-[#FFFFFF] font-bold shadow-md shadow-emerald-500/25'
                        : isDark
                        ? 'text-[#A1A1AA] hover:text-[#FFFFFF] hover:bg-[#18181B]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span>{tab.name}</span>
                    {tab.badge && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md shrink-0 ${
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

            {/* Scroll Right Button (Desktop) */}
            <button
              type="button"
              onClick={() => handleScrollRibbon('right')}
              aria-label="Scroll navigation tabs right"
              className={`hidden md:flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-colors cursor-pointer ${
                isDark
                  ? 'text-zinc-400 hover:text-white hover:bg-[#18181B]'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expandable All Rooms, Categories & Tabs Directory Dropdown (Directly in Sticky Header) */}
        {isAllRoomsOpen && (
          <div
            className={`absolute left-0 right-0 top-full border-b shadow-2xl backdrop-blur-xl transition-all ${
              isDark
                ? 'bg-[#0A0A0C]/95 border-[#27272A] text-white'
                : 'bg-white/95 border-slate-200 text-slate-900'
            }`}
          >
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 max-h-[calc(100dvh-120px)] overflow-y-auto space-y-4">
              {/* Directory Top Controls: Filter Input + Section Switcher + Close */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-[#22C55E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    ref={roomSearchInputRef}
                    type="text"
                    value={roomFilterQuery}
                    onChange={(e) => setRoomFilterQuery(e.target.value)}
                    placeholder={`Jump to any room, lab, or tool (${navigationTabs.length} available)...`}
                    className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs sm:text-sm border focus:outline-none focus:border-[#22C55E] ${
                      isDark
                        ? 'bg-[#18181B] border-[#27272A] text-white placeholder-zinc-400'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  {roomFilterQuery && (
                    <button
                      type="button"
                      onClick={() => setRoomFilterQuery('')}
                      aria-label="Clear room filter"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  {/* Category Section Tabs */}
                  <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-0.5">
                    {(['All', ...SECTION_ORDER] as const).map((sec) => {
                      const active = selectedDirectorySection === sec;
                      return (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => setSelectedDirectorySection(sec)}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                            active
                              ? 'bg-[#22C55E] text-white shadow-sm'
                              : isDark
                              ? 'bg-[#18181B] text-zinc-400 hover:text-white'
                              : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {sec}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAllRoomsOpen(false)}
                    aria-label="Close rooms menu"
                    className={`p-1.5 rounded-lg shrink-0 cursor-pointer transition-colors ${
                      isDark
                        ? 'bg-[#18181B] hover:bg-[#27272A] text-zinc-400 hover:text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick Navigation Actions for Mobile/Compact Screens */}
              <div className="flex flex-wrap items-center gap-1.5 sm:hidden pb-2 border-b border-slate-200 dark:border-[#27272A]">
                <button
                  type="button"
                  onClick={() => handleSelectRoom('learn_topic')}
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#22C55E]/15 text-[#22C55E] text-xs font-bold cursor-pointer"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Learn Topic</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectRoom('ai_solver')}
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#22C55E]/15 text-[#22C55E] text-xs font-bold cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Solver</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectRoom('ai_chat')}
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#22C55E]/15 text-[#22C55E] text-xs font-bold cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>AI Chat</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAllRoomsOpen(false);
                    onOpenSearch();
                  }}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    isDark ? 'bg-[#18181B] text-white' : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  <Search className="w-3.5 h-3.5 text-[#22C55E]" />
                  <span>Formula Search</span>
                </button>
              </div>

              {/* Categorized Grid of All Rooms, Labs & Tools */}
              {groupedDirectoryTabs.length === 0 ? (
                <div className={`py-8 text-center text-xs sm:text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  No rooms or tools matched "{roomFilterQuery}". Try another keyword.
                </div>
              ) : (
                <div className="space-y-4">
                  {groupedDirectoryTabs.map((group) => (
                    <div key={group.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3
                          className={`text-xs font-bold tracking-wide ${
                            isDark ? 'text-zinc-400' : 'text-slate-500'
                          }`}
                        >
                          {group.category} ({group.items.length})
                        </h3>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                        {group.items.map((tab) => {
                          const Icon = tab.icon;
                          const isActive = activeTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => handleSelectRoom(tab.id)}
                              className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-[#22C55E] text-white border-[#22C55E] shadow-md shadow-emerald-500/20'
                                  : isDark
                                  ? 'bg-[#141418] hover:bg-[#1E1E24] text-zinc-200 border-[#27272A]'
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                              }`}
                            >
                              <div className="flex items-center space-x-2 min-w-0">
                                <div
                                  className={`p-1.5 rounded-lg shrink-0 ${
                                    isActive
                                      ? 'bg-black/20 text-white'
                                      : isDark
                                      ? 'bg-[#27272A] text-[#22C55E]'
                                      : 'bg-white text-[#22C55E] border border-slate-200'
                                  }`}
                                >
                                  <Icon className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold truncate">{tab.name}</div>
                                  {tab.badge && (
                                    <div
                                      className={`text-[10px] truncate ${
                                        isActive
                                          ? 'text-white/90'
                                          : isDark
                                          ? 'text-zinc-400'
                                          : 'text-slate-500'
                                      }`}
                                    >
                                      {tab.badge}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {isActive && <Check className="w-3.5 h-3.5 shrink-0 text-white" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Appearance Setting Modal (z-[1100] stays above sticky header) */}
      {isThemeModalOpen && (
        <div className="fixed inset-0 z-[1100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
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
