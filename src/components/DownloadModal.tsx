import React from 'react';
import { Download, Smartphone, Laptop, FileText, X, CheckCircle, ArrowRight, Share } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  pgn: string;
  gameSummary?: string;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({
  isOpen,
  onClose,
  pgn,
  gameSummary
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  if (!isOpen) return null;

  // Download PGN helper
  const handleDownloadPgn = () => {
    const blob = new Blob([pgn || '1. e4 e5'], { type: 'application/x-chess-pgn;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `grandmaster-game-${new Date().toISOString().slice(0, 10)}.pgn`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download Analysis Report helper
  const handleDownloadReport = () => {
    const reportText = `Grandmaster Studio - Game Analysis Report
Made by Garvit Gupta (mathster)
Date: ${new Date().toLocaleString()}

${gameSummary || 'No analysis run yet.'}

====================
PGN Notation:
====================
${pgn || 'No moves played.'}
`;
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chess-analysis-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Download & Install</h3>
              <p className="text-xs text-slate-400">Install the app or download your chess games</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Install as Native App (PWA) */}
        <div className="py-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              1. Install as Desktop / Mobile App
            </span>
            {isInstalled && (
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Installed
              </span>
            )}
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Install Grandmaster Studio to your home screen or desktop to play against Stockfish 19 offline with zero browser bars.
          </p>

          {isInstalled ? (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300">
              ✓ App is already installed and running in standalone app mode!
            </div>
          ) : isInstallable ? (
            <button
              onClick={async () => {
                await install();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Install Grandmaster Studio Now</span>
            </button>
          ) : isIOS ? (
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-2">
              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>To Install on iPhone / iPad:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px]">
                <li>Tap the <strong>Share</strong> button (box with upward arrow) in Safari.</li>
                <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                <li>Tap <strong>Add</strong> in the top-right corner.</li>
              </ol>
            </div>
          ) : (
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1.5 text-slate-300">
              <div className="font-semibold flex items-center gap-1.5 text-slate-200">
                <Laptop className="w-4 h-4 text-emerald-400" />
                <span>Desktop Browser Installation:</span>
              </div>
              <p className="text-[11px] text-slate-400">
                In Google Chrome, Microsoft Edge, or Brave: Click the <strong>Install App icon (⊕ or computer icon)</strong> in the right side of the address bar.
              </p>
            </div>
          )}
        </div>

        {/* Section 2: Download Chess Game Files */}
        <div className="py-4 space-y-3">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
            2. Download Game Files (.PGN)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={handleDownloadPgn}
              className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-colors flex items-center justify-between group"
            >
              <div>
                <div className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400">
                  Download Game PGN
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Standard .pgn chess format
                </div>
              </div>
              <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-400" />
            </button>

            <button
              onClick={handleDownloadReport}
              className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-colors flex items-center justify-between group"
            >
              <div>
                <div className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400">
                  Analysis Report (.txt)
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Move scores & CAPS accuracy
                </div>
              </div>
              <FileText className="w-4 h-4 text-slate-400 group-hover:text-emerald-400" />
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-slate-800 text-center text-[11px] text-slate-400">
          Grandmaster Studio · Made by Garvit Gupta (mathster)
        </div>
      </div>
    </div>
  );
};
