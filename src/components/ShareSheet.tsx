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

  // Opening sms:/wa.me via a real link click works inside the preview frame,
  // where changing window.location is silently blocked.
  const openLink = (href: string) => {
    const a = document.createElement("a");
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const copy = async (prefix?: string) => {
    try {
      await navigator.clipboard.writeText(message);
      flash(prefix ? `${prefix} — lien copié !` : "Lien copié !");
    } catch {
      flash("Copie impossible");
    }
  };

  // Must be called synchronously from the tap (no await before share), else the browser refuses.
  const native = () => {
    playPop();
    if (!navigator.share) {
      void copy("Partage indisponible");
      return;
    }
    navigator
      .share({ title: "ClipClap", text, url })
      .then(() => onOpenChange(false))
      .catch((e: unknown) => {
        if ((e as { name?: string })?.name === "AbortError") return;
        void copy("Partage bloqué ici");
      });
  };

  const sms = (tel = "") => {
    openLink(`sms:${tel}?&body=${encodeURIComponent(message)}`);
  };

  const contacts = () => {
    const api = (navigator as unknown as { contacts?: ContactsApi }).contacts;
    if (!api?.select) {
      // iPhone / ordinateur : pas d'accès direct aux contacts → feuille de partage
      native();
      return;
    }
    playPop();
    api
      .select(["name", "tel"], { multiple: false })
      .then((picked) => {
        const tel = picked[0]?.tel?.[0]?.replace(/\s/g, "");
        if (tel) sms(tel);
      })
      .catch(() => native());
  };

  const items = [
    { label: "Contacts", icon: UserRound, onClick: contacts },
    {
      label: "WhatsApp",
      icon: MessageCircle,
      onClick: () => {
        playPop();
        openLink(`https://wa.me/?text=${encodeURIComponent(message)}`);
      },
    },
    {
      label: "SMS",
      icon: MessageSquare,
      onClick: () => {
        playPop();
        sms();
      },
    },
    {
      label: "Copier le lien",
      icon: Link2,
      onClick: () => {
        playPop();
        void copy();
      },
    },
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
