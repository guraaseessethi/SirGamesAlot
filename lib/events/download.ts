'use client';

import type { StoreEvent } from '@/lib/domain/types';
import { buildIcs } from './ics';

/** Builds the .ics in the browser so it works for every event, including ones added in the admin demo. */
export function downloadIcs(event: StoreEvent): void {
  const blob = new Blob([buildIcs(event)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${event.slug}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
