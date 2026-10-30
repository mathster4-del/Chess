import React from 'react';
import { Sparkles, Eye, EyeOff, Cpu, ArrowUpRight, Zap } from 'lucide-react';
import { EngineEvaluation } from '../types/chess';
import { StockfishEngine } from '../utils/engine';

interface EnginePanelProps {
  evaluation: EngineEvaluation | null;
  evalBarVisible: boolean;
  onToggleEvalBar: () => void;
  showBestMoveArrow: boolean;
  onToggleBestMoveArrow: () => void;
  onApplyBestMove?: () => void;
  isThinking?: boolean;
  className?: string;
}

export const EnginePanel: React.FC<EnginePanelProps> = ({
  evaluation,
  evalBarVisible,
  onToggleEvalBar,
  showBestMoveArrow,
  onToggleBestMoveArrow,
  onApplyBestMove,
  isThinking = false,
  className = ''
}) => {
  const score = evaluation?.score ?? 0;
  const isMate = evaluation?.isMate ?? false;
  const mateIn = evaluation?.mateIn;
  const formattedScore = StockfishEngine.formatScore(score, isMate, mateIn);
  const depth = evaluation?.depth || 14;
  const bestMove = evaluation?.bestMove;
  const pv = evaluation?.pv || [];

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-3 ${className}`}>
      {/* Header with Engine label & controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-100 tracking-tight">Stockfish 19 Engine</span>
              <span className="text-[10px] font-mono text-emerald-400 font-semibold px-1 py-0.5 rounded bg-emerald-500/10">
                Depth {depth}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {evaluation?.source === 'stockfish19-cloud' ? 'Grandmaster Cloud Analysis' : 'Local Deep Search'}
            </span>
          </div>
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleEvalBar}
            className={`px-2 py-1 text-xs font-mono rounded flex items-center gap-1 border transition-colors ${
              evalBarVisible
                ? 'bg-slate-800 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Evaluation Bar"
          >
            {evalBarVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Eval Bar</span>
          </button>

          <button
            onClick={onToggleBestMoveArrow}
            className={`px-2 py-1 text-xs font-mono rounded flex items-center gap-1 border transition-colors ${
              showBestMoveArrow
                ? 'bg-slate-800 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Best Move Arrow on Board"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Best Move</span>
          </button>
        </div>
      </div>

      {/* Main Stats row */}
      <div className="grid grid-cols-2 gap-2">
        {/* Score */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-2.5 flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-400">Evaluation</span>
          <span className="text-base font-mono font-bold text-slate-100 tabular-nums">
            {isThinking ? '...' : formattedScore}
          </span>
        </div>

        {/* Top Move */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-2.5 flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-400">Best Move</span>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-mono font-bold text-emerald-400">
              {bestMove?.san || (bestMove ? `${bestMove.from}-${bestMove.to}` : 'None')}
            </span>
            {bestMove && onApplyBestMove && (
              <button
                onClick={onApplyBestMove}
                title="Play this best move"
                className="p-1 rounded bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600 hover:text-white transition-colors"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Continuation / PV Line */}
      {pv.length > 0 && (
        <div className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-2 text-[11px] font-mono text-slate-400">
          <span className="text-slate-400 font-semibold mr-1.5">Line:</span>
          <span className="text-slate-300">{pv.join(' ')}</span>
        </div>
      )}
    </div>
  );
};
