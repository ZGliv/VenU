# VenU

**Campus talent, one booking away.**

VenU brings campus services into a shared marketplace. Students discover approved providers, choose a service, request an available appointment, and track the provider’s response. Providers publish services and prices, set a weekly schedule, and manage appointments. Payment happens directly with the provider.

## Implemented in the October 2026 branch

- Campus/category/search discovery based on approved listings. Campuses come from actual listings; new providers enter their own campus.
- Service requests with provider timezone, server-issued slots, authoritative prices/duration, and provider-wide overlap protection.
- Pending → confirmed/declined → completed provider workflow; customers can cancel before an appointment starts. Stale transitions are rejected.
- Atomic weekly schedule saves, explicit timezone setup, profile/approval protection, participant privacy and retained booking history.
- Honest pending receipts and recovery states. Fabricated ratings, population counts, and the obsolete payment-placeholder flow have been removed.
- Patched Next.js/Supabase dependencies, successful local production build, PostgreSQL integration tests, and browser contract checks at 375px and 1440px.

## Release gate

The historical Supabase project is unavailable. This branch is **not a verified live MVP yet**. [Restore and release steps](RESTORE.md) cover backend selection, preservation of any recoverable data, migrations, actual hosted OAuth, isolated multi-account acceptance tests, and Vercel preview before promotion. Historical seed data is fictional and must not be presented as real providers.

## Next milestones

1. Restore or replace the owned backend and verify the full hosted student/provider/administrator flow.
2. Run a small campus pilot with consenting providers: real service details, prices, timezone and availability; test missed/declined appointments and support needs.
3. Add one-off schedule exceptions, rescheduling and a clearly defined request-expiry policy.
4. Add opt-in notifications and calendar export when delivery settings and consent are established.
5. Complete verified reviews after actual completed appointments. Consider payments only after the service workflow and operating model are proven.
