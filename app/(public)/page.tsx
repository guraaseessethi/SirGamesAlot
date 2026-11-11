import type { Metadata } from 'next';
import { Aisles, Hero, Reviews } from '@/components/public/Sections';
import sections from '@/components/public/Sections.module.css';
import { D20Roller } from '@/components/public/D20Roller';
import { EventsLayout } from '@/components/public/EventsLayout';
import { StockChecker } from '@/components/public/StockChecker';
import { VisitSection } from '@/components/public/VisitSection';
import { JsonLd } from '@/components/ui/JsonLd';
import { storeJsonLd } from '@/lib/content/seo';
import { getInventorySource, getRepository } from '@/lib/data';
import { loadProducts } from '@/lib/stock/catalog';
import { isUpcoming } from '@/lib/events/events';

export const metadata: Metadata = { alternates: { canonical: '/' } };

export default async function HomePage() {
  const repo = getRepository();
  const now = new Date();
  const [settings, products, events, signups] = await Promise.all([
    repo.getSettings(),
    loadProducts(getInventorySource(), repo),
    repo.listEvents(),
    repo.listSignups(),
  ]);
  const relevantEvents = events.filter((e) => isUpcoming(e, now) || !e.seriesId);
  const nowIso = now.toISOString();

  return (
    <>
      <JsonLd data={storeJsonLd(settings)} />
      <Hero />

      <section className={`${sections.s} dots`} aria-labelledby="aisles-title">
        <div className="wrap">
          <div className={sections.sh}>
            <div>
              <div className="kick">What&apos;s on the shelves</div>
              <h2 id="aisles-title">Pick your aisle</h2>
            </div>
            <p>Come in for one game, leave with a new hobby. The staff actually play this stuff, so ask.</p>
          </div>
          <Aisles />
        </div>
      </section>

      <section className={sections.s} id="stock" aria-labelledby="stock-title">
        <div className="wrap">
          <div className={sections.sh}>
            <div>
              <div className="kick">Stock checker</div>
              <h2 id="stock-title">Got it? Check before you drive.</h2>
            </div>
            <p>Search a paint, codex, book or booster. Hold it at the counter, or ask us to order it in.</p>
          </div>
          <StockChecker initialProducts={products} initialSettings={settings} idPrefix="home-stock" />
        </div>
      </section>

      <section className={`${sections.s} dots`} id="events" aria-labelledby="events-title">
        <div className="wrap">
          <div className={sections.sh}>
            <div>
              <div className="kick">Events</div>
              <h2 id="events-title">Sales, cosplay &amp; game days</h2>
            </div>
            <p>Every event is on one calendar now, with times, costs and seats, instead of buried in comments.</p>
          </div>
          <EventsLayout events={relevantEvents} signups={signups} nowIso={nowIso} anniversaryLabel={settings.nextAnniversaryLabel} limit={8} />
        </div>
      </section>

      <section className={sections.s} id="roll" aria-label="Take 10% off, or roll for it">
        <div className="wrap">
          <D20Roller initialPromoEnabled={settings.d20PromoEnabled} />
        </div>
      </section>

      <section className={`${sections.s} dots`} aria-labelledby="reviews-title">
        <div className="wrap">
          <div className={sections.sh}>
            <div>
              <div className="kick">Reviews</div>
              <h2 id="reviews-title">Locals say it best</h2>
            </div>
          </div>
          <Reviews />
        </div>
      </section>

      <section className={sections.s} id="visit" aria-labelledby="visit-title">
        <div className="wrap">
          <div className={sections.sh}>
            <div>
              <div className="kick">Visit</div>
              <h2 id="visit-title">Lower level, Bayfield Mall</h2>
            </div>
            <p>Near Bowlerama and Service Ontario. Main doors are closed for construction, so use the Coulter Street side.</p>
          </div>
          <VisitSection settings={settings} nowIso={nowIso} />
        </div>
      </section>
    </>
  );
}
