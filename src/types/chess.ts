export type PieceColor = 'w' | 'b';
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

export type GameMode = 'vs-engine' | 'vs-friend' | 'analysis' | 'puzzles';

export type EngineDifficulty = 'beginner' | 'casual' | 'intermediate' | 'master' | 'stockfish19';

export interface DifficultyConfig {
  id: EngineDifficulty;
  name: string;
  elo: number;
  depth: number;
  description: string;
  randomness: number;
}

export type TimeControlId = 'bullet-1-0' | 'blitz-3-2' | 'blitz-5-0' | 'blitz-5-3' | 'rapid-10-0' | 'rapid-15-10' | 'classical-30-0' | 'unlimited';

export interface TimeControl {
  id: TimeControlId;
  name: string;
  minutes: number;
  increment: number;
  category: 'Bullet' | 'Blitz' | 'Rapid' | 'Classical' | 'Unlimited';
}

export type MoveClassification = 
  | 'brilliant'  // !!
  | 'great'      // !
  | 'best'       // Best move
  | 'good'       // Solid
  | 'inaccuracy' // ?!
  | 'mistake'    // ?
  | 'blunder'    // ??
  | 'book';      // Opening book

export interface MoveAnalysis {
  moveNumber: number;
  color: PieceColor;
  san: string;
  from: string;
  to: string;
  fenBefore: string;
  fenAfter: string;
  evalBefore: number; // centipawns (from White perspective)
  evalAfter: number;
  bestMoveSan?: string;
  bestMoveFrom?: string;
  bestMoveTo?: string;
  classification: MoveClassification;
  explanation?: string;
}

export interface GameReviewReport {
  whiteAccuracy: number;
  blackAccuracy: number;
  whiteBreakdown: Record<MoveClassification, number>;
  blackBreakdown: Record<MoveClassification, number>;
  moves: MoveAnalysis[];
  evalTimeline: { moveIndex: number; san: string; eval: number; color: PieceColor }[];
  summary: string;
}

export interface EngineEvaluation {
  score: number; // centipawns from White perspective, e.g. +150 = +1.5 for White
  isMate: boolean;
  mateIn?: number; // positive = White mates, negative = Black mates
  depth: number;
  nodes?: number;
  bestMove?: {
    from: string;
    to: string;
    promotion?: string;
    san?: string;
  };
  pv?: string[]; // Principal variation SAN moves
  source: 'stockfish19-cloud' | 'stockfish-worker' | 'local-engine';
}

export type BoardTheme = 'wood' | 'emerald' | 'slate' | 'ocean' | 'midnight';

export interface Puzzle {
  id: string;
  title: string;
  rating: number;
  theme: string;
  fen: string;
  turn: PieceColor;
  moves: string[]; // sequence of UCI or SAN moves: [playerMove, opponentResponse, playerMove...]
  description: string;
  authorOrGame?: string;
}
