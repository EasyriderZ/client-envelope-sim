import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { FiscalSettingsForm } from "@/components/simulateur/FiscalSettingsForm";
import { DEFAULT_SETTINGS, type FiscalSettings } from "@/lib/fiscalite";
import { enregistrerParametresGlobaux, getMesParametres } from "@/lib/simulateur.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administration fiscale | Simulateur patrimonial" },
      {
        name: "description",
        content:
          "Définissez les taux de prélèvement, abattements, plafonds de déduction et seuils de revenus de référence appliqués à tous les clients.",
      },
      { property: "og:title", content: "Administration des paramètres fiscaux" },
      {
        property: "og:description",
        content: "Valeurs de référence appliquées par défaut aux simulations de tous les clients.",
      },
    ],
  }),
  component: AdminParametres,
});

function AdminParametres() {
  const queryClient = useQueryClient();
  const fetchParams = useServerFn(getMesParametres);
  const saveGlobal = useServerFn(enregistrerParametresGlobaux);

  const query = useQuery({ queryKey: ["fiscal-settings"], queryFn: () => fetchParams() });
  const [draft, setDraft] = useState<FiscalSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (query.data) setDraft(query.data.global);
  }, [query.data]);

  const saveMutation = useMutation({
    mutationFn: () => saveGlobal({ data: draft }),
    onSuccess: () => {
      toast.success("Valeurs de référence mises à jour");
      queryClient.invalidateQueries({ queryKey: ["fiscal-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (query.isLoading) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-10">
        <p className="text-sm text-muted-foreground">Chargement…</p>
      </main>
    );
  }

  if (!query.data?.isAdmin) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-10">
        <h1 className="text-3xl font-extrabold text-foreground">Accès réservé</h1>
        <p className="mt-3 text-base text-muted-foreground">
          Cette page est réservée aux administrateurs du cabinet.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">
        Paramètres fiscaux de référence
      </h1>
      <p className="mt-3 text-base text-muted-foreground">
        Ces valeurs s'appliquent par défaut à tous les clients qui n'ont pas personnalisé leurs
        propres paramètres.
      </p>

      <section className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-card">
        <FiscalSettingsForm value={draft} onChange={setDraft} />
        <div className="mt-7 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-cta transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            Enregistrer les valeurs de référence
          </button>
          <button
            type="button"
            onClick={() => setDraft(DEFAULT_SETTINGS)}
            className="rounded-xl border border-border px-6 py-3 text-sm font-bold text-foreground"
          >
            Recharger le barème 2026
          </button>
        </div>
      </section>
    </main>
  );
}
