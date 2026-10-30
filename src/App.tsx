/**
 * Grandmaster Studio - Stockfish 19 Chess Engine & Game Analysis
 * Made by Garvit Gupta (mathster)
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Chess, Square } from 'chess.js';
import confetti from 'canvas-confetti';
import {
  Swords,
  Users,
  Search,
  Trophy,
  Volume2,
  VolumeX,
  RotateCw,
  Undo2,
  Flag,
  Handshake,
  Plus,
  Download,
  Share2,
  Sliders,
  Sparkles,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Play
} from 'lucide-react';

import {
  BoardTheme,
  EngineDifficulty,
  EngineEvaluation,
  GameMode,
  GameReviewReport,
  PieceColor,
  TimeControl
} from './types/chess';
import { Chessboard } from './components/Chessboard';
import { EvalBar } from './components/EvalBar';
import { EnginePanel } from './components/EnginePanel';
import { MoveHistory } from './components/MoveHistory';
import { AnalysisGraph } from './components/AnalysisGraph';
import { GameClockDisplay, TIME_CONTROLS } from './components/GameClocks';
import { StockfishEngine, ENGINE_DIFFICULTIES } from './utils/engine';
import { GameAnalysisService, PRESET_GAMES, PresetGame } from './utils/gameAnalysis';
import { TACTICAL_PUZZLES } from './utils/puzzles';
import { chessAudio } from './utils/audio';
import { ChessPieceIcon } from './utils/pieces';
import { DownloadModal } from './components/DownloadModal';

export default function App() {
  // Navigation Mode
  const [mode, setMode] = useState<GameMode>('vs-engine');

  // Core Chess State
  const [chess, setChess] = useState<Chess>(() => new Chess());
  const [history, setHistory] = useState<string[]>([]);
  const [currentPlyIndex, setCurrentPlyIndex] = useState<number>(-1);
  const [boardOrientation, setBoardOrientation] = useState<PieceColor>('w');
  const [playerSide, setPlayerSide] = useState<PieceColor>('w');
  const [boardTheme, setBoardTheme] = useState<BoardTheme>('emerald');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Engine Settings & Evaluation
  const [difficulty, setDifficulty] = useState<EngineDifficulty>('intermediate');
  const [evaluation, setEvaluation] = useState<EngineEvaluation | null>(null);
  const [evalBarVisible, setEvalBarVisible] = useState<boolean>(true);
  const [showBestMoveArrow, setShowBestMoveArrow] = useState<boolean>(true);
  const [isEngineThinking, setIsEngineThinking] = useState<boolean>(false);

  // Clocks & Time Controls
  const [selectedTimeControl, setSelectedTimeControl] = useState<TimeControl>(TIME_CONTROLS[1]); // Blitz 3+2
  const [whiteTime, setWhiteTime] = useState<number>(180);
  const [blackTime, setBlackTime] = useState<number>(180);
  const [clockRunning, setClockRunning] = useState<boolean>(false);

  // Game Status
  const [gameOverMessage, setGameOverMessage] = useState<string | null>(null);
  const [autoRotateFriendBoard, setAutoRotateFriendBoard] = useState<boolean>(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState<boolean>(false);

  // Analysis Mode State
  const [importInput, setImportInput] = useState<string>('');
  const [importType, setImportType] = useState<'lichess' | 'chesscom' | 'pgn'>('lichess');
  const [isAnalyzingGame, setIsAnalyzingGame] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [gameReport, setGameReport] = useState<GameReviewReport | null>(null);
  const [currentPgnSource, setCurrentPgnSource] = useState<string>('');
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Puzzle Mode State
  const [currentPuzzleIdx, setCurrentPuzzleIdx] = useState<number>(0);
  const [puzzleMoveIdx, setPuzzleMoveIdx] = useState<number>(0);
  const [puzzleStatus, setPuzzleStatus] = useState<'solving' | 'correct' | 'wrong'>('solving');

  // Material Advantage calculation
  const materialDifferential = useMemo(() => {
    const board = chess.board();
    let wScore = 0;
    let bScore = 0;
    const values: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 };

    for (const row of board) {
      for (const sq of row) {
        if (!sq || sq.type === 'k') continue;
        const val = values[sq.type] || 0;
        if (sq.color === 'w') wScore += val;
        else bScore += val;
      }
    }

    return {
      whiteAdv: Math.max(0, wScore - bScore),
      blackAdv: Math.max(0, bScore - wScore)
    };
  }, [chess]);

  // Last Move tracker
  const lastMove = useMemo(() => {
    const moves = chess.history({ verbose: true });
    if (moves.length === 0) return null;
    const last = moves[moves.length - 1];
    return { from: last.from, to: last.to };
  }, [chess]);

  // Sync Audio Setting
  useEffect(() => {
    chessAudio.setMuted(!soundEnabled);
  }, [soundEnabled]);

  // Real-time Stockfish Evaluation Trigger
  const triggerEvaluation = useCallback(async (chessInstance: Chess) => {
    try {
      const evalResult = await StockfishEngine.evaluate(chessInstance, 6);
      setEvaluation(evalResult);
    } catch {
      // Fallback
    }
  }, []);

  // Update evaluation whenever board state changes
  useEffect(() => {
    triggerEvaluation(chess);
  }, [chess, triggerEvaluation]);

  // Clock Countdown Loop
  useEffect(() => {
    if (!clockRunning || selectedTimeControl.category === 'Unlimited' || gameOverMessage) return;

    const interval = setInterval(() => {
      const turn = chess.turn();
      if (turn === 'w') {
        setWhiteTime((prev) => {
          if (prev <= 1) {
            handleTimeOut('w');
            return 0;
          }
          if (prev <= 10 && prev > 1 && soundEnabled) {
            chessAudio.playClockTick();
          }
          return Math.max(0, prev - 1);
        });
      } else {
        setBlackTime((prev) => {
          if (prev <= 1) {
            handleTimeOut('b');
            return 0;
          }
          if (prev <= 10 && prev > 1 && soundEnabled) {
            chessAudio.playClockTick();
          }
          return Math.max(0, prev - 1);
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [clockRunning, chess, selectedTimeControl, gameOverMessage, soundEnabled]);

  const handleTimeOut = (loser: PieceColor) => {
    setClockRunning(false);
    const winner = loser === 'w' ? 'Black' : 'White';
    setGameOverMessage(`Time out! ${winner} wins on time.`);
    if (playerSide !== loser) {
      triggerVictory();
    } else {
      chessAudio.playDefeat();
    }
  };

  const triggerVictory = () => {
    chessAudio.playVictory();
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  // Bot Turn Automation in vs-engine mode
  useEffect(() => {
    if (mode !== 'vs-engine' || gameOverMessage) return;

    const currentTurn = chess.turn();
    const isBotTurn = currentTurn !== playerSide;

    if (isBotTurn && !chess.isGameOver()) {
      setIsEngineThinking(true);
      const diffConfig = ENGINE_DIFFICULTIES[difficulty];

      const delay = Math.floor(350 + Math.random() * 400);
      const timer = setTimeout(() => {
        try {
          const searchResult = StockfishEngine.searchBestMove(
            chess,
            diffConfig.depth,
            diffConfig.randomness
          );

          if (searchResult.bestMove) {
            const nextChess = new Chess(chess.fen());
            nextChess.move(searchResult.bestMove);
            setChess(nextChess);
            setHistory(nextChess.history());
            setCurrentPlyIndex(nextChess.history().length - 1);

            // Add increment to bot clock
            if (selectedTimeControl.increment > 0) {
              if (currentTurn === 'w') setWhiteTime((t) => t + selectedTimeControl.increment);
              else setBlackTime((t) => t + selectedTimeControl.increment);
            }

            // Audio
            if (nextChess.isCheckmate()) {
              chessAudio.playCheck();
              setGameOverMessage('Checkmate! Engine wins.');
              chessAudio.playDefeat();
            } else if (nextChess.inCheck()) {
              chessAudio.playCheck();
            } else if (searchResult.bestMove.captured) {
              chessAudio.playCapture();
            } else {
              chessAudio.playMove();
            }
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsEngineThinking(false);
        }
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [chess, mode, playerSide, difficulty, gameOverMessage, selectedTimeControl]);

  // Handle Player Move
  const handlePlayerMove = (moveObj: { from: Square; to: Square; promotion?: string }) => {
    if (gameOverMessage) return;

    // In puzzle mode, handle separately
    if (mode === 'puzzles') {
      handlePuzzleMove(moveObj);
      return;
    }

    try {
      const nextChess = new Chess(chess.fen());
      const res = nextChess.move({
        from: moveObj.from,
        to: moveObj.to,
        promotion: moveObj.promotion || 'q'
      });

      if (!res) return;

      const movingColor = chess.turn();

      // Start clock on first move
      if (!clockRunning && selectedTimeControl.category !== 'Unlimited') {
        setClockRunning(true);
      }

      // Add increment
      if (selectedTimeControl.increment > 0) {
        if (movingColor === 'w') setWhiteTime((t) => t + selectedTimeControl.increment);
        else setBlackTime((t) => t + selectedTimeControl.increment);
      }

      setChess(nextChess);
      setHistory(nextChess.history());
      setCurrentPlyIndex(nextChess.history().length - 1);

      // Check for Game Over
      if (nextChess.isGameOver()) {
        setClockRunning(false);
        if (nextChess.isCheckmate()) {
          const winner = movingColor === 'w' ? 'White' : 'Black';
          setGameOverMessage(`Checkmate! ${winner} wins.`);
          if (mode === 'vs-engine' && movingColor === playerSide) {
            triggerVictory();
          } else {
            chessAudio.playCheck();
          }
        } else if (nextChess.isDraw()) {
          setGameOverMessage('Game drawn (Stalemate / Insufficient material / 50-move rule).');
        }
      }

      // Auto-flip board in friend mode if enabled
      if (mode === 'vs-friend' && autoRotateFriendBoard) {
        setBoardOrientation((prev) => (prev === 'w' ? 'b' : 'w'));
      }
    } catch {
      // Invalid move
    }
  };

  // Puzzle move handler
  const handlePuzzleMove = (moveObj: { from: Square; to: Square; promotion?: string }) => {
    const puzzle = TACTICAL_PUZZLES[currentPuzzleIdx];
    const uciMove = `${moveObj.from}${moveObj.to}${moveObj.promotion || ''}`;
    const targetUci = puzzle.moves[puzzleMoveIdx];

    if (uciMove === targetUci) {
      const nextChess = new Chess(chess.fen());
      nextChess.move({
        from: moveObj.from,
        to: moveObj.to,
        promotion: moveObj.promotion || 'q'
      });
      setChess(nextChess);
      setHistory(nextChess.history());
      chessAudio.playMove();

      const nextIdx = puzzleMoveIdx + 1;
      setPuzzleMoveIdx(nextIdx);

      // If finished
      if (nextIdx >= puzzle.moves.length) {
        setPuzzleStatus('correct');
        chessAudio.playBrilliant();
        confetti({ particleCount: 70, spread: 60 });
      } else {
        // Play opponent response
        setTimeout(() => {
          const oppUci = puzzle.moves[nextIdx];
          const oppFrom = oppUci.substring(0, 2) as Square;
          const oppTo = oppUci.substring(2, 4) as Square;
          const oppProm = oppUci.length > 4 ? oppUci[4] : undefined;

          nextChess.move({ from: oppFrom, to: oppTo, promotion: oppProm });
          setChess(new Chess(nextChess.fen()));
          setHistory(nextChess.history());
          setPuzzleMoveIdx(nextIdx + 1);
          chessAudio.playMove();
        }, 400);
      }
    } else {
      setPuzzleStatus('wrong');
      chessAudio.playBlunder();
    }
  };

  // Restart / New Game
  const startNewGame = (side: PieceColor = 'w', tc: TimeControl = selectedTimeControl) => {
    const newChess = new Chess();
    setChess(newChess);
    setHistory([]);
    setCurrentPlyIndex(-1);
    setPlayerSide(side);
    setBoardOrientation(side);
    setGameOverMessage(null);
    setSelectedTimeControl(tc);
    setWhiteTime(tc.minutes * 60);
    setBlackTime(tc.minutes * 60);
    setClockRunning(false);
    setGameReport(null);
    triggerEvaluation(newChess);
  };

  // Undo Move
  const handleUndo = () => {
    if (gameOverMessage || history.length === 0) return;

    const newChess = new Chess();
    // If playing against engine, undo 2 plies to get back to player turn
    const pliesToUndo = mode === 'vs-engine' && history.length >= 2 ? 2 : 1;
    const targetMoves = history.slice(0, history.length - pliesToUndo);

    for (const m of targetMoves) {
      newChess.move(m);
    }

    setChess(newChess);
    setHistory(newChess.history());
    setCurrentPlyIndex(newChess.history().length - 1);
    chessAudio.playMove();
  };

  // Apply Best Move (Hint)
  const handleApplyBestMove = () => {
    if (!evaluation?.bestMove || gameOverMessage) return;
    const { from, to, promotion } = evaluation.bestMove;
    handlePlayerMove({ from: from as Square, to: to as Square, promotion });
  };

  // Step through moves in history / review
  const handleSelectMoveIndex = (index: number) => {
    const sourceHistory = gameReport ? gameReport.moves.map((m) => m.san) : history;
    const newChess = new Chess();

    if (index >= 0) {
      for (let i = 0; i <= index && i < sourceHistory.length; i++) {
        try {
          newChess.move(sourceHistory[i]);
        } catch {
          break;
        }
      }
    }

    setChess(newChess);
    setCurrentPlyIndex(index);
    chessAudio.playMove();
  };

  // Game Import & Analysis
  const handleAnalyzePgn = async (pgnToAnalyze: string) => {
    setIsAnalyzingGame(true);
    setAnalysisError(null);
    setAnalysisProgress(0);

    try {
      const report = await GameAnalysisService.analyzePgn(pgnToAnalyze, (p) => {
        setAnalysisProgress(p);
      });
      setGameReport(report);
      setCurrentPgnSource(pgnToAnalyze);

      // Load game into board
      const reviewChess = new Chess();
      reviewChess.loadPgn(pgnToAnalyze);
      setChess(reviewChess);
      setHistory(reviewChess.history());
      setCurrentPlyIndex(reviewChess.history().length - 1);
      setGameOverMessage(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to analyze game.';
      setAnalysisError(msg);
    } finally {
      setIsAnalyzingGame(false);
    }
  };

  const handleImportSubmit = async () => {
    if (!importInput.trim()) return;
    setIsAnalyzingGame(true);
    setAnalysisError(null);

    try {
      let pgn = importInput;

      if (importType === 'lichess') {
        const fetched = await GameAnalysisService.fetchLichessGame(importInput);
        if (fetched) pgn = fetched.pgn;
      } else if (importType === 'chesscom') {
        const fetched = await GameAnalysisService.fetchChessDotComUserGame(importInput);
        if (fetched) pgn = fetched.pgn;
      }

      await handleAnalyzePgn(pgn);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Import failed. Check ID or URL.';
      setAnalysisError(msg);
      setIsAnalyzingGame(false);
    }
  };

  // Load Preset Game
  const handleLoadPreset = (preset: PresetGame) => {
    setImportInput(preset.pgn);
    setImportType('pgn');
    handleAnalyzePgn(preset.pgn);
  };

  // Load Puzzle
  const loadPuzzle = (index: number) => {
    const puzzle = TACTICAL_PUZZLES[index];
    const puzzleChess = new Chess(puzzle.fen);
    setChess(puzzleChess);
    setHistory(puzzleChess.history());
    setCurrentPuzzleIdx(index);
    setPuzzleMoveIdx(0);
    setPuzzleStatus('solving');
    setBoardOrientation(puzzle.turn);
    setGameOverMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Universal Top Bar */}
      <header className="flex items-center justify-between gap-8 px-5 py-3 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40">
        {/* Brand Zone */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white shadow-md shadow-emerald-600/30">
            ♔
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
              Grandmaster Studio
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Made by Garvit Gupta (mathster)
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
          <button
            onClick={() => {
              setMode('vs-engine');
              startNewGame(playerSide);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              mode === 'vs-engine'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Play Stockfish</span>
          </button>

          <button
            onClick={() => {
              setMode('analysis');
              if (!gameReport && PRESET_GAMES[0]) {
                handleLoadPreset(PRESET_GAMES[0]);
              }
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              mode === 'analysis'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Analyse Game</span>
          </button>

          <button
            onClick={() => {
              setMode('vs-friend');
              startNewGame('w', selectedTimeControl);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              mode === 'vs-friend'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Play Friend / Blitz</span>
          </button>

          <button
            onClick={() => {
              setMode('puzzles');
              loadPuzzle(0);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              mode === 'puzzles'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Best Move Trainer</span>
          </button>
        </nav>

        {/* Action Zone: Download / Install, Audio Toggle, New Game */}
        <div className="flex items-center gap-2">
          {/* Download & Install App Modal Button */}
          <button
            onClick={() => setIsDownloadModalOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5 whitespace-nowrap"
            title="Download App / Export Game PGN"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* New Game CTA */}
          <button
            onClick={() => startNewGame(playerSide)}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm shadow-emerald-600/30 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Game</span>
          </button>
        </div>
      </header>

      {/* Mobile Navigation bar */}
      <div className="md:hidden flex items-center justify-around bg-slate-900 border-b border-slate-800 px-2 py-1.5 overflow-x-auto">
        <button
          onClick={() => {
            setMode('vs-engine');
            startNewGame(playerSide);
          }}
          className={`px-2 py-1 text-xs font-semibold rounded whitespace-nowrap ${
            mode === 'vs-engine' ? 'text-emerald-400' : 'text-slate-400'
          }`}
        >
          Stockfish
        </button>
        <button
          onClick={() => {
            setMode('analysis');
            if (!gameReport && PRESET_GAMES[0]) handleLoadPreset(PRESET_GAMES[0]);
          }}
          className={`px-2 py-1 text-xs font-semibold rounded whitespace-nowrap ${
            mode === 'analysis' ? 'text-emerald-400' : 'text-slate-400'
          }`}
        >
          Analyse
        </button>
        <button
          onClick={() => {
            setMode('vs-friend');
            startNewGame('w');
          }}
          className={`px-2 py-1 text-xs font-semibold rounded whitespace-nowrap ${
            mode === 'vs-friend' ? 'text-emerald-400' : 'text-slate-400'
          }`}
        >
          Blitz / Friends
        </button>
        <button
          onClick={() => {
            setMode('puzzles');
            loadPuzzle(0);
          }}
          className={`px-2 py-1 text-xs font-semibold rounded whitespace-nowrap ${
            mode === 'puzzles' ? 'text-emerald-400' : 'text-slate-400'
          }`}
        >
          Best Move
        </button>
      </div>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 md:p-6 grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 items-start">
        {/* Left Column: Evaluation Bar + Chessboard + Clock HUD */}
        <div className="flex flex-col items-center gap-3 w-full max-w-[620px] mx-auto">
          {/* Top Clock HUD (Opponent / Black) */}
          <div className="w-full flex items-center justify-between gap-3 px-1">
            <div className="flex-1">
              <GameClockDisplay
                color={boardOrientation === 'w' ? 'b' : 'w'}
                playerName={
                  mode === 'vs-engine'
                    ? boardOrientation === 'w'
                      ? `Stockfish 19 (${ENGINE_DIFFICULTIES[difficulty].elo})`
                      : 'You'
                    : mode === 'vs-friend'
                    ? boardOrientation === 'w'
                      ? 'Black'
                      : 'White'
                    : 'Black'
                }
                timeRemaining={boardOrientation === 'w' ? blackTime : whiteTime}
                isActive={clockRunning && chess.turn() === (boardOrientation === 'w' ? 'b' : 'w')}
                capturedMaterialDiff={
                  boardOrientation === 'w' ? materialDifferential.blackAdv : materialDifferential.whiteAdv
                }
              />
            </div>

            {/* Quick Difficulty / Mode Pill */}
            {mode === 'vs-engine' && (
              <span className="text-[11px] font-mono text-slate-400 border border-slate-800 px-2 py-1 rounded bg-slate-900/60 whitespace-nowrap">
                {isEngineThinking ? 'Thinking...' : ENGINE_DIFFICULTIES[difficulty].name.split(' ')[0]}
              </span>
            )}
          </div>

          {/* Center Board Frame + Vertical Stockfish 19 Evaluation Bar */}
          <div className="relative flex items-center justify-center gap-2.5 w-full">
            {/* Togglable Evaluation Bar */}
            <EvalBar
              evaluation={evaluation}
              orientation={boardOrientation}
              visible={evalBarVisible}
              onToggle={() => setEvalBarVisible(!evalBarVisible)}
            />

            {/* The Chessboard */}
            <Chessboard
              chess={chess}
              orientation={boardOrientation}
              theme={boardTheme}
              isInteractive={!gameOverMessage && (mode !== 'vs-engine' || chess.turn() === playerSide)}
              onMove={handlePlayerMove}
              lastMove={lastMove}
              bestMoveArrow={
                evaluation?.bestMove ? { from: evaluation.bestMove.from, to: evaluation.bestMove.to } : null
              }
              showBestMoveArrow={showBestMoveArrow}
              className="flex-1"
            />
          </div>

          {/* Bottom Clock HUD (Player / White) */}
          <div className="w-full flex items-center justify-between gap-3 px-1">
            <div className="flex-1">
              <GameClockDisplay
                color={boardOrientation === 'w' ? 'w' : 'b'}
                playerName={
                  mode === 'vs-engine'
                    ? boardOrientation === 'w'
                      ? 'You'
                      : `Stockfish 19 (${ENGINE_DIFFICULTIES[difficulty].elo})`
                    : mode === 'vs-friend'
                    ? boardOrientation === 'w'
                      ? 'White'
                      : 'Black'
                    : 'White'
                }
                timeRemaining={boardOrientation === 'w' ? whiteTime : blackTime}
                isActive={clockRunning && chess.turn() === (boardOrientation === 'w' ? 'w' : 'b')}
                capturedMaterialDiff={
                  boardOrientation === 'w' ? materialDifferential.whiteAdv : materialDifferential.blackAdv
                }
              />
            </div>

            {/* In-Game Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setBoardOrientation((o) => (o === 'w' ? 'b' : 'w'))}
                title="Flip board"
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <button
                onClick={handleUndo}
                title="Undo move"
                disabled={history.length === 0 || !!gameOverMessage}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-40 transition-colors"
              >
                <Undo2 className="w-4 h-4" />
              </button>

              {mode === 'vs-engine' && !gameOverMessage && (
                <button
                  onClick={() => {
                    setGameOverMessage('You resigned. Stockfish wins.');
                    setClockRunning(false);
                    chessAudio.playDefeat();
                  }}
                  title="Resign"
                  className="p-2 rounded-lg bg-slate-900 hover:bg-rose-950/40 border border-slate-800 text-rose-400 transition-colors"
                >
                  <Flag className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Game Over Banner */}
          {gameOverMessage && (
            <div className="w-full p-3 bg-slate-900 border border-emerald-500/50 rounded-xl flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-200">{gameOverMessage}</span>
              </div>
              <button
                onClick={() => startNewGame(playerSide)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors"
              >
                Rematch
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Mode Controls, Analysis, Moves, & Settings */}
        <div className="flex flex-col gap-4 w-full">
          {/* Stockfish 19 Engine Details & Best Move Panel */}
          <EnginePanel
            evaluation={evaluation}
            evalBarVisible={evalBarVisible}
            onToggleEvalBar={() => setEvalBarVisible(!evalBarVisible)}
            showBestMoveArrow={showBestMoveArrow}
            onToggleBestMoveArrow={() => setShowBestMoveArrow(!showBestMoveArrow)}
            onApplyBestMove={handleApplyBestMove}
            isThinking={isEngineThinking}
          />

          {/* Mode-Specific Panels */}

          {/* MODE 1: Play Stockfish Settings */}
          {mode === 'vs-engine' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Engine Match Settings
              </h3>

              {/* Difficulty Selector */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">Difficulty Level</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {(Object.keys(ENGINE_DIFFICULTIES) as EngineDifficulty[]).map((diffKey) => {
                    const d = ENGINE_DIFFICULTIES[diffKey];
                    const isSelected = difficulty === diffKey;
                    return (
                      <button
                        key={diffKey}
                        onClick={() => {
                          setDifficulty(diffKey);
                        }}
                        className={`p-2 rounded-lg border text-left transition-colors ${
                          isSelected
                            ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="text-xs font-bold">{d.name.split(' ')[0]}</div>
                        <div className="text-[10px] font-mono text-slate-400">Elo {d.elo}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Control & Play As row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Side Selection */}
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Play As</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startNewGame('w')}
                      className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                        playerSide === 'w'
                          ? 'bg-white text-slate-950 border-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="w-2.5 h-2.5 rounded-full bg-white border border-slate-400" />
                      White
                    </button>
                    <button
                      onClick={() => startNewGame('b')}
                      className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                        playerSide === 'b'
                          ? 'bg-slate-800 text-white border-slate-600'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-slate-600" />
                      Black
                    </button>
                  </div>
                </div>

                {/* Time Control */}
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Time Control</label>
                  <select
                    value={selectedTimeControl.id}
                    onChange={(e) => {
                      const tc = TIME_CONTROLS.find((t) => t.id === e.target.value);
                      if (tc) {
                        setSelectedTimeControl(tc);
                        setWhiteTime(tc.minutes * 60);
                        setBlackTime(tc.minutes * 60);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:border-emerald-500 outline-none"
                  >
                    {TIME_CONTROLS.map((tc) => (
                      <option key={tc.id} value={tc.id}>
                        {tc.name} ({tc.category})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* MODE 2: Analyse Game of Lichess or Chess.com */}
          {mode === 'analysis' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Game Importer & Review
                </h3>
                <span className="text-[11px] font-mono text-emerald-400">Stockfish 19 CAPS</span>
              </div>

              {/* Source Tabs */}
              <div className="flex gap-2 p-1 bg-slate-950 rounded-lg border border-slate-800">
                <button
                  onClick={() => setImportType('lichess')}
                  className={`flex-1 py-1 text-xs font-semibold rounded transition-colors ${
                    importType === 'lichess' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400'
                  }`}
                >
                  Lichess URL / ID
                </button>
                <button
                  onClick={() => setImportType('chesscom')}
                  className={`flex-1 py-1 text-xs font-semibold rounded transition-colors ${
                    importType === 'chesscom' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400'
                  }`}
                >
                  Chess.com User
                </button>
                <button
                  onClick={() => setImportType('pgn')}
                  className={`flex-1 py-1 text-xs font-semibold rounded transition-colors ${
                    importType === 'pgn' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400'
                  }`}
                >
                  Paste PGN
                </button>
              </div>

              {/* Input field */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={importInput}
                    onChange={(e) => setImportInput(e.target.value)}
                    placeholder={
                      importType === 'lichess'
                        ? 'e.g. https://lichess.org/a6K2qZ12 or a6K2qZ12'
                        : importType === 'chesscom'
                        ? 'e.g. MagnusCarlsen or Hikaru'
                        : 'Paste PGN notation...'
                    }
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:border-emerald-500 outline-none font-mono"
                  />
                  <button
                    onClick={handleImportSubmit}
                    disabled={isAnalyzingGame || !importInput.trim()}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
                  >
                    {isAnalyzingGame ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    <span>Analyze</span>
                  </button>
                </div>

                {analysisError && (
                  <div className="text-xs text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{analysisError}</span>
                  </div>
                )}
              </div>

              {/* Preset Historic Games */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400 font-medium">Or analyze historic brilliancy:</label>
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_GAMES.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleLoadPreset(preset)}
                      className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left transition-colors group"
                    >
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400 truncate">
                        {preset.title}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {preset.white} vs {preset.black}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Analysis Progress Bar */}
              {isAnalyzingGame && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>Stockfish 19 Game Review...</span>
                    <span>{analysisProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{ width: `${analysisProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Game Review Accuracy Score Card */}
              {gameReport && (
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-center">
                    {/* White Accuracy */}
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <div className="text-[11px] text-slate-400">White Accuracy</div>
                      <div className="text-xl font-mono font-bold text-slate-100">
                        {gameReport.whiteAccuracy}%
                      </div>
                      <div className="flex justify-center gap-1.5 text-[10px] font-mono mt-1">
                        <span className="text-cyan-400">{gameReport.whiteBreakdown.brilliant}!!</span>
                        <span className="text-emerald-400">{gameReport.whiteBreakdown.best}★</span>
                        <span className="text-rose-400">{gameReport.whiteBreakdown.blunder}??</span>
                      </div>
                    </div>

                    {/* Black Accuracy */}
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <div className="text-[11px] text-slate-400">Black Accuracy</div>
                      <div className="text-xl font-mono font-bold text-slate-100">
                        {gameReport.blackAccuracy}%
                      </div>
                      <div className="flex justify-center gap-1.5 text-[10px] font-mono mt-1">
                        <span className="text-cyan-400">{gameReport.blackBreakdown.brilliant}!!</span>
                        <span className="text-emerald-400">{gameReport.blackBreakdown.best}★</span>
                        <span className="text-rose-400">{gameReport.blackBreakdown.blunder}??</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 italic">{gameReport.summary}</p>
                </div>
              )}
            </div>
          )}

          {/* MODE 3: Play Friend / Blitz */}
          {mode === 'vs-friend' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Pass & Play / Blitz Mode
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Preset Time Control</label>
                  <select
                    value={selectedTimeControl.id}
                    onChange={(e) => {
                      const tc = TIME_CONTROLS.find((t) => t.id === e.target.value);
                      if (tc) {
                        setSelectedTimeControl(tc);
                        setWhiteTime(tc.minutes * 60);
                        setBlackTime(tc.minutes * 60);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:border-emerald-500 outline-none"
                  >
                    {TIME_CONTROLS.map((tc) => (
                      <option key={tc.id} value={tc.id}>
                        {tc.name} ({tc.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Auto-Rotate Board</label>
                  <button
                    onClick={() => setAutoRotateFriendBoard(!autoRotateFriendBoard)}
                    className={`w-full py-1.5 px-3 rounded-lg border text-xs font-semibold transition-colors flex items-center justify-between ${
                      autoRotateFriendBoard
                        ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span>Rotate on Turn</span>
                    <span>{autoRotateFriendBoard ? 'ON' : 'OFF'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODE 4: Best Move Tactical Trainer */}
          {mode === 'puzzles' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    {TACTICAL_PUZZLES[currentPuzzleIdx].title}
                  </h3>
                  <div className="text-[11px] font-mono text-emerald-400">
                    Rating {TACTICAL_PUZZLES[currentPuzzleIdx].rating} · {TACTICAL_PUZZLES[currentPuzzleIdx].theme}
                  </div>
                </div>
                <div className="flex gap-1">
                  {TACTICAL_PUZZLES.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => loadPuzzle(idx)}
                      className={`w-6 h-6 rounded text-xs font-mono font-bold transition-colors ${
                        currentPuzzleIdx === idx
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300">
                {TACTICAL_PUZZLES[currentPuzzleIdx].description}
              </div>

              {/* Puzzle status banner */}
              {puzzleStatus === 'correct' && (
                <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/60 text-emerald-300 text-xs flex items-center justify-between">
                  <span className="font-semibold">Puzzle Solved! Stockfish 19 Best Move Found.</span>
                  {currentPuzzleIdx < TACTICAL_PUZZLES.length - 1 && (
                    <button
                      onClick={() => loadPuzzle(currentPuzzleIdx + 1)}
                      className="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-colors"
                    >
                      Next Puzzle
                    </button>
                  )}
                </div>
              )}

              {puzzleStatus === 'wrong' && (
                <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/60 text-rose-300 text-xs flex items-center justify-between">
                  <span>That is not the best move. Try again!</span>
                  <button
                    onClick={() => loadPuzzle(currentPuzzleIdx)}
                    className="px-2.5 py-1 rounded bg-rose-500 text-slate-950 font-bold hover:bg-rose-400 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Interactive Advantage Graph for Analysis */}
          {gameReport && (
            <AnalysisGraph
              timeline={gameReport.evalTimeline}
              currentMoveIndex={currentPlyIndex}
              onSelectMove={handleSelectMoveIndex}
            />
          )}

          {/* Move History Table */}
          <MoveHistory
            history={history}
            currentMoveIndex={currentPlyIndex}
            onSelectMove={handleSelectMoveIndex}
            analysisMoves={gameReport?.moves}
          />

          {/* Board Appearance Settings & Export */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs">
            {/* Board Theme */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Theme:</span>
              <div className="flex gap-1.5">
                {(['emerald', 'wood', 'slate', 'ocean', 'midnight'] as BoardTheme[]).map((thm) => (
                  <button
                    key={thm}
                    onClick={() => setBoardTheme(thm)}
                    className={`px-2 py-1 rounded font-mono text-[11px] capitalize border transition-colors ${
                      boardTheme === thm
                        ? 'bg-slate-800 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {thm}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Export FEN / PGN & Download */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(chess.fen());
                }}
                className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 text-[11px] font-mono transition-colors"
                title="Copy FEN string"
              >
                Copy FEN
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(chess.pgn());
                }}
                className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 text-[11px] font-mono transition-colors"
                title="Copy PGN string"
              >
                Copy PGN
              </button>
              <button
                onClick={() => setIsDownloadModalOpen(true)}
                className="px-2.5 py-1 rounded bg-emerald-950/40 border border-emerald-500/50 hover:bg-emerald-900/50 text-emerald-300 text-[11px] font-mono transition-colors flex items-center gap-1"
                title="Download Game or Install App"
              >
                <Download className="w-3 h-3" />
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Download & Install Modal */}
      <DownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        pgn={chess.pgn()}
        gameSummary={gameReport?.summary}
      />

      {/* Universal Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/80 py-4 px-6 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Grandmaster Studio</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-300 font-semibold">Made by Garvit Gupta (mathster)</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>Stockfish 19 Engine</span>
            <span>·</span>
            <span>Lichess & Chess.com Analysis</span>
            <span>·</span>
            <span>Blitz Clocks</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
