import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getOpportunitiesByScoreRange } from "@/app/actions/opportunities";
import { signOut } from "@/app/actions/auth";
import { getCompanyProfile } from "@/app/actions/onboarding";
import { DeadlineDisplay } from "@/components/opportunities/DeadlineDisplay";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  formatBudgetRange,
  getCountryFlag,
  getPortalLabel,
  getScoreBadgeClass,
} from "@/lib/opportunities/format";
import type { Opportunity } from "@/lib/sources/types";

function parseScoreParam(
  value: string | undefined,
  fallback: number
): number | null {
  if (value == null || value === "") return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export default async function OpportunitiesListPage({
  searchParams,
}: {
  searchParams: { minScore?: string; maxScore?: string };
}) {
  const profile = await getCompanyProfile();
  if (!profile?.onboarding_complete) {
    redirect("/onboard");
  }

  const minScore = parseScoreParam(searchParams.minScore, 60);
  const maxScore = parseScoreParam(searchParams.maxScore, 80);

  if (minScore == null || maxScore == null || minScore >= maxScore) {
    notFound();
  }

  const opportunities = (await getOpportunitiesByScoreRange(
    minScore,
    maxScore
  )) as Opportunity[];

  const title =
    minScore >= 80
      ? "Strong matches"
      : minScore >= 60
        ? "Medium matches"
        : "All matches";

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">
                T
              </div>
              <span className="font-semibold text-slate-900">TenderAI</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-sm text-slate-500">{title}</span>
          </div>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
            <p className="mt-1 text-sm text-slate-600">
              Match scores {minScore}–{maxScore - 1} · {opportunities.length}{" "}
              {opportunities.length === 1 ? "tender" : "tenders"}
            </p>
          </div>
          <LinkButton href="/dashboard" variant="secondary" size="sm">
            Back to dashboard
          </LinkButton>
        </div>

        {opportunities.length === 0 ? (
          <Card>
            <p className="text-sm text-slate-600">
              No tenders in this score range right now.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {opportunities.map((opportunity) => (
              <Link
                key={opportunity.id}
                href={`/opportunities/${opportunity.id}`}
                className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-200 hover:shadow-md"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {getPortalLabel(opportunity.source_portal)}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getScoreBadgeClass(opportunity.match_score)}`}
                      >
                        {opportunity.match_score ?? "—"}% match
                      </span>
                    </div>
                    <h2 className="font-semibold text-slate-900">
                      {opportunity.title ?? "Untitled tender"}
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-600">
                      {opportunity.buyer_name ?? "Unknown buyer"} ·{" "}
                      {formatBudgetRange(
                        opportunity.budget_min,
                        opportunity.budget_max
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-4">
                    <span className="text-sm text-slate-600">
                      {getCountryFlag(opportunity.country)}{" "}
                      {opportunity.country ?? "—"}
                    </span>
                    <DeadlineDisplay deadline={opportunity.deadline} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
