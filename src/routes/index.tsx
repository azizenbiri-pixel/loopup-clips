import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRef } from "react";
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
  const { data: videos } = useSuspenseQuery(videosQueryOptions());
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
      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <h1 className="text-lg font-extrabold tracking-tight text-brand-gradient">ClipClap</h1>
      </header>

      <div
        ref={scrollRef}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="no-scrollbar h-full snap-y snap-mandatory overflow-y-scroll"
      >
        {videos.map((v) => (
          <VideoCard key={v.id} video={v} />
        ))}
      </div>

      <BottomNav />
    </main>
  );
}
