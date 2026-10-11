import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_AVATAR, useMyProfile } from "@/lib/session";
import { uploadAvatar } from "@/lib/publish-video";
import { playPop } from "@/lib/pop-sound";

export function EditProfileSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user, profile } = useMyProfile();
  const qc = useQueryClient();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !profile) return;
    setUsername(profile.username);
    setDisplayName(profile.display_name ?? "");
    setBio(profile.bio ?? "");
    setAvatar(profile.avatar_url);
    setError(null);
  }, [open, profile]);

  if (!open || !user || !profile || typeof document === "undefined") return null;

  const onPickAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      setAvatar(await uploadAvatar(file, user.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'envoi de la photo");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = username.trim().toLowerCase().replace(/[^a-z0-9_.]/g, "");
    if (name.length < 2) {
      setError("Choisis un pseudo (lettres, chiffres, _ ou .).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { data: taken } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", name)
        .neq("id", user.id)
        .maybeSingle();
      if (taken) throw new Error("Ce pseudo est déjà pris.");
      const { error: upErr } = await supabase
        .from("profiles")
        .update({
          username: name,
          display_name: displayName.trim() || null,
          bio: bio.trim() || null,
          avatar_url: avatar,
        })
        .eq("id", user.id);
      if (upErr) throw upErr;
      if (avatar) await supabase.from("videos").update({ profile_pic: avatar }).eq("user_id", user.id);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["me"] }),
        qc.invalidateQueries({ queryKey: ["videos"] }),
        qc.invalidateQueries({ queryKey: ["creator"] }),
      ]);
      playPop();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'enregistrement");
    } finally {
      setBusy(false);
    }
  };

  const field =
    "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary";

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <button aria-label="Fermer" onClick={() => onOpenChange(false)} className="absolute inset-0 bg-black/70" />
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
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="relative" aria-label="Changer la photo de profil">
            <img src={avatar ?? DEFAULT_AVATAR(profile.username)} alt="Ta photo de profil" className="size-24 rounded-full border-2 border-primary bg-secondary object-cover" />
            <span className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full bg-brand-gradient">
              <Camera className="size-4 text-primary-foreground" />
            </span>
          </button>
          <span className="text-xs text-muted-foreground">{uploading ? "Envoi…" : "Changer la photo"}</span>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickAvatar} />
        </div>

        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">Pseudo</span>
          <input value={username} onChange={(e) => setUsername(e.target.value)} maxLength={30} className={field} />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">Nom d'affichage</span>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={60} className={field} />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">Bio</span>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={200} rows={3} className={`${field} resize-none`} />
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
