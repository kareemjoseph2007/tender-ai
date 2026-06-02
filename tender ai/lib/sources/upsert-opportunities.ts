import { createAdminClient } from "@/lib/supabase/admin";
import type { FetchResult, OpportunityInsert } from "@/lib/sources/types";

export async function upsertOpportunities(
  opportunities: OpportunityInsert[]
): Promise<FetchResult> {
  const result: FetchResult = { inserted: 0, skipped: 0, errors: [] };

  if (opportunities.length === 0) {
    return result;
  }

  const supabase = createAdminClient();
  const portal = opportunities[0].source_portal;
  const sourceIds = opportunities.map((o) => o.source_id);

  const { data: existing, error: selectError } = await supabase
    .from("opportunities")
    .select("source_id")
    .eq("source_portal", portal)
    .in("source_id", sourceIds);

  if (selectError) {
    result.errors.push(`Failed to check existing records: ${selectError.message}`);
    return result;
  }

  const existingIds = new Set((existing ?? []).map((row) => row.source_id));
  const now = new Date().toISOString();
  const rows = opportunities.map((opportunity) => ({
    ...opportunity,
    updated_at: now,
  }));

  const { error: upsertError } = await supabase
    .from("opportunities")
    .upsert(rows, { onConflict: "source_portal,source_id" });

  if (upsertError) {
    result.errors.push(`Upsert failed: ${upsertError.message}`);
    return result;
  }

  result.inserted = rows.filter((row) => !existingIds.has(row.source_id)).length;
  result.skipped = rows.length - result.inserted;

  return result;
}

export function pickLocalizedText(
  value: unknown,
  preferredLang = "eng"
): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.map(String).join(", ") || null;
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const preferred = record[preferredLang];
    if (preferred != null) return pickLocalizedText(preferred, preferredLang);
    for (const entry of Object.values(record)) {
      const text = pickLocalizedText(entry, preferredLang);
      if (text) return text;
    }
  }
  return null;
}

export function parseBudget(value: unknown): {
  budget_min: number | null;
  budget_max: number | null;
} {
  if (value == null) {
    return { budget_min: null, budget_max: null };
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const amount = Math.round(value);
    return { budget_min: amount, budget_max: amount };
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(/[^\d.-]/g, ""));
    if (Number.isFinite(parsed)) {
      const amount = Math.round(parsed);
      return { budget_min: amount, budget_max: amount };
    }
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const amount = record.amount ?? record.value ?? record["#text"];
    return parseBudget(amount);
  }

  return { budget_min: null, budget_max: null };
}

export function parseDeadline(value: unknown): string | null {
  if (value == null) return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const parsed = parseDeadline(item);
      if (parsed) return parsed;
    }
    return null;
  }
  if (typeof value === "string" && value.trim()) {
    const normalized = value.replace(/\+(\d{2}:\d{2})$/, "+$1:00");
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  return null;
}

export function matchesItCpv(code: string): boolean {
  const normalized = code.replace(/\D/g, "");
  return normalized.startsWith("72");
}
