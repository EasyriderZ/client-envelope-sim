export function Disclaimer({ dateCalcul }: { dateCalcul: string }) {
  return (
    <details className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <summary className="cursor-pointer text-sm font-bold text-foreground">
        Hypothèses, méthodologie &amp; avertissements réglementaires
      </summary>

      <div className="mt-4 space-y-5 text-sm text-muted-foreground">
        <section>
          <h3 className="mb-2 font-bold text-foreground">Hypothèses utilisées</h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>Barème fiscal en vigueur au 2026-01-01 (version 2026.01).</li>
            <li>Résultats calculés uniquement à partir des paramètres saisis.</li>
            <li>Aucune inflation appliquée.</li>
            <li>Comparaison à versement identique sur 6 enveloppes fiscales principales.</li>
            <li>
              Rendement brut identique sur toutes les enveloppes sauf Livret A (taux réglementé).
            </li>
            <li>PER : économie d'impôt à l'entrée incluse dans le net final.</li>
            <li>
              AV &gt;8 ans : abattement 4 600 € (célibataire) / 9 200 € (couple) appliqué une fois
              au rachat total.
            </li>
            <li>PEA : hypothèse &gt;5 ans (sinon PFU 30%).</li>
            <li>
              Ne prend pas en compte les frais de gestion ni les plafonds légaux (PEA 150 000 €,
              Livret A 22 950 €).
            </li>
          </ul>
        </section>

        <section>
          <h3 className="mb-2 font-bold text-foreground">Références légales</h3>
          <div className="flex flex-wrap gap-2 text-xs">
            {[
              "art. 125-0 A CGI (AV)",
              "art. 200 A CGI (PFU 30%)",
              "art. 157 CGI (exonérations livrets)",
              "art. L221-30 CoMoFi (PEA)",
              "art. 163 quatervicies CGI (PER)",
            ].map((ref) => (
              <code key={ref} className="rounded-md bg-muted px-2 py-1 font-mono">
                {ref}
              </code>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-2 font-bold text-foreground">Méthodologie</h3>
          <p>
            Les projections reposent sur la capitalisation composée à taux constant (capital initial
            capitalisé annuellement, versements mensuels de fin de mois). Les abattements, tranches
            et taux sont ceux publiés pour l'année en cours par la DGFiP et les textes applicables.
          </p>
        </section>

        <section>
          <h3 className="mb-2 font-bold text-foreground">Avertissements réglementaires</h3>
          <div className="space-y-2">
            <p>
              Les performances passées ne préjugent pas des performances futures (Recommandation AMF
              n°2011-24).
            </p>
            <p>
              Le rendement projeté est une hypothèse : les marchés financiers présentent une
              volatilité et un risque de perte en capital.
            </p>
            <p>La fiscalité appliquée est celle en vigueur au jour du calcul ; elle peut évoluer.</p>
            <p>
              Ce document est un outil d'aide à la décision fourni à titre indicatif. Il ne
              constitue ni un conseil en investissement au sens de la directive MiFID II
              (2014/65/UE), ni une recommandation personnalisée au sens de l'article L.541-1 du Code
              monétaire et financier.
            </p>
            <p>
              Toute décision patrimoniale doit être prise après une analyse complète de votre
              situation personnelle par un professionnel habilité (CGP/CIF, notaire,
              expert-comptable, avocat fiscaliste).
            </p>
          </div>
        </section>

        <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
          <p>
            <span className="font-bold text-foreground">Version barème</span>
            <br />
            2026.01 (2026-01-01)
          </p>
          <p>
            <span className="font-bold text-foreground">Date du calcul</span>
            <br />
            {dateCalcul}
          </p>
        </div>
      </div>
    </details>
  );
}
