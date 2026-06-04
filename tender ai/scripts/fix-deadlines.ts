import { createAdminClient } from "../lib/supabase/admin";
import { getOpportunityDescription } from "../lib/opportunities/summary";
import {
  extractDeadlineFromRawText,
  extractTedDeadline,
  parseDeadlineToIso,
} from "../lib/sources/deadline";

const TED_API_URL = "https://api.ted.europa.eu/v3/notices/search";

async function fetchTedNoticeFromApi(
  publicationNumber: string
): Promise<Record<string, unknown> | null> {
  const response = await fetch(TED_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "TenderAI/1.0",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query: `publication-number=${publicationNumber}`,
      fields: [
        "publication-number",
        "deadline-receipt-tender-date-lot",
        "deadline-receipt-tender-time-lot",
        "deadline-date-lot",
        "description-lot",
        "description-proc",
        "notice-title",
      ],
      page: 1,
      limit: 1,
      scope: "ACTIVE",
      paginationMode: "PAGE_NUMBER",
    }),
  });

  if (!response.ok) return null;

  const body = (await response.json()) as {
    notices?: Array<Record<string, unknown>>;
  };
  return body.notices?.[0] ?? null;
}

async function fetchTedDeadlineFromApi(
  publicationNumber: string
): Promise<string | null> {
  const notice = await fetchTedNoticeFromApi(publicationNumber);
  return notice ? extractTedDeadline(notice) : null;
}

async function main() {
  const supabase = createAdminClient();

  const { data: rows, error } = await supabase
    .from("opportunities")
    .select("id, source_portal, source_id, raw_text, deadline, plain_summary, title");

  if (error) {
    throw new Error(`Failed to load opportunities: ${error.message}`);
  }

  const opportunities = rows ?? [];
  console.log(`Checking deadlines for ${opportunities.length} opportunities…`);

  const nullEu = opportunities.filter(
    (r) => r.source_portal === "EU_TED" && !parseDeadlineToIso(r.deadline)
  ).length;
  const nullUk = opportunities.filter(
    (r) => r.source_portal === "UK_FTS" && !parseDeadlineToIso(r.deadline)
  ).length;
  console.log(`Null deadlines: EU_TED=${nullEu}, UK_FTS=${nullUk}`);

  let updated = 0;
  let cleared = 0;
  let unchanged = 0;
  let tedApiFetched = 0;
  let tedApiAttempts = 0;

  for (const row of opportunities) {
    let nextDeadline = extractDeadlineFromRawText(
      row.source_portal,
      row.raw_text
    );

    const current =
      row.deadline && String(row.deadline).trim()
        ? parseDeadlineToIso(row.deadline)
        : null;

    let mergedRawText: string | undefined;

    if (row.source_portal === "EU_TED" && row.source_id && !nextDeadline) {
      tedApiAttempts += 1;
      const notice = await fetchTedNoticeFromApi(row.source_id);
      if (notice) {
        const fromApi = extractTedDeadline(notice);
        if (fromApi) {
          nextDeadline = fromApi;
          tedApiFetched += 1;
        }
        const existing = row.raw_text ? JSON.parse(row.raw_text) : {};
        mergedRawText = JSON.stringify({ ...existing, ...notice });
      }
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    if (!nextDeadline) {
      nextDeadline = current;
    }

    const rawForSummary = mergedRawText ?? row.raw_text;
    const plainSummary = getOpportunityDescription({
      source_portal: row.source_portal,
      plain_summary: row.plain_summary,
      raw_text: rawForSummary,
      title: row.title,
    });

    const summaryChanged =
      plainSummary &&
      plainSummary !== row.plain_summary &&
      !plainSummary.startsWith("This notice only has basic metadata");

    if (nextDeadline === current && !mergedRawText && !summaryChanged) {
      unchanged += 1;
      continue;
    }

    const updatePayload: Record<string, unknown> = {
      deadline: nextDeadline,
      updated_at: new Date().toISOString(),
    };
    if (mergedRawText) updatePayload.raw_text = mergedRawText;
    if (plainSummary && plainSummary !== row.plain_summary) {
      updatePayload.plain_summary = plainSummary;
    }

    const { error: updateError } = await supabase
      .from("opportunities")
      .update(updatePayload)
      .eq("id", row.id);

    if (updateError) {
      console.error(`${row.id}: ${updateError.message}`);
      continue;
    }

    if (nextDeadline && nextDeadline !== current) {
      updated += 1;
      console.log(`Updated ${row.source_portal}/${row.source_id} → ${nextDeadline}`);
    } else if (current && !nextDeadline) {
      cleared += 1;
    }
  }

  for (const row of opportunities) {
    if (row.deadline === "" || row.deadline === " ") {
      await supabase
        .from("opportunities")
        .update({ deadline: null, updated_at: new Date().toISOString() })
        .eq("id", row.id);
    }
  }

  console.log(
    `Done. Updated: ${updated}, Cleared to null: ${cleared}, Unchanged: ${unchanged}, TED API attempts: ${tedApiAttempts}, TED API hits: ${tedApiFetched}`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
