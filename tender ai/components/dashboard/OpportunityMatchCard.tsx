import { SaveOpportunityButton } from "@/components/dashboard/SaveOpportunityButton";
import { DeadlineDisplay } from "@/components/opportunities/DeadlineDisplay";
import { LinkButton } from "@/components/ui/Button";
import {
  formatBudgetRange,
  getCountryFlag,
  getPortalLabel,
  getScoreBadgeClass,
} from "@/lib/opportunities/format";
import type { Opportunity } from "@/lib/sources/types";

export function OpportunityMatchCard({
  opportunity,
  isSaved,
}: {
  opportunity: Opportunity;
  isSaved: boolean;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex gap-4">
        <div
          className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl text-center ${getScoreBadgeClass(opportunity.match_score)}`}
        >
          <span className="text-xl font-bold leading-none">
            {opportunity.match_score ?? "—"}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wide">
            match
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {getPortalLabel(opportunity.source_portal)}
            </span>
          </div>
          <h3 className="font-semibold text-slate-900 line-clamp-2">
            {opportunity.title ?? "Untitled tender"}
          </h3>
          <p className="mt-0.5 text-sm text-slate-600">
            {opportunity.buyer_name ?? "Unknown buyer"}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
            <span>
              {getCountryFlag(opportunity.country)}{" "}
              {opportunity.country ?? "—"}
            </span>
            <span>
              {formatBudgetRange(
                opportunity.budget_min,
                opportunity.budget_max
              )}
            </span>
          </div>

          <div className="mt-2">
            <DeadlineDisplay deadline={opportunity.deadline} />
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
        <LinkButton
          href={`/opportunities/${opportunity.id}`}
          variant="primary"
          size="sm"
        >
          View
        </LinkButton>
        <SaveOpportunityButton
          opportunityId={opportunity.id}
          isSaved={isSaved}
        />
      </div>
    </article>
  );
}
