export type Tranche = { seuil: number | null; taux: number };

export type FiscalSettings = {
  pfu_ir: number;
  ps: number;
  av_taux_reduit: number;
  av_abattement_solo: number;
  av_abattement_couple: number;
  per_taux_deduction: number;
  per_plafond_max: number;
  per_plafond_min: number;
  bareme: Tranche[];
};

export const DEFAULT_SETTINGS: FiscalSettings = {
  pfu_ir: 12.8,
  ps: 17.2,
  av_taux_reduit: 7.5,
  av_abattement_solo: 4600,
  av_abattement_couple: 9200,
  per_taux_deduction: 10,
  per_plafond_max: 37094,
  per_plafond_min: 4637,
  bareme: [
    { seuil: 11497, taux: 0 },
    { seuil: 29315, taux: 11 },
    { seuil: 83823, taux: 30 },
    { seuil: 180294, taux: 41 },
    { seuil: null, taux: 45 },
  ],
};

export const ABATTEMENT_10_PLAFOND = 14171;

export type Profil = {
  revenusAnnuels: number;
  cotisationsDeduites: number;
  enfants: number;
  couple: boolean;
};

/** Quotient familial : 1 part (2 si couple) + 0,5 par enfant, 1 part dès le 3e. */
export function parts(profil: Profil) {
  const base = profil.couple ? 2 : 1;
  const e = Math.max(0, Math.round(profil.enfants));
  const demiParts = e <= 2 ? e * 0.5 : 1 + (e - 2);
  return base + demiParts;
}

export function revenuImposable(profil: Profil) {
  const revenus = Math.max(profil.revenusAnnuels, 0);
  const abattement = Math.min(revenus * 0.1, ABATTEMENT_10_PLAFOND);
  return Math.max(revenus - abattement - Math.max(profil.cotisationsDeduites, 0), 0);
}

function normaliseBareme(bareme: Tranche[]): Tranche[] {
  return [...bareme].sort((a, b) => (a.seuil ?? Infinity) - (b.seuil ?? Infinity));
}

/** Impôt sur le revenu par quotient familial. */
export function impotRevenu(profil: Profil, settings: FiscalSettings) {
  const p = parts(profil);
  const quotient = revenuImposable(profil) / p;
  const tranches = normaliseBareme(settings.bareme);

  let impotParPart = 0;
  let precedent = 0;
  for (const t of tranches) {
    const plafond = t.seuil ?? Infinity;
    const assiette = Math.max(Math.min(quotient, plafond) - precedent, 0);
    impotParPart += assiette * (t.taux / 100);
    precedent = plafond;
    if (quotient <= plafond) break;
  }
  return { impot: impotParPart * p, quotient, parts: p };
}

/** Tranche marginale d'imposition déduite des revenus, enfants et cotisations. */
export function tmi(profil: Profil, settings: FiscalSettings) {
  const { quotient } = impotRevenu(profil, settings);
  const tranches = normaliseBareme(settings.bareme);
  let taux = tranches[0]?.taux ?? 0;
  for (const t of tranches) {
    if (t.seuil === null || quotient <= t.seuil) return t.taux;
    taux = t.taux;
  }
  return taux;
}

/** Plafond annuel de déduction PER. */
export function plafondPer(profil: Profil, settings: FiscalSettings) {
  const brut = Math.max(profil.revenusAnnuels, 0) * (settings.per_taux_deduction / 100);
  return Math.min(Math.max(brut, settings.per_plafond_min), settings.per_plafond_max);
}

export const pct = (v: number) => `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(v)} %`;
