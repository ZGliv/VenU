# VenU

Campus talent, one booking away.

A campus service marketplace: discover an approved provider, choose a service and time, request an appointment, and track the provider’s response. Providers manage a weekly schedule and confirm, decline, or complete appointments. Customers pay providers directly; VenU does not process payments.

## Current release status

The October 2026 booking-integrity changes are implemented and verified locally. The existing production site is [venu-xi.vercel.app](https://venu-xi.vercel.app), but its original Supabase project is unavailable. **The new migration and app have not been deployed to that backend.** See [restoration steps](docs/RESTORE.md) before deploying this branch.

## Development

1. Run `npm ci` (Node 22+).
2. Copy `.env.example` to `.env.local` and configure an owned Supabase project. Only public client credentials belong here; never use a service-role key in a public variable.
3. Apply migrations in order to that project, inspect the migration history first, and configure Google OAuth and allowed callback URLs. Do not load the historical synthetic seed into a real marketplace.
4. Run `npm run dev`.

Every signup receives a student profile through a database trigger. A student can become a provider. An existing trusted administrator or database operator must provision administrator access; the browser cannot grant it and `NEXT_PUBLIC_ADMIN_EMAILS` is no longer used. Providers must save an explicit timezone and weekly schedule, and listings need administrator approval before booking.

## Verification

- `npm run build` — production build, TypeScript and lint.
- `scripts/test-db.sh` — disposable real PostgreSQL database, all migrations, concurrency/RLS/state-transition tests. Requires local PostgreSQL commands (`initdb`, `pg_ctl`, `psql`) and Python 3. Uses loopback port 55438, leaves hosted data untouched, and cleans up its own temporary cluster.
- `playwright-cli run-code --filename scripts/check-booking-ui.js` — browser contract checks at 375px and 1440px against a local build on port 3107. These use synthetic Supabase responses; they do **not** establish hosted authentication or an end-to-end production pass. See the script header and restoration checklist.
- `npm audit --omit=dev` — production dependencies. Full audit still reports issues in the existing Tailwind 3/build-tool dependency chain; do not run untrusted CSS or glob inputs through this toolchain.

[Architecture](docs/ARCHITECTURE.md) · [Roadmap](docs/MASTER.md) · [Restore and release](docs/RESTORE.md)
