import { titleMatchesItKeywords } from "../lib/sources/uk-find-a-tender";
import { createAdminClient } from "../lib/supabase/admin";

async function main() {
  const supabase = createAdminClient();

  const { data: opportunities, error: fetchError } = await supabase
    .from("opportunities")
    .select("id, title")
    .eq("source_portal", "UK_FTS");

  if (fetchError) {
    throw new Error(`Failed to fetch UK opportunities: ${fetchError.message}`);
  }

  const toDelete = (opportunities ?? []).filter(
    (row) => !titleMatchesItKeywords(row.title)
  );

  if (toDelete.length === 0) {
    console.log("No non-IT UK opportunities to delete.");
    return;
  }

  console.log(`Deleting ${toDelete.length} non-IT UK opportunities…`);

  const ids = toDelete.map((row) => row.id);
  const { error: deleteError } = await supabase
    .from("opportunities")
    .delete()
    .in("id", ids);

  if (deleteError) {
    throw new Error(`Delete failed: ${deleteError.message}`);
  }

  console.log(`Done. Deleted ${toDelete.length} rows.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
