let ctx: AudioContext | null = null;

/** Petit "pop" synthétisé (aucun fichier audio nécessaire). */
export function playPop() {
  if (typeof window === "undefined") return;
  try {
    const Ctor = window.AudioContext ?? (window as any).webkitAudioContext;
    if (!Ctor) return;
    ctx ??= new Ctor();
    if (ctx.state === "suspended") void ctx.resume();

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.06);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  } catch {
    /* audio indisponible */
  }
}
