import type { MatchBreakdown } from "@/lib/scoring/score-opportunity";
import type { SourcePortal } from "@/lib/sources/types";

const COUNTRY_FLAGS: Record<string, string> = {
  "united kingdom": "🇬🇧",
  uk: "🇬🇧",
  gb: "🇬🇧",
  germany: "🇩🇪",
  de: "🇩🇪",
  france: "🇫🇷",
  fr: "🇫🇷",
  spain: "🇪🇸",
  es: "🇪🇸",
  italy: "🇮🇹",
  it: "🇮🇹",
  netherlands: "🇳🇱",
  nl: "🇳🇱",
  ireland: "🇮🇪",
  ie: "🇮🇪",
  belgium: "🇧🇪",
  be: "🇧🇪",
  sweden: "🇸🇪",
  se: "🇸🇪",
  norway: "🇳🇴",
  no: "🇳🇴",
  denmark: "🇩🇰",
  dk: "🇩🇰",
  poland: "🇵🇱",
  pl: "🇵🇱",
  portugal: "🇵🇹",
  pt: "🇵🇹",
  luxembourg: "🇱🇺",
  lu: "🇱🇺",
  austria: "🇦🇹",
  at: "🇦🇹",
  finland: "🇫🇮",
  fi: "🇫🇮",
  "united states": "🇺🇸",
  us: "🇺🇸",
  canada: "🇨🇦",
  ca: "🇨🇦",
  australia: "🇦🇺",
  au: "🇦🇺",
};

export function getCountryFlag(country: string | null | undefined): string {
  if (!country) return "🌍";
  const key = country.trim().toLowerCase();
  return COUNTRY_FLAGS[key] ?? "🌍";
}

export function getPortalLabel(portal: SourcePortal): string {
  return portal === "EU_TED" ? "EU TED" : "UK Find a Tender";
}

export function getDaysUntilDeadline(deadline: string | null): number | null {
  if (!deadline) return null;
  return Math.ceil(
    (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
}

export function formatDeadlineCountdown(deadline: string | null): string {
  const days = getDaysUntilDeadline(deadline);
  if (days == null) return "No deadline";
  if (days < 0) return "Expired";
  if (days === 0) return "Due today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

export function getDeadlineColorClass(deadline: string | null): string {
  const days = getDaysUntilDeadline(deadline);
  if (days == null) return "text-slate-600";
  if (days < 7) return "text-red-600";
  if (days < 14) return "text-amber-600";
  return "text-emerald-600";
}

export function getScoreColorClass(score: number | null): string {
  if (score == null) return "text-slate-500";
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
}

export function getScoreBadgeClass(score: number | null): string {
  if (score == null) return "bg-slate-100 text-slate-600";
  if (score >= 80) return "bg-emerald-100 text-emerald-700";
  if (score >= 60) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

export function formatBudgetRange(
  budgetMin: number | null,
  budgetMax: number | null
): string {
  if (budgetMin == null && budgetMax == null) return "Not specified";
  if (budgetMin != null && budgetMax != null && budgetMin !== budgetMax) {
    return `£${budgetMin.toLocaleString()} – £${budgetMax.toLocaleString()}`;
  }
  const value = budgetMin ?? budgetMax;
  return value != null ? `£${value.toLocaleString()}` : "Not specified";
}

export function formatDate(date: string | null): string {
  if (!date) return "Not specified";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function getRawTextPreview(rawText: string | null, limit = 500): string {
  if (!rawText) return "No tender details available yet.";

  try {
    const parsed = JSON.parse(rawText);
    const pretty = JSON.stringify(parsed, null, 2);
    return pretty.length > limit ? `${pretty.slice(0, limit)}…` : pretty;
  } catch {
    return rawText.length > limit ? `${rawText.slice(0, limit)}…` : rawText;
  }
}

export function parseMatchBreakdown(
  value: unknown
): MatchBreakdown | null {
  if (!value || typeof value !== "object") return null;
  const breakdown = value as MatchBreakdown;
  if (!Array.isArray(breakdown.factors)) return null;
  return breakdown;
}
