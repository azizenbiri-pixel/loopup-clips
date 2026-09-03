import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Home, Plus, User } from "lucide-react";
import { UploadSheet } from "@/components/UploadSheet";

export function BottomNav() {
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center justify-around px-6 pb-[env(safe-area-inset-bottom)] pt-2">
        <Link
          to="/"
          className="flex flex-col items-center gap-1 py-2 text-muted-foreground transition-colors [&.active]:text-foreground"
          activeOptions={{ exact: true }}
          aria-label="Accueil"
        >
          <Home className="size-6" />
          <span className="text-[10px] font-medium">Accueil</span>
        </Link>

        <Link to="/create" aria-label="Créer" className="group -mt-1">
          <span className="flex h-11 w-16 items-center justify-center rounded-xl bg-brand-gradient shadow-glow transition-transform group-active:scale-95">
            <Plus className="size-6 text-primary-foreground" strokeWidth={3} />
          </span>
        </Link>

        <Link
          to="/profile"
          className="flex flex-col items-center gap-1 py-2 text-muted-foreground transition-colors [&.active]:text-foreground"
          aria-label="Profil"
        >
          <User className="size-6" />
          <span className="text-[10px] font-medium">Profil</span>
        </Link>
      </div>
    </nav>
  );
}
