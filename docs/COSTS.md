# Running costs

Prices are approximate list prices in USD at the time of writing. **Check each vendor's pricing page before quoting
the client**; plans and limits change.

## Phase 1 (this mockup)

| Item                                 | Cost                                                                                                       |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| GitHub private repo                  | $0                                                                                                         |
| Vercel hosting for a private preview | Hobby plan is free but **not allowed for commercial use**. A client demo is fine; the live site needs Pro. |

## Phase 2 (live site)

| Service               | Plan | About                                         | Notes                                                                                       |
| --------------------- | ---- | --------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Vercel                | Pro  | $20/month per seat                            | Required for commercial use. Usually one seat.                                              |
| Supabase              | Pro  | $25/month                                     | Database, auth, backups. Pick the Canada (Central) region if available.                     |
| Resend                | Free | $0 up to roughly 3,000 emails/month (100/day) | Hold confirmations, "it's in", event reminders. $20/month if they outgrow it.               |
| Cloudflare            | Free | $0                                            | DNS, WAF, Turnstile. R2 free tier for nightly backups.                                      |
| Sentry                | Free | $0                                            | Error tracking.                                                                             |
| Uptime monitor        | Free | $0                                            | UptimeRobot or Better Stack.                                                                |
| Domain                |      | roughly $15–25 CAD/year                       | In the client's name.                                                                       |
| Square or Stripe fees |      | pay-per-transaction                           | **Only if** the owner wants prepaid tournament seats. Default is pay at the counter, so $0. |
| Newsletter tool       |      | $0 for now                                    | Keep weekly updates on Facebook/Instagram until there is demand.                            |

**Typical total: about $45/month plus the domain**, with room to grow on the free tiers. Not included: the POS
itself (the store already has one) and Kooht's build and support fees.

## Where costs could jump

- Email volume past the free tier (a big event blast).
- Supabase database size or bandwidth, unlikely at this scale.
- A POS that charges extra for API access. Ask which POS they use before promising live stock.
