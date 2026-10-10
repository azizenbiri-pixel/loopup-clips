import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { setMuted, useMuted } from "@/lib/mute-store";
import { useLocalProfile } from "@/lib/local-profile";
import { playPop } from "@/lib/pop-sound";
import { BottomNav } from "@/components/BottomNav";
import { VideoCard } from "@/components/VideoCard";
import { FeedError } from "@/components/FeedError";
import { videosQueryOptions } from "@/lib/videos-queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ClipClap — Vidéos courtes en boucle" },
      {
        name: "description",
        content:
          "ClipClap : un fil de vidéos courtes en plein écran. Balaye vers le haut, like et commente en un geste.",
      },
      { property: "og:title", content: "ClipClap — Vidéos courtes en boucle" },
      {
        property: "og:description",
        content: "Un fil vertical de vidéos courtes qui tournent en boucle. Swipe, like, commente.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(videosQueryOptions()),
  errorComponent: ({ reset }) => <FeedError reset={reset} />,
  notFoundComponent: () => (
    <main className="flex h-[100dvh] items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Page introuvable.</p>
    </main>
  ),
  component: Feed,
});

function Feed() {
  const { data: allVideos } = useSuspenseQuery(videosQueryOptions());
  const profile = useLocalProfile();
  const muted = useMuted();
  const [tab, setTab] = useState<"following" | "foryou">("foryou");
  const videos =
    tab === "following" ? allVideos.filter((v) => profile.following.includes(v.username)) : allVideos;
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (t) startRef.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const s = startRef.current;
    const t = e.changedTouches[0];
    startRef.current = null;
    if (!s || !t) return;
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    if (dx < -70 && Math.abs(dy) < 80) {
      const el = scrollRef.current;
      const index = el ? Math.round(el.scrollTop / el.clientHeight) : 0;
      const current = videos[Math.min(Math.max(index, 0), videos.length - 1)];
      if (current) navigate({ to: "/creator/$username", params: { username: current.username } });
    }
  };

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-black">
      <header className="absolute inset-x-0 top-0 z-30 flex justify-center gap-8 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        {(["following", "foryou"] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              playPop();
              setTab(t);
              scrollRef.current?.scrollTo({ top: 0 });
            }}
            className={`border-b-2 pb-1 text-lg font-bold text-shadow-soft transition-colors ${
              tab === t ? "border-primary text-foreground" : "border-transparent text-foreground/60"
            }`}
          >
            {t === "following" ? "Abonnements" : "Pour toi"}
          </button>
        ))}
      </header>

      <button
        onClick={() => setMuted(!muted)}
        aria-label={muted ? "Activer le son" : "Couper le son"}
        className="absolute right-3 top-[calc(env(safe-area-inset-top)+3.5rem)] z-30 flex size-12 items-center justify-center rounded-full border border-border bg-background/50 text-2xl backdrop-blur"
      >
        {muted ? "🔇" : "🔊"}
      </button>

      <div
        ref={scrollRef}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="no-scrollbar h-full snap-y snap-mandatory overflow-y-scroll"
      >
        {videos.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
            <p className="text-4xl">👀</p>
            <p className="font-bold text-foreground">Aucune vidéo de tes abonnements</p>
            <p className="text-sm text-muted-foreground">
              Abonne-toi à des créateurs avec le « + » sur leur photo ou dans Découvrir.
            </p>
          </div>
        ) : (
          videos.map((v) => <VideoCard key={v.id} video={v} />)
        )}
      </div>

      <BottomNav />
    </main>
  );
}
