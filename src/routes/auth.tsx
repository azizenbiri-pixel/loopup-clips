import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useSession } from "@/lib/session";
import { ClipClapLogo } from "@/components/ClipClapLogo";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion — ClipClap" },
      { name: "description", content: "Crée ton compte ClipClap ou connecte-toi pour publier tes vidéos." },
      { property: "og:title", content: "Connexion — ClipClap" },
      { property: "og:description", content: "Rejoins ClipClap : ton profil, tes vidéos, tes abonnés." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useSession();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (user) navigate({ to: "/profile" });
  }, [user, navigate]);

  const google = async () => {
    setErr(null);
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) setErr("Connexion Google impossible. Réessaie.");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { username: username.trim() || undefined },
          },
        });
        if (error) throw error;
        setMsg("Compte créé ! Ouvre l'e-mail de confirmation pour activer ton compte.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e) {
      const m = e instanceof Error ? e.message : "";
      setErr(
        m.includes("Invalid login")
          ? "E-mail ou mot de passe incorrect."
          : m.includes("not confirmed")
            ? "Confirme d'abord ton e-mail (regarde ta boîte de réception)."
            : m || "Une erreur est survenue.",
      );
    } finally {
      setBusy(false);
    }
  };

  const input =
    "w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-base text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring";

  return (
    <main className="min-h-[100dvh] bg-background px-6 pb-10 pt-[calc(env(safe-area-inset-top)+1rem)]">
      <button onClick={() => navigate({ to: "/" })} aria-label="Retour" className="flex size-10 items-center justify-center">
        <ArrowLeft className="size-6 text-foreground" />
      </button>
      <div className="mx-auto mt-4 flex max-w-sm flex-col items-center">
        <ClipClapLogo className="size-20" />
        <h1 className="mt-3 text-2xl font-extrabold text-foreground">
          {mode === "signin" ? "Content de te revoir" : "Crée ton profil"}
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Publie tes vidéos, gagne des abonnés et des likes.
        </p>

        <button
          onClick={google}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-foreground py-3.5 text-base font-bold text-background active:scale-95"
        >
          <span className="text-lg font-black">G</span> Continuer avec Google
        </button>

        <div className="my-5 flex w-full items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="w-full space-y-3">
          {mode === "signup" && (
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Pseudo (ex : azizenbiri)"
              maxLength={30}
              className={input}
            />
          )}
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" className={input} />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe (6 caractères min.)"
            className={input}
          />
          {err && <p className="text-sm text-destructive">{err}</p>}
          {msg && <p className="text-sm font-semibold text-primary">{msg}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-2xl bg-brand-gradient py-3.5 text-base font-bold text-primary-foreground shadow-glow disabled:opacity-60"
          >
            {busy ? "Patiente…" : mode === "signin" ? "Se connecter" : "Créer mon compte"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setErr(null);
            setMsg(null);
          }}
          className="mt-5 text-sm text-muted-foreground"
        >
          {mode === "signin" ? "Pas encore de compte ? " : "Déjà un compte ? "}
          <span className="font-bold text-primary">{mode === "signin" ? "Inscris-toi" : "Connecte-toi"}</span>
        </button>
      </div>
    </main>
  );
}
