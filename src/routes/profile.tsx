import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Camera, Pencil } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { videosQueryOptions } from "@/lib/videos-queries";
import { updateProfile, useLocalProfile } from "@/lib/local-profile";
import { supabase } from "@/integrations/supabase/client";
import { EditProfileSheet } from "@/components/EditProfileSheet";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

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
  const profile = useLocalProfile();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const onPickAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError(null);
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
      setError(err instanceof Error ? err.message : "Échec de l'envoi");
    } finally {
      setBusy(false);
    }
  };

  const stats = [
    { label: "Abonnements", value: `${profile.following.length}` },
    { label: "Abonnés", value: "3 402" },
    { label: "Vidéos", value: `${videos.length}` },
  ];

  return (
    <main className="min-h-[100dvh] bg-background pb-28 pt-14">
      <div className="flex flex-col items-center px-6">
        <div className="relative">
          <img
            src={profile.avatar}
            alt="Ta photo de profil"
            className="size-24 rounded-full border-2 border-primary bg-card object-cover"
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPickAvatar}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            aria-label="Changer ta photo de profil"
            className="absolute -bottom-1 -right-1 flex size-9 items-center justify-center rounded-full bg-brand-gradient transition-transform active:scale-90 disabled:opacity-60"
          >
            <Camera className="size-4 text-primary-foreground" />
          </button>
        </div>
        <h1 className="mt-3 text-lg font-bold text-foreground">
          {profile.displayName || `@${profile.username}`}
        </h1>
        <p className="text-sm text-muted-foreground">@{profile.username}</p>
        <p className="mt-1 text-center text-sm text-muted-foreground">{profile.bio}</p>
        {busy && <p className="mt-2 text-xs text-muted-foreground">Envoi de la photo…</p>}
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

        <div className="mt-6 flex w-full max-w-xs justify-between">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-base font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="mt-6 flex items-center gap-2 rounded-full bg-brand-gradient px-6 py-2.5 text-sm font-bold text-primary-foreground transition-transform active:scale-95"
        >
          <Pencil className="size-4" /> Modifier le profil
        </button>
      </div>

      <EditProfileSheet open={editOpen} onOpenChange={setEditOpen} />

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
