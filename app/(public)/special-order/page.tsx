import type { Metadata } from 'next';
import { PageHero } from '@/components/public/Sections';
import sections from '@/components/public/Sections.module.css';
import { SpecialOrderForm } from '@/components/public/SpecialOrderForm';

export const metadata: Metadata = {
  title: 'Special order',
  description: "Can't find it on the shelf? Ask Sir Games-A-Lot in Barrie to order it in. No online payment; you pay at the counter when it arrives.",
  alternates: { canonical: '/special-order' },
};

export default function SpecialOrderPage() {
  return (
    <>
      <PageHero kicker="Special order" title="Can't find it? We'll order it in.">
        Tell us what you&apos;re after. We&apos;ll call or email with a price and an arrival date. You pay at the counter when it arrives.
      </PageHero>
      <div className={`wrap ${sections.pageBody}`}>
        <SpecialOrderForm />
      </div>
    </>
  );
}
