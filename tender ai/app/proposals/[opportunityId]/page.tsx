import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getProposalDraft } from "@/app/actions/proposals";
import { getOpportunityById } from "@/app/actions/opportunities";
import { getCompanyProfile } from "@/app/actions/onboarding";
import { signOut } from "@/app/actions/auth";
import { ProposalWriter } from "@/components/proposals/ProposalWriter";
import { Button } from "@/components/ui/Button";
import type { ProposalSections } from "@/lib/proposals/types";

export default async function ProposalPage({
  params,
}: {
  params: { opportunityId: string };
}) {
  const profile = await getCompanyProfile();
  if (!profile?.onboarding_complete) {
    redirect("/onboard");
  }

  const opportunity = await getOpportunityById(params.opportunityId);
  if (!opportunity) {
    notFound();
  }

  const draft = await getProposalDraft(params.opportunityId);
  const draftSections = draft?.sections as ProposalSections | undefined;
  const hasGeneratedContent =
    draftSections &&
    Object.entries(draftSections).some(
      ([key, section]) =>
        key !== "pricing" &&
        section.content &&
        section.content.length > 80 &&
        !section.content.startsWith("[Complete your pricing")
    );

  const initialDraft =
    draft && hasGeneratedContent
      ? {
          id: draft.id,
          sections: draftSections,
          status: draft.status,
        }
      : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">
              T
            </div>
            <span className="font-semibold text-slate-900">TenderAI</span>
          </Link>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <ProposalWriter
          opportunityId={params.opportunityId}
          initialDraft={initialDraft}
        />
      </main>
    </div>
  );
}
