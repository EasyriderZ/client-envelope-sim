import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="no-print border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <Link to="/" className="text-lg font-extrabold tracking-tight text-foreground">
            Simulateurs <span className="text-brand">patrimoniaux</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-4 text-sm font-semibold">
            <Link to="/espace" className="text-muted-foreground hover:text-brand">
              Mon comparateur
            </Link>
            <Link to="/parametres" className="text-muted-foreground hover:text-brand">
              Mes paramètres
            </Link>
            <Link to="/admin" className="text-muted-foreground hover:text-brand">
              Admin
            </Link>
            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/auth" });
              }}
              className="rounded-full border border-border px-4 py-2 text-foreground"
            >
              Déconnexion
            </button>
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
