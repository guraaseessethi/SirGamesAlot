# Photos the owner can supply

The site never uses artwork, box art or logos from Games Workshop, Wizards of the Coast, Blizzard, Riot or any
other publisher, and nothing is copied from the store's Facebook or Instagram. Product tiles use simple icons and
colour blocks. Where a real photo would help, the site has a labelled **photo slot** (`components/ui/PhotoSlot.tsx`).

To fill a slot: drop the file in this folder, then set `src` on that slot (for now the four slots are on
`app/(public)/visit/page.tsx`). `next/image` resizes and compresses it. Please send photos you took yourself, or that
you have permission to use.

| Slot | File name | Size (px) | Notes |
|---|---|---|---|
| Storefront and sign | `storefront.jpg` | 1200 × 800 | Daytime, whole sign visible. |
| Statues at the door | `statues.jpg` | 1200 × 800 | The life-size statues people see first. |
| The Citadel paint wall | `paint-wall.jpg` | 1200 × 800 | Straight on, good light. |
| The playspace | `playspace.jpg` | 1200 × 800 | Tables set up; people optional (ask them first). |
| Event photos (later) | `events/<name>.jpg` | 1200 × 800 | Cosplay contest, tournaments. Ask people before posting. |
| Social preview (later) | `og.jpg` | 1200 × 630 | Used when the link is shared. |

If the store has **retailer image rights** from a distributor or publisher trade portal, product photos can be added
in Phase 2 under that publisher's terms. Keep a note of which terms apply to which images.
