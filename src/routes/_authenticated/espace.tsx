import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { NumberField } from "@/components/simulateur/NumberField";
import { RankCard } from "@/components/simulateur/RankCard";
import { Disclaimer } from "@/components/simulateur/Disclaimer";
import { comparer, euro, type Inputs } from "@/lib/enveloppes";
import { DEFAULT_SETTINGS, impotRevenu, parts, plafondPer, tmi, pct } from "@/lib/fiscalite";
import {
  enregistrerSimulation,
  envoyerComparateurParMail,
  getMesParametres,
  listerSimulations,
} from "@/lib/simulateur.functions";

export const Route = createFileRoute("/_authenticated/espace")({
  head: () => ({
    meta: [
      { title: "Mon comparateur personnalisé | Simulateur patrimonial" },
      {
        name: "description",
        content:
          "Renseignez vos revenus, enfants et cotisations : votre TMI et votre plafond PER sont calculés puis appliqués au comparateur d'enveloppes.",
      },
      { property: "og:title", content: "Mon comparateur personnalisé" },
      {
        property: "og:description",
        content: "Comparateur d'enveloppes fiscales calculé à partir de votre situation réelle.",
      },
    ],
  }),
  component: EspaceClient,
});

type Profil = {
  revenusAnnuels: number;
  enfants: number;
  cotisationsDeduites: number;
  couple: boolean;
};

const profilDefaut: Profil = {
  revenusAnnuels: 45000,
  enfants: 0,
  cotisationsDeduites: 0,
  couple: false,
};

const placementDefaut = {
  capitalInitial: 10000,
  versementMensuel: 300,
  duree: 15,
  rendement: 5,
  tauxLivretA: 3,
  tmiRetraite: 11,
};

