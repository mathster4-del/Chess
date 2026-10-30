import React, { useEffect, useRef } from 'react';
import { PieceColor, TimeControl } from '../types/chess';
import { chessAudio } from '../utils/audio';

interface GameClocksProps {
  timeControl: TimeControl;
  activeColor: PieceColor | null; // null if game not started or paused
  whiteTime: number; // in seconds
  blackTime: number; // in seconds
  onTimeOut?: (loser: PieceColor) => void;
  className?: string;
}

export const TIME_CONTROLS: TimeControl[] = [
  { id: 'bullet-1-0', name: 'Bullet 1m', minutes: 1, increment: 0, category: 'Bullet' },
  { id: 'blitz-3-2', name: 'Blitz 3+2', minutes: 3, increment: 2, category: 'Blitz' },
  { id: 'blitz-5-0', name: 'Blitz 5m', minutes: 5, increment: 0, category: 'Blitz' },
  { id: 'blitz-5-3', name: 'Blitz 5+3', minutes: 5, increment: 3, category: 'Blitz' },
  { id: 'rapid-10-0', name: 'Rapid 10m', minutes: 10, increment: 0, category: 'Rapid' },
  { id: 'rapid-15-10', name: 'Rapid 15+10', minutes: 15, increment: 10, category: 'Rapid' },
  { id: 'classical-30-0', name: 'Classical 30m', minutes: 30, increment: 0, category: 'Classical' },
  { id: 'unlimited', name: 'Untimed', minutes: 0, increment: 0, category: 'Unlimited' },
];

export const formatClockTime = (totalSeconds: number): string => {
  if (totalSeconds <= 0) return '0:00';
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  const padS = s < 10 ? `0${s}` : `${s}`;

  // If under 10 seconds, show decimal
  if (totalSeconds < 10) {
    const tenths = Math.floor((totalSeconds % 1) * 10);
    return `${m}:${padS}.${tenths}`;
  }
  return `${m}:${padS}`;
};

export const GameClockDisplay: React.FC<{
  color: PieceColor;
  timeRemaining: number;
  isActive: boolean;
  playerName: string;
  capturedMaterialDiff?: number;
}> = ({ color, timeRemaining, isActive, playerName, capturedMaterialDiff }) => {
  const isLowTime = timeRemaining > 0 && timeRemaining < 30;
  const isCriticalTime = timeRemaining > 0 && timeRemaining < 10;

  return (
    <div
      className={`flex items-center justify-between px-3.5 py-2 rounded-lg border transition-all duration-200 ${
        isActive
          ? 'bg-slate-800 border-emerald-500/70 shadow-sm shadow-emerald-500/10'
          : 'bg-slate-900/80 border-slate-800 text-slate-400'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={`w-3.5 h-3.5 rounded-full border ${
            color === 'w' ? 'bg-white border-slate-300' : 'bg-slate-950 border-slate-600'
          }`}
        />
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-slate-200 whitespace-nowrap">
            {playerName}
          </span>
          {capturedMaterialDiff !== undefined && capturedMaterialDiff !== 0 && (
            <span className="text-[10px] font-mono text-emerald-400 font-medium">
              +{capturedMaterialDiff}
            </span>
          )}
        </div>
      </div>

      <div
        className={`font-mono font-bold text-base md:text-lg tabular-nums px-2.5 py-0.5 rounded ${
          isCriticalTime
            ? 'bg-red-950/80 text-red-400 animate-pulse'
            : isLowTime
            ? 'bg-amber-950/60 text-amber-300'
            : isActive
            ? 'bg-slate-950 text-slate-100'
            : 'bg-slate-950/50 text-slate-400'
        }`}
      >
        {timeRemaining > 0 ? formatClockTime(timeRemaining) : '0:00'}
      </div>
    </div>
  );
};
