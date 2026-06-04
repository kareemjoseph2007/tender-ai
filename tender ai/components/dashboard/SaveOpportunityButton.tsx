"use client";

import { useFormStatus } from "react-dom";
import { saveOpportunity } from "@/app/actions/opportunities";
import { Button } from "@/components/ui/Button";

function SaveSubmit({ isSaved }: { isSaved: boolean }) {
  const { pending } = useFormStatus();

  if (isSaved) {
    return (
      <Button type="button" variant="secondary" size="sm" disabled>
        Saved
      </Button>
    );
  }

  return (
    <Button type="submit" variant="secondary" size="sm" disabled={pending}>
      {pending ? "Saving…" : "Save"}
    </Button>
  );
}

export function SaveOpportunityButton({
  opportunityId,
  isSaved,
}: {
  opportunityId: string;
  isSaved: boolean;
}) {
  return (
    <form action={saveOpportunity.bind(null, opportunityId)}>
      <SaveSubmit isSaved={isSaved} />
    </form>
  );
}
