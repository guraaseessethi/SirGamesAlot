import type { Metadata } from 'next';
import { HoldsPage } from '@/components/admin/HoldsPage';

export const metadata: Metadata = { title: 'Holds & orders' };

export default function Page() {
  return <HoldsPage />;
}
