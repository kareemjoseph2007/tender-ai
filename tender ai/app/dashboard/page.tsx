import { redirect } from "next/navigation";
import {
  getDashboardData,
  touchLastLoginAndGetPrevious,
} from "@/app/actions/dashboard";
import { signOut } from "@/app/actions/auth";
import { getCompanyProfile } from "@/app/actions/onboarding";
import { DashboardSections } from "@/components/dashboard/DashboardSections";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/server";

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <Card className="!p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </Card>
  );
}

export default async function DashboardPage() {
  const profile = await getCompanyProfile();

  if (!profile?.onboarding_complete) {
    redirect("/onboard");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const loginMeta = await touchLastLoginAndGetPrevious();
  const data = await getDashboardData(
    profile.id,
    user.id,
    loginMeta?.previousLastLogin ?? null
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
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

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">
            {profile.name
              ? `Opportunities matched for ${profile.name}`
              : "Your tender pipeline at a glance"}
          </p>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Tenders found this week"
            value={data.stats.tendersThisWeek}
          />
          <StatCard
            label="Strong matches"
            value={data.stats.strongMatches}
          />
          <StatCard
            label="Deadlines in 14 days"
            value={data.stats.deadlinesIn14Days}
          />
          <StatCard
            label="Proposals drafted"
            value={data.stats.proposalsDrafted}
          />
        </div>

        <DashboardSections data={data} />

        <div className="mt-8 text-center">
          <LinkButton href="/onboard" variant="ghost" size="sm">
            Edit company profile
          </LinkButton>
        </div>
      </main>
    </div>
  );
}
