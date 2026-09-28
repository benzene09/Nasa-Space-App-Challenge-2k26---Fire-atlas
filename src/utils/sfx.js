/**
 * Tiny synthesized sound effects (Web Audio). No audio files needed.
 * Every call is safe: if audio is blocked or unsupported it silently does nothing.
 */
let ctx = null;
let enabled = true;

export const setSoundEnabled = (on) => {
  enabled = on;
};

function audio() {
  if (!enabled || typeof window === 'undefined') return null;
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq, start, dur, { type = 'sine', vol = 0.12, slide = 0 } = {}) {
  const a = audio();
  if (!a) return;
  const t0 = a.currentTime + start;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const sfx = {
  pop: () => tone(620, 0, 0.08, { type: 'triangle', vol: 0.06, slide: 200 }),
  ding: () => {
    tone(880, 0, 0.18, { vol: 0.09 });
    tone(1320, 0.08, 0.25, { vol: 0.07 });
  },
  fanfare: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.3, { type: 'triangle', vol: 0.1 })),
  whoosh: () => tone(200, 0, 0.5, { type: 'sawtooth', vol: 0.04, slide: 900 }),
  oops: () => tone(300, 0, 0.25, { type: 'square', vol: 0.05, slide: -150 }),
};
