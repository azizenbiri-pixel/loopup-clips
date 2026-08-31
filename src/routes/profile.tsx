import { createFileRoute } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";
import { videos } from "@/lib/feed-data";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Ton profil — LoopUp" },
      { name: "description", content: "Retrouve tes vidéos, tes abonnés et tes likes sur LoopUp." },
      { property: "og:title", content: "Ton profil — LoopUp" },
      { property: "og:description", content: "Tes boucles, tes abonnés et tes likes réunis." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const stats = [
    { label: "Abonnements", value: "128" },
    { label: "Abonnés", value: "3 402" },
    { label: "Likes", value: "58,1K" },
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
            <video src={v.src} muted playsInline className="h-full w-full object-cover" />
          </div>
        ))}
      </div>

      <BottomNav />
    </main>
  );
}
