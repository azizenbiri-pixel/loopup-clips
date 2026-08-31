import { useState } from "react";
import { Send, X } from "lucide-react";
import type { Comment, VideoItem } from "@/lib/feed-data";

type Props = {
  video: VideoItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CommentsSheet({ video, open, onOpenChange }: Props) {
  const [comments, setComments] = useState<Comment[]>(video.comments);
  const [draft, setDraft] = useState("");

  if (!open) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setComments((c) => [
      ...c,
      {
        id: `${Date.now()}`,
        user: "toi",
        avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=moi",
        text,
      },
    ]);
    setDraft("");
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <button
        aria-label="Fermer les commentaires"
        className="absolute inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative flex h-[65%] flex-col rounded-t-3xl border-t border-border bg-card">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold text-card-foreground">
            {comments.length} commentaires
          </span>
          <button onClick={() => onOpenChange(false)} aria-label="Fermer">
            <X className="size-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-2">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <img src={c.avatar} alt="" className="size-9 rounded-full bg-muted" />
              <div>
                <p className="text-xs font-semibold text-muted-foreground">@{c.user}</p>
                <p className="text-sm text-card-foreground">{c.text}</p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={submit} className="flex items-center gap-2 border-t border-border p-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ajouter un commentaire…"
            className="h-11 flex-1 rounded-full bg-secondary px-4 text-sm text-secondary-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            aria-label="Envoyer"
            className="flex size-11 items-center justify-center rounded-full bg-brand-gradient"
          >
            <Send className="size-5 text-primary-foreground" />
          </button>
        </form>
      </div>
    </div>
  );
}
