import React, { useState } from 'react';
import {
  Loader2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  Cloud,
  Users,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface AuthViewProps {
  onSuccess?: () => void;
  compact?: boolean;
}

const GoogleIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
    />
  </svg>
);

export const AuthView: React.FC<AuthViewProps> = ({
  onSuccess,
  compact = false,
}) => {
  const { signInWithGoogle } = useAuth();
  const { isDark } = useTheme();

  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setGoogleSubmitting(true);
    const { error } = await signInWithGoogle();
    setGoogleSubmitting(false);

    if (error) {
      setErrorMsg(error);
      return;
    }

    onSuccess?.();
  };

  return (
    <div className={compact ? 'space-y-4' : 'space-y-5'}>
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#22C55E]/15 text-[#22C55E] text-[11px] font-extrabold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Firebase Google Sign-In</span>
        </div>
        <h2 className="text-lg sm:text-xl font-black tracking-tight">
          Sign in to SmartSolve with Google
        </h2>
        <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
          One Google sign-in unlocks your Student Profile, Private Cloud Vault, Cross-Device Cloud Sync, and Collaborative Study Rooms.
        </p>
      </div>

      {!compact && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div
            className={`p-3 rounded-2xl border flex items-start gap-2.5 ${
              isDark ? 'bg-[#141418] border-[#27272A]' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <Cloud className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold">Private Cloud Vault</div>
              <div className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Save formulas, notes & goals to Firestore
              </div>
            </div>
          </div>
          <div
            className={`p-3 rounded-2xl border flex items-start gap-2.5 ${
              isDark ? 'bg-[#141418] border-[#27272A]' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <Users className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold">Live Study Rooms</div>
              <div className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Collaborate on whiteboards & quizzes
              </div>
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 leading-relaxed ${
            isDark
              ? 'bg-red-500/10 border-red-500/30 text-red-200'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={googleSubmitting}
        className={`w-full py-3.5 px-5 rounded-2xl border font-extrabold text-sm flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-60 active:scale-[0.99] ${
          isDark
            ? 'bg-white hover:bg-zinc-100 text-slate-900 border-white shadow-lg'
            : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900 shadow-lg'
        }`}
      >
        {googleSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon />}
        <span>{googleSubmitting ? 'Connecting to Google...' : 'Continue with Google'}</span>
      </button>

      <div
        className={`flex items-center justify-center gap-1.5 text-[11px] pt-1 ${
          isDark ? 'text-zinc-500' : 'text-slate-400'
        }`}
      >
        <ShieldCheck className="w-3.5 h-3.5 text-[#22C55E]" />
        <span>Secured by Firebase Authentication & Firestore Rules</span>
      </div>
    </div>
  );
};
