import { HistoryItem, StepSolution } from '../types';

const STORAGE_KEY = 'smartsolve_history_v1';
const MAX_HISTORY = 50;

export function getHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load history', e);
    return [];
  }
}

export function saveToHistory(solution: StepSolution): HistoryItem {
  try {
    const history = getHistory();
    const newItem: HistoryItem = {
      ...solution,
      id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: Date.now(),
    };

    // Filter duplicates with exact same problem and answer if submitted consecutively
    const filtered = history.filter(
      (item) => !(item.problemStatement === newItem.problemStatement && item.finalAnswer === newItem.finalAnswer)
    );

    const updated = [newItem, ...filtered].slice(0, MAX_HISTORY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Dispatch custom event for real-time reactivity across tabs/components
    window.dispatchEvent(new Event('smartsolve_history_changed'));
    return newItem;
  } catch (e) {
    console.error('Failed to save to history', e);
    return {
      ...solution,
      id: 'hist_' + Date.now(),
      timestamp: Date.now(),
    };
  }
}

export function deleteHistoryItem(id: string): void {
  try {
    const history = getHistory().filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    window.dispatchEvent(new Event('smartsolve_history_changed'));
  } catch (e) {
    console.error('Failed to delete history item', e);
  }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event('smartsolve_history_changed'));
  } catch (e) {
    console.error('Failed to clear history', e);
  }
}
