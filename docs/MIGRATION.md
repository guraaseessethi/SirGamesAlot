# Moving from the mockup to the real site, and moving out again

## Phase 2 build plan

1. **Find out what the store uses for sales.** Square, Lightspeed, Shopify POS, something else, or nothing with an
   API. This decides the stock adapter more than anything else.
2. **Accounts in the client's name** (below). Kooht is added as a collaborator.
3. **Database**: write SQL migrations for `staff`, `products_cache`, `product_overrides`, `holds`, `special_orders`,
   `back_in_stock_requests`, `events`, `event_recurrences`, `event_signups`, `customers`, `consents`, `settings`,
   `message_log`, `audit_log`. Turn on RLS and write policies per role. See SECURITY.md.
4. **`SupabaseRepository`** implementing `DataRepository` (`lib/data/repository.ts`). Every method already exists
   in the mock with the same behaviour; the unit tests in `tests/unit/repository.test.ts` become the contract test
   suite, run against both implementations.
   - Seat capacity: a Postgres function that locks the event row, counts seated people and inserts seated or
     waitlist in one transaction.
   - Replace the demo role picker with Supabase Auth and role claims.
   - Move `settings` (banner, hours, holidays, hold length, d20) to a table the public site reads on the server, so the
     banner no longer flashes from the seed value.
5. **Real `InventorySource`** adapter (see `lib/inventory-source/README.md`): scheduled pull (about every 15 min) into
   `products_cache`, real `lastSyncedAt()`.
6. **Email** via Resend on `mail.<domain>` with SPF, DKIM and DMARC. Replace "Would send in the full build" with real
   sends; keep the outbox as `message_log`.
7. **Server routes** for hold, order, back-in-stock and sign-up with zod, rate limiting and Turnstile.
8. **Switch** `NEXT_PUBLIC_DATA_SOURCE=supabase`. Replace the mock-only code paths:
   - server pages call the real repository (no seed fallback);
   - `lib/data/hooks.ts` can subscribe to Supabase Realtime or poll;
   - remove the "Concept preview · sample data" ribbon and the sample badges.
9. Content review from `docs/CONTENT_TODO.md`, real photos, and `NEXT_PUBLIC_ALLOW_INDEXING=true` at launch.
10. Backups, monitoring, restore drill, then launch.

## Accounts and ownership

| Account                | Owner                        | Kooht's access                    |
| ---------------------- | ---------------------------- | --------------------------------- |
| Domain registrar       | Client                       | Collaborator or DNS delegate      |
| Cloudflare             | Client                       | Member                            |
| GitHub repo            | Client's org or account      | Collaborator                      |
| Vercel                 | Client                       | Member                            |
| Supabase               | Client                       | Member                            |
| Resend                 | Client                       | Member                            |
| POS API token          | Client generates (read-only) | Given once, stored only in Vercel |
| Sentry, uptime monitor | Client                       | Member                            |

**Handover = remove Kooht.** Nothing in the stack belongs to Kooht.

## Exit plan

- Standard Postgres, plain SQL migrations, Next.js. It can run on any Node host or container.
- Swapping the POS later means writing **one new `InventorySource` adapter**.
- `scripts/export-all.ts` (Phase 2) writes the whole database to CSV and JSON. Run it before any handover.
- The repository interface keeps the UI independent of Supabase. Moving to another database means one new
  `DataRepository`.
