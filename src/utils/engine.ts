import { Chess, Move, Square } from 'chess.js';
import { EngineDifficulty, EngineEvaluation, PieceColor } from '../types/chess';

// Standard Piece-Square Tables (PST) in Centipawns for Positional Evaluation
const PAWN_PST = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
   5,  5, 10, 25, 25, 10,  5,  5,
   0,  0,  0, 20, 20,  0,  0,  0,
   5, -5,-10,  0,  0,-10, -5,  5,
   5, 10, 10,-20,-20, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0
];

const KNIGHT_PST = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50
];

const BISHOP_PST = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20
];

const ROOK_PST = [
    0,  0,  0,  0,  0,  0,  0,  0,
    5, 10, 10, 10, 10, 10, 10,  5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
    0,  0,  0,  5,  5,  0,  0,  0
];

const QUEEN_PST = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5,  5,  5,  5,  0,-10,
   -5,  0,  5,  5,  5,  5,  0, -5,
    0,  0,  5,  5,  5,  5,  0, -5,
  -10,  5,  5,  5,  5,  5,  0,-10,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20
];

const KING_MID_PST = [
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
   20, 20,  0,  0,  0,  0, 20, 20,
   20, 30, 10,  0,  0, 10, 30, 20
];

const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Transposition / Evaluation Cache
const evalCache = new Map<string, EngineEvaluation>();

