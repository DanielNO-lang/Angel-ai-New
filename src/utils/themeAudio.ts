/**
 * ANGEL AI — Ethereal Audio Feedback Synthesizer
 * Uses the Web Audio API to create subtle, ethereal harmonic chimes
 * when switching between Light, Dark, Midnight, and System themes.
 * Zero external audio files, sub-millisecond start, ethereal decay.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx) {
    try {
      audioCtx = new AudioContextClass();
    } catch {
      return null;
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playThemeSound(theme: 'light' | 'dark' | 'midnight' | 'system') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.exponentialRampToValueAtTime(0.04, now + 0.03);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    masterGain.connect(ctx.destination);

    // Ethereal chord frequencies tailored to each theme's personality
    let freqs: number[] = [];
    if (theme === 'light') {
      // Crystalline luminous chime (E5, G#5, B5)
      freqs = [659.25, 830.61, 987.77];
    } else if (theme === 'dark') {
      // Warm cosmic obsidian chime (D4, A4, D5)
      freqs = [293.66, 440.0, 587.33];
    } else if (theme === 'midnight') {
      // Resonant deep space ethereal shimmer (A3, E4, A4)
      freqs = [220.0, 329.63, 440.0];
    } else {
      // System: Smooth dual-harmony chime (C#5, G#5)
      freqs = [554.37, 830.61];
    }

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.03);

      gain.gain.setValueAtTime(0.0001, now + idx * 0.03);
      gain.gain.linearRampToValueAtTime(0.25 / freqs.length, now + idx * 0.03 + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.03 + 0.4);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now + idx * 0.03);
      osc.stop(now + idx * 0.03 + 0.45);
    });
  } catch {
    // Non-blocking failover if audio is blocked by user browser policy
  }
}
