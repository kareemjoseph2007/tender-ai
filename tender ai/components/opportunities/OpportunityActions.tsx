"use client";

import { useFormStatus } from "react-dom";
import { ignoreOpportunity, saveOpportunity } from "@/app/actions/opportunities";
import { Button, LinkButton } from "@/components/ui/Button";

function SubmitButton({
  children,
  variant = "primary",
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant={variant} disabled={pending}>
      {pending ? "Saving…" : children}
    </Button>
  );
}

export function OpportunityActions({
  opportunityId,
  sourceUrl,
  isSaved,
  isIgnored,
}: {
  opportunityId: string;
  sourceUrl: string | null;
  isSaved: boolean;
  isIgnored: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {!isSaved && !isIgnored && (
        <form action={saveOpportunity.bind(null, opportunityId)}>
          <SubmitButton>Save opportunity</SubmitButton>
        </form>
      )}

      {isSaved && (
        <Button variant="secondary" disabled>
          Saved
        </Button>
      )}

      {!isIgnored && (
        <form action={ignoreOpportunity.bind(null, opportunityId)}>
          <SubmitButton variant="ghost">Ignore</SubmitButton>
        </form>
      )}

      {sourceUrl && (
        <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="secondary" type="button">
            View original tender
          </Button>
        </a>
      )}

      {!isIgnored && (
        <LinkButton href={`/proposals/${opportunityId}`} variant="primary">
          Write Proposal
        </LinkButton>
      )}
    </div>
  );
}
