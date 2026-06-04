import { processAlertsForOpportunities } from "../lib/alerts/process-alerts";
import { scoreOpportunitiesByIds } from "../lib/scoring/apply-scores";
import { fetchTEDOpportunities } from "../lib/sources/ted-europa";
import { fetchUKTenders } from "../lib/sources/uk-find-a-tender";

async function main() {
  console.log("Fetching tenders from EU TED and UK Find a Tender…\n");

  const [ted, uk] = await Promise.all([
    fetchTEDOpportunities(),
    fetchUKTenders(),
  ]);

  const insertedIds = [...ted.insertedIds, ...uk.insertedIds];
  const scoring = await scoreOpportunitiesByIds(insertedIds);
  const alerts = await processAlertsForOpportunities(insertedIds);

  const summary = { ted, uk, scoring, alerts };
  console.log(JSON.stringify(summary, null, 2));

  const newCount = ted.inserted + uk.inserted;
  if (newCount === 0) {
    console.log(
      "\nNo new tenders inserted (sources returned only duplicates or none). This is normal if you already fetched recently."
    );
  } else {
    console.log(`\nInserted ${newCount} new tender(s). Refresh the dashboard.`);
  }

  const hasErrors =
    ted.errors.length > 0 ||
    uk.errors.length > 0 ||
    scoring.errors.length > 0 ||
    alerts.errors.length > 0;

  if (hasErrors) process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
