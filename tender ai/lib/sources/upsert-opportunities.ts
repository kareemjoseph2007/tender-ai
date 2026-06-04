import { createAdminClient } from "@/lib/supabase/admin";
import { parseDeadlineToIso } from "@/lib/sources/deadline";
import type { FetchResult, OpportunityInsert } from "@/lib/sources/types";

export { pickLocalizedText } from "@/lib/sources/localized-text";

export async function upsertOpportunities(
  opportunities: OpportunityInsert[]
): Promise<FetchResult> {
  const result: FetchResult = {
    inserted: 0,
    skipped: 0,
    errors: [],
    insertedIds: [],
  };

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
    deadline: normalizeDeadline(opportunity.deadline),
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

  const newSourceIds = rows
    .filter((row) => !existingIds.has(row.source_id))
    .map((row) => row.source_id);

  if (newSourceIds.length > 0) {
    const { data: insertedRows, error: insertedError } = await supabase
      .from("opportunities")
      .select("id")
      .eq("source_portal", portal)
      .in("source_id", newSourceIds);

    if (insertedError) {
      result.errors.push(
        `Failed to fetch inserted IDs: ${insertedError.message}`
      );
    } else {
      result.insertedIds = (insertedRows ?? []).map((row) => row.id);
    }
  }

  return result;
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

/** @deprecated Use parseDeadlineToIso from ./deadline instead */
export function parseDeadline(value: unknown): string | null {
  return parseDeadlineToIso(value);
}

export function normalizeDeadline(deadline: string | null | undefined): string | null {
  if (deadline == null) return null;
  if (typeof deadline === "string" && !deadline.trim()) return null;
  return parseDeadlineToIso(deadline);
}

export function matchesItCpv(code: string): boolean {
  const normalized = code.replace(/\D/g, "");
  return normalized.startsWith("72");
}
