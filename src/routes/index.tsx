import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { BottomNav } from "@/components/BottomNav";
import { VideoCard } from "@/components/VideoCard";
import { videosQueryOptions } from "@/lib/videos-queries";

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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(videosQueryOptions()),
  errorComponent: () => (
    <main className="flex h-[100dvh] items-center justify-center bg-background px-6 text-center">
      <p className="text-sm text-muted-foreground">Impossible de charger le fil pour le moment.</p>
    </main>
  ),
  notFoundComponent: () => (
    <main className="flex h-[100dvh] items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Page introuvable.</p>
    </main>
  ),
  component: Feed,
});

function Feed() {
  const { data: videos } = useSuspenseQuery(videosQueryOptions());

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
