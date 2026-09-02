import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { NumberField } from "@/components/simulateur/NumberField";
import { RankCard } from "@/components/simulateur/RankCard";
import { Disclaimer } from "@/components/simulateur/Disclaimer";
import { comparer, euro, type Inputs } from "@/lib/enveloppes";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Comparateur d'enveloppes fiscales | Simulateur" },
      {
        name: "description",
        content:
          "Livret A, assurance-vie, PEA, PER ou CTO : comparez le net après fiscalité à versement et rendement identiques, sur la durée de votre choix.",
      },
      { property: "og:title", content: "Comparateur d'enveloppes fiscales" },
      {
        property: "og:description",
        content:
          "Quelle enveloppe offre le meilleur net après fiscalité ? Comparaison Livret A, AV, PEA, PER et CTO.",
      },
    ],
  }),
  component: SimulateurEnveloppes,
});

const defauts: Inputs = {
  capitalInitial: 10000,
  versementMensuel: 300,
  duree: 15,
  rendement: 5,
  tauxLivretA: 3,
  tmiActuelle: 30,
  tmiRetraite: 11,
  couple: false,
};

function SimulateurEnveloppes() {
  const [form, setForm] = useState<Inputs>(defauts);
  const [applique, setApplique] = useState<Inputs>(defauts);

  const { enveloppes, totalVerse } = useMemo(() => comparer(applique), [applique]);
  const gagnant = enveloppes[0]!;


  const set = <K extends keyof Inputs>(key: K) => (value: Inputs[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const dateCalcul = new Date().toLocaleString("fr-FR");

  return (
    <div className="min-h-screen bg-background">
      <header className="no-print border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <p className="text-lg font-extrabold tracking-tight text-foreground">
              Simulateurs <span className="text-brand">patrimoniaux</span>
            </p>
            <p className="text-xs text-muted-foreground">Outils clients en marque blanche</p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-cta transition-transform hover:-translate-y-0.5"
          >
            Télécharger le PDF
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10">
        <h1 className="text-4xl font-extrabold text-foreground sm:text-5xl">
          Comparateur d'enveloppes fiscales
        </h1>
        <p className="mt-3 max-w-2xl text-base text-muted-foreground">
          À versement identique et rendement brut identique, quelle enveloppe offre le meilleur net
          après fiscalité ? Comparaison Livret A, Assurance-vie, PEA, PER et CTO.
        </p>

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-2">
          {/* Formulaire */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="rounded-xl border-l-4 border-brand bg-brand-soft p-4">
              <p className="font-bold text-foreground">Personnalisez vos simulations</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Ajustez le rendement, la durée et votre situation fiscale pour adapter la
                comparaison à votre profil.
              </p>
            </div>

            <h2 className="mt-6 text-lg font-bold text-foreground">Paramètres communs</h2>

            <p className="label-eyebrow mt-5">Versement</p>
            <div className="mt-2 space-y-4">
              <NumberField
                label="Capital initial"
                value={form.capitalInitial}
                onChange={set("capitalInitial")}
                suffix="€"
                step={500}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberField
                  label="Versement mensuel"
                  value={form.versementMensuel}
                  onChange={set("versementMensuel")}
                  suffix="€"
                  step={50}
                />
                <NumberField
                  label="Durée"
                  value={form.duree}
                  onChange={set("duree")}
                  suffix="ans"
                  min={1}
                />
              </div>
            </div>

            <p className="label-eyebrow mt-6">Rendement</p>
            <div className="mt-2 grid gap-4 sm:grid-cols-2">
              <NumberField
                label="Rendement brut (AV/PEA/PER/CTO)"
                value={form.rendement}
                onChange={set("rendement")}
                suffix="%"
                step={0.1}
              />
              <NumberField
                label="Taux Livret A"
                value={form.tauxLivretA}
                onChange={set("tauxLivretA")}
                suffix="%"
                step={0.1}
              />
            </div>

            <p className="label-eyebrow mt-6">Situation fiscale</p>
            <div className="mt-2 grid gap-4 sm:grid-cols-2">
              <NumberField
                label="TMI actuelle"
                value={form.tmiActuelle}
                onChange={set("tmiActuelle")}
                suffix="%"
              />
              <NumberField
                label="TMI retraite (PER)"
                value={form.tmiRetraite}
                onChange={set("tmiRetraite")}
                suffix="%"
              />
            </div>

            <label className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-muted/60 p-4 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                checked={form.couple}
                onChange={(e) => setForm((f) => ({ ...f, couple: e.target.checked }))}
                className="size-4 accent-[var(--color-brand)]"
              />
              Imposition couple (AV : abattement 9 200 € au lieu de 4 600 €)
            </label>

            <button
              type="button"
              onClick={() => setApplique(form)}
              className="no-print mt-6 w-full rounded-xl bg-primary px-6 py-3 text-base font-bold text-primary-foreground shadow-cta transition-transform hover:-translate-y-0.5"
            >
              ✓ Comparer
            </button>
          </section>

          {/* Résultats */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="text-lg font-bold text-foreground">Classement</h2>
            <p className="label-eyebrow mt-4 !text-muted-foreground">
              Meilleure enveloppe pour votre profil
            </p>
            <p className="mt-1 text-3xl font-extrabold text-brand sm:text-4xl">{gagnant.nom}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Net : <strong className="text-foreground">{euro(gagnant.net)}</strong> · Total versé :{" "}
              <strong className="text-foreground">{euro(totalVerse)}</strong>
            </p>

            <div className="mt-5 space-y-3">
              {enveloppes.map((e, i) => (
                <RankCard key={e.id} enveloppe={e} index={i} best={gagnant.net} />
              ))}
            </div>
          </section>
        </div>

        <div className="mt-6">
          <Disclaimer dateCalcul={dateCalcul} />
        </div>
      </main>
    </div>
  );
}
