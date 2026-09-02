import { useState } from "react";
import { Send, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { addComment } from "@/lib/videos.functions";
import { commentsQueryOptions } from "@/lib/videos-queries";

type Props = {
  videoId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const MY_AVATAR = "https://api.dicebear.com/9.x/avataaars/svg?seed=moi&backgroundColor=ffd5dc";

export function CommentsSheet({ videoId, open, onOpenChange }: Props) {
  const [draft, setDraft] = useState("");
  const queryClient = useQueryClient();
  const post = useServerFn(addComment);

  const { data: comments = [], isLoading } = useQuery({
    ...commentsQueryOptions(videoId),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: (text: string) =>
      post({ data: { videoId, username: "toi", avatarUrl: MY_AVATAR, text } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", videoId] });
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
  });

  if (!open) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || mutation.isPending) return;
    setDraft("");
    mutation.mutate(text);
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
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
          {isLoading && <p className="text-sm text-muted-foreground">Chargement…</p>}
          {!isLoading && comments.length === 0 && (
            <p className="text-sm text-muted-foreground">Sois le premier à commenter ✨</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <img
                src={c.avatar_url ?? MY_AVATAR}
                alt=""
                className="size-9 rounded-full bg-muted"
              />
              <div>
                <p className="text-xs font-semibold text-muted-foreground">@{c.username}</p>
                <p className="text-sm text-card-foreground">{c.text}</p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={submit} className="flex items-center gap-2 border-t border-border p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ajouter un commentaire…"
            className="h-11 flex-1 rounded-full bg-secondary px-4 text-sm text-secondary-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={mutation.isPending}
            aria-label="Envoyer"
            className="flex size-11 items-center justify-center rounded-full bg-brand-gradient disabled:opacity-60"
          >
            <Send className="size-5 text-primary-foreground" />
          </button>
        </form>
      </div>
    </div>
  );
}
