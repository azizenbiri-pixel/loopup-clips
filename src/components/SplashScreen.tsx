import { useEffect, useState } from "react";
import { ClipClapLogo } from "@/components/ClipClapLogo";

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
      style={{ backgroundColor: "#0B0E14" }}
    >
      <div
        className="pointer-events-none absolute -left-24 top-10 size-72 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(138,43,226,0.35), transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute -right-20 bottom-16 size-80 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(255,0,127,0.28), transparent 70%)" }}
      />

      <div className="relative flex flex-col items-center gap-4">
        <ClipClapLogo className="size-28 animate-in fade-in zoom-in duration-700" />
        <p className="text-3xl font-extrabold tracking-tight text-white">ClipClap</p>
      </div>

      <div className="absolute bottom-24 h-1 w-48 overflow-hidden rounded-full bg-white/10">
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
