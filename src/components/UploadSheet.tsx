import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Film, Upload, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;
const MY_AVATAR = "https://api.dicebear.com/9.x/avataaars/svg?seed=moi&backgroundColor=ffd5dc";

export function UploadSheet({ open, onOpenChange }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  if (!open || typeof document === "undefined") return null;

  const close = () => {
    if (busy) return;
    setFile(null);
    setDescription("");
    setError(null);
    onOpenChange(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || busy) return;
    setBusy(true);
    setError(null);

    try {
      const path = `${crypto.randomUUID()}.mp4`;
      const { error: uploadError } = await supabase.storage
        .from("videos")
        .upload(path, file, { contentType: file.type || "video/mp4", upsert: false });
      if (uploadError) throw uploadError;

      const { data: signed, error: signError } = await supabase.storage
        .from("videos")
        .createSignedUrl(path, TEN_YEARS);
      if (signError || !signed) throw signError ?? new Error("URL indisponible");

      const { error: insertError } = await supabase.from("videos").insert({
        video_url: signed.signedUrl,
        description: description.trim() || null,
        profile_pic: MY_AVATAR,
      });
      if (insertError) throw insertError;

      await queryClient.invalidateQueries({ queryKey: ["videos"] });
      setBusy(false);
      setFile(null);
      setDescription("");
      onOpenChange(false);
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : "Échec de l'envoi");
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      <button aria-label="Fermer" className="absolute inset-0 bg-black/50" onClick={close} />

      <form
        onSubmit={submit}
        className="relative rounded-t-3xl border-t border-border bg-card p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
      >
        <div className="flex items-center justify-between pb-3">
          <span className="text-sm font-semibold text-card-foreground">Ajouter une vidéo</span>
          <button type="button" onClick={close} aria-label="Fermer le panneau">
            <X className="size-5 text-muted-foreground" />
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/*"
          className="hidden"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setError(null);
          }}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-border bg-secondary p-4 text-left"
        >
          {file ? <Film className="size-5 text-accent" /> : <Upload className="size-5 text-accent" />}
          <span className="truncate text-sm text-secondary-foreground">
            {file ? file.name : "Choisir un fichier MP4"}
          </span>
        </button>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={300}
          rows={3}
          placeholder="Écris une description…"
          className="mt-3 w-full resize-none rounded-2xl bg-secondary p-4 text-sm text-secondary-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
        />

        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={!file || busy}
          className="mt-3 flex h-12 w-full items-center justify-center rounded-full bg-brand-gradient text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {busy ? "Envoi en cours…" : "Publier"}
        </button>
      </form>
    </div>,
    document.body,
  );
}
