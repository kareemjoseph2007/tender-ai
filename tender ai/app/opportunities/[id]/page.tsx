import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  getOpportunityById,
  getSavedOpportunity,
} from "@/app/actions/opportunities";
import { getCompanyProfile } from "@/app/actions/onboarding";
import { signOut } from "@/app/actions/auth";
import { OpportunityActions } from "@/components/opportunities/OpportunityActions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DeadlineDisplay } from "@/components/opportunities/DeadlineDisplay";
import {
  formatBudgetRange,
  formatDate,
  getCountryFlag,
  getPortalLabel,
  getScoreBadgeClass,
  getScoreColorClass,
  parseMatchBreakdown,
} from "@/lib/opportunities/format";
import { getOpportunityDescription } from "@/lib/opportunities/summary";
import type { Opportunity } from "@/lib/sources/types";

function StatBox({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p
        className={`mt-1 text-lg font-semibold text-slate-900 ${valueClassName ?? ""}`}
      >
        {value}
      </p>
    </div>
  );
}

export default async function OpportunityDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const profile = await getCompanyProfile();
  if (!profile?.onboarding_complete) {
    redirect("/onboard");
  }

  const opportunity = (await getOpportunityById(
    params.id
  )) as Opportunity | null;

  if (!opportunity) {
    notFound();
  }

  const saved = await getSavedOpportunity(params.id);
  const breakdown = parseMatchBreakdown(opportunity.match_breakdown);
  const description = getOpportunityDescription(opportunity);

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
            <span className="text-sm text-slate-500">Opportunity</span>
          </div>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* HEADER */}
        <section className="mb-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700">
              {getPortalLabel(opportunity.source_portal)}
            </span>
            {saved && (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                Saved
              </span>
            )}
            {opportunity.status === "ignored" && (
              <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
                Ignored
              </span>
            )}
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {opportunity.title ?? "Untitled tender"}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
            {opportunity.buyer_name && (
              <span className="font-medium text-slate-800">
                {opportunity.buyer_name}
              </span>
            )}
            <span>
              {getCountryFlag(opportunity.country)}{" "}
              {opportunity.country ?? "Unknown country"}
            </span>
            <DeadlineDisplay deadline={opportunity.deadline} />
          </div>
        </section>

        {/* KEY STATS BAR */}
        <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatBox
            label="Match score"
            value={
              opportunity.match_score != null
                ? `${opportunity.match_score}/100`
                : "Not scored"
            }
            valueClassName={getScoreColorClass(opportunity.match_score)}
          />
          <StatBox
            label="Budget"
            value={formatBudgetRange(
              opportunity.budget_min,
              opportunity.budget_max
            )}
          />
          <StatBox
            label="Deadline"
            value={
              opportunity.deadline
                ? formatDate(opportunity.deadline)
                : "No deadline specified"
            }
          />
          <StatBox
            label="Source"
            value={getPortalLabel(opportunity.source_portal)}
          />
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* AI SUMMARY */}
            <Card>
              <h2 className="mb-4 text-lg font-semibold text-slate-900">
                What they&apos;re asking for
              </h2>
              <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
                {description}
              </p>
              {opportunity.source_url && (
                <a
                  href={opportunity.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  View full tender →
                </a>
              )}
            </Card>

            {/* MATCH BREAKDOWN */}
            <Card>
              <h2 className="mb-4 text-lg font-semibold text-slate-900">
                Why this matches you
              </h2>
              {breakdown ? (
                <div className="space-y-3">
                  {breakdown.factors.map((factor) => (
                    <div
                      key={factor.name}
                      className="flex items-start justify-between gap-4 rounded-lg border border-slate-100 px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900">
                          {factor.name}
                        </p>
                        <p className="mt-0.5 text-sm text-slate-600">
                          {factor.reason}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-slate-700">
                        {factor.points}/{factor.max}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
                    <span className="text-slate-500">
                      Raw score: {breakdown.rawTotal}/{breakdown.maxTotal}{" "}
                      (scaled to 100)
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${getScoreBadgeClass(opportunity.match_score)}`}
                    >
                      {opportunity.match_score ?? "—"}/100
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-600">
                  This opportunity hasn&apos;t been scored yet.
                </p>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            {/* ELIGIBILITY */}
            <Card>
              <h2 className="mb-4 text-lg font-semibold text-slate-900">
                Do you qualify?
              </h2>
              {/* TODO: replace with real eligibility result when eligibility checker is built */}
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
                Eligibility checking coming soon — we will automatically verify
                whether you meet this tender&apos;s requirements.
              </div>
            </Card>

            {/* ACTIONS */}
            <Card>
              <h2 className="mb-4 text-lg font-semibold text-slate-900">
                Actions
              </h2>
              <OpportunityActions
                opportunityId={opportunity.id}
                sourceUrl={opportunity.source_url}
                isSaved={!!saved}
                isIgnored={opportunity.status === "ignored"}
              />
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
