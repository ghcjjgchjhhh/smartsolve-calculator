import React, { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

type CurtainPhase = 'closing' | 'opening' | 'done';

export const AppOpeningCurtain: React.FC = () => {
  const { isDark } = useTheme();
  const [phase, setPhase] = useState<CurtainPhase>('closing');

  useEffect(() => {
    // Hand off seamlessly from the static HTML pre-boot splash if present
    try {
      const bootEl = document.getElementById('smartsolve-boot-splash');
      if (bootEl && bootEl.parentNode) {
        bootEl.parentNode.removeChild(bootEl);
      }
    } catch {
      // ignore
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      const quickTimer = window.setTimeout(() => setPhase('done'), 90);
      return () => window.clearTimeout(quickTimer);
    }

    // Brief close/lock beat so the seam completes, then split open smoothly
    const openTimer = window.setTimeout(() => {
      setPhase('opening');
    }, 240);

    const doneTimer = window.setTimeout(() => {
      setPhase('done');
    }, 760);

    return () => {
      window.clearTimeout(openTimer);
      window.clearTimeout(doneTimer);
    };
  }, []);

  if (phase === 'done') return null;

  const isOpening = phase === 'opening';
  const surfaceBg = isDark ? 'bg-[#000000]' : 'bg-[#F8FAFC]';
  const borderCol = isDark ? 'border-[#27272A]' : 'border-slate-200';
  const titleCol = isDark ? 'text-white' : 'text-slate-900';
  const subCol = isDark ? 'text-[#A1A1AA]' : 'text-slate-500';

  return (
    <div
      role="presentation"
      aria-hidden="true"
      onClick={() => setPhase('done')}
      className={`fixed inset-0 z-[9999] overflow-hidden select-none ${
        isOpening ? 'pointer-events-none' : 'cursor-pointer'
      }`}
    >
      {/* Top Shutter Panel */}
      <div
        className={`absolute inset-x-0 top-0 h-1/2 ${surfaceBg} border-b ${borderCol} will-change-transform transition-transform duration-[480ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isOpening ? '-translate-y-full' : 'translate-y-0'
        }`}
      />

      {/* Bottom Shutter Panel */}
      <div
        className={`absolute inset-x-0 bottom-0 h-1/2 ${surfaceBg} border-t ${borderCol} will-change-transform transition-transform duration-[480ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isOpening ? 'translate-y-full' : 'translate-y-0'
        }`}
      />

      {/* Precision Center Split Seam */}
      <div
        className={`absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-transparent via-[#22C55E] to-transparent transition-opacity duration-200 animate-curtainSeam ${
          isOpening ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* Centered SmartSolve Emblem */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-300 ease-out ${
          isOpening ? 'opacity-0 scale-110' : 'opacity-100 scale-100 animate-curtainBadge'
        }`}
      >
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-xl shadow-emerald-500/20 mb-3 ${
            isDark
              ? 'bg-[#0A0A0C] border-[#22C55E]/40'
              : 'bg-white border-emerald-500/40'
          }`}
        >
          <span className="font-mono text-2xl font-extrabold text-[#22C55E] tracking-tight">
            √x
          </span>
        </div>
        <div className={`text-lg font-extrabold tracking-tight ${titleCol}`}>
          Smart<span className="text-[#22C55E]">Solve</span>
        </div>
        <div className={`text-[11px] font-medium mt-1 ${subCol}`}>
          Math, Physics &amp; AI Studio
        </div>
      </div>
    </div>
  );
};
