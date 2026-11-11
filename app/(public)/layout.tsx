import { DemoRibbon, SiteHeader } from '@/components/public/SiteHeader';
import { SiteFooter } from '@/components/public/SiteFooter';
import { getRepository } from '@/lib/data';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await getRepository().getSettings();
  const nowIso = new Date().toISOString();
  return (
    <>
      <DemoRibbon />
      <SiteHeader settings={settings} nowIso={nowIso} />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
