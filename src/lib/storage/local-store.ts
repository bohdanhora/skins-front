'use client';

import { useCallback, useSyncExternalStore } from 'react';

export const CHANGE_EVENT = 'skins:storage';

const read = <T>(key: string, fallback: T): T => {
  try {
    const raw = window.localStorage.getItem(key);

    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
};

export const readLocal = <T>(key: string): T | undefined => read<T | undefined>(key, undefined);

export const writeLocal = <T>(key: string, value: T): void => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}

  window.dispatchEvent(new Event(CHANGE_EVENT));
};

const cache = new Map<string, { raw: string | null; value: unknown }>();

const snapshot = <T>(key: string, fallback: T): T => {
  let raw: string | null = null;

  try {
    raw = window.localStorage.getItem(key);
  } catch {}

  const cached = cache.get(key);

  if (cached && cached.raw === raw) {
    return cached.value as T;
  }

  const value = raw === null ? fallback : read(key, fallback);

  cache.set(key, { raw, value });
  return value;
};

const subscribe = (onChange: () => void): (() => void) => {
  window.addEventListener('storage', onChange);
  window.addEventListener(CHANGE_EVENT, onChange);

  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
};

export const useLocalStore = <T>(key: string, fallback: T): [T, (next: T) => void] => {
  const value = useSyncExternalStore(
    subscribe,
    () => snapshot(key, fallback),
    () => fallback,
  );

  const update = useCallback(
    (next: T) => {
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {}

      window.dispatchEvent(new Event(CHANGE_EVENT));
    },
    [key],
  );

  return [value, update];
};
