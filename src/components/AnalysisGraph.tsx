import React from 'react';
import { PieceColor } from '../types/chess';
import { StockfishEngine } from '../utils/engine';

interface AnalysisGraphProps {
  timeline: { moveIndex: number; san: string; eval: number; color: PieceColor }[];
  currentMoveIndex: number;
  onSelectMove: (index: number) => void;
  className?: string;
}

export const AnalysisGraph: React.FC<AnalysisGraphProps> = ({
  timeline,
  currentMoveIndex,
  onSelectMove,
  className = ''
}) => {
  if (!timeline || timeline.length <= 1) {
    return null;
  }

  const height = 90;
  const width = 600;
  const midY = height / 2;

  // Clamp evaluation between -800 and +800 centipawns for graph display
  const clampEval = (cp: number) => {
    return Math.max(-800, Math.min(800, cp));
  };

  const getY = (cp: number) => {
    const clamped = clampEval(cp);
    // Score > 0 is White advantage (drawn higher, so lower Y)
    // Scale: +800 -> 10, 0 -> midY, -800 -> height - 10
    const ratio = clamped / 800; // -1 to +1
    return midY - ratio * (midY - 10);
  };

  const getX = (index: number) => {
    return (index / (timeline.length - 1)) * width;
  };

  // Build SVG path
  let pathD = `M 0,${getY(timeline[0].eval)}`;
  for (let i = 1; i < timeline.length; i++) {
    const x = getX(i);
    const y = getY(timeline[i].eval);
    pathD += ` L ${x.toFixed(1)},${y.toFixed(1)}`;
  }

  // Area under/over zero curve
  const areaD = `${pathD} L ${width},${midY} L 0,${midY} Z`;

  return (
    <div className={`flex flex-col bg-slate-900 border border-slate-800 rounded-xl p-3 ${className}`}>
      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
        <span className="font-semibold text-slate-300">Advantage Chart</span>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="text-white">+White Advantage</span>
          <span>·</span>
          <span className="text-slate-400">-Black Advantage</span>
        </div>
      </div>

      <div className="relative w-full h-[90px] overflow-hidden rounded bg-slate-950 border border-slate-800/80">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full cursor-pointer"
          preserveAspectRatio="none"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const fraction = Math.max(0, Math.min(1, clickX / rect.width));
            const targetPly = Math.round(fraction * (timeline.length - 1)) - 1;
            onSelectMove(targetPly);
          }}
        >
          {/* Zero baseline */}
          <line
            x1="0"
            y1={midY}
            x2={width}
            y2={midY}
            stroke="#475569"
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          {/* Shaded Area */}
          <path d={areaD} fill="#10b981" fillOpacity="0.12" />

          {/* Advantage Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Current Move Indicator */}
          {currentMoveIndex >= -1 && (
            (() => {
              const activeIndex = currentMoveIndex + 1; // +1 because index 0 is start
              if (activeIndex >= 0 && activeIndex < timeline.length) {
                const cx = getX(activeIndex);
                const cy = getY(timeline[activeIndex].eval);
                return (
                  <g>
                    <line
                      x1={cx}
                      y1="0"
                      x2={cx}
                      y2={height}
                      stroke="#f59e0b"
                      strokeWidth="1.5"
                    />
                    <circle cx={cx} cy={cy} r="4" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
                  </g>
                );
              }
              return null;
            })()
          )}
        </svg>
      </div>

      {/* Current point details */}
      {currentMoveIndex >= -1 && (
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2">
          <span>
            {currentMoveIndex === -1
              ? 'Starting Position'
              : `Move ${Math.floor(currentMoveIndex / 2) + 1}${currentMoveIndex % 2 === 0 ? '. ' : '... '}${timeline[currentMoveIndex + 1]?.san || ''}`}
          </span>
          <span className="text-emerald-400 font-bold">
            {StockfishEngine.formatScore(timeline[currentMoveIndex + 1]?.eval ?? 0)}
          </span>
        </div>
      )}
    </div>
  );
};
