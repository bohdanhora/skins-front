'use client';

import { useMemo } from 'react';

import { readLocal, useLocalStore, writeLocal } from '@/lib/storage/local-store';

const KEY = 'skins.boughtLots';
const KEEP_MS = 3 * 86_400_000;
const NONE: Record<string, number> = {};

export const markBought = (url: string): void => {
  const now = Date.now();
  const lots = Object.entries(readLocal<Record<string, number>>(KEY) ?? NONE).filter(
    ([, at]) => now - at < KEEP_MS,
  );

  writeLocal(KEY, Object.fromEntries([...lots, [url, now]]));
};

export const useBoughtLots = (): ReadonlySet<string> => {
  const [lots] = useLocalStore(KEY, NONE);

  return useMemo(() => new Set(Object.keys(lots)), [lots]);
};
