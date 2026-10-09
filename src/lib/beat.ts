/** Instru synthétisée en direct (kick, snare, charleston) — aucun fichier audio. */
export type BeatStyle = "trap" | "boombap" | "drill";

const PATTERNS: Record<BeatStyle, { kick: number[]; snare: number[]; hat: number[] }> = {
  trap: { kick: [0, 7, 10], snare: [4, 12], hat: [0, 2, 4, 6, 8, 9, 10, 12, 14, 15] },
  boombap: { kick: [0, 3, 10], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14] },
  drill: { kick: [0, 6, 11], snare: [4, 13], hat: [0, 3, 6, 8, 11, 14] },
};

export function startBeat(bpm: number, style: BeatStyle) {
  const Ctor = window.AudioContext ?? (window as any).webkitAudioContext;
  const ctx: AudioContext = new Ctor();
  void ctx.resume();
  const noise = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  const kick = (t: number) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.25);
    g.gain.setValueAtTime(0.9, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.4);
  };
  const hit = (t: number, len: number, freq: number, vol: number) => {
    const s = ctx.createBufferSource();
    s.buffer = noise;
    const f = ctx.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + len);
    s.connect(f).connect(g).connect(ctx.destination);
    s.start(t);
    s.stop(t + len);
  };

  const p = PATTERNS[style];
  const step = 60 / bpm / 4;
  let next = ctx.currentTime + 0.05;
  let i = 0;
  const timer = window.setInterval(() => {
    while (next < ctx.currentTime + 0.12) {
      const s = i % 16;
      if (p.kick.includes(s)) kick(next);
      if (p.snare.includes(s)) hit(next, 0.18, 1200, 0.5);
      if (p.hat.includes(s)) hit(next, 0.04, 7000, 0.18);
      next += step;
      i++;
    }
  }, 25);

  return () => {
    window.clearInterval(timer);
    void ctx.close();
  };
}
