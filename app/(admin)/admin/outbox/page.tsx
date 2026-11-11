import type { Metadata } from 'next';
import { OutboxPage } from '@/components/admin/OutboxPage';

export const metadata: Metadata = { title: 'Outbox' };

export default function Page() {
  return <OutboxPage />;
}
