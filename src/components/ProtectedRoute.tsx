import React from 'react';
import { Lock, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { AuthView } from './AuthView';

interface ProtectedRouteProps {
  children: React.ReactNode;
  routeTitle?: string;
  routeDescription?: string;
  onBackToCalculator?: () => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  routeTitle = 'Protected Student Workspace',
  routeDescription = 'Sign in with Google to access your persistent student profile, saved study vault, and Firebase cloud workspace.',
  onBackToCalculator,
}) => {
  const { user, loading } = useAuth();
  const { isDark } = useTheme();

  if (loading) {
    return (
      <div
        className={`rounded-3xl border p-10 sm:p-14 flex flex-col items-center justify-center gap-3 text-center ${
          isDark
            ? 'bg-[#0A0A0C] border-[#27272A] text-zinc-300'
            : 'bg-white border-slate-200 text-slate-700'
        }`}
      >
        <Loader2 className="w-7 h-7 animate-spin text-[#22C55E]" />
        <p className="text-sm font-bold">Restoring your Google session...</p>
        <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
          Checking Firebase Authentication state
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-2 sm:py-4">
        <div
          className={`rounded-3xl border overflow-hidden shadow-xl grid grid-cols-1 lg:grid-cols-5 ${
            isDark
              ? 'bg-[#0E0E12] border-[#27272A] text-white'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          {/* Protected Route Info Panel */}
          <div
            className={`lg:col-span-2 p-6 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r ${
              isDark
                ? 'bg-[#121217] border-[#27272A]'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] text-xs font-extrabold">
                <Lock className="w-3.5 h-3.5" />
                <span>Protected Route</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                {routeTitle}
              </h1>

              <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                {routeDescription}
              </p>

              <ul className={`space-y-2.5 text-xs pt-2 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
                  <span>Single Firebase Google login across Profile, Cloud Sync & Study Rooms</span>
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
                  <span>Private Firestore rules scoped exclusively to your UID</span>
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
                  <span>All calculators, graphs & 3D labs remain available anytime</span>
                </li>
              </ul>
            </div>

            {onBackToCalculator && (
              <button
                type="button"
                onClick={onBackToCalculator}
                className={`mt-6 inline-flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                  isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Scientific Calculator</span>
              </button>
            )}
          </div>

          {/* Google Auth Panel */}
          <div className="lg:col-span-3 p-6 sm:p-8 flex items-center">
            <div className="w-full">
              <AuthView />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
