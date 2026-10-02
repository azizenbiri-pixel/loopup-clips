import { useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RotateCw } from "lucide-react";

const MAX_AUTO_RETRIES = 6;

// Shown when the feed fails to load: retries automatically in the background
// so a temporary backend hiccup recovers without the user doing anything.
export function FeedError({ reset }: { reset?: () => void }) {
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);
  const giveUp = attempt >= MAX_AUTO_RETRIES;

  const retry = () => {
    void router.invalidate().then(() => reset?.());
  };

  useEffect(() => {
    if (giveUp) return;
    const t = setTimeout(() => {
      setAttempt((a) => a + 1);
      retry();
    }, 2000 + attempt * 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, giveUp]);

  return (
    <main className="flex h-[100dvh] flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      {giveUp ? (
        <p className="text-sm text-muted-foreground">Le fil ne répond pas pour le moment.</p>
      ) : (
        <>
          <RotateCw className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Connexion au fil en cours…</p>
        </>
      )}
      <button
        onClick={() => {
          setAttempt(0);
          retry();
        }}
        className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
      >
        Réessayer
      </button>
    </main>
  );
}
