import type { Metadata } from 'next';
import { StockPage } from '@/components/admin/StockPage';

export const metadata: Metadata = { title: 'Stock' };

export default function Page() {
  return <StockPage />;
}
