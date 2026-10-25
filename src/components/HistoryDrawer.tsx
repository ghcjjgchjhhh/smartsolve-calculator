import React, { useState, useEffect } from 'react';
import { HistoryItem } from '../types';
import { getHistory, deleteHistoryItem, clearHistory } from '../services/historyStorage';
import { StepSolutionCard } from './StepSolutionCard';
import {
  History,
  Trash2,
  X,
  Clock,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectSolution?: (item: HistoryItem) => void;
}

export const HistoryDrawer: React.FC<Props> = ({ isOpen, onClose }) => {
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
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-lg bg-[#0A0A0A] h-full shadow-2xl flex flex-col border-l border-[#27272A] animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#27272A] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-[#22C55E]" />
            <h3 className="font-bold text-[#FFFFFF] text-lg">Calculation History</h3>
            <span className="px-2 py-0.5 rounded-full bg-[#18181B] text-xs font-bold text-[#A1A1AA]">
              {historyList.length}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {historyList.length > 0 && (
              <button
                onClick={handleClearAll}
                title="Clear All History"
                className="p-2 hover:bg-[#EF4444]/20 rounded-lg text-[#EF4444] transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#18181B] rounded-lg text-[#A1A1AA] hover:text-[#FFFFFF] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {historyList.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-[#A1A1AA] space-y-2">
              <Clock className="w-10 h-10 opacity-30" />
              <p className="text-sm font-semibold text-[#FFFFFF]">No calculation history yet</p>
              <p className="text-xs max-w-xs text-[#A1A1AA]">
                Calculations from Mathematics, Physics, Scientific, and Smart Input are automatically saved here.
              </p>
            </div>
          ) : (
            historyList.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-[#27272A] bg-[#000000] hover:border-[#22C55E]/60 transition-all space-y-2 group"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-[#22C55E]">
                    {item.category}
                  </span>
                  <span className="text-[11px] text-[#A1A1AA]">{formatDate(item.timestamp)}</span>
                </div>

                <div className="font-semibold text-sm text-[#FFFFFF] line-clamp-1">
                  {item.title}
                </div>

                {item.problemStatement && (
                  <div className="text-xs font-mono text-[#A1A1AA] line-clamp-1">
                    {item.problemStatement}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <div className="font-mono text-sm font-bold text-[#22C55E]">
                    = {item.finalAnswer} {item.unit || ''}
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setActiveItem(item)}
                      className="px-2.5 py-1 rounded bg-[#18181B] text-[#FFFFFF] text-xs font-semibold hover:bg-[#22C55E] hover:text-white transition-all cursor-pointer"
                    >
                      View Steps
                    </button>
                    <button
                      onClick={() => deleteHistoryItem(item.id)}
                      className="p-1 text-[#A1A1AA] hover:text-[#EF4444] rounded cursor-pointer"
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
          <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
            <div className="max-w-xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => setActiveItem(null)}
                  className="p-1.5 bg-[#18181B] text-[#FFFFFF] rounded-full hover:bg-[#22C55E] cursor-pointer"
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
