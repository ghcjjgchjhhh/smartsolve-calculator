import { User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { getHistory } from './historyStorage';
import { getProgressSummary, loadTutorProgress } from './tutorProgressService';
import { HistoryItem } from '../types';

export interface PinnedFormulaItem {
  id: string;
  title: string;
  subject: string;
  latex: string;
  notes?: string;
  pinnedAt: number;
}

export interface ExamGoalItem {
  id: string;
  examName: string;
  subjectFocus: string;
  targetDate: string; // YYYY-MM-DD
}

export interface SyncedWorkspaceSummary {
  displayName: string;
  pinnedCount: number;
  examGoalsCount: number;
  historyCount: number;
  tutorStats: {
    topicsCompleted: number;
    formulasPracticed: number;
    totalAnswered: number;
    overallAccuracyPct: number;
    streak: number;
  };
  syncedAt: number;
}

const PINNED_KEY = 'smartsolve_pinned_formulas_v1';
const GOALS_KEY = 'smartsolve_exam_goals_v1';
const LAST_SYNC_KEY = 'smartsolve_last_cloud_sync_v1';
const HISTORY_STORAGE_KEY = 'smartsolve_history_v1';

function emitWorkspaceEvent() {
  window.dispatchEvent(new Event('smartsolve_workspace_changed'));
}

export function getPinnedFormulas(): PinnedFormulaItem[] {
  try {
    const raw = localStorage.getItem(PINNED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function pinFormula(item: Omit<PinnedFormulaItem, 'id' | 'pinnedAt'>): PinnedFormulaItem[] {
  const existing = getPinnedFormulas();
  const deduped = existing.filter(
    (f) => !(f.title.toLowerCase() === item.title.toLowerCase() && f.latex === item.latex)
  );
  const nextItem: PinnedFormulaItem = {
    id: `pin_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title: item.title.slice(0, 120),
    subject: item.subject.slice(0, 60),
    latex: item.latex.slice(0, 500),
    notes: item.notes ? item.notes.slice(0, 240) : '',
    pinnedAt: Date.now(),
  };
  const next = [nextItem, ...deduped].slice(0, 40);
  localStorage.setItem(PINNED_KEY, JSON.stringify(next));
  emitWorkspaceEvent();
  return next;
}

export function unpinFormula(id: string): PinnedFormulaItem[] {
  const next = getPinnedFormulas().filter((f) => f.id !== id);
  localStorage.setItem(PINNED_KEY, JSON.stringify(next));
  emitWorkspaceEvent();
  return next;
}

export function getExamGoals(): ExamGoalItem[] {
  try {
    const raw = localStorage.getItem(GOALS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addExamGoal(goal: Omit<ExamGoalItem, 'id'>): ExamGoalItem[] {
  const existing = getExamGoals();
  const nextItem: ExamGoalItem = {
    id: `goal_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    examName: goal.examName.trim().slice(0, 80),
    subjectFocus: goal.subjectFocus.trim().slice(0, 80),
    targetDate: goal.targetDate,
  };
  const next = [nextItem, ...existing].slice(0, 10);
  localStorage.setItem(GOALS_KEY, JSON.stringify(next));
  emitWorkspaceEvent();
  return next;
}

export function removeExamGoal(id: string): ExamGoalItem[] {
  const next = getExamGoals().filter((g) => g.id !== id);
  localStorage.setItem(GOALS_KEY, JSON.stringify(next));
  emitWorkspaceEvent();
  return next;
}

export function getLastSyncTimestamp(): number | null {
  try {
    const raw = localStorage.getItem(LAST_SYNC_KEY);
    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
}

export async function syncWorkspaceToCloud(user: User): Promise<SyncedWorkspaceSummary> {
  const path = `user_workspaces/${user.uid}`;
  const ref = doc(db, 'user_workspaces', user.uid);

  const pinnedFormulas = getPinnedFormulas()
    .slice(0, 40)
    .map((p) => ({
      id: String(p.id).slice(0, 64),
      title: String(p.title).slice(0, 120),
      subject: String(p.subject).slice(0, 60),
      latex: String(p.latex).slice(0, 500),
      notes: String(p.notes || '').slice(0, 240),
      pinnedAt: Number(p.pinnedAt) || Date.now(),
    }));

  const examGoals = getExamGoals()
    .slice(0, 10)
    .map((g) => ({
      id: String(g.id).slice(0, 64),
      examName: String(g.examName).slice(0, 80),
      subjectFocus: String(g.subjectFocus).slice(0, 80),
      targetDate: String(g.targetDate).slice(0, 20),
    }));

  const rawHistory = getHistory().slice(0, 50);
  const recentHistory = rawHistory.map((h) => ({
    id: String(h.id).slice(0, 80),
    title: String(h.title || h.problemStatement || 'Calculation').slice(0, 120),
    problemStatement: String(h.problemStatement || '').slice(0, 280),
    formula: String(h.formula || '').slice(0, 200),
    substitution: String(h.substitution || '').slice(0, 200),
    finalAnswer: String(h.finalAnswer || '').slice(0, 200),
    category: String(h.category || 'Math').slice(0, 60),
    timestamp: Number(h.timestamp) || Date.now(),
  }));

  const progress = loadTutorProgress();
  const summary = getProgressSummary(progress);
  const tutorStats = {
    topicsCompleted: Number(summary.topicsCompletedCount) || 0,
    formulasPracticed: Number(summary.formulasPracticedCount) || 0,
    totalAnswered: Number(summary.totalAnswered) || 0,
    overallAccuracyPct: Number(summary.overallAccuracyPct) || 0,
    streak: Number(progress.streak) || 0,
  };

  const displayName = (user.displayName || 'Student').slice(0, 90);

  try {
    const existingSnap = await getDoc(ref);
    if (!existingSnap.exists()) {
      await setDoc(ref, {
        ownerId: user.uid,
        displayName,
        pinnedFormulas,
        examGoals,
        recentHistory,
        tutorStats,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        displayName,
        pinnedFormulas,
        examGoals,
        recentHistory,
        tutorStats,
        updatedAt: serverTimestamp(),
      });
    }

    const now = Date.now();
    localStorage.setItem(LAST_SYNC_KEY, String(now));
    emitWorkspaceEvent();

    return {
      displayName,
      pinnedCount: pinnedFormulas.length,
      examGoalsCount: examGoals.length,
      historyCount: recentHistory.length,
      tutorStats,
      syncedAt: now,
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

export async function restoreWorkspaceFromCloud(user: User): Promise<{
  found: boolean;
  pinnedCount: number;
  examGoalsCount: number;
  historyCount: number;
}> {
  const path = `user_workspaces/${user.uid}`;
  const ref = doc(db, 'user_workspaces', user.uid);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return { found: false, pinnedCount: 0, examGoalsCount: 0, historyCount: 0 };
    }
    const data = snap.data() as any;

    if (Array.isArray(data.pinnedFormulas)) {
      const localPins = getPinnedFormulas();
      const mergedPins = [...data.pinnedFormulas];
      localPins.forEach((lp) => {
        if (!mergedPins.some((mp: any) => mp.title === lp.title && mp.latex === lp.latex)) {
          mergedPins.push(lp);
        }
      });
      localStorage.setItem(PINNED_KEY, JSON.stringify(mergedPins.slice(0, 40)));
    }

    if (Array.isArray(data.examGoals)) {
      const localGoals = getExamGoals();
      const mergedGoals = [...data.examGoals];
      localGoals.forEach((lg) => {
        if (!mergedGoals.some((mg: any) => mg.examName === lg.examName && mg.targetDate === lg.targetDate)) {
          mergedGoals.push(lg);
        }
      });
      localStorage.setItem(GOALS_KEY, JSON.stringify(mergedGoals.slice(0, 10)));
    }

    if (Array.isArray(data.recentHistory)) {
      const localHist = getHistory();
      const mergedHist: HistoryItem[] = [...localHist];
      data.recentHistory.forEach((rh: any) => {
        if (
          !mergedHist.some(
            (lh) => lh.problemStatement === rh.problemStatement && lh.finalAnswer === rh.finalAnswer
          )
        ) {
          mergedHist.push({
            id: rh.id || `hist_${Date.now()}`,
            title: rh.title || rh.problemStatement || 'Synced Calculation',
            problemStatement: rh.problemStatement || '',
            formula: rh.formula || '',
            substitution: rh.substitution || '',
            finalAnswer: rh.finalAnswer || '',
            category: rh.category || 'Math',
            steps: [],
            timestamp: Number(rh.timestamp) || Date.now(),
          });
        }
      });
      mergedHist.sort((a, b) => b.timestamp - a.timestamp);
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(mergedHist.slice(0, 50)));
      window.dispatchEvent(new Event('smartsolve_history_changed'));
    }

    const now = Date.now();
    localStorage.setItem(LAST_SYNC_KEY, String(now));
    emitWorkspaceEvent();

    return {
      found: true,
      pinnedCount: getPinnedFormulas().length,
      examGoalsCount: getExamGoals().length,
      historyCount: getHistory().length,
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    throw err;
  }
}
