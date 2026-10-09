import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { startBeat, type BeatStyle } from "@/lib/beat";
import { publishVideo } from "@/lib/publish-video";
import { useLocalProfile } from "@/lib/local-profile";
import { playPop } from "@/lib/pop-sound";

export const Route = createFileRoute("/studio")({
  head: () => ({
    meta: [
      { title: "Studio d'enregistrement — ClipClap" },
      { name: "description", content: "Choisis une instru et filme ton freestyle directement dans ClipClap." },
      { property: "og:title", content: "Studio d'enregistrement — ClipClap" },
      { property: "og:description", content: "Instrus prêtes à l'emploi pour clipper ton freestyle." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Studio,
});

const BEATS: { id: string; emoji: string; name: string; prod: string; bpm: number; style: BeatStyle }[] = [
  { id: "trap", emoji: "🔥", name: "Trap Bangers Vol. 1", prod: "ClipBeat", bpm: 140, style: "trap" },
  { id: "boombap", emoji: "🎧", name: "Boom Bap New York", prod: "RetroVibes", bpm: 90, style: "boombap" },
  { id: "drill", emoji: "🌃", name: "Drill Paris Nights", prod: "NeonKeys", bpm: 142, style: "drill" },
];

type Phase = "idle" | "recording" | "review";

function Studio() {
  const [beatId, setBeatId] = useState("trap");
  const beat = BEATS.find((b) => b.id === beatId)!;
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [clip, setClip] = useState<Blob | null>(null);
  const [clipUrl, setClipUrl] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const liveRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const stopBeatRef = useRef<(() => void) | null>(null);
  const profile = useLocalProfile();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const stopAll = () => {
    stopBeatRef.current?.();
    stopBeatRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };
  useEffect(() => stopAll, []);

  useEffect(() => {
    if (phase !== "recording") return;
    const t = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, [phase]);

  const togglePreview = () => {
    playPop();
    if (previewing) {
      stopBeatRef.current?.();
      stopBeatRef.current = null;
      setPreviewing(false);
    } else {
      stopBeatRef.current?.();
      stopBeatRef.current = startBeat(beat.bpm, beat.style);
      setPreviewing(true);
    }
  };

  const start = async () => {
    playPop();
    setError(null);
    stopBeatRef.current?.();
    setPreviewing(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true,
      });
      streamRef.current = stream;
      if (liveRef.current) {
        liveRef.current.srcObject = stream;
        void liveRef.current.play();
      }
      const chunks: Blob[] = [];
      const type = ["video/mp4", "video/webm;codecs=vp8,opus", "video/webm"].find((t) =>
        MediaRecorder.isTypeSupported(t),
      );
      const rec = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunks, { type: rec.mimeType || "video/mp4" });
        setClip(blob);
        setClipUrl(URL.createObjectURL(blob));
        setPhase("review");
        stopAll();
      };
      recRef.current = rec;
      stopBeatRef.current = startBeat(beat.bpm, beat.style);
      rec.start(500);
      setSeconds(0);
      setDescription(`Freestyle sur ${beat.name} 🎤 #freestyle #clipclap`);
      setPhase("recording");
    } catch {
      stopAll();
      setError("Autorise la caméra et le micro pour enregistrer.");
    }
  };

  const stop = () => {
    playPop();
    recRef.current?.stop();
  };

  const reset = () => {
    if (clipUrl) URL.revokeObjectURL(clipUrl);
    setClip(null);
    setClipUrl(null);
    setPhase("idle");
  };

  const publish = async () => {
    if (!clip || busy) return;
    setBusy(true);
    setError(null);
    try {
      await publishVideo(clip, description, profile.avatar);
      await queryClient.invalidateQueries({ queryKey: ["videos"] });
      reset();
      navigate({ to: "/" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'envoi");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-background pb-32">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/90 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] backdrop-blur-xl">
        <span className="text-3xl">🎙️</span>
        <h1 className="text-2xl font-extrabold text-foreground">Studio d'enregistrement</h1>
      </header>

      <div className="px-4">
        <p className="mt-3 text-base text-muted-foreground">
          Choisis une instru et enregistre ton freestyle pour le prochain cypher !
        </p>

        {phase === "idle" && (
          <>
            <h2 className="mt-6 text-sm font-bold uppercase tracking-widest text-muted-foreground">
              1. Choisis ton instrumental
            </h2>
            <div className="mt-3 space-y-3">
              {BEATS.map((b) => {
                const selected = b.id === beatId;
                return (
                  <div
                    key={b.id}
                    className={`flex items-center gap-3 rounded-3xl border p-4 ${
                      selected ? "border-primary bg-primary/10 shadow-glow" : "border-border bg-card"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-bold text-foreground">
                        {b.emoji} {b.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Prod by {b.prod} • {b.bpm} BPM
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        playPop();
                        if (previewing) {
                          stopBeatRef.current?.();
                          stopBeatRef.current = null;
                          setPreviewing(false);
                        }
                        setBeatId(b.id);
                      }}
                      className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${
                        selected ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {selected ? "Sélectionné ✅" : "Sélectionner"}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <section className="mt-6 rounded-3xl border border-border bg-gradient-to-br from-accent/25 via-card to-primary/20 p-6 text-center">
          {phase === "idle" && (
            <>
              <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-primary text-4xl">
                🎥
              </div>
              <h3 className="mt-4 text-xl font-extrabold text-foreground">Prêt à clipper ton freestyle ?</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Instru active : <span className="font-bold text-primary">{beat.name}</span>
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                L'instru se lancera dans ton casque pendant que tu te filmeras.
              </p>
              <button
                onClick={togglePreview}
                className="mt-4 rounded-full border border-border bg-secondary px-5 py-2 text-sm font-bold text-secondary-foreground"
              >
                {previewing ? "⏸ Arrêter l'écoute" : "▶ Écouter l'instru"}
              </button>
              <button
                onClick={start}
                className="mt-4 w-full rounded-2xl bg-foreground py-4 text-lg font-bold text-background transition-transform active:scale-95"
              >
                Lancer l'enregistrement
              </button>
            </>
          )}

          <video
            ref={liveRef}
            muted
            playsInline
            className={phase === "recording" ? "mx-auto aspect-[9/16] w-full max-w-xs -scale-x-100 rounded-2xl bg-black object-cover" : "hidden"}
          />
          {phase === "recording" && (
            <>
              <p className="mt-3 flex items-center justify-center gap-2 text-sm font-bold text-foreground">
                <span className="size-2.5 animate-pulse rounded-full bg-destructive" /> Enregistrement •{" "}
                {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
              </p>
              <button
                onClick={stop}
                className="mt-4 w-full rounded-2xl bg-destructive py-4 text-lg font-bold text-destructive-foreground"
              >
                ⏹ Arrêter
              </button>
            </>
          )}

          {phase === "review" && clipUrl && (
            <>
              <video src={clipUrl} controls playsInline className="mx-auto aspect-[9/16] w-full max-w-xs rounded-2xl bg-black object-cover" />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={300}
                rows={2}
                className="mt-4 w-full resize-none rounded-2xl border border-border bg-secondary p-3 text-sm text-secondary-foreground outline-none"
              />
              <div className="mt-3 flex gap-3">
                <button onClick={reset} disabled={busy} className="flex-1 rounded-2xl border border-border bg-secondary py-3 text-sm font-bold text-secondary-foreground">
                  Recommencer
                </button>
                <button onClick={publish} disabled={busy} className="flex-1 rounded-2xl bg-brand-gradient py-3 text-sm font-bold text-primary-foreground disabled:opacity-60">
                  {busy ? "Envoi…" : "Publier 🚀"}
                </button>
              </div>
            </>
          )}
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </section>
      </div>

      <BottomNav />
    </main>
  );
}
