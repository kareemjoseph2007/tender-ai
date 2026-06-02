import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-brand-950 text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-sm font-bold">
            T
          </div>
          <span className="text-lg font-semibold">TenderAI</span>
        </div>
        <Link
          href="/login"
          className="text-sm text-slate-300 transition hover:text-white"
        >
          Sign in
        </Link>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-24 text-center sm:py-32">
        <div className="mb-6 inline-flex items-center rounded-full border border-brand-400/30 bg-brand-500/10 px-4 py-1.5 text-sm text-brand-200">
          AI-powered tender intelligence for software agencies
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl sm:leading-tight">
          Win more government tenders
          <span className="block text-brand-400">without the grind</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
          TenderAI finds relevant opportunities, checks your eligibility, scores
          fit, and drafts proposals using your company profile and past projects.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <LinkButton href="/signup" size="lg">
            Sign up — it&apos;s free
          </LinkButton>
          <Link
            href="/login"
            className="text-sm text-slate-400 transition hover:text-white"
          >
            Already have an account?
          </Link>
        </div>
      </main>
    </div>
  );
}
