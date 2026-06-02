import { redirect } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { getCompanyProfile } from "@/app/actions/onboarding";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default async function DashboardPage() {
  const profile = await getCompanyProfile();

  if (!profile?.onboarding_complete) {
    redirect("/onboard");
  }

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

      <main className="mx-auto max-w-5xl px-6 py-12">
        <Card className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl">
            ✓
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Dashboard coming soon — your profile is saved.
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-slate-600">
            {profile.name
              ? `Welcome, ${profile.name}. Tender matching and proposal drafting are up next.`
              : "Your company profile is ready. Tender matching and proposal drafting are up next."}
          </p>
        </Card>
      </main>
    </div>
  );
}
