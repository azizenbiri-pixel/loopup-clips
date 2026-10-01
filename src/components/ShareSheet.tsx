import { useState } from "react";
import { createPortal } from "react-dom";
import { Link2, MessageCircle, MessageSquare, MoreHorizontal, UserRound, X } from "lucide-react";
import { playPop } from "@/lib/pop-sound";

type ContactsApi = {
  select: (
    props: string[],
    opts?: { multiple?: boolean },
  ) => Promise<{ name?: string[]; tel?: string[] }[]>;
};

export function ShareSheet({
  open,
  onOpenChange,
  url,
  text,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  text: string;
}) {
  const [notice, setNotice] = useState<string | null>(null);
  if (!open || typeof document === "undefined") return null;

  const message = `${text} ${url}`;
  const flash = (m: string) => {
    setNotice(m);
    setTimeout(() => setNotice(null), 2500);
  };

  const native = async () => {
    playPop();
    try {
      if (navigator.share) {
        await navigator.share({ title: "ClipClap", text, url });
        onOpenChange(false);
      } else {
        await copy();
      }
    } catch {
      /* annulé */
    }
  };

  const copy = async () => {
    playPop();
    try {
      await navigator.clipboard.writeText(message);
      flash("Lien copié !");
    } catch {
      flash("Copie impossible");
    }
  };

  const contacts = async () => {
    playPop();
    const api = (navigator as unknown as { contacts?: ContactsApi }).contacts;
    if (api?.select) {
      try {
        const picked = await api.select(["name", "tel"], { multiple: false });
        const tel = picked[0]?.tel?.[0]?.replace(/\s/g, "");
        if (tel) {
          window.location.href = `sms:${tel}?&body=${encodeURIComponent(message)}`;
          return;
        }
      } catch {
        return;
      }
    }
    // Pas d'accès aux contacts (iOS / bureau) : feuille de partage du téléphone
    await native();
  };

  const items = [
    { label: "Contacts", icon: UserRound, onClick: contacts },
    {
      label: "WhatsApp",
      icon: MessageCircle,
      onClick: () => {
        playPop();
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
      },
    },
    {
      label: "SMS",
      icon: MessageSquare,
      onClick: () => {
        playPop();
        window.location.href = `sms:?&body=${encodeURIComponent(message)}`;
      },
    },
    { label: "Copier le lien", icon: Link2, onClick: copy },
    { label: "Plus", icon: MoreHorizontal, onClick: native },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <button
        aria-label="Fermer"
        onClick={() => onOpenChange(false)}
        className="absolute inset-0 bg-black/70"
      />
      <div className="relative w-full max-w-md rounded-t-3xl border-t border-border bg-card p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-card-foreground">Envoyer à</h2>
          <button onClick={() => onOpenChange(false)} aria-label="Fermer">
            <X className="size-5 text-muted-foreground" />
          </button>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {items.map(({ label, icon: Icon, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className="flex flex-col items-center gap-2 transition-transform active:scale-90"
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-brand-gradient">
                <Icon className="size-5 text-primary-foreground" />
              </span>
              <span className="text-center text-[11px] leading-tight text-card-foreground">
                {label}
              </span>
            </button>
          ))}
        </div>
        {notice && (
          <p role="status" className="mt-4 text-center text-xs font-semibold text-card-foreground">
            {notice}
          </p>
        )}
      </div>
    </div>,
    document.body,
  );
}
