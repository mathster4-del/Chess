import React from 'react';
import { EngineEvaluation, PieceColor } from '../types/chess';
import { StockfishEngine } from '../utils/engine';

interface EvalBarProps {
  evaluation: EngineEvaluation | null;
  orientation: PieceColor;
  visible: boolean;
  onToggle: () => void;
  className?: string;
}

export const EvalBar: React.FC<EvalBarProps> = ({
  evaluation,
  orientation,
  visible,
  onToggle,
  className = ''
}) => {
  if (!visible) {
    return null;
  }

  const score = evaluation?.score ?? 0;
  const isMate = evaluation?.isMate ?? false;
  const mateIn = evaluation?.mateIn;

  // Winning percentage for White (0% to 100%)
  const whitePercent = StockfishEngine.evalToPercentage(score, isMate, mateIn);
  const formattedScore = StockfishEngine.formatScore(score, isMate, mateIn);

  // If orientation is Black (board flipped), invert the visual display so player's color is at the bottom
  const fillPercent = orientation === 'w' ? whitePercent : 100 - whitePercent;
  const isWhiteFavored = score > 0;

  return (
    <div
      className={`relative flex flex-col justify-between items-center w-8 md:w-9 h-full min-h-[340px] md:min-h-[500px] bg-slate-900 rounded-lg overflow-hidden border border-slate-700/80 shadow-md select-none group transition-all duration-300 ${className}`}
      title="Stockfish 19 Real-Time Evaluation Bar (Click to toggle)"
    >
      {/* Black's portion (top if white orientation, bottom if black orientation) */}
      <div 
        className="w-full bg-slate-900 transition-[height] duration-500 ease-out flex flex-col justify-start items-center pt-2"
        style={{ height: `${100 - fillPercent}%` }}
      >
        {fillPercent <= 50 && (
          <span className="text-[11px] font-mono font-bold text-slate-200 tracking-tight tabular-nums px-0.5">
            {formattedScore}
          </span>
        )}
      </div>

      {/* Center 0.0 midline mark */}
      <div className="w-full h-[1px] bg-slate-600/50 shrink-0 pointer-events-none" />

      {/* White's portion (bottom if white orientation, top if black orientation) */}
      <div 
        className="w-full bg-white transition-[height] duration-500 ease-out flex flex-col justify-end items-center pb-2"
        style={{ height: `${fillPercent}%` }}
      >
        {fillPercent > 50 && (
          <span className="text-[11px] font-mono font-bold text-slate-900 tracking-tight tabular-nums px-0.5">
            {formattedScore}
          </span>
        )}
      </div>

      {/* Engine badge on hover */}
      <div className="absolute inset-x-0 bottom-0 py-1 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex justify-center items-center pointer-events-none">
        <span className="text-[9px] font-mono text-emerald-400 font-semibold tracking-wider">
          SF19
        </span>
      </div>
    </div>
  );
};
