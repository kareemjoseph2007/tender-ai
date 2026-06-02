import { redirect } from "next/navigation";
import { getCompanyProfile, loadOnboardingData } from "@/app/actions/onboarding";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export default async function OnboardPage() {
  const profile = await getCompanyProfile();

  if (profile?.onboarding_complete) {
    redirect("/dashboard");
  }

  const initialData = (await loadOnboardingData()) ?? {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50/20">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-6 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">
            T
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">TenderAI</p>
            <p className="text-xs text-slate-500">Company profile setup</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <OnboardingWizard initialData={initialData} />
      </main>
    </div>
  );
}
