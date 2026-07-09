// Procedural tactile feedback — short synthesized sounds (no audio files) plus
// a haptic-ish CSS pulse hook. Off unless enabled in Settings. Kept tiny so
// it never gets in the way; every sound is a quick enveloped oscillator/noise.

let enabled = false;
let ac = null;

export function setFeedbackEnabled(on) { enabled = !!on; }

function ctx() {
  if (!enabled) return null;
  if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; } }
  if (ac.state === 'suspended') ac.resume();
  return ac;
}

function tone(freq, dur, type = 'sine', gain = 0.06) {
  const a = ctx(); if (!a) return;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.value = freq;
  o.connect(g); g.connect(a.destination);
  const t = a.currentTime;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.start(t); o.stop(t + dur + 0.02);
}

function noise(dur, gain = 0.05, hp = 800) {
  const a = ctx(); if (!a) return;
  const n = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, n, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = a.createBufferSource(); src.buffer = buf;
  const f = a.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
  const g = a.createGain(); g.gain.value = gain;
  src.connect(f); f.connect(g); g.connect(a.destination);
  src.start();
}

// named cues
export const fb = {
  tick() { tone(1500, 0.03, 'square', 0.03); },              // checkbox
  thunk() { tone(120, 0.16, 'sine', 0.12); noise(0.06, 0.08, 300); }, // stamp / released
  whoosh() { noise(0.28, 0.04, 400); },                      // blueprint open
  drawer() { noise(0.18, 0.05, 200); tone(180, 0.12, 'sine', 0.04); }, // archive open
  chime() { tone(660, 0.12, 'sine', 0.06); setTimeout(() => tone(990, 0.18, 'sine', 0.06), 90); }, // gate cleared
};

// brown-noise ambient bed for focus mode (returns a stop() fn)
export function startAmbient(kind = 'noise') {
  const a = ctx(); if (!a) return () => {};
  const n = a.sampleRate * 2;
  const buf = a.createBuffer(1, n, a.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
  const src = a.createBufferSource(); src.buffer = buf; src.loop = true;
  const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = kind === 'rain' ? 1800 : 700;
  const g = a.createGain(); g.gain.value = 0.05;
  src.connect(f); f.connect(g); g.connect(a.destination);
  src.start();
  return () => { try { src.stop(); } catch { /* already stopped */ } };
}