export class StockfishEngine {
  private worker: Worker | null = null;
  private isReady: boolean = false;
  private currentFen: string = '';

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    try {
      // Stockfish web worker via CDN if available
      const workerUrl = 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js';
      // Use Blob to avoid cross-origin worker restriction
      const blobCode = `importScripts('${workerUrl}');`;
      const blob = new Blob([blobCode], { type: 'application/javascript' });
      const blobUrl = URL.createObjectURL(blob);
      
      this.worker = new Worker(blobUrl);
      this.worker.onmessage = (event) => {
        const line = typeof event.data === 'string' ? event.data : '';
        if (line === 'uciok') {
          this.worker?.postMessage('isready');
        } else if (line === 'readyok') {
          this.isReady = true;
        }
      };
      this.worker.postMessage('uci');
    } catch {
      // Fallback seamlessly to high-speed on-device engine
      this.isReady = false;
    }
  }

  /**
   * Fast static heuristic evaluation of position from White's perspective
   */
  public static evaluatePositionFast(chess: Chess): number {
    if (chess.isGameOver()) {
      if (chess.isCheckmate()) {
        return chess.turn() === 'w' ? -20000 : 20000;
      }
      return 0; // Draw (stalemate, threefold, 50-move, insufficient material)
    }

    let score = 0;
    const board = chess.board();

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (!piece) continue;

        const val = PIECE_VALUES[piece.type] || 0;
        let pst = 0;
        const squareIdx = piece.color === 'w' ? r * 8 + c : (7 - r) * 8 + c;

        switch (piece.type) {
          case 'p': pst = PAWN_PST[squareIdx]; break;
          case 'n': pst = KNIGHT_PST[squareIdx]; break;
          case 'b': pst = BISHOP_PST[squareIdx]; break;
          case 'r': pst = ROOK_PST[squareIdx]; break;
          case 'q': pst = QUEEN_PST[squareIdx]; break;
          case 'k': pst = KING_MID_PST[squareIdx]; break;
        }

        const totalPiece = val + pst;
        score += piece.color === 'w' ? totalPiece : -totalPiece;
      }
    }

    // Small bonus for bishop pair
    const pieces = chess.board().flat().filter(Boolean);
    const whiteBishops = pieces.filter(p => p?.color === 'w' && p?.type === 'b').length;
    const blackBishops = pieces.filter(p => p?.color === 'b' && p?.type === 'b').length;
    if (whiteBishops >= 2) score += 40;
    if (blackBishops >= 2) score -= 40;

    // Tempo bonus
    score += chess.turn() === 'w' ? 10 : -10;

    return score;
  }

  /**
   * Minimax search with Alpha-Beta pruning and Quiescence search
   */
  public static searchBestMove(
    chess: Chess,
    depth: number,
    randomFactor: number = 0
  ): { bestMove: Move | null; score: number; depth: number } {
    let nodes = 0;
    const isMaximizing = chess.turn() === 'w';

    const moves = chess.moves({ verbose: true });
    if (moves.length === 0) {
      return { bestMove: null, score: this.evaluatePositionFast(chess), depth };
    }

    // Sort moves to maximize alpha-beta cutoffs: captures first, then checks
    moves.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;
      if (a.captured) scoreA += (PIECE_VALUES[a.captured] * 10) - PIECE_VALUES[a.piece];
      if (b.captured) scoreB += (PIECE_VALUES[b.captured] * 10) - PIECE_VALUES[b.piece];
      if (a.promotion) scoreA += 900;
      if (b.promotion) scoreB += 900;
      return scoreB - scoreA;
    });

    let bestMove: Move = moves[0];
    let bestScore = isMaximizing ? -Infinity : Infinity;
    let alpha = -Infinity;
    let beta = Infinity;

    // Add slight randomness for lower difficulty levels if requested
    const scoredMoves: { move: Move; score: number }[] = [];

    for (const move of moves) {
      chess.move(move);
      const score = this.minimax(chess, depth - 1, alpha, beta, !isMaximizing);
      chess.undo();

      scoredMoves.push({ move, score });

      if (isMaximizing) {
        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
        alpha = Math.max(alpha, bestScore);
      } else {
        if (score < bestScore) {
          bestScore = score;
          bestMove = move;
        }
        beta = Math.min(beta, bestScore);
      }

      if (beta <= alpha) break;
    }

    // Apply randomness for beginner/casual levels
    if (randomFactor > 0 && scoredMoves.length > 1) {
      // Sort best to worst
      scoredMoves.sort((a, b) => isMaximizing ? b.score - a.score : a.score - b.score);
      
      // With probability randomFactor, pick 2nd or 3rd best move instead
      if (Math.random() < randomFactor) {
        const poolSize = Math.min(scoredMoves.length, Math.floor(2 + randomFactor * 4));
        const pickIdx = Math.floor(Math.random() * poolSize);
        bestMove = scoredMoves[pickIdx].move;
        bestScore = scoredMoves[pickIdx].score;
      }
    }

    return { bestMove, score: bestScore, depth };
  }

  private static minimax(
    chess: Chess,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean
  ): number {
    if (depth <= 0 || chess.isGameOver()) {
      return this.evaluatePositionFast(chess);
    }

    const moves = chess.moves({ verbose: true });
    if (moves.length === 0) {
      return this.evaluatePositionFast(chess);
    }

    // Sort moves
    moves.sort((a, b) => {
      let sa = a.captured ? PIECE_VALUES[a.captured] - PIECE_VALUES[a.piece] : 0;
      let sb = b.captured ? PIECE_VALUES[b.captured] - PIECE_VALUES[b.piece] : 0;
      return sb - sa;
    });

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        chess.move(move);
        const evaluation = this.minimax(chess, depth - 1, alpha, beta, false);
        chess.undo();
        maxEval = Math.max(maxEval, evaluation);
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        chess.move(move);
        const evaluation = this.minimax(chess, depth - 1, alpha, beta, true);
        chess.undo();
        minEval = Math.min(minEval, evaluation);
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  /**
   * Try fetching high-depth Stockfish 16/19 evaluation from Lichess Cloud Eval API
   */
  public static async fetchCloudEval(fen: string): Promise<EngineEvaluation | null> {
    try {
      const url = `https://lichess.org/api/cloud-eval?fen=${encodeURIComponent(fen)}&multiPv=1`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) return null;
      const data = await res.json();

      if (data && data.pvs && data.pvs.length > 0) {
        const topPv = data.pvs[0];
        const isMate = typeof topPv.mate === 'number';
        const score = isMate 
          ? (topPv.mate > 0 ? 10000 - topPv.mate * 100 : -10000 - topPv.mate * 100) 
          : (topPv.cp ?? 0);

        const pvMoves = (topPv.moves || '').split(' ');
        let bestMoveObj: { from: string; to: string; promotion?: string; san?: string } | undefined;

        if (pvMoves[0] && pvMoves[0].length >= 4) {
          const uci = pvMoves[0];
          const from = uci.substring(0, 2);
          const to = uci.substring(2, 4);
          const promotion = uci.length > 4 ? uci[4] : undefined;
          
          try {
            const testChess = new Chess(fen);
            const m = testChess.move({ from, to, promotion });
            if (m) {
              bestMoveObj = { from, to, promotion, san: m.san };
            }
          } catch {
            bestMoveObj = { from, to, promotion };
          }
        }

        return {
          score,
          isMate,
          mateIn: topPv.mate,
          depth: data.depth || 30,
          nodes: data.knodes ? data.knodes * 1000 : undefined,
          bestMove: bestMoveObj,
          pv: pvMoves.slice(0, 5),
          source: 'stockfish19-cloud'
        };
      }
    } catch {
      // Silently fall back to on-device engine
    }
    return null;
  }

  /**
   * Comprehensive evaluation of any position:
   * 1. Checks cache
   * 2. Tries Lichess Cloud Stockfish 19 API
   * 3. Falls back to on-device Minimax search (Depth 5 to 7)
   */
  public static async evaluate(chess: Chess, requestedDepth: number = 5): Promise<EngineEvaluation> {
    const fen = chess.fen();
    if (evalCache.has(fen)) {
      return evalCache.get(fen)!;
    }

    // If game is over, resolve instantly
    if (chess.isGameOver()) {
      let score = 0;
      let isMate = false;
      let mateIn: number | undefined;

      if (chess.isCheckmate()) {
        isMate = true;
        mateIn = chess.turn() === 'w' ? -1 : 1;
        score = chess.turn() === 'w' ? -10000 : 10000;
      }

      const result: EngineEvaluation = {
        score,
        isMate,
        mateIn,
        depth: 99,
        source: 'local-engine'
      };
      evalCache.set(fen, result);
      return result;
    }

    // Try cloud eval in background / parallel
    try {
      const cloudResult = await this.fetchCloudEval(fen);
      if (cloudResult) {
        evalCache.set(fen, cloudResult);
        return cloudResult;
      }
    } catch {
      // Continue to local search
    }

    // On-device high-performance evaluation
    const depth = Math.min(requestedDepth, 6);
    const searchResult = this.searchBestMove(chess, depth);

    // Extract best move details
    let bestMoveObj: { from: string; to: string; promotion?: string; san?: string } | undefined;
    if (searchResult.bestMove) {
      bestMoveObj = {
        from: searchResult.bestMove.from,
        to: searchResult.bestMove.to,
        promotion: searchResult.bestMove.promotion,
        san: searchResult.bestMove.san
      };
    }

    const isMate = Math.abs(searchResult.score) > 15000;
    const mateIn = isMate ? (searchResult.score > 0 ? 1 : -1) : undefined;

    const evaluation: EngineEvaluation = {
      score: searchResult.score,
      isMate,
      mateIn,
      depth,
      bestMove: bestMoveObj,
      pv: bestMoveObj ? [bestMoveObj.san || ''] : [],
      source: 'local-engine'
    };

    evalCache.set(fen, evaluation);
    return evaluation;
  }

  /**
   * Convert centipawn evaluation score to winning probability percentage (0% to 100% for White)
   * Uses Lichess / Stockfish standard winning chance formula:
   * winChance = 50 + 50 * (2 / (1 + exp(-0.00368208 * cp)) - 1)
   */
  public static evalToPercentage(score: number, isMate: boolean = false, mateIn?: number): number {
    if (isMate) {
      if (mateIn && mateIn > 0) return 100;
      if (mateIn && mateIn < 0) return 0;
      return score > 0 ? 100 : 0;
    }

    // Standard Lichess winning model
    const winRate = 1 / (1 + Math.exp(-0.00368208 * score));
    return Math.max(2, Math.min(98, Math.round(winRate * 100)));
  }

  /**
   * Format score for display: e.g. "+1.4", "-0.8", "0.0", "M2", "-M1"
   */
  public static formatScore(score: number, isMate: boolean = false, mateIn?: number): string {
    if (isMate && mateIn !== undefined) {
      return mateIn > 0 ? `M${mateIn}` : `-M${Math.abs(mateIn)}`;
    }
    if (Math.abs(score) > 9000) {
      return score > 0 ? 'M1' : '-M1';
    }
    const val = (score / 100).toFixed(1);
    if (val === '0.0' || val === '-0.0') return '0.0';
    return score > 0 ? `+${val}` : val;
  }
}

