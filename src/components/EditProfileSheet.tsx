import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { saveMyProfile } from "@/lib/videos.functions";
import { updateProfile, useLocalProfile } from "@/lib/local-profile";
import { playPop } from "@/lib/pop-sound";

export function EditProfileSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const profile = useLocalProfile();
  const save = useServerFn(saveMyProfile);
  const [username, setUsername] = useState(profile.username);
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio);
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setUsername(profile.username);
    setDisplayName(profile.displayName);
    setBio(profile.bio);
    setAvatar(profile.avatar);
    setError(null);
  }, [open, profile.username, profile.displayName, profile.bio]);

  if (!open || typeof document === "undefined") return null;

  const onPickAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `avatars/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("videos")
        .upload(path, file, { contentType: file.type || "image/jpeg", upsert: false });
      if (upErr) throw upErr;
      const { data: signed, error: signErr } = await supabase.storage
        .from("videos")
        .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (signErr || !signed) throw signErr ?? new Error("URL indisponible");
      setAvatar(signed.signedUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'envoi de la photo");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = username.trim();
    if (!name) {
      setError("Choisis un pseudo.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await save({
        data: {
          id: profile.id,
          username: name,
          displayName: displayName.trim() || null,
          bio: bio.trim() || null,
          avatarUrl: avatar || null,
        },
      });
      updateProfile({ avatar, username: name, displayName: displayName.trim(), bio: bio.trim() });
      playPop();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'enregistrement");
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <button
        aria-label="Fermer"
        onClick={() => onOpenChange(false)}
        className="absolute inset-0 bg-black/70"
      />
      <form
        onSubmit={onSubmit}
        className="relative w-full max-w-md space-y-4 rounded-t-3xl border-t border-border bg-card p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-card-foreground">Modifier le profil</h2>
          <button type="button" onClick={() => onOpenChange(false)} aria-label="Fermer">
            <X className="size-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="relative"
            aria-label="Changer la photo de profil"
          >
            <img
              src={avatar}
              alt="Ta photo de profil"
              className="size-24 rounded-full border-2 border-primary object-cover"
            />
            <span className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full bg-brand-gradient">
              <Camera className="size-4 text-primary-foreground" />
            </span>
          </button>
          <span className="text-xs text-muted-foreground">
            {uploading ? "Envoi…" : "Changer la photo"}
          </span>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPickAvatar}
          />
        </div>

        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">Pseudo</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={40}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">Nom d'affichage</span>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={60}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">Bio</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={200}
            rows={3}
            className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          />
        </label>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={busy || uploading}
          className="w-full rounded-full bg-brand-gradient py-3 text-sm font-bold text-primary-foreground transition-transform active:scale-95 disabled:opacity-60"
        >
          {busy ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>
    </div>,
    document.body,
  );
}
