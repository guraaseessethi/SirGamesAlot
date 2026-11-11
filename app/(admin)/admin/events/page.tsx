import type { Metadata } from 'next';
import { EventsPage } from '@/components/admin/EventsPage';

export const metadata: Metadata = { title: 'Events' };

export default function Page() {
  return <EventsPage />;
}
