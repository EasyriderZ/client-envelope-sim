import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { FiscalSettingsForm } from "@/components/simulateur/FiscalSettingsForm";
import { DEFAULT_SETTINGS, type FiscalSettings } from "@/lib/fiscalite";
import {
  enregistrerMesParametres,
  getMesParametres,
  reinitialiserMesParametres,
} from "@/lib/simulateur.functions";

export const Route = createFileRoute("/_authenticated/parametres")({
  head: () => ({
    meta: [
      { title: "Mes paramètres fiscaux | Simulateur patrimonial" },
      {
        name: "description",
        content:
          "Personnalisez vos taux de prélèvement, abattements, plafonds de déduction PER et seuils du barème de l'impôt.",
      },
      { property: "og:title", content: "Mes paramètres fiscaux" },
      {
        property: "og:description",
        content: "Ajustez taux, abattements, plafonds PER et tranches de revenus de vos simulations.",
      },
    ],
  }),
  component: MesParametres,
});

function MesParametres() {
  const queryClient = useQueryClient();
  const fetchParams = useServerFn(getMesParametres);
  const save = useServerFn(enregistrerMesParametres);
  const reset = useServerFn(reinitialiserMesParametres);

  const query = useQuery({ queryKey: ["fiscal-settings"], queryFn: () => fetchParams() });
  const [draft, setDraft] = useState<FiscalSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (query.data) setDraft(query.data.settings);
  }, [query.data]);

  const saveMutation = useMutation({
    mutationFn: () => save({ data: draft }),
    onSuccess: () => {
      toast.success("Paramètres enregistrés");
      queryClient.invalidateQueries({ queryKey: ["fiscal-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetMutation = useMutation({
    mutationFn: () => reset(),
    onSuccess: () => {
      toast.success("Retour aux valeurs de référence");
      queryClient.invalidateQueries({ queryKey: ["fiscal-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">Mes paramètres fiscaux</h1>
      <p className="mt-3 text-base text-muted-foreground">
        Ces valeurs surchargent les paramètres de référence pour vos propres simulations.
        {query.data?.personnalise
          ? " Vous utilisez actuellement des valeurs personnalisées."
          : " Vous utilisez actuellement les valeurs de référence."}
      </p>

      <section className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-card">
        {query.isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : (
          <>
            <FiscalSettingsForm value={draft} onChange={setDraft} />
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-cta transition-transform hover:-translate-y-0.5 disabled:opacity-60"
              >
                Enregistrer mes paramètres
              </button>
              <button
                type="button"
                onClick={() => resetMutation.mutate()}
                disabled={resetMutation.isPending}
                className="rounded-xl border border-border px-6 py-3 text-sm font-bold text-foreground disabled:opacity-60"
              >
                Revenir aux valeurs de référence
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
