import { pickLocalizedText } from "@/lib/sources/localized-text";

function firstScalar(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const parsed = firstScalar(item);
      if (parsed) return parsed;
    }
    return null;
  }
  if (typeof value === "object") {
    return pickLocalizedText(value);
  }
  return null;
}

/** Parse deadline values into ISO timestamptz or null (never empty string). */
export function parseDeadlineToIso(value: unknown): string | null {
  if (value == null) return null;

  if (Array.isArray(value)) {
    for (const item of value) {
      const parsed = parseDeadlineToIso(item);
      if (parsed) return parsed;
    }
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    let normalized = trimmed;
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      normalized = `${trimmed}T23:59:59Z`;
    } else if (/^\d{4}-\d{2}-\d{2}\+\d{2}:\d{2}$/.test(trimmed)) {
      normalized = trimmed.replace(
        /^(\d{4}-\d{2}-\d{2})\+(\d{2}:\d{2})$/,
        "$1T23:59:59+$2"
      );
    } else if (/^\d{4}-\d{2}-\d{2}\+\d{2}$/.test(trimmed)) {
      normalized = trimmed.replace(
        /^(\d{4}-\d{2}-\d{2})\+(\d{2})$/,
        "$1T23:59:59+$2:00"
      );
    } else if (/\+\d{2}$/.test(trimmed)) {
      normalized = trimmed.replace(/\+(\d{2})$/, "+$1:00");
    } else if (/\+\d{2}:\d{2}$/.test(trimmed) && !/\+\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
      normalized = trimmed;
    } else {
      normalized = trimmed;
    }

    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  if (typeof value === "object") {
    const text = pickLocalizedText(value);
    return text ? parseDeadlineToIso(text) : null;
  }

  return null;
}

export function combineDateAndTime(
  datePart: string | null,
  timePart: string | null
): string | null {
  if (!datePart) return null;

  const dateOnly = datePart.split("T")[0].replace(/\+.*/, "");
  const timeMatch = timePart?.match(/(\d{2}:\d{2}(?::\d{2})?)/);
  const timeOnly = timeMatch ? timeMatch[1] : "23:59:59";
  const tzMatch = datePart.match(/([+-]\d{2}(?::\d{2})?)$/);
  const tzSuffix = tzMatch
    ? tzMatch[1].length === 3
      ? `${tzMatch[1]}:00`
      : tzMatch[1]
    : "Z";
  const combined =
    tzSuffix === "Z"
      ? `${dateOnly}T${timeOnly}Z`
      : `${dateOnly}T${timeOnly}${tzSuffix.startsWith("+") || tzSuffix.startsWith("-") ? tzSuffix : `+${tzSuffix}`}`;

  return parseDeadlineToIso(combined);
}

/** EU TED: date + optional time lot fields (arrays or multilingual objects). */
export function extractTedDeadline(notice: Record<string, unknown>): string | null {
  const datePart =
    firstScalar(notice["deadline-receipt-tender-date-lot"]) ??
    firstScalar(notice["deadline-date-lot"]) ??
    firstScalar(notice["deadline-receipt-tenders"]);

  const timePart =
    firstScalar(notice["deadline-receipt-tender-time-lot"]) ??
    firstScalar(notice["deadline-time-lot"]);

  if (datePart && timePart) {
    return combineDateAndTime(datePart, timePart);
  }

  return parseDeadlineToIso(datePart);
}

/** UK OCDS: tender.tenderPeriod.endDate and lot-level fallbacks. */
export function extractUkDeadline(release: Record<string, unknown>): string | null {
  const tender = release.tender as Record<string, unknown> | undefined;
  if (!tender) return null;

  const tenderPeriod = tender.tenderPeriod as Record<string, unknown> | undefined;
  const fromTender = parseDeadlineToIso(tenderPeriod?.endDate);
  if (fromTender) return fromTender;

  const fromEoi = parseDeadlineToIso(tender.expressionOfInterestDeadline);
  if (fromEoi) return fromEoi;

  const lots = tender.lots as Array<Record<string, unknown>> | undefined;
  if (lots) {
    for (const lot of lots) {
      const lotPeriod = lot.tenderPeriod as Record<string, unknown> | undefined;
      const parsed = parseDeadlineToIso(lotPeriod?.endDate);
      if (parsed) return parsed;
    }
  }

  return null;
}

export function extractDeadlineFromRawText(
  sourcePortal: string,
  rawText: string | null
): string | null {
  if (!rawText?.trim()) return null;

  try {
    const parsed = JSON.parse(rawText) as Record<string, unknown>;
    if (sourcePortal === "EU_TED") {
      return extractTedDeadline(parsed);
    }
    if (sourcePortal === "UK_FTS") {
      return extractUkDeadline(parsed);
    }
  } catch {
    return null;
  }

  return null;
}
