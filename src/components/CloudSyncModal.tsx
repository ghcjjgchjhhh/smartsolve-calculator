import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  Cloud,
  CloudUpload,
  CloudDownload,
  LogIn,
  LogOut,
  X,
  Pin,
  Trash2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
} from 'lucide-react';
import { auth, signInWithGoogle, signOutUser } from '../firebase';
import {
  addExamGoal,
  ExamGoalItem,
  getExamGoals,
  getLastSyncTimestamp,
  getPinnedFormulas,
  PinnedFormulaItem,
  removeExamGoal,
  restoreWorkspaceFromCloud,
  syncWorkspaceToCloud,
  unpinFormula,
} from '../services/cloudSyncService';
import { getHistory } from '../services/historyStorage';
import { getProgressSummary, loadTutorProgress } from '../services/tutorProgressService';
import { MathRenderer } from './MathRenderer';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function getDaysRemaining(targetDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(targetDate + 'T00:00:00');
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export const CloudSyncModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [user, setUser] = useState<User | null>(null);
  const [pinned, setPinned] = useState<PinnedFormulaItem[]>(() => getPinnedFormulas());
  const [goals, setGoals] = useState<ExamGoalItem[]>(() => getExamGoals());
  const [lastSync, setLastSync] = useState<number | null>(() => getLastSyncTimestamp());
  const [busy, setBusy] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Exam Countdown form
  const [examName, setExamName] = useState<string>('');
  const [subjectFocus, setSubjectFocus] = useState<string>('Mathematics, Physics & Chemistry');
  const [targetDate, setTargetDate] = useState<string>('');

  const refreshLocal = () => {
    setPinned(getPinnedFormulas());
    setGoals(getExamGoals());
    setLastSync(getLastSyncTimestamp());
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    const onWorkspace = () => refreshLocal();
    window.addEventListener('smartsolve_workspace_changed', onWorkspace);
    return () => {
      unsub();
      window.removeEventListener('smartsolve_workspace_changed', onWorkspace);
    };
  }, []);

  if (!isOpen) return null;

  const historyCount = getHistory().length;
  const tutorSummary = getProgressSummary(loadTutorProgress());

  const handleSignIn = async () => {
    setErrorMsg('');
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Google Sign-In failed or was cancelled.');
    }
  };

  const handlePushSync = async () => {
    if (!user || busy) return;
    setBusy(true);
    setStatusMsg('');
    setErrorMsg('');
    try {
      const res = await syncWorkspaceToCloud(user);
      setLastSync(res.syncedAt);
      setStatusMsg(
        `Synced ${res.pinnedCount} pinned formulas, ${res.examGoalsCount} exam countdowns & ${res.historyCount} history entries to your cloud workspace.`
      );
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to push workspace to cloud.');
    } finally {
      setBusy(false);
    }
  };

  const handleRestoreSync = async () => {
    if (!user || busy) return;
    setBusy(true);
    setStatusMsg('');
    setErrorMsg('');
    try {
      const res = await restoreWorkspaceFromCloud(user);
      if (!res.found) {
        setStatusMsg('No cloud backup found yet — click Push Sync first to back up this device.');
      } else {
        refreshLocal();
        setStatusMsg(
          `Restored & merged ${res.pinnedCount} pinned formulas, ${res.examGoalsCount} exam countdowns & ${res.historyCount} history items.`
        );
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to restore from cloud.');
    } finally {
      setBusy(false);
    }
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examName.trim() || !targetDate) return;
    setGoals(addExamGoal({ examName, subjectFocus, targetDate }));
    setExamName('');
    setTargetDate('');
  };

  return (
    <div className="fixed inset-0 z-[1150] overflow-y-auto bg-black/80 backdrop-blur-sm p-4 flex items-start sm:items-center justify-center">
      <div className="bg-white dark:bg-[#0D0D11] border border-slate-200 dark:border-[#27272A] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-[#27272A] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#22C55E]/15 border border-[#22C55E]/30 flex items-center justify-center text-[#22C55E]">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Cloud Workspace Sync, Pinned Formulas & Exam Radar
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#A1A1AA]">
                Back up & sync pinned formulas, exam countdowns, solved history & mastery across your devices.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#18181B] text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[78vh] overflow-y-auto">
          {/* Cloud Auth & Sync Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#121216] p-4 space-y-3">
            {!user ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-600 dark:text-zinc-300">
                  Sign in with Google to encrypt & sync your formulas, history, and exam countdowns privately to Firestore.
                </div>
                <button
                  type="button"
                  onClick={handleSignIn}
                  className="px-4 py-2 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In with Google</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs">
                    <span className="text-slate-500 dark:text-zinc-400">Signed in as </span>
                    <strong className="text-slate-900 dark:text-white">{user.displayName || 'Student'}</strong>
                    {lastSync && (
                      <span className="ml-2 text-[11px] text-[#22C55E]">
                        · Last synced {new Date(lastSync).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => signOutUser()}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#27272A] text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Sign Out</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="rounded-xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-2.5">
                    <div className="text-base font-bold text-[#22C55E]">{pinned.length}</div>
                    <div className="text-[11px] text-slate-500">Pinned Formulas</div>
                  </div>
                  <div className="rounded-xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-2.5">
                    <div className="text-base font-bold text-slate-900 dark:text-white">{goals.length}</div>
                    <div className="text-[11px] text-slate-500">Exam Countdowns</div>
                  </div>
                  <div className="rounded-xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-2.5">
                    <div className="text-base font-bold text-slate-900 dark:text-white">{historyCount}</div>
                    <div className="text-[11px] text-slate-500">Solved History</div>
                  </div>
                  <div className="rounded-xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-2.5">
                    <div className="text-base font-bold text-[#22C55E]">{tutorSummary.overallAccuracyPct}%</div>
                    <div className="text-[11px] text-slate-500">Tutor Accuracy</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handlePushSync}
                    disabled={busy}
                    className="flex-1 min-w-[140px] py-2 px-3 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CloudUpload className="w-3.5 h-3.5" />}
                    <span>Push Sync to Cloud</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRestoreSync}
                    disabled={busy}
                    className="flex-1 min-w-[140px] py-2 px-3 rounded-xl border border-slate-200 dark:border-[#27272A] hover:bg-slate-100 dark:hover:bg-[#18181B] disabled:opacity-50 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CloudDownload className="w-3.5 h-3.5 text-[#22C55E]" />
                    <span>Restore & Merge from Cloud</span>
                  </button>
                </div>
              </div>
            )}

            {statusMsg && (
              <div className="p-2.5 rounded-xl bg-[#22C55E]/15 border border-[#22C55E]/30 text-xs text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0" />
                <span>{statusMsg}</span>
              </div>
            )}
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-500 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Exam Countdown Tracker */}
          <div className="rounded-2xl border border-slate-200 dark:border-[#27272A] p-4 space-y-3">
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#22C55E]" />
              <span>Exam Countdown Targets ({goals.length}/10)</span>
            </div>

            <form onSubmit={handleAddGoal} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <input
                type="text"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="Exam title (e.g. JAMB UTME, WAEC, CHM 101)"
                className="sm:col-span-5 rounded-xl border border-slate-200 dark:border-[#27272A] px-3 py-2 text-xs"
                required
              />
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="sm:col-span-4 rounded-xl border border-slate-200 dark:border-[#27272A] px-3 py-2 text-xs"
                required
              />
              <button
                type="submit"
                className="sm:col-span-3 py-2 px-3 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Date</span>
              </button>
            </form>

            {goals.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {goals.map((g) => {
                  const days = getDaysRemaining(g.targetDate);
                  return (
                    <div
                      key={g.id}
                      className="rounded-xl border border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#121216] p-3 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{g.examName}</div>
                        <div className="text-[11px] text-slate-500">{g.targetDate}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-xs font-bold tabular-nums px-2 py-0.5 rounded-lg ${
                            days >= 0 ? 'bg-[#22C55E]/15 text-[#22C55E]' : 'bg-slate-200 dark:bg-[#27272A] text-slate-500'
                          }`}
                        >
                          {days > 0 ? `${days}d left` : days === 0 ? 'Today!' : 'Completed'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setGoals(removeExamGoal(g.id))}
                          className="text-slate-400 hover:text-rose-500 cursor-pointer"
                          title="Remove countdown"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pinned Formulas */}
          <div className="rounded-2xl border border-slate-200 dark:border-[#27272A] p-4 space-y-3">
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Pin className="w-4 h-4 text-[#22C55E]" />
              <span>Pinned Formulas & Derivations ({pinned.length}/40)</span>
            </div>

            {pinned.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">
                No formulas pinned yet. Pin results from the Calculus Lab or Formula Explorer to keep them synced across devices.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {pinned.map((f) => (
                  <div
                    key={f.id}
                    className="rounded-xl border border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#121216] p-3 flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {f.title} · <span className="text-[#22C55E]">{f.subject}</span>
                      </div>
                      <div className="overflow-x-auto text-xs">
                        <MathRenderer content={`$$${f.latex.replace(/^\$\$|\$\$$/g, '')}$$`} />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPinned(unpinFormula(f.id))}
                      className="text-slate-400 hover:text-rose-500 cursor-pointer shrink-0"
                      title="Unpin"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
