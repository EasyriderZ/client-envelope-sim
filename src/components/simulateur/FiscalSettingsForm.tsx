import { NumberField } from "./NumberField";
import type { FiscalSettings, Tranche } from "@/lib/fiscalite";

type Props = {
  value: FiscalSettings;
  onChange: (v: FiscalSettings) => void;
};

export function FiscalSettingsForm({ value, onChange }: Props) {
  const set = <K extends keyof FiscalSettings>(key: K) => (v: FiscalSettings[K]) =>
    onChange({ ...value, [key]: v });

  const setTranche = (index: number, patch: Partial<Tranche>) => {
    const bareme = value.bareme.map((t, i) => (i === index ? { ...t, ...patch } : t));
    onChange({ ...value, bareme });
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="label-eyebrow">Taux de prélèvement</p>
        <div className="mt-2 grid gap-4 sm:grid-cols-2">
          <NumberField label="PFU — part IR" value={value.pfu_ir} onChange={set("pfu_ir")} suffix="%" step={0.1} />
          <NumberField label="Prélèvements sociaux" value={value.ps} onChange={set("ps")} suffix="%" step={0.1} />
          <NumberField
            label="Assurance-vie > 8 ans (taux réduit)"
            value={value.av_taux_reduit}
            onChange={set("av_taux_reduit")}
            suffix="%"
            step={0.1}
          />
        </div>
      </div>

      <div>
        <p className="label-eyebrow">Abattements assurance-vie</p>
        <div className="mt-2 grid gap-4 sm:grid-cols-2">
          <NumberField
            label="Abattement célibataire"
            value={value.av_abattement_solo}
            onChange={set("av_abattement_solo")}
            suffix="€"
            step={100}
          />
          <NumberField
            label="Abattement couple"
            value={value.av_abattement_couple}
            onChange={set("av_abattement_couple")}
            suffix="€"
            step={100}
          />
        </div>
      </div>

      <div>
        <p className="label-eyebrow">Plafonds de déduction PER</p>
        <div className="mt-2 grid gap-4 sm:grid-cols-3">
          <NumberField
            label="Taux de déduction"
            value={value.per_taux_deduction}
            onChange={set("per_taux_deduction")}
            suffix="%"
            step={0.5}
          />
          <NumberField
            label="Plafond maximum"
            value={value.per_plafond_max}
            onChange={set("per_plafond_max")}
            suffix="€"
            step={100}
          />
          <NumberField
            label="Plafond plancher"
            value={value.per_plafond_min}
            onChange={set("per_plafond_min")}
            suffix="€"
            step={100}
          />
        </div>
      </div>

      <div>
        <p className="label-eyebrow">Barème de l'impôt sur le revenu (par part)</p>
        <div className="mt-2 space-y-3">
          {value.bareme.map((t, i) => (
            <div key={i} className="grid gap-4 sm:grid-cols-2">
              <NumberField
                label={t.seuil === null ? "Dernière tranche (sans plafond)" : `Seuil tranche ${i + 1}`}
                value={t.seuil ?? 0}
                onChange={(v) => setTranche(i, { seuil: t.seuil === null ? null : v })}
                suffix="€"
                step={100}
              />
              <NumberField
                label={`Taux tranche ${i + 1}`}
                value={t.taux}
                onChange={(v) => setTranche(i, { taux: v })}
                suffix="%"
                step={1}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
