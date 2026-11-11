'use client';

import { createContext, useCallback, useContext, useSyncExternalStore, type ReactNode } from 'react';
import type { Role } from '@/lib/domain/types';

const KEY = 'sgal-demo-role';
const listeners = new Set<() => void>();
/** Fallback when sessionStorage is blocked. */
let memoryRole: Role | null = null;

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function readRole(): Role | null {
  try {
    const stored = window.sessionStorage.getItem(KEY);
    return stored === 'owner' || stored === 'staff' ? stored : memoryRole;
  } catch {
    return memoryRole;
  }
}

interface RoleCtx {
  role: Role | null;
  /** False during server render and hydration, so markup matches. */
  ready: boolean;
  setRole: (r: Role | null) => void;
  isOwner: boolean;
}

const Ctx = createContext<RoleCtx>({ role: null, ready: false, setRole: () => {}, isOwner: false });

export function RoleProvider({ children }: { children: ReactNode }) {
  const role = useSyncExternalStore(subscribe, readRole, () => null);
  const ready = useSyncExternalStore(subscribe, () => true, () => false);

  const setRole = useCallback((r: Role | null) => {
    memoryRole = r;
    try {
      if (r) window.sessionStorage.setItem(KEY, r);
      else window.sessionStorage.removeItem(KEY);
    } catch {
      // sessionStorage blocked: the demo role just won't stick.
    }
    listeners.forEach((l) => l());
  }, []);

  return <Ctx.Provider value={{ role, ready, setRole, isOwner: role === 'owner' }}>{children}</Ctx.Provider>;
}

export function useRole() {
  return useContext(Ctx);
}
