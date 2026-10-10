import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Camera, ChevronLeft, Play } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { videosQueryOptions } from "@/lib/videos-queries";
import { updateProfile, useLocalProfile } from "@/lib/local-profile";
import { supabase } from "@/integrations/supabase/client";
import { EditProfileSheet } from "@/components/EditProfileSheet";
import { FeedError } from "@/components/FeedError";
import { formatCount } from "@/lib/feed-data";
import { playPop } from "@/lib/pop-sound";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Ton profil — ClipClap" },
      { name: "description", content: "Retrouve tes vidéos, tes favoris, tes abonnés et tes likes sur ClipClap." },
      { property: "og:title", content: "Ton profil — ClipClap" },
      { property: "og:description", content: "Tes boucles, tes favoris, tes abonnés et tes likes réunis." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(videosQueryOptions()),
  errorComponent: ({ reset }) => <FeedError reset={reset} label="ton profil" />,
  component: Profile,
});

function Profile() {
  const { data: videos } = useSuspenseQuery(videosQueryOptions());
  const profile = useLocalProfile();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [tab, setTab] = useState<"mine" | "saved">("mine");

  const mine = videos.filter((v) => profile.myVideos.includes(v.id));
  const saved = videos.filter((v) => profile.saved.includes(v.id));
  const shown = tab === "mine" ? mine : saved;
  const likes = mine.reduce((n, v) => n + v.likes_count, 0);

  const flash = (m: string) => {
    setNotice(m);
    setTimeout(() => setNotice(null), 2500);
  };

  const onPickAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `avatars/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("videos")
        .upload(path, file, { contentType: file.type || "image/jpeg", upsert: false });
      if (uploadError) throw uploadError;
      const { data: signed, error: signError } = await supabase.storage
        .from("videos")
        .createSignedUrl(path, TEN_YEARS);
      if (signError || !signed) throw signError ?? new Error("URL indisponible");
      updateProfile({ avatar: signed.signedUrl });
    } catch (err) {
      flash(err instanceof Error ? err.message : "Échec de l'envoi");
    } finally {
      setBusy(false);
    }
  };

  const onShare = () => {
    const url = `${window.location.origin}/creator/${encodeURIComponent(profile.username)}`;
    const text = `Découvre mon profil @${profile.username} sur ClipClap`;
    let framed = true;
    try {
      framed = window.self !== window.top;
    } catch {
      /* iframe */
    }
    if (!framed && typeof navigator.share === "function") {
      navigator.share({ title: "ClipClap", text, url }).catch(() => undefined);
      playPop();
      return;
    }
    playPop();
    navigator.clipboard
      .writeText(`${text} ${url}`)
      .then(() => flash("Lien du profil copié !"))
      .catch(() => flash("Copie impossible"));
  };

  const stats = [
    { label: "Abonnements", value: `${profile.following.length}` },
    { label: "Abonnés", value: "0" },
    { label: "J'aime", value: formatCount(likes) },
  ];

  return (
    <main className="min-h-[100dvh] bg-background pb-28 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
      <button
        onClick={() => router.history.back()}
        aria-label="Retour"
        className="ml-3 flex size-10 items-center justify-center rounded-full text-foreground"
      >
        <ChevronLeft className="size-6" />
      </button>

      <div className="flex flex-col items-center px-6">
        <div className="relative">
          <img
            src={profile.avatar}
            alt="Ta photo de profil"
            className="size-28 rounded-full border-[3px] border-primary bg-card object-cover"
          />
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickAvatar} />
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            aria-label="Changer ta photo de profil"
            className="absolute bottom-0 right-0 flex size-9 items-center justify-center rounded-full bg-brand-gradient transition-transform active:scale-90 disabled:opacity-60"
          >
            <Camera className="size-4 text-primary-foreground" />
          </button>
        </div>
        <h1 className="mt-3 flex items-center gap-1.5 text-2xl font-extrabold text-foreground">
          {profile.displayName || profile.username} <span className="text-primary">✓</span>
        </h1>
        <p className="text-sm text-muted-foreground">@{profile.username}</p>
        <p className="mt-2 text-center text-sm text-foreground/90">{profile.bio}</p>
        {busy && <p className="mt-2 text-xs text-muted-foreground">Envoi de la photo…</p>}

        <div className="mt-6 flex w-full max-w-xs items-center justify-between">
          {stats.map((s, i) => (
            <div key={s.label} className={`flex-1 text-center ${i ? "border-l border-border" : ""}`}>
              <p className="text-xl font-extrabold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex w-full max-w-sm gap-2">
          <button
            type="button"
            onClick={() => {
              playPop();
              setEditOpen(true);
            }}
            className="flex-1 rounded-2xl border border-border bg-card py-3 text-sm font-bold text-card-foreground active:scale-95"
          >
            Modifier le profil
          </button>
          <button
            type="button"
            onClick={onShare}
            className="rounded-2xl border border-border bg-card px-4 text-sm font-bold text-card-foreground active:scale-95"
          >
            Partager
          </button>
        </div>
        {notice && <p role="status" className="mt-2 text-xs font-semibold text-foreground">{notice}</p>}
      </div>

      <EditProfileSheet open={editOpen} onOpenChange={setEditOpen} />

      <div className="mx-4 mt-6 flex justify-center gap-10 border-t border-border pt-4">
        {(["mine", "saved"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 pb-1 text-base font-bold ${
              tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground"
            }`}
          >
            {t === "mine" ? "Mes vidéos" : "Favoris"}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="mt-10 px-8 text-center text-sm text-muted-foreground">
          {tab === "mine"
            ? "Tu n'as encore rien publié. Appuie sur + ou va dans le Studio 🎙️"
            : "Aucun favori. Appuie sur 📌 sur une vidéo pour l'ajouter ici."}
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-3 gap-1 px-1">
          {shown.map((v) => (
            <div key={v.id} className="relative aspect-[9/16] overflow-hidden rounded-lg bg-card">
              <video src={v.video_url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
              <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-md bg-background/70 px-1.5 py-0.5 text-[11px] font-bold text-foreground">
                <Play className="size-3" fill="currentColor" /> {formatCount(v.views_count)}
              </span>
            </div>
          ))}
        </div>
      )}

      <BottomNav />
    </main>
  );
}
