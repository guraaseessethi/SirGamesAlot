'use client';

import { useEffect, useRef, useState } from 'react';
import { getRepository } from './index';
import type { DataRepository } from './repository';

/**
 * Loads data from the repository in the browser and keeps it fresh when anything changes
 * (this tab or another). `initial` is rendered first, so server HTML and hydration match.
 */
export function useRepoData<T>(loader: (repo: DataRepository) => Promise<T>, initial: T): T {
  const [data, setData] = useState<T>(initial);
  const loaderRef = useRef(loader);
  useEffect(() => {
    loaderRef.current = loader;
  });

  useEffect(() => {
    let active = true;
    const repo = getRepository();
    const run = () => {
      loaderRef.current(repo).then(
        (value) => {
          if (active) setData(value);
        },
        () => {
          // Keep showing the last good data; the demo has no network to fail.
        },
      );
    };
    run();
    const off = repo.subscribe(run);
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
