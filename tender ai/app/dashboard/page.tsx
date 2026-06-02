import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { getCompanyProfile } from "@/app/actions/onboarding";
import { getTopOpportunities } from "@/app/actions/opportunities";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  formatDeadlineCountdown,
  getCountryFlag,
  getDeadlineColorClass,
  getPortalLabel,
  getScoreBadgeClass,
} from "@/lib/opportunities/format";
import type { Opportunity } from "@/lib/sources/types";

export default async function DashboardPage() {
  const profile = await getCompanyProfile();

  if (!profile?.onboarding_complete) {
    redirect("/onboard");
  }

  const opportunities = (await getTopOpportunities(10)) as Opportunity[];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">
              T
            </div>
            <span className="font-semibold text-slate-900">TenderAI</span>
          </div>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">
            Top opportunities
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {profile.name
              ? `Ranked by match score for ${profile.name}. Full dashboard coming in Step 8.`
              : "Ranked by match score. Full dashboard coming in Step 8."}
          </p>
        </div>

        {opportunities.length === 0 ? (
          <Card className="text-center">
            <p className="text-slate-600">
              No opportunities yet. Run the tender fetch cron to pull in data.
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
                        {opportunity.match_score != null
                          ? `${opportunity.match_score}% match`
                          : "Unscored"}
                      </span>
                    </div>
                    <h2 className="truncate font-semibold text-slate-900">
                      {opportunity.title ?? "Untitled tender"}
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-600">
                      {opportunity.buyer_name ?? "Unknown buyer"}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-4 text-sm text-slate-600">
                    <span>
                      {getCountryFlag(opportunity.country)}{" "}
                      {opportunity.country ?? "—"}
                    </span>
                    <span
                      className={`font-medium ${getDeadlineColorClass(opportunity.deadline)}`}
                    >
                      {formatDeadlineCountdown(opportunity.deadline)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <LinkButton href="/onboard" variant="ghost" size="sm">
            Edit company profile
          </LinkButton>
        </div>
      </main>
    </div>
  );
}
