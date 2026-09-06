import { useEffect, useState } from "react";
import logo from "@/assets/clipclap-logo.png";

export function SplashScreen() {
  const [done, setDone] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fade = setTimeout(() => setFading(true), 1700);
    const end = setTimeout(() => setDone(true), 2200);
    return () => {
      clearTimeout(fade);
      clearTimeout(end);
    };
  }, []);

  if (done) return null;

  return (
    <div
      aria-hidden={fading}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-500 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
      style={{
        background:
          "radial-gradient(120% 90% at 50% 40%, #1B1140 0%, #120C2A 45%, #0B0E14 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute -left-24 top-8 size-72 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(138,43,226,0.40), transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute -right-20 bottom-16 size-80 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(255,0,127,0.30), transparent 70%)" }}
      />

      <div className="relative flex flex-col items-center gap-5 px-8 text-center">
        <img
          src={logo}
          alt="Logo ClipClap"
          width={1024}
          height={1024}
          className="size-44 animate-in fade-in zoom-in duration-700"
          style={{ filter: "drop-shadow(0 0 24px rgba(255,0,127,0.45))" }}
        />
        <div className="flex flex-col items-center gap-2">
          <p className="text-4xl font-extrabold tracking-tight text-white drop-shadow-[0_0_18px_rgba(190,80,255,0.55)]">
            ClipClap
          </p>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-white/85">
            Short video social network
          </p>
          <p className="text-sm text-white/60">Connecting Stories, Creating Ripples</p>
        </div>
      </div>

      <div className="absolute bottom-24 h-1 w-56 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, #FF007F, #8A2BE2)",
            animation: "clipclap-loading 2s linear forwards",
          }}
        />
      </div>

      <style>{`@keyframes clipclap-loading { from { width: 0% } to { width: 100% } }`}</style>
    </div>
  );
}
