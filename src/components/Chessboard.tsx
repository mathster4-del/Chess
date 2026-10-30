import React, { useState, useMemo } from 'react';
import { Chess, Square, Move } from 'chess.js';
import { BoardTheme, PieceColor, PieceType } from '../types/chess';
import { ChessPieceIcon } from '../utils/pieces';
import { chessAudio } from '../utils/audio';

interface ChessboardProps {
  chess: Chess;
  orientation?: PieceColor;
  theme?: BoardTheme;
  isInteractive?: boolean;
  onMove?: (move: { from: Square; to: Square; promotion?: string }) => void;
  lastMove?: { from: string; to: string } | null;
  bestMoveArrow?: { from: string; to: string } | null;
  showBestMoveArrow?: boolean;
  className?: string;
}

const THEME_COLORS: Record<BoardTheme, { light: string; dark: string; border: string }> = {
  emerald: {
    light: '#edeed1',
    dark: '#779952',
    border: '#4d6932'
  },
  wood: {
    light: '#f0d9b5',
    dark: '#b58863',
    border: '#8c603e'
  },
  slate: {
    light: '#e2e8f0',
    dark: '#64748b',
    border: '#334155'
  },
  ocean: {
    light: '#dbeafe',
    dark: '#3b82f6',
    border: '#1d4ed8'
  },
  midnight: {
    light: '#94a3b8',
    dark: '#1e293b',
    border: '#0f172a'
  }
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

export const Chessboard: React.FC<ChessboardProps> = ({
  chess,
  orientation = 'w',
  theme = 'emerald',
  isInteractive = true,
  onMove,
  lastMove,
  bestMoveArrow,
  showBestMoveArrow = true,
  className = ''
}) => {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const [draggedSquare, setDraggedSquare] = useState<Square | null>(null);

  const colors = THEME_COLORS[theme] || THEME_COLORS.emerald;

  // Ordered files and ranks based on orientation
  const displayFiles = useMemo(() => {
    return orientation === 'w' ? FILES : [...FILES].reverse();
  }, [orientation]);

  const displayRanks = useMemo(() => {
    return orientation === 'w' ? RANKS : [...RANKS].reverse();
  }, [orientation]);

  // Compute legal moves for the selected square
  const legalMovesForSelected = useMemo(() => {
    if (!selectedSquare) return [];
    try {
      return chess.moves({ square: selectedSquare, verbose: true });
    } catch {
      return [];
    }
  }, [chess, selectedSquare]);

  const legalTargets = useMemo(() => {
    return new Set(legalMovesForSelected.map(m => m.to));
  }, [legalMovesForSelected]);

  // Find if king is in check
  const inCheckSquare = useMemo<string | null>(() => {
    if (!chess.inCheck()) return null;
    const turn = chess.turn();
    const board = chess.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === 'k' && piece.color === turn) {
          return `${FILES[c]}${8 - r}`;
        }
      }
    }
    return null;
  }, [chess]);

  const handleSquareClick = (sq: Square) => {
    if (!isInteractive) return;

    // If waiting for promotion selection, cancel or ignore
    if (pendingPromotion) {
      setPendingPromotion(null);
      return;
    }

    const currentPiece = chess.get(sq);

    // If clicking a destination square for selected piece
    if (selectedSquare) {
      if (selectedSquare === sq) {
        setSelectedSquare(null);
        return;
      }

      const matchMove = legalMovesForSelected.find(m => m.to === sq);
      if (matchMove) {
        // Check if pawn promotion
        const isPromotion = 
          matchMove.piece === 'p' &&
          ((matchMove.color === 'w' && sq.endsWith('8')) || (matchMove.color === 'b' && sq.endsWith('1')));

        if (isPromotion) {
          setPendingPromotion({ from: selectedSquare, to: sq });
          return;
        }

        executeMove(selectedSquare, sq);
        setSelectedSquare(null);
        return;
      }
    }

    // If clicking own piece, select it
    if (currentPiece && currentPiece.color === chess.turn()) {
      setSelectedSquare(sq);
    } else {
      setSelectedSquare(null);
    }
  };

  const executeMove = (from: Square, to: Square, promotion: string = 'q') => {
    try {
      const piece = chess.get(from);
      const isCapture = !!chess.get(to);
      const isCastle = piece?.type === 'k' && Math.abs(from.charCodeAt(0) - to.charCodeAt(0)) === 2;

      if (onMove) {
        onMove({ from, to, promotion });
      }

      // Audio cues
      if (chess.isCheckmate() || chess.inCheck()) {
        chessAudio.playCheck();
      } else if (isCastle) {
        chessAudio.playCastle();
      } else if (isCapture) {
        chessAudio.playCapture();
      } else {
        chessAudio.playMove();
      }
    } catch {
      // Invalid move
    }
  };

  const handlePromotionChoice = (pieceType: 'q' | 'r' | 'b' | 'n') => {
    if (pendingPromotion) {
      executeMove(pendingPromotion.from, pendingPromotion.to, pieceType);
      setPendingPromotion(null);
      setSelectedSquare(null);
    }
  };

  // Convert square notation to 0-7 coordinates for SVG arrow rendering
  const getSquareCoordinates = (squareStr: string) => {
    const file = squareStr[0];
    const rank = squareStr[1];
    const fileIdx = displayFiles.indexOf(file);
    const rankIdx = displayRanks.indexOf(rank);
    if (fileIdx === -1 || rankIdx === -1) return null;
    return {
      x: fileIdx * 12.5 + 6.25,
      y: rankIdx * 12.5 + 6.25
    };
  };

  return (
    <div className={`relative aspect-square w-full max-w-[580px] select-none rounded-xl overflow-hidden shadow-2xl border-4 ${className}`}
      style={{ borderColor: colors.border }}
    >
      {/* 8x8 Board Grid */}
      <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
        {displayRanks.map((rank, rankIdx) =>
          displayFiles.map((file, fileIdx) => {
            const squareKey = `${file}${rank}` as Square;
            const piece = chess.get(squareKey);
            const isLight = (fileIdx + rankIdx) % 2 === 0;
            const isSelected = selectedSquare === squareKey;
            const isLastMoveSquare = lastMove && (lastMove.from === squareKey || lastMove.to === squareKey);
            const isLegalTarget = legalTargets.has(squareKey);
            const isChecked = inCheckSquare === squareKey;

            return (
              <div
                key={squareKey}
                onClick={() => handleSquareClick(squareKey)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggedSquare && draggedSquare !== squareKey) {
                    handleSquareClick(squareKey);
                  }
                  setDraggedSquare(null);
                }}
                className="relative flex items-center justify-center cursor-pointer transition-colors"
                style={{
                  backgroundColor: isLight ? colors.light : colors.dark
                }}
              >
                {/* Last Move Highlight */}
                {isLastMoveSquare && (
                  <div className="absolute inset-0 bg-amber-400/35 pointer-events-none" />
                )}

                {/* Selected Square Highlight */}
                {isSelected && (
                  <div className="absolute inset-0 ring-4 ring-inset ring-amber-400 bg-amber-300/20 pointer-events-none" />
                )}

                {/* King in Check Highlight */}
                {isChecked && (
                  <div className="absolute inset-0 bg-red-600/60 animate-pulse pointer-events-none rounded-full" />
                )}

                {/* Rank label on left column */}
                {fileIdx === 0 && (
                  <span
                    className={`absolute top-0.5 left-1 text-[10px] md:text-xs font-mono font-semibold pointer-events-none ${
                      isLight ? 'text-slate-700/80' : 'text-slate-100/90'
                    }`}
                  >
                    {rank}
                  </span>
                )}

                {/* File label on bottom row */}
                {rankIdx === 7 && (
                  <span
                    className={`absolute bottom-0.5 right-1 text-[10px] md:text-xs font-mono font-semibold pointer-events-none ${
                      isLight ? 'text-slate-700/80' : 'text-slate-100/90'
                    }`}
                  >
                    {file}
                  </span>
                )}

                {/* Piece Graphic */}
                {piece && (
                  <div
                    draggable={isInteractive && piece.color === chess.turn()}
                    onDragStart={() => {
                      setDraggedSquare(squareKey);
                      setSelectedSquare(squareKey);
                    }}
                    className={`w-full h-full p-1 md:p-1.5 transition-transform duration-100 active:scale-95 ${
                      isInteractive && piece.color === chess.turn() ? 'cursor-grab active:cursor-grabbing hover:scale-105' : ''
                    }`}
                  >
                    <ChessPieceIcon type={piece.type} color={piece.color} />
                  </div>
                )}

                {/* Legal Move Indicators */}
                {isLegalTarget && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {piece ? (
                      // Target ring for capture
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-4 border-black/30 dark:border-white/40" />
                    ) : (
                      // Dot for empty square
                      <div className="w-3.5 h-3.5 md:w-4 md:h-4 rounded-full bg-black/25 dark:bg-white/35" />
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Stockfish Best Move Arrow SVG Overlay */}
      {showBestMoveArrow && bestMoveArrow && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <marker
              id="best-move-arrowhead"
              markerWidth="6"
              markerHeight="6"
              refX="5"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 6 3, 0 6" fill="#10b981" />
            </marker>
          </defs>
          {(() => {
            const start = getSquareCoordinates(bestMoveArrow.from);
            const end = getSquareCoordinates(bestMoveArrow.to);
            if (!start || !end) return null;

            return (
              <line
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke="#10b981"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeOpacity="0.85"
                markerEnd="url(#best-move-arrowhead)"
              />
            );
          })()}
        </svg>
      )}

      {/* Pawn Promotion Dialog Modal Overlay */}
      {pendingPromotion && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-30 p-4">
          <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-2xl text-center max-w-xs w-full">
            <h4 className="text-sm font-semibold text-slate-200 mb-3">Promote Pawn</h4>
            <div className="grid grid-cols-4 gap-2">
              {(['q', 'r', 'b', 'n'] as const).map((pType) => (
                <button
                  key={pType}
                  onClick={() => handlePromotionChoice(pType)}
                  className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-800 hover:bg-emerald-600/30 hover:border-emerald-500 border border-slate-700 transition-colors"
                >
                  <div className="w-10 h-10">
                    <ChessPieceIcon type={pType} color={chess.turn()} />
                  </div>
                  <span className="text-[11px] font-mono text-slate-300 uppercase mt-1">
                    {pType === 'q' ? 'Queen' : pType === 'r' ? 'Rook' : pType === 'b' ? 'Bishop' : 'Knight'}
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setPendingPromotion(null)}
              className="mt-3 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
