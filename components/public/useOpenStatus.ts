'use client';

import { useRepoData, useNow } from '@/lib/data/hooks';
import type { Settings } from '@/lib/domain/types';
import { getOpenStatus } from '@/lib/hours/hours';

export function useStoreHours(initialSettings: Settings, initialNowIso: string) {
  const settings = useRepoData((r) => r.getSettings(), initialSettings);
  const now = useNow(initialNowIso);
  return { settings, now, status: getOpenStatus(settings, now) };
}
