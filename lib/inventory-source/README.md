# Inventory source adapters

The website never owns stock counts. The store's POS does. Everything in the UI reads stock through the
`InventorySource` interface in `source.ts`:

```ts
interface InventorySource {
  listItems(): Promise<InventoryItem[]>;
  getCounts(): Promise<Record<string, number>>;
  lastSyncedAt(): Promise<Date | null>;
}
```

Phase 1 ships `MockInventorySource` (sample data only). Staff overrides (manual status, shelf location, low-stock
threshold) are separate and live in `DataRepository`, so a re-sync never wipes them.

## Phase 2 adapters (write one, swap it in `lib/inventory-source/index.ts`)

| Store runs on      | Adapter                                            | Notes                                                                                                                     |
| ------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Square             | `square.ts` using the Catalog + Inventory APIs     | Read-only access token, server-only. Poll about every 15 minutes.                                                         |
| Lightspeed         | `lightspeed.ts`                                    | Read-only API key. Map `Item` + `ItemShop.qoh` to `InventoryItem`.                                                        |
| Shopify POS        | `shopify.ts` using the Admin API `inventoryLevels` | Read-only scopes only.                                                                                                    |
| No POS with an API | `csv.ts`                                           | Owner uploads a CSV export in admin; we parse with zod and cache it. Or the admin Stock page becomes the source of truth. |

Rules for every adapter:

1. **One place to update stock.** The POS wins; never let staff edit counts on the website.
2. **Cache, don't proxy.** Pull on a schedule (cron), write to `products_cache`, and have the site read the cache.
3. **Honest timestamps.** `lastSyncedAt()` returns the real time of the last successful pull. The UI shows
   "Counts updated today at …" from it. If a sync fails, the old time stays and the admin shows a warning.
4. **Read-only credentials**, stored only as server environment variables.
5. Map into `InventoryItem` (integer cents, `count`, `orderable`) and validate with zod at the boundary.
