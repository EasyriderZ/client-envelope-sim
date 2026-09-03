import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { DEFAULT_SETTINGS, type FiscalSettings, type Tranche } from "./fiscalite";

type Row = {
  pfu_ir: number;
  ps: number;
  av_taux_reduit: number;
  av_abattement_solo: number;
  av_abattement_couple: number;
  per_taux_deduction: number;
  per_plafond_max: number;
  per_plafond_min: number;
  bareme: unknown;
};

const COLS =
  "pfu_ir, ps, av_taux_reduit, av_abattement_solo, av_abattement_couple, per_taux_deduction, per_plafond_max, per_plafond_min, bareme";

function toSettings(row: Row | null | undefined): FiscalSettings | null {
  if (!row) return null;
  return {
    pfu_ir: Number(row.pfu_ir),
    ps: Number(row.ps),
    av_taux_reduit: Number(row.av_taux_reduit),
    av_abattement_solo: Number(row.av_abattement_solo),
    av_abattement_couple: Number(row.av_abattement_couple),
    per_taux_deduction: Number(row.per_taux_deduction),
    per_plafond_max: Number(row.per_plafond_max),
    per_plafond_min: Number(row.per_plafond_min),
    bareme: (Array.isArray(row.bareme) ? row.bareme : DEFAULT_SETTINGS.bareme) as Tranche[],
  };
}

const validateSettings = (input: FiscalSettings): FiscalSettings => ({
  pfu_ir: Number(input.pfu_ir) || 0,
  ps: Number(input.ps) || 0,
  av_taux_reduit: Number(input.av_taux_reduit) || 0,
  av_abattement_solo: Number(input.av_abattement_solo) || 0,
  av_abattement_couple: Number(input.av_abattement_couple) || 0,
  per_taux_deduction: Number(input.per_taux_deduction) || 0,
  per_plafond_max: Number(input.per_plafond_max) || 0,
  per_plafond_min: Number(input.per_plafond_min) || 0,
  bareme: (input.bareme ?? []).map((t) => ({
    seuil: t.seuil === null || t.seuil === undefined ? null : Number(t.seuil),
    taux: Number(t.taux) || 0,
  })),
});

/** Paramètres applicables : personnels si définis, sinon la référence globale. */
export const getMesParametres = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [own, global, role] = await Promise.all([
      supabase.from("fiscal_settings").select(COLS).eq("user_id", userId).maybeSingle(),
      supabase.from("fiscal_settings").select(COLS).is("user_id", null).maybeSingle(),
      supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
    ]);
    const globalSettings = toSettings(global.data as Row | null) ?? DEFAULT_SETTINGS;
    const ownSettings = toSettings(own.data as Row | null);
    return {
      settings: ownSettings ?? globalSettings,
      global: globalSettings,
      personnalise: Boolean(ownSettings),
      isAdmin: Boolean(role.data),
    };
  });

export const enregistrerMesParametres = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validateSettings)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const existing = await supabase
      .from("fiscal_settings")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (existing.data?.id) {
      const { error } = await supabase
        .from("fiscal_settings")
        .update(data)
        .eq("id", existing.data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from("fiscal_settings")
        .insert({ ...data, user_id: userId });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const reinitialiserMesParametres = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("fiscal_settings")
      .delete()
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const enregistrerParametresGlobaux = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validateSettings)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Accès réservé aux administrateurs");

    const existing = await supabase
      .from("fiscal_settings")
      .select("id")
      .is("user_id", null)
      .maybeSingle();
    if (existing.data?.id) {
      const { error } = await supabase
        .from("fiscal_settings")
        .update(data)
        .eq("id", existing.data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("fiscal_settings").insert({ ...data, user_id: null });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export type SimulationInput = {
  revenus: number;
  enfants: number;
  cotisations: number;
  couple: boolean;
  inputs: Record<string, unknown>;
  resultats: Record<string, unknown>;
};

export const enregistrerSimulation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: SimulationInput) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("simulations").insert({
      user_id: context.userId,
      revenus: Number(data.revenus) || 0,
      enfants: Math.max(0, Math.round(Number(data.enfants) || 0)),
      cotisations: Number(data.cotisations) || 0,
      couple: Boolean(data.couple),
      inputs: data.inputs ?? {},
      resultats: data.resultats ?? {},
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listerSimulations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("simulations")
      .select("id, revenus, enfants, cotisations, couple, resultats, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Envoi du comparateur par email : nécessite un domaine d'envoi configuré. */
export const envoyerComparateurParMail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { resume: string }) => input)
  .handler(async () => {
    return {
      sent: false,
      reason:
        "L'envoi par email nécessite un domaine d'envoi configuré pour ce projet. Configurez-le dans Cloud → Emails, puis réessayez.",
    };
  });
