import { Chess } from 'chess.js';
import { GameReviewReport, MoveAnalysis, MoveClassification } from '../types/chess';
import { StockfishEngine } from './engine';

export interface PresetGame {
  id: string;
  title: string;
  event: string;
  date: string;
  white: string;
  black: string;
  result: string;
  pgn: string;
  highlight: string;
}

export const PRESET_GAMES: PresetGame[] = [
  {
    id: 'fischer-byrne-1956',
    title: 'The Game of the Century',
    event: 'Rosenwald Memorial, New York',
    date: '1956.10.17',
    white: 'Donald Byrne',
    black: 'Robert James Fischer (age 13)',
    result: '0-1',
    highlight: 'Fischer plays 17... Be6!! sacrificing his queen to weave a mating net with bishop and knights.',
    pgn: `[Event "Third Rosenwald Trophy"]
[Site "New York, NY USA"]
[Date "1956.10.17"]
[Round "8"]
[White "Donald Byrne"]
[Black "Robert James Fischer"]
[Result "0-1"]

1. Nf3 Nf6 2. c4 g6 3. Nc3 Bg7 4. d4 O-O 5. Bf4 d5 6. Qb3 dxc4 7. Qxc4 c6 8. e4 Nbd7 9. Rd1 Nb6 10. Qc5 Bg4 11. Bg5 Na4 12. Qa3 Nxc3 13. bxc3 Nxe4 14. Bxe7 Qb6 15. Bc4 Nxc3 16. Bc5 Rfe8+ 17. Kf1 Be6 18. Bxb6 Bxc4+ 19. Kg1 Ne2+ 20. Kf1 Nxd4+ 21. Kg1 Ne2+ 22. Kf1 Nc3+ 23. Kg1 axb6 24. Qb4 Ra4 25. Qxb6 Nxd1 26. h3 Rxa2 27. Kh2 Nxf2 28. Re1 Rxe1 29. Qd8+ Bf8 30. Nxe1 Bd5 31. Nf3 Ne4 32. Qb8 b5 33. h4 h5 34. Ne5 Kg7 35. Kg1 Bc5+ 36. Kf1 Ng3+ 37. Ke1 Bb4+ 38. Kd1 Bb3+ 39. Kc1 Ne2+ 40. Kb1 Nc3+ 41. Kc1 Rc2# 0-1`
  },
  {
    id: 'opera-game-1858',
    title: 'The Opera Game',
    event: 'Paris Opera House',
    date: '1858.11.02',
    white: 'Paul Morphy',
    black: 'Duke of Brunswick & Count Isouard',
    result: '1-0',
    highlight: 'Masterpiece of rapid development and piece activity culminating in 16. Qb8+!! and 17. Rd8#.',
    pgn: `[Event "Paris Opera"]
[Site "Paris FRA"]
[Date "1858.11.02"]
[Round "1"]
[White "Paul Morphy"]
[Black "Duke Karl / Count Isouard"]
[Result "1-0"]

1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8# 1-0`
  },
  {
    id: 'kasparov-topalov-1999',
    title: "Kasparov's Immortal",
    event: 'Wijk aan Zee',
    date: '1999.01.20',
    white: 'Garry Kasparov',
    black: 'Veselin Topalov',
    result: '1-0',
    highlight: 'Kasparov shocks the chess world with 24. Rxd4!! and a 15-move king hunt all the way down to a1.',
    pgn: `[Event "Hoogovens Group A"]
[Site "Wijk aan Zee NED"]
[Date "1999.01.20"]
[Round "4"]
[White "Garry Kasparov"]
[Black "Veselin Topalov"]
[Result "1-0"]

1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Be3 Bg7 5. Qd2 c6 6. f3 b5 7. Nge2 Nbd7 8. Bh6 Bxh6 9. Qxh6 Bb7 10. a3 e5 11. O-O-O Qe7 12. Kb1 a6 13. Nc1 O-O-O 14. Nb3 exd4 15. Rxd4 c5 16. Rd1 Nb6 17. g3 Kb8 18. Na5 Ba8 19. Bh3 d5 20. Qf4+ Ka7 21. Rhe1 d4 22. Nd5 Nbxd5 23. exd5 Qd6 24. Rxd4 cxd4 25. Re7+ Kb6 26. Qxd4+ Kxa5 27. b4+ Ka4 28. Qc3 Qxd5 29. Ra7 Bb7 30. Rxb7 Qc4 31. Qxf6 Kxa3 32. Qxa6+ Kxb4 33. c3+ Kxc3 34. Qa1+ Kd2 35. Qb2+ Kd1 36. Bf1 Rd2 37. Rd7 Rxd7 38. Bxc4 bxc4 39. Qxh8 Rd3 40. Qa8 c3 41. Qa4+ Ke1 42. f4 f5 43. Kc1 Rd2 44. Qa7 1-0`
  },
  {
    id: 'immortal-game-1851',
    title: 'The Immortal Game',
    event: 'London Casual',
    date: '1851.06.21',
    white: 'Adolf Anderssen',
    black: 'Lionel Kieseritzky',
    result: '1-0',
    highlight: 'White sacrifices both rooks, a bishop, and finally his queen to deliver checkmate with three minor pieces.',
    pgn: `[Event "London Casual"]
[Site "London ENG"]
[Date "1851.06.21"]
[Round "1"]
[White "Adolf Anderssen"]
[Black "Lionel Kieseritzky"]
[Result "1-0"]

1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 b5 5. Bxb5 Nf6 6. Nf3 Qh6 7. d3 Nh5 8. Nh4 Qg5 9. Nf5 c6 10. g4 Nf6 11. Rg1 cxb5 12. h4 Qg6 13. h5 Qg5 14. Qf3 Ng8 15. Bxf4 Qf6 16. Nc3 Bc5 17. Nd5 Qxb2 18. Bd6 Bxg1 19. e5 Qxa1+ 20. Ke2 Na6 21. Nxg7+ Kd8 22. Qf6+ Nxf6 23. Be7# 1-0`
  }
];

