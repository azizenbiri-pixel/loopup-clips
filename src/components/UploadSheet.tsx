import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { publishVideo } from "@/lib/publish-video";
import { useLocalProfile } from "@/lib/local-profile";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function UploadSheet({ open, onOpenChange }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const profile = useLocalProfile();

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
      await publishVideo(file, description, profile.avatar);
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
      <button aria-label="Fermer" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />

      <form
        onSubmit={submit}
        className="relative rounded-t-3xl border-t border-border bg-card p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
      >
        <div className="flex items-center justify-between pb-5">
          <h2 className="text-xl font-extrabold text-card-foreground">Publier une vidéo</h2>
          <button type="button" onClick={close} aria-label="Fermer le panneau">
            <X className="size-5 text-muted-foreground" />
          </button>
        </div>

        <p className="mb-2 text-sm font-semibold text-muted-foreground">Fichier Vidéo (MP4)</p>
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
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="shrink-0 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
          >
            Choisir le fichier
          </button>
          <span className="truncate text-sm text-muted-foreground">
            {file ? file.name : "aucun fichier sélectionné"}
          </span>
        </div>

        <p className="mb-2 mt-5 text-sm font-semibold text-muted-foreground">Description & Hashtags</p>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={300}
          rows={3}
          placeholder="Décris ta vidéo avec des hashtags (#fyp, #dance...)"
          className="w-full resize-none rounded-2xl border border-border bg-secondary p-4 text-sm text-secondary-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
        />

        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={!file || busy}
          className="mt-5 flex h-13 w-full items-center justify-center rounded-2xl bg-brand-gradient py-4 text-base font-bold text-primary-foreground shadow-glow disabled:opacity-50"
        >
          {busy ? "Envoi en cours…" : "Publier sur ClipClap 🚀"}
        </button>
      </form>
    </div>,
    document.body,
  );
}
