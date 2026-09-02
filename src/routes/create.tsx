import { createFileRoute } from "@tanstack/react-router";
import { Upload, Video } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Créer une vidéo — ClipClap" },
      { name: "description", content: "Enregistre ou importe une vidéo courte à publier sur ClipClap." },
      { property: "og:title", content: "Créer une vidéo — ClipClap" },
      { property: "og:description", content: "Enregistre ou importe ta prochaine vidéo ClipClap." },
    ],
  }),
  component: Create,
});

function Create() {
  return (
    <main className="min-h-[100dvh] bg-background px-6 pb-28 pt-16">
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Créer</h1>
      <p className="mt-1 text-sm text-muted-foreground">Partage ta prochaine boucle.</p>

      <div className="mt-8 space-y-4">
        <button className="flex w-full items-center gap-4 rounded-2xl bg-brand-gradient p-5 text-left shadow-glow">
          <Video className="size-6 text-primary-foreground" />
          <span className="text-base font-semibold text-primary-foreground">Enregistrer</span>
        </button>
        <button className="flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-5 text-left">
          <Upload className="size-6 text-accent" />
          <span className="text-base font-semibold text-card-foreground">Importer une vidéo</span>
        </button>
      </div>

      <BottomNav />
    </main>
  );
}
