import type { TenderAnalysis } from "@/lib/proposals/types";

export function parseClaudeJson<T>(raw: string): T {
  let text = raw.trim();

  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Response did not contain a JSON object");
  }

  return JSON.parse(text.slice(start, end + 1)) as T;
}

export function parseTenderAnalysis(raw: string): TenderAnalysis {
  const parsed = parseClaudeJson<TenderAnalysis>(raw);
  return {
    tender_summary: parsed.tender_summary ?? "",
    required_sections: parsed.required_sections ?? [],
    covered_by_profile: parsed.covered_by_profile ?? [],
    needs_user_input: parsed.needs_user_input ?? [],
    cannot_write: parsed.cannot_write ?? [],
    projects_to_use: parsed.projects_to_use ?? [],
    team_members_to_use: parsed.team_members_to_use ?? [],
  };
}
