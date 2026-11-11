import type { Metadata } from 'next';
import { PageHero } from '@/components/public/Sections';
import sections from '@/components/public/Sections.module.css';
import { StockChecker } from '@/components/public/StockChecker';
import { getInventorySource, getRepository } from '@/lib/data';
import { CATEGORIES, type Category } from '@/lib/domain/types';
import { loadProducts } from '@/lib/stock/catalog';

export const metadata: Metadata = {
  title: 'Stock checker',
  description: 'Check if we have it before you drive. Search Warhammer, Citadel paints, D&D books, trading cards and board games at Sir Games-A-Lot in Barrie, then hold it or order it in.',
  alternates: { canonical: '/stock' },
};

export default async function StockPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const repo = getRepository();
  const [settings, products] = await Promise.all([repo.getSettings(), loadProducts(getInventorySource(), repo)]);
  const initialCategory = CATEGORIES.includes(category as Category) ? (category as Category) : undefined;
  return (
    <>
      <PageHero kicker="Stock checker" title="Got it? Check before you drive.">
        Search a paint, codex, book or booster. Hold it at the counter for {settings.holdHours} hours, order it in, or ask us to tell you when it&apos;s back.
      </PageHero>
      <div className={`wrap ${sections.pageBody}`}>
        <StockChecker initialProducts={products} initialSettings={settings} idPrefix="stock" initialCategory={initialCategory} />
      </div>
    </>
  );
}
