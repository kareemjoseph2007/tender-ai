import { pickLocalizedText } from "@/lib/sources/localized-text";
import type { Opportunity } from "@/lib/sources/types";

const TED_DESCRIPTION_FIELDS = [
  "description-part",
  "description-lot",
  "description-glo",
  "description-proc",
  "short-description-lot",
] as const;

function extractUkDescription(raw: Record<string, unknown>): string | null {
  const tender = raw.tender as Record<string, unknown> | undefined;
  const description = tender?.description;
  return typeof description === "string" && description.trim()
    ? description.trim()
    : null;
}

function extractTedDescription(raw: Record<string, unknown>): string | null {
  for (const field of TED_DESCRIPTION_FIELDS) {
    const text = pickLocalizedText(raw[field]);
    if (text?.trim()) return text.trim();
  }

  const title = pickLocalizedText(raw["notice-title"]);
  return title?.trim() || null;
}

/** Human-readable tender scope — not Claude; uses stored summary or parsed source fields. */
export function getOpportunityDescription(opportunity: {
  source_portal: Opportunity["source_portal"];
  plain_summary: string | null;
  raw_text: string | null;
  title: string | null;
}): string {
  if (opportunity.plain_summary?.trim()) {
    return opportunity.plain_summary.trim();
  }

  if (!opportunity.raw_text?.trim()) {
    return "No tender details available yet.";
  }

  try {
    const raw = JSON.parse(opportunity.raw_text) as Record<string, unknown>;

    if (opportunity.source_portal === "UK_FTS") {
      const description = extractUkDescription(raw);
      if (description) return description;
    }

    if (opportunity.source_portal === "EU_TED") {
      const description = extractTedDescription(raw);
      if (description && description !== opportunity.title?.trim()) {
        return description;
      }

      return (
        opportunity.title?.trim() ||
        "This notice only has basic metadata in our cache. Open the full tender on EU TED for the complete scope and requirements."
      );
    }
  } catch {
    return opportunity.raw_text.length > 2000
      ? `${opportunity.raw_text.slice(0, 2000)}…`
      : opportunity.raw_text;
  }

  return "No tender details available yet.";
}
