import React, { useState, useEffect } from 'react';
import {
  Settings,
  Monitor,
  Moon,
  Sun,
  Check,
  X,
  Palette,
  Globe,
  Cloud,
  Download,
  RotateCcw,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import {
  useTheme,
  ThemePreference,
  ACCENT_PALETTES,
  AccentCategory,
} from '../contexts/ThemeContext';
import { useAppLanguage } from '../contexts/LanguageContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCloudSync: () => void;
  isInstalled: boolean;
  onTriggerInstall: () => void;
}

const CATEGORY_TABS: { id: 'all' | AccentCategory; label: string }[] = [
  { id: 'all', label: `All (${ACCENT_PALETTES.length})` },
  { id: 'greens', label: 'Greens & Teals' },
  { id: 'blues', label: 'Blues & Cyans' },
  { id: 'purples', label: 'Purples & Pinks' },
  { id: 'warm', label: 'Reds & Oranges' },
  { id: 'neutrals', label: 'Golds & Steel' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenCloudSync,
  isInstalled,
  onTriggerInstall,
}) => {
  const {
    themePreference,
    resolvedTheme,
    isDark,
    setThemePreference,
    accentColor,
    accentPalette,
    setAccentColor,
  } = useTheme();
  const { currentLanguage, setIsLanguageModalOpen } = useAppLanguage();
  const [colorCategory, setColorCategory] = useState<'all' | AccentCategory>('all');

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const themeOptions: {
    id: ThemePreference;
    name: string;
    description: string;
    icon: typeof Moon;
  }[] = [
    {
      id: 'system',
      name: 'System Default',
      description: `Follows device (${resolvedTheme})`,
      icon: Monitor,
    },
    {
      id: 'dark',
      name: 'Dark Mode',
      description: 'OLED obsidian contrast',
      icon: Moon,
    },
    {
      id: 'light',
      name: 'Light Mode',
      description: 'Bright daylight reading',
      icon: Sun,
    },
  ];

  const visiblePalettes =
    colorCategory === 'all'
      ? ACCENT_PALETTES
      : ACCENT_PALETTES.filter((p) => p.category === colorCategory);

  const handleResetDefaults = () => {
    setThemePreference('system');
    setAccentColor('emerald');
  };

  return (
    <div
      className="fixed inset-0 z-[1100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Settings Room"
        className={`rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border overflow-hidden ${
          isDark
            ? 'bg-[#0E0E12] border-[#27272A] text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Top Settings Room Header */}
        <div
          className={`flex items-center justify-between px-5 sm:px-6 py-4 border-b shrink-0 ${
            isDark ? 'bg-[#121216] border-[#27272A]' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${
                isDark
                  ? 'bg-[#18181B] border-[#22C55E]/40 text-[#22C55E]'
                  : 'bg-emerald-50 border-emerald-300 text-[#22C55E]'
              }`}
            >
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight">
                Settings Room
              </h2>
              <p className={`text-[11px] sm:text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Theme mode, {ACCENT_PALETTES.length} accent colors, language & workspace sync
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Settings Room"
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDark
                ? 'bg-[#1C1C22] hover:bg-[#27272A] text-zinc-400 hover:text-white'
                : 'bg-slate-200/70 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Settings Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Live Theme & Accent Preview Card */}
          <div
            className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isDark
                ? 'bg-[#141418] border-[#27272A]'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-9 h-9 rounded-xl shrink-0 ring-2 ring-offset-2 flex items-center justify-center ${
                  accentPalette.swatchClass
                } ${isDark ? 'ring-white/30 ring-offset-[#141418]' : 'ring-slate-900/20 ring-offset-slate-50'}`}
              >
                <Sparkles
                  className={`w-4 h-4 ${
                    accentPalette.onSolid === '#09090B' ? 'text-slate-950' : 'text-white'
                  }`}
                />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs sm:text-sm font-extrabold">
                    Smart<span className="text-[#22C55E]">Solve</span> Live Preview
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30">
                    {accentPalette.name} · {accentPalette.primary}
                  </span>
                </div>
                <p className={`text-[11px] mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Mode: <strong className="capitalize">{themePreference}</strong>
                  {themePreference === 'system' ? ` (${resolvedTheme})` : ''} · {accentPalette.tagline}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="px-3 py-1.5 rounded-xl bg-[#22C55E] text-white text-xs font-bold shadow-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Active Theme</span>
              </span>
            </div>
          </div>

          {/* Section 1: Display Mode (System Default / Dark / Light) */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-[#22C55E]" />
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider">
                  Appearance Mode
                </h3>
              </div>
              <span className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Auto-saved
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {themeOptions.map((opt) => {
                const isSelected = themePreference === opt.id;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setThemePreference(opt.id)}
                    className={`p-3.5 rounded-2xl border text-left flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#22C55E]/15 border-[#22C55E] shadow-sm'
                        : isDark
                        ? 'bg-[#15151A] border-[#27272A] hover:bg-[#1C1C22] text-zinc-300'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-auto sm:w-full">
                      <div
                        className={`p-2 rounded-xl ${
                          isSelected
                            ? 'bg-[#22C55E] text-white'
                            : isDark
                            ? 'bg-[#27272A] text-zinc-300'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#22C55E] hidden sm:block" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold">{opt.name}</div>
                      <div
                        className={`text-[11px] mt-0.5 ${
                          isDark ? 'text-zinc-400' : 'text-slate-500'
                        }`}
                      >
                        {opt.description}
                      </div>
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-[#22C55E] sm:hidden shrink-0" />}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Section 2: Accent Color Studio (28 Colors) */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#22C55E]" />
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider">
                  Accent Colors ({ACCENT_PALETTES.length})
                </h3>
              </div>
              <span className="text-xs font-bold text-[#22C55E]">
                {accentPalette.name} · {accentPalette.tagline}
              </span>
            </div>

            {/* Color Family Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORY_TABS.map((tab) => {
                const active = colorCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setColorCategory(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors border ${
                      active
                        ? 'bg-[#22C55E] text-white border-[#22C55E]'
                        : isDark
                        ? 'bg-[#18181D] text-zinc-400 border-[#27272A] hover:text-white'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Swatch Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {visiblePalettes.map((pal) => {
                const selected = pal.id === accentColor;
                return (
                  <button
                    key={pal.id}
                    type="button"
                    onClick={() => setAccentColor(pal.id)}
                    title={`${pal.name} · ${pal.tagline} (${pal.primary})`}
                    aria-label={`Select ${pal.name} color`}
                    className={`group p-2 rounded-2xl border flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                      selected
                        ? 'border-[#22C55E] bg-[#22C55E]/15 shadow-sm'
                        : isDark
                        ? 'border-[#27272A] bg-[#15151A] hover:border-zinc-500 hover:bg-[#1C1C22]'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${
                        pal.swatchClass
                      } ${
                        selected
                          ? isDark
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-[#15151A] scale-105'
                            : 'ring-2 ring-slate-900 ring-offset-2 ring-offset-slate-50 scale-105'
                          : ''
                      }`}
                    >
                      {selected && (
                        <Check
                          className={`w-4 h-4 ${
                            pal.onSolid === '#09090B' ? 'text-slate-950' : 'text-white'
                          }`}
                        />
                      )}
                    </span>
                    <span className="text-[10px] font-bold leading-tight text-center truncate w-full">
                      {pal.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Section 3: Workspace & App Settings */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#22C55E]" />
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider">
                Language, Sync & Preferences
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setIsLanguageModalOpen(true);
                }}
                className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 cursor-pointer transition-colors ${
                  isDark
                    ? 'bg-[#15151A] border-[#27272A] hover:bg-[#1C1C22]'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="p-2.5 rounded-xl bg-[#22C55E]/15 text-[#22C55E] shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold">App Language & Script</div>
                  <div className={`text-[11px] truncate ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    {currentLanguage.flag} {currentLanguage.nativeName} ({currentLanguage.name})
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCloudSync();
                }}
                className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 cursor-pointer transition-colors ${
                  isDark
                    ? 'bg-[#15151A] border-[#27272A] hover:bg-[#1C1C22]'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="p-2.5 rounded-xl bg-[#22C55E]/15 text-[#22C55E] shrink-0">
                  <Cloud className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold">Cloud Sync & Countdowns</div>
                  <div className={`text-[11px] truncate ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    Backup history, notes & exam dates
                  </div>
                </div>
              </button>

              {!isInstalled && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onTriggerInstall();
                  }}
                  className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 cursor-pointer transition-colors ${
                    isDark
                      ? 'bg-[#15151A] border-[#27272A] hover:bg-[#1C1C22]'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="p-2.5 rounded-xl bg-[#22C55E]/15 text-[#22C55E] shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold">Install SmartSolve App</div>
                    <div className={`text-[11px] truncate ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      Use offline on phone or desktop
                    </div>
                  </div>
                </button>
              )}

              <button
                type="button"
                onClick={handleResetDefaults}
                className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 cursor-pointer transition-colors ${
                  isDark
                    ? 'bg-[#15151A] border-[#27272A] hover:bg-[#1C1C22]'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="p-2.5 rounded-xl bg-[#22C55E]/15 text-[#22C55E] shrink-0">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold">Reset Appearance</div>
                  <div className={`text-[11px] truncate ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    Restore System Default & Emerald
                  </div>
                </div>
              </button>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div
          className={`px-5 sm:px-6 py-3.5 border-t flex items-center justify-between gap-3 shrink-0 ${
            isDark ? 'bg-[#121216] border-[#27272A]' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <span className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Changes apply immediately across the whole app
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-emerald-500/20"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
