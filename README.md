# Dispatch OS

Carrier dispatch operations platform.

Phase 1: auth, carrier onboarding with a compliance gate, load board, and a
dashboard.

Phase 2: rate scoring against lane benchmarks, rate confirmation PDF
parsing, broker credit and fraud screening, and a per-truck profit and loss
report.

Phase 3: per-dispatcher scoping with a team model, a driver-facing status
and document link, and automated invoice packets.

## Stack

- Next.js 14, App Router, TypeScript
- Supabase (Postgres, Auth, Row Level Security, Storage)
- Anthropic API (rate confirmation parsing)
- pdf-lib (invoice packet generation)
- Tailwind
- Deploy on Vercel

## Guardrails

- Money never routes through this platform. No payment processing, no
  broker or factoring fund handling. Invoices are generated as documents
  under the carrier's identity only, for the carrier to send to the broker
  or their factoring company themselves. The dispatcher marks a load paid
  manually once the carrier confirms payment. The Trucks P&L report is
  reporting only, it reads existing load data and moves no funds.
- No shipper facing features. The service acts for carriers only.
- Every carrier must have a signed dispatch agreement, active authority,
  and unexpired insurance on file before any load can be created for them.
  This is enforced in the database with triggers, not just the UI.
- Dispatchers see only the carriers assigned to them, the owner sees
  everything. This is enforced with row level security, not just the UI.

## Getting started

1. Copy `.env.local.example` to `.env.local` and fill in your Supabase
   project URL, anon key, and service role key, plus an Anthropic API key
   for rate confirmation parsing. The service role key is used server-side
   only, never exposed to the browser.
2. Run the SQL files in `supabase/migrations/` in order in the Supabase SQL
   editor. See `supabase/README.md` for details.
3. Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

- `app/login`, `app/auth/callback` - auth
- `app/(app)` - authenticated app shell (Dashboard, Carriers, Loads,
  Brokers, Trucks P&L, Team for owners, Settings)
- `app/d/[token]` - public driver link, one load only, no account needed
- `app/api/parse-ratecon` - rate confirmation PDF parsing route
- `app/api/driver/[token]/pod` - driver proof of delivery upload route
- `app/api/loads/[id]/invoice` - invoice packet generation route
- `lib/supabase` - browser, server, middleware, and admin (service role)
  Supabase clients
- `lib/scoring.ts` - lane benchmark rate scoring
- `lib/pnl.ts` - per-truck profit and loss calculations
- `lib/invoice.ts` - invoice packet PDF assembly
- `lib/profile.ts` - current user profile and owner check
- `supabase/migrations` - database schema, compliance gate triggers, RLS
  policies, storage bucket setup, lane benchmarks, broker risk fields,
  equipment cost fields, per-dispatcher scoping, driver token functions,
  and invoice numbering
