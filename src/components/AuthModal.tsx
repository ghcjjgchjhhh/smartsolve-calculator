import React, { useEffect } from 'react';
import { X, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { AuthView } from './AuthView';

interface AuthModalProps {
  onAuthenticated?: (redirectTab: string | null) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onAuthenticated }) => {
  const {
    authModalOpen,
    closeAuthModal,
    pendingRedirectTab,
    clearPendingRedirectTab,
    user,
  } = useAuth();
  const { isDark } = useTheme();

  useEffect(() => {
    if (authModalOpen && user) {
      const targetTab = pendingRedirectTab;
      clearPendingRedirectTab();
      closeAuthModal();
      if (targetTab) {
        onAuthenticated?.(targetTab);
      }
    }
  }, [
    authModalOpen,
    user,
    pendingRedirectTab,
    clearPendingRedirectTab,
    closeAuthModal,
    onAuthenticated,
  ]);

  useEffect(() => {
    if (!authModalOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAuthModal();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [authModalOpen, closeAuthModal]);

  if (!authModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuthModal();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="SmartSolve Google Sign-In"
        className={`max-w-md w-full rounded-3xl border shadow-2xl overflow-hidden ${
          isDark
            ? 'bg-[#0E0E12] border-[#27272A] text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div
          className={`flex items-center justify-between px-5 py-4 border-b ${
            isDark ? 'bg-[#121216] border-[#27272A]' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#22C55E]/15 border border-[#22C55E]/30 flex items-center justify-center text-[#22C55E]">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold">SmartSolve Account</h2>
              <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Auth.js · Google Sign-In
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeAuthModal}
            aria-label="Close sign-in modal"
            className={`p-1.5 rounded-xl cursor-pointer transition-colors ${
              isDark
                ? 'bg-[#1C1C22] hover:bg-[#27272A] text-zinc-400 hover:text-white'
                : 'bg-slate-200/70 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6">
          <AuthView
            compact
            onSuccess={() => {
              const targetTab = pendingRedirectTab;
              clearPendingRedirectTab();
              closeAuthModal();
              if (targetTab) {
                onAuthenticated?.(targetTab);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};
