# Sir Games-A-Lot

Phase 1 clickable mockup for Sir Games-A-Lot, Barrie's independent game and hobby store: a public site (stock
checker with holds and orders, events with seats and waitlist, the d20 "take 10% or roll for it", entrance map) and a
back-office mockup (Today, Stock, Holds & orders, Events, Customers, Outbox, Settings). **All data is sample data.**
Built by Kooht Studio. The approved design is `reference/sir-games-a-lot-concept.html` (not shipped).

## Run it

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

Try it on a phone: place a hold on `/stock`, save a seat on `/events`, roll the d20, then open `/admin` (pick Owner)
and watch it all appear. **Reset demo data** is in the admin header. Add `?review=1` to any public URL to see what
still needs the owner's confirmation.

## Scripts

| Command                        | What it does                                                          |
| ------------------------------ | --------------------------------------------------------------------- |
| `pnpm typecheck` / `pnpm lint` | TypeScript (strict) and ESLint                                        |
| `pnpm test`                    | Vitest unit tests                                                     |
| `pnpm test:e2e`                | Playwright smoke and flow tests plus axe on every page (builds first) |
| `pnpm build`                   | Production build                                                      |
| `pnpm screenshots`             | Writes `docs/screenshots/*` at 360, 768 and 1280 px                   |

Locally, Playwright can use your installed Chrome: `PW_CHANNEL=chrome pnpm test:e2e`. CI installs Chromium.

## Docs

[Architecture](docs/ARCHITECTURE.md) · [Security](docs/SECURITY.md) · [Costs](docs/COSTS.md) ·
[Migration and exit plan](docs/MIGRATION.md) · [Content to confirm](docs/CONTENT_TODO.md) ·
[Photo slots](public/images/README.md) · [Stock adapters](lib/inventory-source/README.md)

## Environment

See `.env.example`. No secrets are needed in Phase 1. Search engines are blocked by default while the site shows
sample data (`NEXT_PUBLIC_ALLOW_INDEXING=false`).
