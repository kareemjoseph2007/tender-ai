# TenderAI

AI-powered platform that finds government tenders for small software agencies, checks eligibility, scores fit, and writes proposal drafts.

## Stack

- Next.js 14 (App Router)
- Supabase (auth + database)
- Tailwind CSS
- TypeScript
- Vercel

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Copy `.env.example` to `.env.local` and fill in your credentials:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Run the migration in `supabase/migrations/20250602000000_initial_schema.sql` via the Supabase SQL editor or CLI
4. Enable **Email** auth in Authentication → Providers
5. Enable **Google** OAuth and add redirect URL: `http://localhost:3000/auth/callback`

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/login` | Sign in (email/password + Google) |
| `/signup` | Create account |
| `/onboard` | 4-step company profile onboarding (protected) |
| `/dashboard` | Dashboard placeholder (protected) |

## Project structure

```
app/
  actions/          # Server actions (auth, onboarding)
  auth/callback/    # OAuth callback handler
  dashboard/        # Protected dashboard
  login/            # Login page
  onboard/          # Onboarding wizard
  signup/           # Signup page
components/
  auth/             # Auth forms
  onboarding/       # Onboarding steps + wizard
  ui/               # Reusable UI components
lib/
  supabase/         # Supabase client utilities
  constants.ts      # Form options
  types.ts          # TypeScript types
supabase/
  migrations/       # Database schema
middleware.ts       # Auth + session refresh
```