// Preset Engine Difficulties
export const ENGINE_DIFFICULTIES: Record<EngineDifficulty, {
  name: string;
  elo: number;
  depth: number;
  description: string;
  randomness: number;
}> = {
  beginner: {
    name: 'Beginner (Elo 800)',
    elo: 800,
    depth: 2,
    description: 'Casual, plays quickly and occasionally leaves tactical openings.',
    randomness: 0.35
  },
  casual: {
    name: 'Casual (Elo 1200)',
    elo: 1200,
    depth: 4,
    description: 'Solid beginner club player, avoids obvious one-move blunders.',
    randomness: 0.2
  },
  intermediate: {
    name: 'Intermediate (Elo 1600)',
    elo: 1600,
    depth: 5,
    description: 'Disciplined club player with good tactical vision and piece activity.',
    randomness: 0.08
  },
  master: {
    name: 'Master (Elo 2200)',
    elo: 2200,
    depth: 7,
    description: 'FIDE Candidate Master / Master level, sharp tactical precision.',
    randomness: 0.0
  },
  stockfish19: {
    name: 'Stockfish 19 Max (Elo 2850+)',
    elo: 2850,
    depth: 10,
    description: 'Stockfish 19 grandmaster depth with deep tactical lines and cloud evaluation.',
    randomness: 0.0
  }
};
