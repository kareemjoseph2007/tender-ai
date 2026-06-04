import type { FetchResult, OpportunityInsert } from "@/lib/sources/types";
import { extractUkDeadline } from "@/lib/sources/deadline";
import { upsertOpportunities } from "@/lib/sources/upsert-opportunities";

const IT_TITLE_KEYWORD_PATTERNS = [
  /\bsoftware\b/i,
  /\bit\b/i,
  /\bdigital\b/i,
  /\bdata\b/i,
  /\bsystems\b/i,
  /\btechnology\b/i,
  /\btechnologies\b/i,
  /\bdevelopment\b/i,
] as const;

/** Exported for one-off cleanup scripts. */
export function titleMatchesItKeywords(title: string | null | undefined): boolean {
  if (!title?.trim()) return false;
  return IT_TITLE_KEYWORD_PATTERNS.some((pattern) => pattern.test(title));
}

const UK_API_BASE =
  "https://www.find-tender.service.gov.uk/api/1.0/ocdsReleasePackages";
const UK_FETCH_LIMIT = 50;
const UK_MAX_PAGES = 5;

interface OcdsClassification {
  scheme?: string;
  id?: string;
}

interface OcdsRelease {
  id?: string;
  ocid?: string;
  date?: string;
  tag?: string[];
  tender?: {
    id?: string;
    title?: string;
    description?: string;
    status?: string;
    classification?: OcdsClassification;
    items?: Array<{
      classification?: OcdsClassification;
      additionalClassifications?: OcdsClassification[];
    }>;
    value?: { amount?: number; currency?: string };
    tenderPeriod?: { endDate?: string };
    lots?: Array<{
      value?: { amount?: number; currency?: string };
      tenderPeriod?: { endDate?: string };
    }>;
    documents?: Array<{ url?: string; documentType?: string }>;
  };
  parties?: Array<{
    name?: string;
    roles?: string[];
    address?: { country?: string; countryName?: string };
  }>;
  buyer?: { id?: string; name?: string };
}

interface OcdsReleasePackage {
  releases?: OcdsRelease[];
  links?: { next?: string };
}

function releaseMatchesItTender(release: OcdsRelease): boolean {
  const tags = release.tag ?? [];
  const isOpenTender =
    tags.includes("tender") &&
    !tags.includes("award") &&
    !tags.includes("contract");
  if (!isOpenTender) return false;
  return titleMatchesItKeywords(release.tender?.title);
}

function getBuyerName(release: OcdsRelease): string | null {
  if (release.buyer?.name) return release.buyer.name;

  const buyerParty = release.parties?.find((party) =>
    party.roles?.includes("buyer")
  );
  return buyerParty?.name ?? null;
}

function getNoticeUrl(release: OcdsRelease): string | null {
  const documentUrl = release.tender?.documents?.find(
    (document) => document.url
  )?.url;
  if (documentUrl) return documentUrl;
  if (release.id) {
    return `https://www.find-tender.service.gov.uk/Notice/${release.id}`;
  }
  return null;
}

function getTenderValue(release: OcdsRelease): number | null {
  const tender = release.tender;
  if (!tender) return null;

  if (tender.value?.amount != null) {
    return Math.round(tender.value.amount);
  }

  for (const lot of tender.lots ?? []) {
    if (lot.value?.amount != null) {
      return Math.round(lot.value.amount);
    }
  }

  return null;
}

function mapUkRelease(release: OcdsRelease): OpportunityInsert | null {
  const sourceId = release.id ?? release.tender?.id ?? release.ocid;
  if (!sourceId) return null;

  const amount = getTenderValue(release);
  const budget =
    amount != null
      ? { budget_min: amount, budget_max: amount }
      : { budget_min: null, budget_max: null };

  const buyerParty = release.parties?.find((party) =>
    party.roles?.includes("buyer")
  );

  return {
    source_portal: "UK_FTS",
    source_id: sourceId,
    source_url: getNoticeUrl(release),
    title: release.tender?.title ?? null,
    buyer_name: getBuyerName(release),
    country:
      buyerParty?.address?.countryName ??
      buyerParty?.address?.country ??
      "United Kingdom",
    deadline: extractUkDeadline(release as Record<string, unknown>),
    budget_min: budget.budget_min,
    budget_max: budget.budget_max,
    raw_text: JSON.stringify(release),
    plain_summary: release.tender?.description ?? null,
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

async function fetchReleasePage(url: string): Promise<OcdsReleasePackage> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "TenderAI/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`UK Find a Tender API returned ${response.status}`);
  }

  return (await response.json()) as OcdsReleasePackage;
}

export async function fetchUKTenders(): Promise<FetchResult> {
  const result: FetchResult = {
    inserted: 0,
    skipped: 0,
    errors: [],
    insertedIds: [],
  };
  const opportunities: OpportunityInsert[] = [];
  const seenSourceIds = new Set<string>();

  let url: string | undefined =
    `${UK_API_BASE}?classificationScheme=CPV&classificationID=72000000&limit=${UK_FETCH_LIMIT}`;
  let useClientSideFilter = false;

  try {
    for (let page = 0; page < UK_MAX_PAGES; page++) {
      let packageData: OcdsReleasePackage;

      try {
        packageData = await fetchReleasePage(url);
      } catch (error) {
        if (page === 0 && !useClientSideFilter) {
          useClientSideFilter = true;
          url = `${UK_API_BASE}?limit=${UK_FETCH_LIMIT}`;
          packageData = await fetchReleasePage(url);
        } else {
          throw error;
        }
      }

      for (const release of packageData.releases ?? []) {
        if (!releaseMatchesItTender(release)) {
          continue;
        }

        const mapped = mapUkRelease(release);
        if (!mapped || seenSourceIds.has(mapped.source_id)) {
          continue;
        }

        seenSourceIds.add(mapped.source_id);
        opportunities.push(mapped);
      }

      url = packageData.links?.next;
      if (!url) break;
    }

    const upsertResult = await upsertOpportunities(opportunities);
    return {
      inserted: upsertResult.inserted,
      skipped: upsertResult.skipped,
      insertedIds: upsertResult.insertedIds,
      errors: [...result.errors, ...upsertResult.errors],
    };
  } catch (error) {
    result.errors.push(
      error instanceof Error ? error.message : "Unknown UK FTS fetch error"
    );
    return result;
  }
}
