/**
 * ANGEL AI — Ambient Ethereal Theme Audio Feedback
 * Synthesizes pure harmonic, gentle acoustic chime feedback using Web Audio API.
 * Zero external audio files, 0ms latency, zero bandwidth.
 * Master volume is calibrated to be subtle, calming, and non-intrusive (~0.04 - 0.06).
 */

class ThemeSoundSynthesizer {
  private audioCtx: AudioContext | null = null;
  private isUserInteracted = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        this.isUserInteracted = true;
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
          this.audioCtx.resume().catch(() => {});
        }
        window.removeEventListener('pointerdown', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
      };
      window.addEventListener('pointerdown', unlockAudio, { passive: true });
      window.addEventListener('keydown', unlockAudio, { passive: true });
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended' && this.isUserInteracted) {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public playThemeSound(theme: 'light' | 'dark' | 'midnight' | 'system'): void {
    try {
      const ctx = this.getContext();
      if (!ctx || ctx.state !== 'running') return;

      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.001, now);
      masterGain.connect(ctx.destination);

      if (theme === 'light') {
        // Bright crystalline celestial chime (High harmonic shimmer)
        // 880Hz (A5), 1320Hz (E6), 1760Hz (A6)
        masterGain.gain.exponentialRampToValueAtTime(0.045, now + 0.02);
        masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

        this.createTone(ctx, masterGain, 880, 'sine', now, 0.4);
        this.createTone(ctx, masterGain, 1320, 'sine', now + 0.03, 0.35);
        this.createTone(ctx, masterGain, 1760, 'triangle', now + 0.06, 0.25);
      } else if (theme === 'midnight') {
        // Deep cosmic abyssal resonance with soft sub-bass warmth
        // 110Hz (A2), 165Hz (E3), 330Hz (E4)
        masterGain.gain.exponentialRampToValueAtTime(0.055, now + 0.02);
        masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

        this.createTone(ctx, masterGain, 110, 'sine', now, 0.55);
        this.createTone(ctx, masterGain, 165, 'sine', now + 0.02, 0.45);
        this.createTone(ctx, masterGain, 330, 'triangle', now + 0.05, 0.35);
      } else if (theme === 'system') {
        // Balanced harmonic convergence
        // 523.25Hz (C5), 659.25Hz (E5), 783.99Hz (G5)
        masterGain.gain.exponentialRampToValueAtTime(0.04, now + 0.02);
        masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

        this.createTone(ctx, masterGain, 523.25, 'sine', now, 0.45);
        this.createTone(ctx, masterGain, 659.25, 'sine', now + 0.04, 0.4);
        this.createTone(ctx, masterGain, 783.99, 'sine', now + 0.08, 0.35);
      } else {
        // Cosmic Dark: radiant celestial violet chime
        // 440Hz (A4), 659.25Hz (E5), 880Hz (A5)
        masterGain.gain.exponentialRampToValueAtTime(0.05, now + 0.02);
        masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

        this.createTone(ctx, masterGain, 440, 'sine', now, 0.45);
        this.createTone(ctx, masterGain, 659.25, 'sine', now + 0.03, 0.4);
        this.createTone(ctx, masterGain, 880, 'sine', now + 0.07, 0.35);
      }
    } catch {
      // Audio autoplay policy or hardware restriction: graceful silence
    }
  }

  private createTone(
    ctx: AudioContext,
    destination: AudioNode,
    freq: number,
    type: OscillatorType,
    startTime: number,
    duration: number
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.exponentialRampToValueAtTime(0.7, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }
}

export const themeSoundService = new ThemeSoundSynthesizer();
