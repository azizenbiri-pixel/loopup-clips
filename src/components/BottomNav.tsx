import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { UploadSheet } from "@/components/UploadSheet";

const item =
  "flex flex-col items-center gap-0.5 py-2 text-muted-foreground transition-colors [&.active]:font-bold [&.active]:text-primary";

export function BottomNav() {
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 pb-[env(safe-area-inset-bottom)] pt-1">
        <Link to="/" className={item} activeOptions={{ exact: true }} aria-label="Accueil">
          <span className="text-2xl leading-none">🏠</span>
          <span className="text-[11px]">Accueil</span>
        </Link>
        <Link to="/discover" className={item} aria-label="Découvrir">
          <span className="text-2xl leading-none">🔍</span>
          <span className="text-[11px]">Découvrir</span>
        </Link>
        <button
          type="button"
          onClick={() => setUploadOpen(true)}
          aria-label="Créer"
          className="group -mt-4"
        >
          <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-gradient shadow-glow transition-transform group-active:scale-95">
            <Plus className="size-7 text-primary-foreground" strokeWidth={3} />
          </span>
        </button>
        <Link to="/studio" className={item} aria-label="Studio">
          <span className="text-2xl leading-none">🎙️</span>
          <span className="text-[11px]">Studio</span>
        </Link>
        <Link to="/profile" className={item} aria-label="Profil">
          <span className="text-2xl leading-none">👤</span>
          <span className="text-[11px]">Profil</span>
        </Link>
      </div>

      <UploadSheet open={uploadOpen} onOpenChange={setUploadOpen} />
    </nav>
  );
}
