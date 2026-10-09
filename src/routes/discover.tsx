import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { FeedError } from "@/components/FeedError";
import { videosQueryOptions } from "@/lib/videos-queries";
import { toggleFollow, useLocalProfile } from "@/lib/local-profile";
import { playPop } from "@/lib/pop-sound";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Découvrir — ClipClap" },
      { name: "description", content: "Cherche des créateurs et des hashtags tendance sur ClipClap." },
      { property: "og:title", content: "Découvrir — ClipClap" },
      { property: "og:description", content: "Tendances du moment et créateurs suggérés sur ClipClap." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(videosQueryOptions()),
  errorComponent: ({ reset }) => <FeedError reset={reset} label="Découvrir" />,
  component: Discover,
});

const TRENDS = ["#neon", "#cyberpunk", "#dance", "#vibes", "#music", "#art"];

const followersOf = (name: string) => {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return 800 + (h % 9200);
};

function Discover() {
  const { data: videos } = useSuspenseQuery(videosQueryOptions());
  const profile = useLocalProfile();
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase().replace(/^@/, "");

  const creators = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const v of videos) if (!map.has(v.username)) map.set(v.username, v.profile_pic);
    return [...map.entries()]
      .filter(([u]) => u !== profile.username)
      .map(([username, avatar]) => ({ username, avatar }));
  }, [videos, profile.username]);

  const shownCreators = query
    ? creators.filter((c) => c.username.toLowerCase().includes(query.replace(/^#/, "")))
    : creators;
  const matchingVideos = query
    ? videos.filter(
        (v) =>
          (v.description ?? "").toLowerCase().includes(query) ||
          v.username.toLowerCase().includes(query),
      )
    : [];

  return (
    <main className="min-h-[100dvh] bg-background px-4 pb-32 pt-[calc(env(safe-area-inset-top)+1rem)]">
      <label className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5">
        <span className="text-xl">🔍</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un utilisateur, un hashtag..."
          className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
        />
      </label>

      <h2 className="mt-7 text-sm font-bold uppercase tracking-widest text-muted-foreground">
        Tendances du moment
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {TRENDS.map((t) => (
          <button
            key={t}
            onClick={() => setQ(q === t ? "" : t)}
            className={`rounded-full border px-5 py-2.5 text-sm font-bold transition-colors ${
              q === t ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {query && (
        <>
          <h2 className="mt-7 text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Vidéos ({matchingVideos.length})
          </h2>
          {matchingVideos.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Aucune vidéo pour « {q} ».</p>
          ) : (
            <div className="mt-3 grid grid-cols-3 gap-1">
              {matchingVideos.map((v) => (
                <Link
                  key={v.id}
                  to="/creator/$username"
                  params={{ username: v.username }}
                  className="relative aspect-[9/16] overflow-hidden rounded-lg bg-card"
                >
                  <video src={v.video_url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                  <span className="absolute bottom-1 left-1 text-[11px] font-bold text-foreground text-shadow-soft">
                    @{v.username}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      <h2 className="mt-7 text-sm font-bold uppercase tracking-widest text-muted-foreground">
        Créateurs suggérés
      </h2>
      <div className="mt-3 space-y-3">
        {shownCreators.length === 0 && <p className="text-sm text-muted-foreground">Aucun créateur trouvé.</p>}
        {shownCreators.map((c) => {
          const following = profile.following.includes(c.username);
          const followers = followersOf(c.username) + (following ? 1 : 0);
          return (
            <div key={c.username} className="flex items-center gap-4 rounded-3xl border border-border bg-card p-4">
              <Link to="/creator/$username" params={{ username: c.username }} className="flex min-w-0 flex-1 items-center gap-4">
                <img
                  src={c.avatar ?? `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(c.username)}`}
                  alt={`Photo de ${c.username}`}
                  className="size-14 shrink-0 rounded-full border-2 border-primary bg-secondary object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate font-bold text-foreground">@{c.username}</p>
                  <p className="text-sm text-muted-foreground">{followers.toLocaleString("fr-FR")} abonnés</p>
                </div>
              </Link>
              <button
                onClick={() => {
                  playPop();
                  toggleFollow(c.username);
                }}
                className={`shrink-0 rounded-full px-5 py-2 text-sm font-bold transition-transform active:scale-95 ${
                  following ? "border border-border bg-secondary text-secondary-foreground" : "bg-brand-gradient text-primary-foreground"
                }`}
              >
                {following ? "Abonné" : "Suivre"}
              </button>
            </div>
          );
        })}
      </div>

      <BottomNav />
    </main>
  );
}
