import React, { useRef, useEffect } from 'react';
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, Copy, Check, RotateCcw } from 'lucide-react';
import { MoveAnalysis, MoveClassification } from '../types/chess';

interface MoveHistoryProps {
  history: string[]; // SAN list: ['e4', 'e5', 'Nf3', ...]
  currentMoveIndex: number; // -1 for start, 0 for 1st ply, etc.
  onSelectMove: (index: number) => void;
  analysisMoves?: MoveAnalysis[];
  className?: string;
}

const CLASSIFICATION_BADGES: Record<MoveClassification, { label: string; bg: string; text: string }> = {
  brilliant: { label: '!!', bg: 'bg-cyan-500/20 border-cyan-500/50', text: 'text-cyan-300' },
  great: { label: '!', bg: 'bg-blue-500/20 border-blue-500/50', text: 'text-blue-300' },
  best: { label: '★', bg: 'bg-emerald-500/20 border-emerald-500/50', text: 'text-emerald-300' },
  good: { label: '✓', bg: 'bg-slate-700/40 border-slate-600/40', text: 'text-slate-300' },
  inaccuracy: { label: '?!', bg: 'bg-amber-500/20 border-amber-500/50', text: 'text-amber-300' },
  mistake: { label: '?', bg: 'bg-orange-500/20 border-orange-500/50', text: 'text-orange-300' },
  blunder: { label: '??', bg: 'bg-rose-500/20 border-rose-500/50', text: 'text-rose-300' },
  book: { label: '📖', bg: 'bg-indigo-500/20 border-indigo-500/50', text: 'text-indigo-300' }
};

export const MoveHistory: React.FC<MoveHistoryProps> = ({
  history,
  currentMoveIndex,
  onSelectMove,
  analysisMoves,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Group plies into move pairs: [ { num: 1, white: 'e4', whiteIdx: 0, black: 'e5', blackIdx: 1 }, ... ]
  const movePairs = [];
  for (let i = 0; i < history.length; i += 2) {
    movePairs.push({
      num: Math.floor(i / 2) + 1,
      white: history[i],
      whiteIdx: i,
      black: history[i + 1] || null,
      blackIdx: i + 1 < history.length ? i + 1 : null
    });
  }

  // Auto-scroll to active move
  useEffect(() => {
    if (containerRef.current) {
      const activeEl = containerRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [currentMoveIndex]);

  return (
    <div className={`flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden ${className}`}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/90 border-b border-slate-800">
        <span className="text-xs font-semibold text-slate-300">Move History</span>
        <span className="text-[11px] font-mono text-slate-400">
          {history.length > 0 ? `${Math.ceil(history.length / 2)} moves` : 'Game not started'}
        </span>
      </div>

      {/* Scrollable Move Table */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto max-h-[220px] md:max-h-[280px] p-2 space-y-0.5 text-xs font-mono"
      >
        {movePairs.length === 0 ? (
          <div className="h-28 flex items-center justify-center text-slate-400 text-xs italic">
            Play a move or import a game to begin
          </div>
        ) : (
          movePairs.map((pair) => {
            const whiteAnalysis = analysisMoves ? analysisMoves[pair.whiteIdx] : undefined;
            const blackAnalysis = pair.blackIdx !== null && analysisMoves ? analysisMoves[pair.blackIdx] : undefined;

            return (
              <div
                key={pair.num}
                className="grid grid-cols-[36px_1fr_1fr] items-center rounded hover:bg-slate-800/40 px-1 py-1 transition-colors"
              >
                {/* Move Number */}
                <span className="text-slate-400 font-semibold text-[11px]">
                  {pair.num}.
                </span>

                {/* White Move */}
                <button
                  onClick={() => onSelectMove(pair.whiteIdx)}
                  data-active={currentMoveIndex === pair.whiteIdx}
                  className={`flex items-center justify-between px-2 py-1 rounded text-left transition-colors ${
                    currentMoveIndex === pair.whiteIdx
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <span>{pair.white}</span>
                  {whiteAnalysis && (
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded border font-bold ${
                        CLASSIFICATION_BADGES[whiteAnalysis.classification].bg
                      } ${CLASSIFICATION_BADGES[whiteAnalysis.classification].text}`}
                      title={`${whiteAnalysis.classification.toUpperCase()}: ${whiteAnalysis.explanation || ''}`}
                    >
                      {CLASSIFICATION_BADGES[whiteAnalysis.classification].label}
                    </span>
                  )}
                </button>

                {/* Black Move */}
                {pair.black ? (
                  <button
                    onClick={() => onSelectMove(pair.blackIdx!)}
                    data-active={currentMoveIndex === pair.blackIdx}
                    className={`flex items-center justify-between px-2 py-1 rounded text-left transition-colors ${
                      currentMoveIndex === pair.blackIdx
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span>{pair.black}</span>
                    {blackAnalysis && (
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded border font-bold ${
                          CLASSIFICATION_BADGES[blackAnalysis.classification].bg
                        } ${CLASSIFICATION_BADGES[blackAnalysis.classification].text}`}
                        title={`${blackAnalysis.classification.toUpperCase()}: ${blackAnalysis.explanation || ''}`}
                      >
                        {CLASSIFICATION_BADGES[blackAnalysis.classification].label}
                      </span>
                    )}
                  </button>
                ) : (
                  <div />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Navigation Controls Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-t border-slate-800">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onSelectMove(-1)}
            disabled={currentMoveIndex <= -1}
            title="Start of game"
            className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300 transition-colors"
          >
            <ChevronFirst className="w-4 h-4" />
          </button>
          <button
            onClick={() => onSelectMove(Math.max(-1, currentMoveIndex - 1))}
            disabled={currentMoveIndex <= -1}
            title="Previous move"
            className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onSelectMove(Math.min(history.length - 1, currentMoveIndex + 1))}
            disabled={currentMoveIndex >= history.length - 1}
            title="Next move"
            className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onSelectMove(history.length - 1)}
            disabled={currentMoveIndex >= history.length - 1}
            title="Latest move"
            className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300 transition-colors"
          >
            <ChevronLast className="w-4 h-4" />
          </button>
        </div>

        <div className="text-[11px] font-mono text-slate-400">
          {currentMoveIndex >= 0 ? `Ply ${currentMoveIndex + 1}/${history.length}` : 'Start'}
        </div>
      </div>
    </div>
  );
};
