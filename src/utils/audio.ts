/**
 * Web Audio API synthesizer for crisp, low-latency chess sounds.
 * Works seamlessly in all modern browsers without external audio assets.
 */

class ChessAudio {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public playMove() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.07);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.08);
  }

  public playCapture() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    
    // Impact click
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(450, t);
    osc1.frequency.exponentialRampToValueAtTime(110, t + 0.1);
    gain1.gain.setValueAtTime(0.4, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    // Sub thump
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(160, t);
    osc2.frequency.exponentialRampToValueAtTime(70, t + 0.12);
    gain2.gain.setValueAtTime(0.3, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);

    osc1.start(t);
    osc1.stop(t + 0.1);
    osc2.start(t);
    osc2.stop(t + 0.12);
  }

  public playCheck() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(540, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.14);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.22);
  }

  public playCastle() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    // Double tap
    this.playMove();
    setTimeout(() => {
      this.playMove();
    }, 110);
  }

  public playVictory() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [440, 554.37, 659.25, 880]; // A major chord arpeggio
    notes.forEach((freq, idx) => {
      const t = this.ctx!.currentTime + idx * 0.08;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 0.35);
    });
  }

  public playDefeat() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [440, 415.3, 392, 349.2];
    notes.forEach((freq, idx) => {
      const t = this.ctx!.currentTime + idx * 0.1;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 0.25);
    });
  }

  public playBrilliant() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    // Sparkle two-tone
    const t = this.ctx.currentTime;
    [784, 1174.66].forEach((f, i) => {
      const ot = t + i * 0.09;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, ot);
      gain.gain.setValueAtTime(0.25, ot);
      gain.gain.exponentialRampToValueAtTime(0.001, ot + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(ot);
      osc.stop(ot + 0.3);
    });
  }

  public playBlunder() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.linearRampToValueAtTime(80, t + 0.25);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  public playClockTick() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.04);
  }
}

export const chessAudio = new ChessAudio();
