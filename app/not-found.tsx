import { PageHero } from '@/components/public/Sections';
import { ButtonLink } from '@/components/ui/Button';
import { SiteFooter } from '@/components/public/SiteFooter';
import { STORE } from '@/lib/content/store';

export default function NotFound() {
  return (
    <>
      <main id="main" tabIndex={-1}>
        <PageHero kicker="Critical miss" title="Page not found">
          You rolled a natural 1. That page isn&apos;t here. Try the stock checker, or call us on {STORE.phone}.
        </PageHero>
        <div className="wrap" style={{ paddingBlock: 36, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <ButtonLink href="/">Back to the shop</ButtonLink>
          <ButtonLink href="/stock" variant="blue">
            Check stock
          </ButtonLink>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
