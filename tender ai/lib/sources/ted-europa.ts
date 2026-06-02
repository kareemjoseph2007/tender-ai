import type { FetchResult, OpportunityInsert } from "@/lib/sources/types";
import {
  parseBudget,
  parseDeadline,
  pickLocalizedText,
  upsertOpportunities,
} from "@/lib/sources/upsert-opportunities";

const TED_API_URL = "https://api.ted.europa.eu/v3/notices/search";
const TED_USER_AGENT = "TenderAI/1.0";

const TED_SEARCH_QUERIES = [
  "cpv IN (72000000, 72200000, 72300000, 72400000, 72500000, 72600000)",
  "classification-cpv IN (72000000, 72200000, 72300000, 72400000, 72500000, 72600000)",
];

const TED_SEARCH_FIELDS = [
  "notice-title",
  "buyer-name",
  "deadline-receipt-tender-date-lot",
  "estimated-value-lot",
  "publication-date",
  "buyer-country",
  "publication-number",
];

interface TedNotice {
  "publication-number"?: string;
  "notice-title"?: unknown;
  "buyer-name"?: unknown;
  "buyer-country"?: unknown;
  "deadline-receipt-tender-date-lot"?: unknown;
  "estimated-value-lot"?: unknown;
  "publication-date"?: unknown;
  links?: {
    html?: Record<string, string>;
    htmlDirect?: Record<string, string>;
  };
}

interface TedSearchResponse {
  notices?: TedNotice[];
  totalNoticeCount?: number;
  message?: string;
}

function mapTedNotice(notice: TedNotice): OpportunityInsert | null {
  const sourceId = notice["publication-number"];
  if (!sourceId) return null;

  const title = pickLocalizedText(notice["notice-title"]);
  const buyerName = pickLocalizedText(notice["buyer-name"]);
  const country = pickLocalizedText(notice["buyer-country"]);
  const deadline = parseDeadline(notice["deadline-receipt-tender-date-lot"]);
  const budget = parseBudget(notice["estimated-value-lot"]);
  const sourceUrl =
    notice.links?.html?.ENG ??
    notice.links?.htmlDirect?.ENG ??
    `https://ted.europa.eu/en/notice/-/detail/${sourceId}`;

  return {
    source_portal: "EU_TED",
    source_id: sourceId,
    source_url: sourceUrl,
    title,
    buyer_name: buyerName,
    country,
    deadline,
    budget_min: budget.budget_min,
    budget_max: budget.budget_max,
    raw_text: JSON.stringify(notice),
    plain_summary: null,
    requirements: [],
    eligibility_requirements: [],
    evaluation_criteria: [],
    match_score: null,
    match_breakdown: null,
    eligibility_result: null,
    eligibility_notes: null,
    status: "new",
  };
}

export async function fetchTEDOpportunities(): Promise<FetchResult> {
  const result: FetchResult = { inserted: 0, skipped: 0, errors: [] };

  try {
    let body: TedSearchResponse | null = null;
    let lastError = "EU TED API request failed";

    for (const query of TED_SEARCH_QUERIES) {
      const response = await fetch(TED_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": TED_USER_AGENT,
          Accept: "application/json",
        },
        body: JSON.stringify({
          query,
          fields: TED_SEARCH_FIELDS,
          page: 1,
          limit: 50,
          scope: "ACTIVE",
          paginationMode: "PAGE_NUMBER",
        }),
      });

      const parsed = (await response.json()) as TedSearchResponse;

      if (response.ok) {
        body = parsed;
        break;
      }

      lastError = parsed.message ?? `EU TED API returned ${response.status}`;
    }

    if (!body) {
      result.errors.push(lastError);
      return result;
    }

    const opportunities = (body.notices ?? [])
      .map(mapTedNotice)
      .filter((notice): notice is OpportunityInsert => notice !== null);

    return upsertOpportunities(opportunities);
  } catch (error) {
    result.errors.push(
      error instanceof Error ? error.message : "Unknown EU TED fetch error"
    );
    return result;
  }
}
