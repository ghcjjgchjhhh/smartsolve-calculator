import React, { useState } from 'react';
import { useAppLanguage, APP_LANGUAGES } from '../contexts/LanguageContext';
import { Globe, Check, X, Search, Sparkles } from 'lucide-react';

export const LanguageSettingsModal: React.FC = () => {
  const { currentLanguage, setLanguage, isLanguageModalOpen, setIsLanguageModalOpen } = useAppLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  if (!isLanguageModalOpen) return null;

  const filtered = APP_LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121417] border border-[#27272A] rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 max-h-[90vh] flex flex-col animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#22C55E]/15 border border-[#22C55E]/40 flex items-center justify-center text-[#22C55E]">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>App Language & Writing</span>
              </h3>
              <p className="text-[11px] text-zinc-400">
                Choose your preferred interface writing and tutor language
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsLanguageModalOpen(false)}
            className="p-1.5 rounded-lg bg-[#27272A] hover:bg-[#3F3F46] text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search languages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1A1D23] border border-[#27272A] focus:border-[#22C55E] rounded-xl pl-9.5 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none"
          />
        </div>

        {/* Language List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin max-h-80">
          {filtered.map((lang) => {
            const isSelected = currentLanguage.code === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setLanguage(lang.code);
                  // Also sync chat voice settings if present
                  try {
                    const raw = localStorage.getItem('smartsolve_chat_voice_settings');
                    if (raw) {
                      const parsed = JSON.parse(raw);
                      parsed.language = lang.voiceCode;
                      localStorage.setItem('smartsolve_chat_voice_settings', JSON.stringify(parsed));
                    }
                  } catch {}
                }}
                className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#22C55E]/15 border-[#22C55E] text-white shadow-md shadow-emerald-500/10'
                    : 'bg-[#181B20] border-[#27272A] text-zinc-300 hover:text-white hover:bg-[#20242B]'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <span className="text-2xl shrink-0">{lang.flag}</span>
                  <div className="min-w-0 truncate">
                    <div className="font-bold text-xs sm:text-sm text-white truncate">
                      {lang.nativeName}
                    </div>
                    <div className="text-[11px] text-zinc-400 truncate">
                      {lang.name} • {lang.voiceCode}
                    </div>
                  </div>
                </div>

                {isSelected ? (
                  <div className="w-6 h-6 rounded-full bg-[#22C55E] flex items-center justify-center text-white shrink-0 ml-2">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border border-zinc-700 shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-[#27272A] flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5 text-zinc-400 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-[#22C55E]" />
            <span>Updates UI labels & AI tutor responses</span>
          </div>
          <button
            type="button"
            onClick={() => setIsLanguageModalOpen(false)}
            className="px-5 py-2 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};
