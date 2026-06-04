import Link from "next/link";
import type { DashboardData, SavedOpportunityRow } from "@/app/actions/dashboard";
import { OpportunityMatchCard } from "@/components/dashboard/OpportunityMatchCard";
import { DeadlineDisplay } from "@/components/opportunities/DeadlineDisplay";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  getCountryFlag,
  getScoreBadgeClass,
} from "@/lib/opportunities/format";
import type { Opportunity } from "@/lib/sources/types";

function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-3">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {subtitle && (
        <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
      )}
    </div>
  );
}

function savedStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    spotted: "Spotted",
    reviewing: "Reviewing",
    writing: "Writing",
    submitted: "Submitted",
    won: "Won",
    lost: "Lost",
  };
  return labels[status] ?? status;
}

function savedStatusClass(status: string): string {
  const classes: Record<string, string> = {
    spotted: "bg-slate-100 text-slate-700",
    reviewing: "bg-amber-100 text-amber-800",
    writing: "bg-brand-100 text-brand-800",
    submitted: "bg-emerald-100 text-emerald-800",
  };
  return classes[status] ?? "bg-slate-100 text-slate-700";
}

export function DashboardSections({
  data,
}: {
  data: DashboardData;
}) {
  const savedSet = new Set(data.savedOpportunityIds);
  const isSaved = (id: string) => savedSet.has(id);

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-8 lg:col-span-2">
        <section>
          <SectionHeading title="Strong matches" subtitle="Score 80+" />
          {data.strongMatches.length === 0 ? (
            <Card>
              <p className="text-sm text-slate-600">
                No strong matches yet. We check for new tenders regularly —
                check back soon.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {data.strongMatches.map((opportunity) => (
                <OpportunityMatchCard
                  key={opportunity.id}
                  opportunity={opportunity}
                  isSaved={isSaved(opportunity.id)}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionHeading title="New since your last login" />
          {data.newSinceLogin.length === 0 ? (
            <Card>
              <p className="text-sm text-slate-600">
                No new tenders since your last login. Check back soon.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {data.newSinceLogin.map((opportunity) => (
                <OpportunityMatchCard
                  key={opportunity.id}
                  opportunity={opportunity}
                  isSaved={isSaved(opportunity.id)}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionHeading
            title="Deadlines coming up"
            subtitle="Saved opportunities due within 14 days"
          />
          {!data.hasAnySaved ? (
            <Card>
              <p className="text-sm text-slate-600">
                You haven&apos;t saved any opportunities yet. Browse your
                matches and save the ones worth pursuing.
              </p>
            </Card>
          ) : data.deadlinesComingUp.length === 0 ? (
            <Card>
              <p className="text-sm text-slate-600">
                No saved deadlines in the next 14 days.
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {data.deadlinesComingUp.map((row) => (
                <DeadlineUpcomingCard key={row.id} row={row} />
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="space-y-8">
        <section>
          <SectionHeading title="In progress" />
          {data.inProgress.length === 0 ? (
            <Card>
              <p className="text-sm text-slate-600">Nothing in progress yet.</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {data.inProgress.map((row) => (
                <InProgressCard key={row.id} row={row} />
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionHeading title="Medium matches" subtitle="Score 60–79" />
          {data.mediumMatches.length === 0 ? (
            <Card>
              <p className="text-sm text-slate-600">No medium matches right now.</p>
            </Card>
          ) : (
            <Card className="divide-y divide-slate-100 !p-0">
              <ul>
                {data.mediumMatches.map((opportunity) => (
                  <MediumMatchRow key={opportunity.id} opportunity={opportunity} />
                ))}
              </ul>
              <div className="border-t border-slate-100 px-4 py-3">
                <Link
                  href="/opportunities?minScore=60&maxScore=80"
                  className="text-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  View all
                </Link>
              </div>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}

function DeadlineUpcomingCard({ row }: { row: SavedOpportunityRow }) {
  const opp = row.opportunities;
  if (!opp) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-900">
          {opp.title ?? "Untitled tender"}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <DeadlineDisplay deadline={opp.deadline} />
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${savedStatusClass(row.status)}`}
          >
            {savedStatusLabel(row.status)}
          </span>
        </div>
      </div>
      <LinkButton
        href={`/opportunities/${opp.id}`}
        variant="secondary"
        size="sm"
      >
        View
      </LinkButton>
    </div>
  );
}

function InProgressCard({ row }: { row: SavedOpportunityRow }) {
  const opp = row.opportunities;
  if (!opp) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="truncate font-medium text-slate-900">
        {opp.title ?? "Untitled tender"}
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${savedStatusClass(row.status)}`}
        >
          {savedStatusLabel(row.status)}
        </span>
        <DeadlineDisplay deadline={opp.deadline} />
      </div>
      <div className="mt-3">
        <LinkButton
          href={`/opportunities/${opp.id}`}
          variant="primary"
          size="sm"
        >
          Continue
        </LinkButton>
      </div>
    </div>
  );
}

function MediumMatchRow({ opportunity }: { opportunity: Opportunity }) {
  return (
    <li>
      <Link
        href={`/opportunities/${opportunity.id}`}
        className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50"
      >
        <span
          className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold ${getScoreBadgeClass(opportunity.match_score)}`}
        >
          {opportunity.match_score ?? "—"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-900">
            {opportunity.title ?? "Untitled"}
          </p>
          <p className="text-xs text-slate-500">
            {getCountryFlag(opportunity.country)}{" "}
            {opportunity.country ?? "—"}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <DeadlineDisplay deadline={opportunity.deadline} className="text-right" />
        </div>
      </Link>
    </li>
  );
}