export class GameAnalysisService {
  /**
   * Extract game ID from a Lichess URL (e.g. "https://lichess.org/a6K2qZ12/white#35" -> "a6K2qZ12")
   */
  public static extractLichessId(input: string): string | null {
    const trimmed = input.trim();
    const match = trimmed.match(/lichess\.org\/([a-zA-Z0-9]{8,12})/);
    if (match) return match[1].substring(0, 8);
    // If user provided direct 8-character ID
    if (/^[a-zA-Z0-9]{8}$/.test(trimmed)) {
      return trimmed;
    }
    return null;
  }

  /**
   * Fetch game PGN from Lichess public API
   */
  public static async fetchLichessGame(gameIdOrUrl: string): Promise<{ pgn: string; white: string; black: string } | null> {
    const gameId = this.extractLichessId(gameIdOrUrl);
    if (!gameId) {
      throw new Error('Invalid Lichess URL or Game ID. Format: https://lichess.org/xxxxxxxx');
    }

    const url = `https://lichess.org/game/export/${gameId}?evals=true&clocks=true`;
    const res = await fetch(url, { headers: { Accept: 'application/x-chess-pgn' } });
    if (!res.ok) {
      throw new Error(`Failed to fetch Lichess game (${res.status}). Ensure the game exists and is public.`);
    }

    const pgn = await res.text();
    const whiteMatch = pgn.match(/\[White "([^"]+)"\]/);
    const blackMatch = pgn.match(/\[Black "([^"]+)"\]/);

    return {
      pgn,
      white: whiteMatch ? whiteMatch[1] : 'White',
      black: blackMatch ? blackMatch[1] : 'Black'
    };
  }

  /**
   * Fetch latest games for a Chess.com user
   */
  public static async fetchChessDotComUserGame(username: string): Promise<{ pgn: string; white: string; black: string } | null> {
    const cleanUser = username.trim().toLowerCase();
    const archivesUrl = `https://api.chess.com/pub/player/${cleanUser}/games/archives`;
    const res = await fetch(archivesUrl);
    if (!res.ok) {
      throw new Error(`Could not find Chess.com player: "${username}"`);
    }

    const archivesData = await res.json();
    const archives = archivesData.archives as string[];
    if (!archives || archives.length === 0) {
      throw new Error(`No game archives found for "${username}"`);
    }

    // Get the latest month's archive
    const latestArchiveUrl = archives[archives.length - 1];
    const gamesRes = await fetch(latestArchiveUrl);
    if (!gamesRes.ok) {
      throw new Error('Failed to retrieve games from Chess.com archive');
    }

    const monthData = await gamesRes.json();
    const games = monthData.games;
    if (!games || games.length === 0) {
      throw new Error(`No recent games found for "${username}" this month.`);
    }

    // Get the last game
    const lastGame = games[games.length - 1];
    if (!lastGame.pgn) {
      throw new Error('PGN not available for the latest game');
    }

    return {
      pgn: lastGame.pgn,
      white: lastGame.white?.username || 'White',
      black: lastGame.black?.username || 'Black'
    };
  }

