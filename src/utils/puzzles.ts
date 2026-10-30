import { Puzzle } from '../types/chess';

export const TACTICAL_PUZZLES: Puzzle[] = [
  {
    id: 'opera-mate',
    title: 'Morphy Back-Rank Deflection',
    rating: 1450,
    theme: 'Back-Rank Deflection & Mate',
    fen: '1r1r2k1/p4ppp/8/8/8/8/PP3PPP/2R3K1 w - - 0 1',
    turn: 'w',
    moves: ['c1c8', 'd8c8'],
    description: 'Find the decisive move to control the back rank and force mate or major piece advantage.',
    authorOrGame: 'Paul Morphy Theme'
  },
  {
    id: 'fischer-knight-fork',
    title: 'The Golden Royal Fork',
    rating: 1650,
    theme: 'Knight Fork',
    fen: 'r1bqk2r/pp1nbppp/2p1pn2/3p4/2PP4/2N1PN2/PPQ2PPP/R1B1KB1R w KQkq - 0 7',
    turn: 'w',
    moves: ['c4d5', 'e6d5'],
    description: 'Central pawn tension. Open the line and exploit black piece coordination.',
    authorOrGame: 'Classical French Defense'
  },
  {
    id: 'queen-sacrifice-smothered',
    title: 'Philidor Smothered Mate',
    rating: 1850,
    theme: 'Smothered Mate & Queen Sacrifice',
    fen: '6k1/5ppp/8/8/8/2N5/1Q3PPP/5RK1 w - - 0 1',
    turn: 'w',
    moves: ['b2b8'],
    description: 'White to move and deliver unstoppable back-rank mate.',
    authorOrGame: 'Greco Sacrifice Pattern'
  },
  {
    id: 'greek-gift',
    title: 'The Greek Gift Sacrifice',
    rating: 1720,
    theme: 'Kingside Attack & Bishop Sacrifice',
    fen: 'r1bq1rk1/ppp2ppp/2n1pn2/3p4/2PP4/2NBPN2/PP3PPP/R1BQK2R w KQ - 0 7',
    turn: 'w',
    moves: ['d3h7'],
    description: 'Find the standard classical sacrifice on h7 to shatter the black king defense.',
    authorOrGame: 'Classical Kingside Breakthrough'
  },
  {
    id: 'endgame-passed-pawn',
    title: 'Decisive King Activity',
    rating: 1950,
    theme: 'Pawn Endgame Opposition',
    fen: '8/8/4k3/8/4K3/4P3/8/8 w - - 0 1',
    turn: 'w',
    moves: ['e4d4', 'e6d6'],
    description: 'White must seize the opposition or advance the king to escort the pawn to queen.',
    authorOrGame: 'Capablanca Endgame Technique'
  }
];
