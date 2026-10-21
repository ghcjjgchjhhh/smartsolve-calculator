import React, { useState, useEffect } from 'react';
import { HistoryItem } from '../types';
import { getHistory, deleteHistoryItem, clearHistory } from '../services/historyStorage';
import { StepSolutionCard } from './StepSolutionCard';
import {
  History,
  Trash2,
  X,
  ExternalLink,
  ChevronRight,
  Clock,
  BookOpen,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectSolution?: (item: HistoryItem) => void;
}

export const HistoryDrawer: React.FC<Props> = ({ isOpen, onClose, onSelectSolution }) => {
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [activeItem, setActiveItem] = useState<HistoryItem | null>(null);

  const loadItems = () => {
    setHistoryList(getHistory());
  };

  useEffect(() => {
    loadItems();
    window.addEventListener('smartsolve_history_changed', loadItems);
    return () => {
      window.removeEventListener('smartsolve_history_changed', loadItems);
    };
  }, []);

  if (!isOpen) return null;

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + d.toLocaleDateString();
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear your calculation history?')) {
      clearHistory();
      setActiveItem(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-lg bg-white dark:bg-black h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-zinc-800 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">Calculation History</h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-900 text-xs font-bold text-slate-600 dark:text-slate-400">
              {historyList.length}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {historyList.length > 0 && (
              <button
                onClick={handleClearAll}
                title="Clear All History"
                className="p-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-rose-500 hover:text-rose-600"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {historyList.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
              <Clock className="w-10 h-10 opacity-30" />
              <p className="text-sm font-semibold">No calculation history yet</p>
              <p className="text-xs max-w-xs text-slate-500">
                Calculations from Mathematics, Physics, Scientific, and Smart Input are automatically saved here.
              </p>
            </div>
          ) : (
            historyList.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/40 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all space-y-2 group"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
                    {item.category}
                  </span>
                  <span className="text-[11px] text-slate-400">{formatDate(item.timestamp)}</span>
                </div>

                <div className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-1">
                  {item.title}
                </div>

                {item.problemStatement && (
                  <div className="text-xs font-mono text-slate-600 dark:text-slate-400 line-clamp-1">
                    {item.problemStatement}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <div className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    = {item.finalAnswer} {item.unit || ''}
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setActiveItem(item)}
                      className="px-2.5 py-1 rounded bg-emerald-500/20 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-500/30"
                    >
                      View Steps
                    </button>
                    <button
                      onClick={() => deleteHistoryItem(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal for viewing selected historic item */}
        {activeItem && (
          <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4">
            <div className="max-w-xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => setActiveItem(null)}
                  className="p-1.5 bg-white/20 text-white rounded-full hover:bg-white/30"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <StepSolutionCard solution={activeItem} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
