export type Inputs = {
  capitalInitial: number;
  versementMensuel: number;
  duree: number;
  rendement: number;
  tauxLivretA: number;
  tmiActuelle: number;
  tmiRetraite: number;
  couple: boolean;
};

export type Enveloppe = {
  id: string;
  nom: string;
  regle: string;
  liquidite: number;
  horizon: string;
  transmission: string;
  volatilite: string;
  net: number;
  brut: number;
  gains: number;
  impots: number;
};

export const PFU_IR = 0.128;
export const PS = 0.172;
export const PFU = PFU_IR + PS;

/** Capitalisation composée : capital initial + versements mensuels de fin de mois. */
export function valeurFuture(capital: number, mensuel: number, annees: number, tauxAnnuel: number) {
  const n = Math.round(annees * 12);
  const i = tauxAnnuel / 100 / 12;
  const fvCapital = capital * Math.pow(1 + tauxAnnuel / 100, annees);
  const fvVersements = i === 0 ? mensuel * n : mensuel * ((Math.pow(1 + i, n) - 1) / i);
  return fvCapital + fvVersements;
}

export function comparer(input: Inputs): { enveloppes: Enveloppe[]; totalVerse: number } {
  const {
    capitalInitial,
    versementMensuel,
    duree,
    rendement,
    tauxLivretA,
    tmiActuelle,
    tmiRetraite,
    couple,
  } = input;

  const totalVerse = capitalInitial + versementMensuel * 12 * Math.round(duree);
  const brut = valeurFuture(capitalInitial, versementMensuel, duree, rendement);
  const gains = Math.max(brut - totalVerse, 0);

  const brutLivret = valeurFuture(capitalInitial, versementMensuel, duree, tauxLivretA);
  const gainsLivret = Math.max(brutLivret - totalVerse, 0);

  const abattementAv = couple ? 9200 : 4600;
  const gainsAvImposables = Math.max(gains - abattementAv, 0);
  const impotAv8 = gainsAvImposables * 0.075 + gains * PS;

  const impotPfu = gains * PFU;
  const impotPea = gains * PS;

  const economieEntreePer = totalVerse * (tmiActuelle / 100);
  const impotPer = totalVerse * (tmiRetraite / 100) + gains * PFU - economieEntreePer;

  const enveloppes: Enveloppe[] = [
    {
      id: "per",
      nom: "PER (sortie capital)",
      regle: "Déduction entrée + TMI retraite + PFU gains",
      liquidite: 1,
      horizon: "Retraite",
      transmission: "Standard",
      volatilite: "Variable",
      net: brut - impotPer,
      brut,
      gains,
      impots: impotPer,
    },
    {
      id: "pea",
      nom: "PEA >5 ans",
      regle: "Exo IR, PS 17,2% sur gains",
      liquidite: 3,
      horizon: ">5 ans",
      transmission: "Standard (succession)",
      volatilite: "Actions/ETF",
      net: brut - impotPea,
      brut,
      gains,
      impots: impotPea,
    },
    {
      id: "av8plus",
      nom: "Assurance-vie >8 ans",
      regle: `Abattement ${abattementAv.toLocaleString("fr-FR")} € + 7,5% + PS`,
      liquidite: 4,
      horizon: ">8 ans",
      transmission: "Excellent (152 500 €/bénéf.)",
      volatilite: "Variable (UC)",
      net: brut - impotAv8,
      brut,
      gains,
      impots: impotAv8,
    },
    {
      id: "av8moins",
      nom: "Assurance-vie <8 ans",
      regle: "PFU 30% (12,8% + 17,2%)",
      liquidite: 3,
      horizon: "4-8 ans",
      transmission: "Excellent (art. 990 I)",
      volatilite: "Variable (UC)",
      net: brut - impotPfu,
      brut,
      gains,
      impots: impotPfu,
    },
    {
      id: "cto",
      nom: "CTO (ordinaire)",
      regle: "PFU 30% (12,8% IR + 17,2% PS)",
      liquidite: 5,
      horizon: "Flexible",
      transmission: "Standard",
      volatilite: "Variable",
      net: brut - impotPfu,
      brut,
      gains,
      impots: impotPfu,
    },
    {
      id: "livreta",
      nom: "Livret A / LDDS",
      regle: "Exonération totale, taux réglementé",
      liquidite: 5,
      horizon: "Court terme",
      transmission: "Neutre",
      volatilite: "Aucun",
      net: brutLivret,
      brut: brutLivret,
      gains: gainsLivret,
      impots: 0,
    },
  ];

  enveloppes.sort((a, b) => b.net - a.net);

  return { enveloppes, totalVerse };
}

export const euro = (v: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })
    .format(Math.round(v))
    .replace(/\u202f|\u00a0/g, " ");
