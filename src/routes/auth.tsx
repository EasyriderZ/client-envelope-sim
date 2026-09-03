import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Espace client — Connexion | Simulateur patrimonial" },
      {
        name: "description",
        content:
          "Créez votre compte pour enregistrer vos simulations d'enveloppes fiscales et retrouver vos comparateurs personnalisés.",
      },
      { property: "og:title", content: "Espace client — Connexion" },
      {
        property: "og:description",
        content: "Connectez-vous pour retrouver vos comparateurs d'enveloppes fiscales.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nom, setNom] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/espace" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/espace`,
            data: { nom },
          },
        });
        if (error) throw error;
        toast.success("Compte créé. Vérifiez votre boîte mail pour confirmer votre adresse.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/espace" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-7 shadow-card">
        <Link to="/" className="text-sm font-semibold text-brand">
          ← Retour au simulateur
        </Link>
        <h1 className="mt-4 text-2xl font-extrabold text-foreground">
          {mode === "login" ? "Connexion à votre espace" : "Créer votre espace client"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enregistrez votre profil fiscal et retrouvez vos comparateurs à tout moment.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "signup" ? (
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-foreground">Nom</span>
              <input
                className="field-input focus:field-input-focus"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                autoComplete="name"
              />
            </label>
          ) : null}
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-foreground">Email</span>
            <input
              type="email"
              required
              className="field-input focus:field-input-focus"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-foreground">Mot de passe</span>
            <input
              type="password"
              required
              minLength={6}
              className="field-input focus:field-input-focus"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-primary px-6 py-3 text-base font-bold text-primary-foreground shadow-cta transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            {busy ? "Patientez…" : mode === "login" ? "Se connecter" : "Créer mon compte"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="mt-5 w-full text-sm font-semibold text-brand"
        >
          {mode === "login"
            ? "Pas encore de compte ? Inscrivez-vous"
            : "Déjà inscrit ? Connectez-vous"}
        </button>
      </div>
    </div>
  );
}
