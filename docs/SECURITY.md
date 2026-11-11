# Security

## Phase 1 (this mockup)

- **No real personal data.** Everything is sample data. Anything typed into a form stays in that browser's
  `localStorage`; it is never sent anywhere. The only network calls are to this site.
- **No secrets.** There are none. `.env.example` lists the three public settings. `.env*` files are git-ignored.
- **Headers** (`next.config.ts` and `proxy.ts`): `Content-Security-Policy` with a per-request nonce for scripts and
  `'strict-dynamic'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`;
  `Strict-Transport-Security` (2 years, preload); `X-Content-Type-Options: nosniff`; `X-Frame-Options: DENY`;
  `Referrer-Policy: strict-origin-when-cross-origin`; `Permissions-Policy` (camera, microphone, geolocation, payment
  off); `Cross-Origin-Opener-Policy: same-origin`.
  - `style-src` allows `'unsafe-inline'` because React inline `style` attributes need it. Scripts, which are the
    real XSS risk, do not.
  - zod's JIT mode is switched off (`z.config({ jitless: true })`) so nothing needs `eval`.
- **Indexing is off by default.** The mockup shows made-up stock and prices, so `robots.txt` disallows everything and
  pages send `noindex`. Set `NEXT_PUBLIC_ALLOW_INDEXING=true` at launch to switch on the sitemap, robots and indexing.
  `/admin` is `noindex` and `Cache-Control: no-store` always.
- **The admin demo has no security.** The Owner/Staff picker is a label, not a login, and says so on screen
  ("Demo. Real staff login comes in the full build."). It only protects nothing, because there is nothing real to protect.
- JSON-LD escapes `<`. CSV exports neutralise spreadsheet formulas. User text is rendered by React (escaped).
- Dependabot is configured. Turn on branch protection and required checks when the repo moves to the client's account.

## Phase 2 (full build)

### Roles (enforced by Postgres row-level security, not just by hiding buttons)

| Role  | Access                                                                          |
| ----- | ------------------------------------------------------------------------------- |
| Owner | Everything: settings, exports, customers, staff invites                         |
| Staff | Holds, special orders, event check-in, stock overrides. No exports, no settings |

### Controls

- **Auth**: Supabase Auth. **TOTP MFA required for the owner.** Invite-only staff accounts, no public sign-up.
- **RLS on every table.** The public site writes only through narrow server routes (hold, order, back-in-stock,
  sign-up), never with direct table access.
- **Secrets are server-only.** POS API token (read-only scope where the provider allows it) and the Supabase
  service-role key live in Vercel environment variables, never in client code.
- **Every public form**: zod validation on the server, rate limiting per IP and per email/phone, **Cloudflare
  Turnstile**, and a honeypot field.
- **Seat capacity is enforced in the database** (a transaction with a row lock, or a capacity check constraint), so
  two people can never take the last seat.
- **CSP with nonces, HSTS**, Dependabot, branch protection, required reviews.
- **Audit log** for staff actions: stock overrides, status changes, exports, setting changes.
- **Backups**: Supabase daily backups plus a nightly encrypted `pg_dump` to Cloudflare R2 from GitHub Actions.
  Restore is practised once before launch.
- **Monitoring**: Sentry (errors) and an uptime monitor with email alerts.

### CASL (Canada's anti-spam law)

- Hold, order and event confirmations, "your order is in" and "a seat opened up" are **transactional** and need no
  opt-in.
- Newsletters and "new stock" blasts need **recorded consent**: a `consents` row with timestamp and source (which form),
  an unchecked-by-default checkbox, and a **one-click unsubscribe** link in every message.
- Every marketing email states who it is from and includes the store's mailing address.
- The Phase 1 demo already models this: the opt-in box is unchecked by default, the customer record stores the
  consent date and source, and the admin filters by consent.

### Personal data we keep

Name, phone or email, what they held or ordered, interests, consent status. No payment details, ever. Retention
rule to agree with the owner: purge holds and sign-ups older than 24 months unless the person is opted in.

### Honest note for the client

No system is unbreachable. This one keeps very little personal data, limits each account to what it needs,
requires MFA for the owner, and can be restored from backup in hours.
