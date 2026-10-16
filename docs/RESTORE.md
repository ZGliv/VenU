# Restore and release VenU

## Evidence, 2026-10-16

- Canonical repository: `ZGliv/VenU`, historical main `4915bc3`.
- Existing production: `https://venu-xi.vercel.app`, Vercel project `venu` (`prj_XkNLCZtnV9KOwbiAID6zW21IJfo9`) in `zgliv21-gmailcoms-projects`.
- Production and archived configuration both reference `mhnbocpozdpubjwzquha.supabase.co`. DNS resolution failed for Auth and REST checks. That project is absent from both accessible Supabase inventories. This is not evidence that its data is recoverable elsewhere.
- The MCP-accessible organization `Parl.ai` is Pro/pay-as-you-go. CLI also sees `ushop`, but its plan/capacity is not verified. No replacement project, subscription, migration, live fixture, credential rotation, or production deployment was made by this task.
- Original archived working files remain untouched. Work is isolated in `codex/venu-booking-mvp`. Existing production credentials are retained only in the ignored local `.env.local`; do not commit or share it.

## Before release

1. Confirm the owner-selected Supabase organization and capacity/cost. Restore the original project if possible, or create a separate explicitly authorized project. Do not reuse another app’s database. A fresh project does not recover historical VenU data.
2. Inspect actual tables, policies, migration history, Auth configuration and backups. There are two historical files with the `0003` prefix; do not blindly run `db push` against a linked project. On an existing project, reconcile history before applying the new forward migration. On a clean project, apply each historical SQL file once in filename order, then the new migration; both 0003 policy files are idempotent.
3. Back up data before applying `20261016031955_enforce_booking_integrity.sql`. Review invalid/null account roles/statuses, service durations outside 5–720 minutes, nonpositive booking intervals, and overlapping pending/confirmed reservations across **all services and venues owned by each provider**. The migration fails rather than deleting or guessing how to resolve these conflicts.
4. Apply the forward migration and run Supabase security/performance advisors. This moves `uuid-ossp` and `btree_gist` to the `extensions` schema, adds provider snapshots, server checks, protected role/status updates, restricted profile visibility, and slot/status/schedule RPCs.
5. Configure Google OAuth for the new project and explicit callback URLs for the existing Vercel domain and the selected preview. No user-message/email integration is required by the booking flow. Provision the intended administrator with a trusted database operation after their verified signup. Do not trust an environment email list or user-editable metadata for permissions.
6. Existing providers must choose their actual IANA timezone and save their weekly schedule. The migration deliberately leaves old timezone values NULL; it does not guess where a fictional or historical campus is. Existing reservations are retained. No new request can be made until schedule setup and listing approval are complete.
7. Update the existing Vercel project’s **preview** public Supabase URL/key first. Keep the original values privately for rollback. Never put a service-role key in the browser, and never remove Deployment Protection.
8. Test real hosted sign-in with isolated QA accounts: provider signup → pending listing → administrator approval → service → timezone/schedule → two customers racing for one appointment → provider response → customer refresh/cancellation. Also test inactive accounts, RLS isolation, a different service with overlapping provider time, and browser reload. Remove only generated QA fixtures afterward; never create requests for real providers as tests.
9. Deploy a protected preview. Promote to the existing production alias only after the hosted checks pass and any old data has been reviewed. Do not deploy these client changes against the old schema: the booking UI now depends on the new RPCs and `provider_id`/`timezone` columns.

## Verification boundaries

Local integration checks use PostgreSQL 14 with Supabase-style `anon`/`authenticated` roles and `auth.uid()` derived from test JWT claims. They exercise real constraints, transactions, RLS, rollback and concurrent inserts. They do not test Supabase’s hosted JWT verifier, Google OAuth, SMTP, networking or a different production schema. Browser checks use clearly marked synthetic API responses and validate UI behavior, not live persistence. Production acceptance remains pending until the backend is restored or replaced.

## Product limits

- No in-app payments, automated email/SMS, calendar sync, rescheduling, one-off availability exceptions, or waitlist.
- Pending requests reserve provider time until a participant cancels or the provider responds; there is no automatic expiry job.
- Provider timezone is explicit; dashboard lists label times in the viewer’s device timezone. Fresh requests use the provider timezone including DST.
- Review schema exists, but fabricated ratings/review counts were removed. A complete verified-review UI is future work.
- Public discovery shows approved listing data. Private account profiles/emails are restricted to the account, its booking provider, and administrators; public provider contact details come from the listing fields the provider supplies.