  /**
   * Run full game review with move classification and accuracy calculation
   */
  public static async analyzePgn(
    pgn: string,
    onProgress?: (progress: number, currentMove: number, totalMoves: number) => void
  ): Promise<GameReviewReport> {
    const chess = new Chess();
    try {
      chess.loadPgn(pgn);
    } catch (e) {
      throw new Error('Invalid PGN format. Please verify the game notation.');
    }

    const history = chess.history({ verbose: true });
    if (history.length === 0) {
      throw new Error('No moves found in PGN.');
    }

    // Replay game step-by-step
    const replayChess = new Chess();
    const movesAnalysis: MoveAnalysis[] = [];
    const evalTimeline: { moveIndex: number; san: string; eval: number; color: 'w' | 'b' }[] = [];

    const whiteBreakdown: Record<MoveClassification, number> = {
      brilliant: 0,
      great: 0,
      best: 0,
      good: 0,
      inaccuracy: 0,
      mistake: 0,
      blunder: 0,
      book: 0
    };

    const blackBreakdown: Record<MoveClassification, number> = {
      brilliant: 0,
      great: 0,
      best: 0,
      good: 0,
      inaccuracy: 0,
      mistake: 0,
      blunder: 0,
      book: 0
    };

    let prevEval = 20; // Starting position slight white initiative
    evalTimeline.push({ moveIndex: 0, san: 'Start', eval: prevEval, color: 'w' });

    for (let i = 0; i < history.length; i++) {
      const move = history[i];
      const fenBefore = replayChess.fen();
      const color = move.color;
      const isWhite = color === 'w';

      // Evaluate position before move
      const evalBeforeObj = await StockfishEngine.evaluate(replayChess, 5);
      const evalBefore = evalBeforeObj.score;
      const bestMoveCandidate = evalBeforeObj.bestMove;

      // Make the move
      replayChess.move(move);
      const fenAfter = replayChess.fen();

      // Evaluate position after move
      const evalAfterObj = await StockfishEngine.evaluate(replayChess, 5);
      const evalAfter = evalAfterObj.score;

      // Centipawn loss from moving player's perspective
      // If White moved: loss = evalBefore - evalAfter
      // If Black moved: loss = evalAfter - evalBefore (since lower score is better for Black)
      const cpLoss = isWhite ? (evalBefore - evalAfter) : (evalAfter - evalBefore);

      // Classification heuristic
      let classification: MoveClassification = 'good';
      let explanation = '';

      // Check opening book for first 6 plies
      if (i < 6 && cpLoss <= 25) {
        classification = 'book';
        explanation = 'Standard opening theory.';
      } else if (bestMoveCandidate && bestMoveCandidate.from === move.from && bestMoveCandidate.to === move.to) {
        // Was it a sacrifice leading to victory?
        if (move.captured && ['q', 'r'].includes(move.piece) && cpLoss <= 10) {
          classification = 'brilliant';
          explanation = 'Brilliant sacrifice maintaining decisive tactical control!';
        } else {
          classification = 'best';
          explanation = 'The highest-rated move in this position.';
        }
      } else if (cpLoss <= 25) {
        classification = 'good';
        explanation = 'Solid positional choice.';
      } else if (cpLoss <= 75) {
        classification = 'inaccuracy';
        explanation = bestMoveCandidate?.san ? `Slight inaccuracy. Better was ${bestMoveCandidate.san}.` : 'Sub-optimal move.';
      } else if (cpLoss <= 200) {
        classification = 'mistake';
        explanation = bestMoveCandidate?.san ? `Mistake giving away advantage. Preferred was ${bestMoveCandidate.san}.` : 'Noticeable mistake.';
      } else {
        classification = 'blunder';
        explanation = bestMoveCandidate?.san ? `Blunder that shifts the evaluation. ${bestMoveCandidate.san} was critical.` : 'Critical game blunder.';
      }

      // Tally
      if (isWhite) {
        whiteBreakdown[classification]++;
      } else {
        blackBreakdown[classification]++;
      }

      movesAnalysis.push({
        moveNumber: Math.floor(i / 2) + 1,
        color,
        san: move.san,
        from: move.from,
        to: move.to,
        fenBefore,
        fenAfter,
        evalBefore,
        evalAfter,
        bestMoveSan: bestMoveCandidate?.san,
        bestMoveFrom: bestMoveCandidate?.from,
        bestMoveTo: bestMoveCandidate?.to,
        classification,
        explanation
      });

      evalTimeline.push({
        moveIndex: i + 1,
        san: move.san,
        eval: evalAfter,
        color
      });

      prevEval = evalAfter;

      if (onProgress) {
        onProgress(Math.round(((i + 1) / history.length) * 100), i + 1, history.length);
      }
    }

    // Accuracy Score (CAPS formula based on average cp loss)
    const calcAccuracy = (breakdown: Record<MoveClassification, number>): number => {
      const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
      if (total === 0) return 85;
      
      const weights = {
        brilliant: 100,
        great: 98,
        best: 95,
        book: 95,
        good: 85,
        inaccuracy: 65,
        mistake: 45,
        blunder: 15
      };

      let sum = 0;
      for (const [key, count] of Object.entries(breakdown)) {
        sum += (weights[key as MoveClassification] || 80) * count;
      }
      return Math.round((sum / total) * 10) / 10;
    };

    const whiteAccuracy = calcAccuracy(whiteBreakdown);
    const blackAccuracy = calcAccuracy(blackBreakdown);

    let summary = `Game concluded with ${history.length} moves. White achieved ${whiteAccuracy}% accuracy and Black achieved ${blackAccuracy}% accuracy.`;
    if (whiteBreakdown.brilliant > 0 || blackBreakdown.brilliant > 0) {
      summary += ` Featured ${whiteBreakdown.brilliant + blackBreakdown.brilliant} brilliant move(s)!`;
    }

    return {
      whiteAccuracy,
      blackAccuracy,
      whiteBreakdown,
      blackBreakdown,
      moves: movesAnalysis,
      evalTimeline,
      summary
    };
  }
}
