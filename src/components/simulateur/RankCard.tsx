import type { Enveloppe } from "@/lib/enveloppes";
import { euro } from "@/lib/enveloppes";

const rankColor = [
  "var(--color-gold)",
  "var(--color-silver)",
  "var(--color-bronze)",
  "var(--color-rank-4)",
  "var(--color-rank-5)",
  "var(--color-rank-6)",
];

const medals = ["🥇", "🥈", "🥉"];

export function RankCard({
  enveloppe,
  index,
  best,
}: {
  enveloppe: Enveloppe;
  index: number;
  best: number;
}) {
  const delta = enveloppe.net - best;

  return (
    <div
      className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-card"
      style={{ borderLeftWidth: 4, borderLeftColor: rankColor[index] ?? "var(--color-border)" }}
    >
      <div className="w-8 shrink-0 text-center text-lg font-bold text-brand">
        {medals[index] ?? `${index + 1}.`}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-foreground">{enveloppe.nom}</p>
        <p className="text-xs text-muted-foreground">{enveloppe.regle}</p>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span>
            💧 {"●".repeat(enveloppe.liquidite)}
            {"○".repeat(5 - enveloppe.liquidite)}
          </span>
          <span>📅 {enveloppe.horizon}</span>
          <span>🎁 {enveloppe.transmission}</span>
          <span>⚡ {enveloppe.volatilite}</span>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-lg font-extrabold text-brand">{euro(enveloppe.net)}</p>
        <p className="text-[11px] text-muted-foreground">
          {index === 0 ? "— référence —" : `${euro(delta)} vs n°1`}
        </p>
      </div>
    </div>
  );
}
