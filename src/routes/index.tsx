import { createFileRoute } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";
import { VideoCard } from "@/components/VideoCard";
import { videos } from "@/lib/feed-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LoopUp — Vidéos courtes en boucle" },
      {
        name: "description",
        content:
          "LoopUp : un fil de vidéos courtes en plein écran. Balaye vers le haut, like et commente en un geste.",
      },
      { property: "og:title", content: "LoopUp — Vidéos courtes en boucle" },
      {
        property: "og:description",
        content: "Un fil vertical de vidéos courtes qui tournent en boucle. Swipe, like, commente.",
      },
    ],
  }),
  component: Feed,
});

function Feed() {
  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-black">
      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <h1 className="text-lg font-extrabold tracking-tight text-brand-gradient">LoopUp</h1>
      </header>

      <div className="no-scrollbar h-full snap-y snap-mandatory overflow-y-scroll">
        {videos.map((v) => (
          <VideoCard key={v.id} video={v} />
        ))}
      </div>

      <BottomNav />
    </main>
  );
}
