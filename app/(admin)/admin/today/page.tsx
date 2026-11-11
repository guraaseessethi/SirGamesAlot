import type { Metadata } from 'next';
import { TodayPage } from '@/components/admin/TodayPage';

export const metadata: Metadata = { title: 'Today' };

export default function Page() {
  return <TodayPage />;
}
