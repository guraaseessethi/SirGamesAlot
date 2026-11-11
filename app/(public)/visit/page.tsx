import type { Metadata } from 'next';
import { PageHero } from '@/components/public/Sections';
import sections from '@/components/public/Sections.module.css';
import visit from '@/components/public/Visit.module.css';
import { VisitSection } from '@/components/public/VisitSection';
import { JsonLd } from '@/components/ui/JsonLd';
import { PhotoSlot } from '@/components/ui/PhotoSlot';
import { storeJsonLd } from '@/lib/content/seo';
import { getRepository } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Hours and directions',
  description: 'Sir Games-A-Lot is on the lower level of the Bayfield Mall, 320 Bayfield Street, Barrie, next to Bowlerama and Service Ontario. Hours, phone and entrance directions.',
  alternates: { canonical: '/visit' },
};

export default async function VisitPage() {
  const settings = await getRepository().getSettings();
  return (
    <>
      <JsonLd data={storeJsonLd(settings)} />
      <PageHero kicker="Visit" title="Lower level, Bayfield Mall">
        Near Bowlerama and Service Ontario. Main doors are closed for construction, so use the Coulter Street side.
      </PageHero>
      <div className={`wrap ${sections.pageBody}`}>
        <VisitSection settings={settings} nowIso={new Date().toISOString()} />
        <h2 className={sections.sectionTitle} style={{ marginTop: 40 }}>
          Inside the shop
        </h2>
        <div className={visit.photos}>
          <PhotoSlot label="Storefront and sign" alt="The Sir Games-A-Lot storefront" width={1200} height={800} />
          <PhotoSlot label="Statues at the door" alt="Life-size statues at the entrance" width={1200} height={800} />
          <PhotoSlot label="The Citadel paint wall" alt="The wall of miniature paints" width={1200} height={800} />
          <PhotoSlot label="The playspace tables" alt="Playspace tables in the store" width={1200} height={800} />
        </div>
      </div>
    </>
  );
}
