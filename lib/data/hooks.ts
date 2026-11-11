'use client';

import { useEffect, useRef, useState } from 'react';
import type { InventorySource } from '@/lib/inventory-source/source';
import type { DataRepository } from './repository';

/**
 * Loads data from the repository in the browser and keeps it fresh when anything changes
 * (this tab or another). `initial` is rendered first, so server HTML and hydration match.
 *
 * The repository (validation, sample data) is imported lazily so it stays out of the first
 * JavaScript the browser has to download and run.
 */
export function useRepoData<T>(
  loader: (repo: DataRepository, source: InventorySource) => Promise<T>,
  initial: T,
): T {
  const [data, setData] = useState<T>(initial);
  const loaderRef = useRef(loader);
  useEffect(() => {
    loaderRef.current = loader;
  });

  useEffect(() => {
    let active = true;
    let off = () => {};
    import('./index').then(({ getRepository, getInventorySource }) => {
      if (!active) return;
      const repo = getRepository();
      const source = getInventorySource();
      const run = () => {
        loaderRef.current(repo, source).then(
          (value) => {
            if (active) setData(value);
          },
          () => {
            // Keep showing the last good data.
          },
        );
      };
      run();
      off = repo.subscribe(run);
    });
    return () => {
      active = false;
      off();
    };
  }, []);

  return data;
}

/** The current time, starting from a server-provided instant so hydration matches. */
export function useNow(initialIso: string, everyMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date(initialIso));
  useEffect(() => {
    const first = setTimeout(() => setNow(new Date()), 0);
    const t = setInterval(() => setNow(new Date()), everyMs);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [everyMs]);
  return now;
}

/** Warm up a lazily loaded chunk once the browser is idle, so the first click feels instant. */
export function useIdlePrefetch(load: () => Promise<unknown>) {
  const ref = useRef(load);
  useEffect(() => {
    const run = () => void ref.current();
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(run, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const t = setTimeout(run, 2000);
    return () => clearTimeout(t);
  }, []);
}
