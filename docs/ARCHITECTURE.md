# Architecture

## What this is

A clickable **mockup** (Phase 1) of the Sir Games-A-Lot website and back office. All data is sample data. The code is
shaped so that Phase 2 swaps in a real stock source and a real database **without rewriting any screen**.

## Layout

```
app/
  layout.tsx            fonts, <html>, toast provider
  (public)/             home, stock, events, events/[slug], visit, special-order
  (admin)/admin/        today, stock, holds, events, customers, outbox, settings (demo role picker)
  robots.ts sitemap.ts  indexing rules and sitemap
proxy.ts                per-request CSP nonce, admin noindex, ?review=1 switch
lib/
  domain/               types.ts, schemas.ts (zod), interests.ts
  stock/                status.ts (in / low / order / out), search.ts, catalog.ts
  events/               recurrence.ts, seats.ts, events.ts, ics.ts, download.ts
  hours/                hours.ts (weekly hours, holidays, "open now")
  data/                 repository.ts (interface), mock/ (sample data + localStorage), index.ts, hooks.ts
  inventory-source/     source.ts (interface), mock.ts, README.md
components/             public/, admin/, ui/
tests/                  unit/ (repository), e2e/ (Playwright + axe)
```

## The two seams

1. **`InventorySource`** is the only way the UI reads stock counts: `listItems()`, `getCounts()`, `lastSyncedAt()`.
   The POS stays the single source of truth for counts. Phase 1 has `MockInventorySource`.
2. **`DataRepository`** is the only way the UI reads or writes everything else: settings, stock overrides, holds,
   special orders, back-in-stock requests, events, sign-ups, customers, outbox. Phase 1 has `MockRepository`.
   `getRepository()` reads `NEXT_PUBLIC_DATA_SOURCE=mock|supabase`; `supabase` throws a clear "Phase 2" error.

Stock shown to the public = POS item (from `InventorySource`) merged with staff overrides (from `DataRepository`) in
`lib/stock/catalog.ts`. A re-sync can never wipe an override.

## How the mock works

- `MockRepository` keeps state in memory and in `localStorage` (`sgal-demo-state-v1`). The public site and the admin
  demo share it, so a hold placed on `/stock` shows up in `/admin/holds`, including across tabs (the `storage` event).
- On the server it is a fresh, seeded, in-memory copy per request. That gives real HTML, titles and JSON-LD for
  crawlers and the first paint, then the browser swaps in the stored state.
- Server components pass their seed data as `initial` props to client islands, so server HTML and hydration match.
  `useRepoData` (in `lib/data/hooks.ts`) then loads the repository **lazily** and subscribes to changes.
- The repository validates every write with zod again (defence in depth), mirroring what the database will do.
- Sample people use `example.invalid` addresses and `705-555-01xx` numbers. No real personal data is ever stored.
- "Counts updated today at …" comes from `lastSyncedAt()`. The mock records one timestamp (about 40 minutes before the
  first visit) and keeps it, so it never moves on every reload and never pretends to be live.

## Rules the code follows

- Money is **integer cents**; HST is 13% (`lib/money.ts`).
- Times are stored as instants (UTC) and shown in `America/Toronto`. Recurrence works on calendar dates with UTC
  arithmetic only, so daylight-saving changes never move an event.
- **Past events never show as upcoming** (`isUpcoming` is true only until the end time). They appear in "Event
  history". The next anniversary is a setting ("May 2027 · date TBA").
- Seat capacity is enforced in `decideSignup`/`seatSummary`. Phase 2 enforces it again in the database.
- Holds expire by comparison at read time, so nothing needs a background job in Phase 1.
- No online payment anywhere. Fees say "pay at the counter".

## Rendering and performance

- Server Components by default. Client islands: stock checker, events list, d20, hours/open-now, forms, admin.
- The request forms and the repository are loaded on demand (`next/dynamic` and a dynamic `import()`), which keeps
  first-load JavaScript small. Home shows 6 stock items and 5 events until the visitor asks for more.
- Every page is rendered per request, because the CSP nonce must be unique per request.
- Measured on the production build, Lighthouse mobile, home: performance 95–96, accessibility 100, best practices 100,
  SEO 100 (with `NEXT_PUBLIC_ALLOW_INDEXING=true`; see SECURITY.md for why the default is noindex).

## Accessibility (WCAG 2.2 AA)

- One `h1` per page, landmarks, skip link, visible 3px focus ring.
- Chips and filters use `aria-pressed`. The seats bar is decorative; the text under it carries the same facts.
- Toasts and the d20 result use polite live regions. The die is a real button with a name.
  `prefers-reduced-motion` shows the result without spinning.
- Dialogs are native `<dialog>` (focus trap, Escape, inert background). Errors are announced and focus moves to
  the first invalid field.
- Palette contrast is unit-tested (`lib/a11y/contrast.test.ts`). The green and amber in the concept were darkened a
  little so status text passes 4.5:1 on white and cream. Yellow is never used as text on white.
- `@axe-core/playwright` runs on every public page, an event page and every admin page with zero serious or
  critical issues allowed.

## Testing

| Layer | Tool                  | What                                                                                                                                                        |
| ----- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit  | Vitest (114 tests)    | stock status and search, holds, seats and waitlist, recurrence, hours and open-now, DST, money, d20, CSV, contrast, ICS, repository flows                   |
| E2E   | Playwright (38 tests) | every page, CSP/console errors, hold → admin, seat → admin, waitlist and promote, banner off, staff vs owner, reduced motion, no horizontal scroll at 360px |
| A11y  | axe                   | every public and admin page                                                                                                                                 |
