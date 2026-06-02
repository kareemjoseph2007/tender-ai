"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { signIn, signInWithGoogle, signUp } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { FormField, TextInput } from "@/components/ui/FormField";
import { Card, CardHeader } from "@/components/ui/Card";

function GoogleButton() {
  return (
    <form action={signInWithGoogle}>
      <Button type="submit" variant="secondary" className="w-full gap-2">
        <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </Button>
    </form>
  );
}

export function LoginForm() {
  const [state, formAction] = useFormState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return (await signIn(formData)) ?? null;
    },
    null
  );

  return (
    <Card>
      <CardHeader
        title="Welcome back"
        description="Sign in to find and win government tenders."
      />

      {state?.error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <GoogleButton />

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs text-slate-500">or</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <form action={formAction} className="space-y-4">
        <FormField label="Email" required>
          <TextInput
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@agency.com"
          />
        </FormField>
        <FormField label="Password" required>
          <TextInput
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
          />
        </FormField>
        <Button type="submit" className="w-full">
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-brand-600 hover:text-brand-700">
          Sign up
        </Link>
      </p>
    </Card>
  );
}

export function SignupForm() {
  const [state, formAction] = useFormState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return (await signUp(formData)) ?? null;
    },
    null
  );

  return (
    <Card>
      <CardHeader
        title="Create your account"
        description="Start finding government tenders matched to your agency."
      />

      {state?.error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <GoogleButton />

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs text-slate-500">or</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <form action={formAction} className="space-y-4">
        <FormField label="Email" required>
          <TextInput
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@agency.com"
          />
        </FormField>
        <FormField label="Password" required hint="At least 6 characters">
          <TextInput
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            placeholder="••••••••"
          />
        </FormField>
        <Button type="submit" className="w-full">
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Sign in
        </Link>
      </p>
    </Card>
  );
}

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-brand-50/30 px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">
          T
        </div>
        <span className="text-lg font-semibold text-slate-900">TenderAI</span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
