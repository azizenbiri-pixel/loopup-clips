import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setUsername(profile.username);
    setDisplayName(profile.displayName);
    setBio(profile.bio);
    setError(null);
  }, [open, profile.username, profile.displayName, profile.bio]);

  if (!open || typeof document === "undefined") return null;

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
          avatarUrl: profile.avatar || null,
        },
      });
      updateProfile({ username: name, displayName: displayName.trim(), bio: bio.trim() });
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
          disabled={busy}
          className="w-full rounded-full bg-brand-gradient py-3 text-sm font-bold text-primary-foreground transition-transform active:scale-95 disabled:opacity-60"
        >
          {busy ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>
    </div>,
    document.body,
  );
}
