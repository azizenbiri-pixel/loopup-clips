import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { BottomNav } from "@/components/BottomNav";
import { videosQueryOptions } from "@/lib/videos-queries";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Ton profil — ClipClap" },
      { name: "description", content: "Retrouve tes vidéos, tes abonnés et tes likes sur ClipClap." },
      { property: "og:title", content: "Ton profil — ClipClap" },
      { property: "og:description", content: "Tes boucles, tes abonnés et tes likes réunis." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(videosQueryOptions()),
  errorComponent: () => (
    <main className="flex h-[100dvh] items-center justify-center bg-background px-6 text-center">
      <p className="text-sm text-muted-foreground">Impossible de charger le profil.</p>
    </main>
  ),
  notFoundComponent: () => (
    <main className="flex h-[100dvh] items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Page introuvable.</p>
    </main>
  ),
  component: Profile,
});

function Profile() {
  const { data: videos } = useSuspenseQuery(videosQueryOptions());

  const stats = [
    { label: "Abonnements", value: "128" },
    { label: "Abonnés", value: "3 402" },
    { label: "Vidéos", value: `${videos.length}` },
  ];

  return (
    <main className="min-h-[100dvh] bg-background pb-28 pt-14">
      <div className="flex flex-col items-center px-6">
        <img
          src="https://api.dicebear.com/9.x/avataaars/svg?seed=moi&backgroundColor=ffd5dc"
          alt="Ta photo de profil"
          className="size-24 rounded-full border-2 border-primary bg-card"
        />
        <h1 className="mt-3 text-lg font-bold text-foreground">@toi</h1>
        <p className="mt-1 text-sm text-muted-foreground">Créateur de boucles infinies ♾️</p>

        <div className="mt-6 flex w-full max-w-xs justify-between">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-base font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-0.5 px-0.5">
        {videos.map((v) => (
          <div key={v.id} className="aspect-[9/16] overflow-hidden bg-card">
            <video src={v.video_url} muted playsInline className="h-full w-full object-cover" />
          </div>
        ))}
      </div>

      <BottomNav />
    </main>
  );
}