function EspaceClient() {
  const queryClient = useQueryClient();
  const fetchParams = useServerFn(getMesParametres);
  const fetchSimulations = useServerFn(listerSimulations);
  const saveSimulation = useServerFn(enregistrerSimulation);
  const sendMail = useServerFn(envoyerComparateurParMail);

  const [profil, setProfil] = useState<Profil>(profilDefaut);
  const [placement, setPlacement] = useState(placementDefaut);

  const paramsQuery = useQuery({ queryKey: ["fiscal-settings"], queryFn: () => fetchParams() });
  const historique = useQuery({ queryKey: ["simulations"], queryFn: () => fetchSimulations() });

  const settings = paramsQuery.data?.settings ?? DEFAULT_SETTINGS;

  const calc = useMemo(() => {
    const p = {
      revenusAnnuels: profil.revenusAnnuels,
      cotisationsDeduites: profil.cotisationsDeduites,
      enfants: profil.enfants,
      couple: profil.couple,
    };
    const tmiActuelle = tmi(p, settings);
    const plafond = plafondPer(p, settings);
    const ir = impotRevenu(p, settings);
    const inputs: Inputs = {
      ...placement,
      tmiActuelle,
      couple: profil.couple,
      plafondPerAnnuel: plafond,
    };
    return { tmiActuelle, plafond, ir, nbParts: parts(p), ...comparer(inputs, settings), inputs };
  }, [profil, placement, settings]);

  const gagnant = calc.enveloppes[0]!;

  const saveMutation = useMutation({
    mutationFn: () =>
      saveSimulation({
        data: {
          revenus: profil.revenusAnnuels,
          enfants: profil.enfants,
          cotisations: profil.cotisationsDeduites,
          couple: profil.couple,
          inputs: calc.inputs as unknown as Record<string, unknown>,
          resultats: {
            tmi: calc.tmiActuelle,
            plafondPer: calc.plafond,
            totalVerse: calc.totalVerse,
            classement: calc.enveloppes.map((e) => ({ id: e.id, nom: e.nom, net: e.net })),
          },
        },
      }),
    onSuccess: () => {
      toast.success("Simulation enregistrée");
      queryClient.invalidateQueries({ queryKey: ["simulations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const mailMutation = useMutation({
    mutationFn: () =>
      sendMail({
        data: {
          resume: `${gagnant.nom} — net ${euro(gagnant.net)} sur ${placement.duree} ans`,
        },
      }),
    onSuccess: (r) => (r.sent ? toast.success("Comparateur envoyé par mail") : toast.info(r.reason)),
    onError: (e: Error) => toast.error(e.message),
  });

  const setP = <K extends keyof Profil>(k: K) => (v: Profil[K]) =>
    setProfil((f) => ({ ...f, [k]: v }));
  const setPl = (k: keyof typeof placementDefaut) => (v: number) =>
    setPlacement((f) => ({ ...f, [k]: v }));

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">Mon comparateur</h1>
      <p className="mt-3 max-w-2xl text-base text-muted-foreground">
        Renseignez votre situation : votre tranche marginale d'imposition et votre plafond de
        déduction PER sont calculés automatiquement, puis appliqués à la comparaison.
        {paramsQuery.data?.personnalise
          ? " Vos paramètres fiscaux personnalisés sont utilisés."
          : " Les paramètres fiscaux de référence sont utilisés."}
      </p>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="text-lg font-bold text-foreground">Ma situation</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <NumberField
              label="Revenus nets annuels"
              value={profil.revenusAnnuels}
              onChange={setP("revenusAnnuels")}
              suffix="€"
              step={1000}
            />
            <NumberField
              label="Nombre d'enfants à charge"
              value={profil.enfants}
              onChange={setP("enfants")}
            />
            <NumberField
              label="Cotisations déductibles"
              value={profil.cotisationsDeduites}
              onChange={setP("cotisationsDeduites")}
              suffix="€"
              step={100}
            />
          </div>
          <label className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-muted/60 p-4 text-sm font-medium text-foreground">
            <input
              type="checkbox"
              checked={profil.couple}
              onChange={(e) => setProfil((f) => ({ ...f, couple: e.target.checked }))}
              className="size-4 accent-[var(--color-brand)]"
            />
            Imposition commune (couple)
          </label>

          <h2 className="mt-6 text-lg font-bold text-foreground">Mon projet d'épargne</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <NumberField
              label="Capital initial"
              value={placement.capitalInitial}
              onChange={setPl("capitalInitial")}
              suffix="€"
              step={500}
            />
            <NumberField
              label="Versement mensuel"
              value={placement.versementMensuel}
              onChange={setPl("versementMensuel")}
              suffix="€"
              step={50}
            />
            <NumberField label="Durée" value={placement.duree} onChange={setPl("duree")} suffix="ans" min={1} />
            <NumberField
              label="Rendement brut"
              value={placement.rendement}
              onChange={setPl("rendement")}
              suffix="%"
              step={0.1}
            />
            <NumberField
              label="Taux Livret A"
              value={placement.tauxLivretA}
              onChange={setPl("tauxLivretA")}
              suffix="%"
              step={0.1}
            />
            <NumberField
              label="TMI estimée à la retraite"
              value={placement.tmiRetraite}
              onChange={setPl("tmiRetraite")}
              suffix="%"
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-cta transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            >
              Enregistrer cette simulation
            </button>
            <button
              type="button"
              onClick={() => mailMutation.mutate()}
              disabled={mailMutation.isPending}
              className="rounded-xl border border-border px-6 py-3 text-sm font-bold text-foreground disabled:opacity-60"
            >
              Recevoir par mail
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="text-lg font-bold text-foreground">Votre profil fiscal calculé</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-brand-soft p-4">
              <p className="label-eyebrow">TMI</p>
              <p className="mt-1 text-2xl font-extrabold text-brand">{pct(calc.tmiActuelle)}</p>
            </div>
            <div className="rounded-xl bg-muted/60 p-4">
              <p className="label-eyebrow">Parts fiscales</p>
              <p className="mt-1 text-2xl font-extrabold text-foreground">{calc.nbParts}</p>
            </div>
            <div className="rounded-xl bg-muted/60 p-4">
              <p className="label-eyebrow">Plafond PER</p>
              <p className="mt-1 text-2xl font-extrabold text-foreground">{euro(calc.plafond)}</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Impôt sur le revenu estimé : <strong className="text-foreground">{euro(calc.ir.impot)}</strong>
          </p>

          <h2 className="mt-6 text-lg font-bold text-foreground">Classement</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Meilleure enveloppe : <strong className="text-foreground">{gagnant.nom}</strong> · net{" "}
            <strong className="text-foreground">{euro(gagnant.net)}</strong> · total versé{" "}
            <strong className="text-foreground">{euro(calc.totalVerse)}</strong>
          </p>
          <div className="mt-4 space-y-3">
            {calc.enveloppes.map((e, i) => (
              <RankCard key={e.id} enveloppe={e} index={i} best={gagnant.net} />
            ))}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
        <h2 className="text-lg font-bold text-foreground">Mes simulations enregistrées</h2>
        {historique.isLoading ? (
          <p className="mt-3 text-sm text-muted-foreground">Chargement…</p>
        ) : (historique.data?.length ?? 0) === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Aucune simulation enregistrée.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {historique.data!.map((s) => {
              const res = (s.resultats ?? {}) as {
                classement?: { nom: string; net: number }[];
              };
              const top = res.classement?.[0];
              return (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-4 py-3 text-sm"
                >
                  <span className="text-muted-foreground">
                    {new Date(s.created_at).toLocaleString("fr-FR")} · {euro(Number(s.revenus))} de
                    revenus · {s.enfants} enfant(s)
                  </span>
                  {top ? (
                    <span className="font-semibold text-foreground">
                      {top.nom} — {euro(top.net)}
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="mt-6">
        <Disclaimer dateCalcul={new Date().toLocaleString("fr-FR")} />
      </div>
    </main>
  );
}
