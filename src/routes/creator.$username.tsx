import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { ArrowLeft, Eye } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { creatorQueryOptions } from "@/lib/videos-queries";
import { formatCount } from "@/lib/feed-data";
import { toggleFollow, useLocalProfile } from "@/lib/local-profile";
import { FeedError } from "@/components/FeedError";

export const Route = createFileRoute("/creator/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `@${params.username} — ClipClap` },
      {
        name: "description",
        content: `Découvre les vidéos, les abonnés et les likes de @${params.username} sur ClipClap.`,
      },
      { property: "og:title", content: `@${params.username} — ClipClap` },
      { property: "og:description", content: `Le profil créateur de @${params.username} sur ClipClap.` },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(creatorQueryOptions(params.username)),
  errorComponent: ({ reset }) => <FeedError reset={reset} label="ce profil" />,
  component: CreatorPage,
});

function CreatorPage() {
  const { username } = Route.useParams();
  const { data: creator } = useSuspenseQuery(creatorQueryOptions(username));
  const navigate = useNavigate();
  const me = useLocalProfile();
  const start = useRef<{ x: number; y: number } | null>(null);
  const isFollowing = me.following.includes(username);

  const stats = [
    { label: "Abonnés", value: formatCount(creator.followers) },
    { label: "Abonnements", value: formatCount(creator.following) },
    { label: "Likes", value: formatCount(creator.total_likes) },
  ];

  return (
    <main
      className="min-h-[100dvh] bg-background pb-28 pt-14"
      onTouchStart={(e) => {
        const t = e.touches[0];
        start.current = t ? { x: t.clientX, y: t.clientY } : null;
      }}
      onTouchEnd={(e) => {
        const s = start.current;
        const t = e.changedTouches[0];
        start.current = null;
        if (!s || !t) return;
        if (t.clientX - s.x > 70 && Math.abs(t.clientY - s.y) < 80) navigate({ to: "/" });
      }}
    >
      <button
        onClick={() => navigate({ to: "/" })}
        aria-label="Retour au flux"
        className="absolute left-4 top-[calc(env(safe-area-inset-top)+0.75rem)] z-20 flex size-10 items-center justify-center rounded-full bg-card/70 backdrop-blur"
      >
        <ArrowLeft className="size-5 text-foreground" />
      </button>

      <div className="flex flex-col items-center px-6">
        <img
          src={creator.avatar_url ?? "https://api.dicebear.com/9.x/avataaars/svg?seed=clipclap"}
          alt={`Photo de profil de ${creator.username}`}
          className="size-24 rounded-full border-2 border-primary bg-card object-cover"
        />
        <h1 className="mt-3 text-lg font-bold text-foreground">@{creator.username}</h1>

        <div className="mt-6 flex w-full max-w-xs justify-between">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-base font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => toggleFollow(username)}
          className={`mt-6 h-11 w-44 rounded-full text-sm font-semibold transition-transform active:scale-95 ${
            isFollowing
              ? "border border-border bg-secondary text-secondary-foreground"
              : "bg-brand-gradient text-primary-foreground shadow-glow"
          }`}
        >
          {isFollowing ? "Abonné" : "S'abonner"}
        </button>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-0.5 px-0.5">
        {creator.videos.map((v) => (
          <div key={v.id} className="relative aspect-[9/16] overflow-hidden bg-card">
            <video src={v.video_url} muted playsInline className="h-full w-full object-cover" />
            <span className="absolute bottom-1 left-1 flex items-center gap-1 text-[11px] font-semibold text-foreground text-shadow-soft">
              <Eye className="size-3.5" /> {formatCount(v.views_count)}
            </span>
          </div>
        ))}
        {creator.videos.length === 0 && (
          <p className="col-span-3 py-10 text-center text-sm text-muted-foreground">
            Pas encore de vidéo publiée.
          </p>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
