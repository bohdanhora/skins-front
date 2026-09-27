'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { apiSend } from '@/lib/api/client';
import type { LiveCheck } from '@/lib/api/types';

import { useDebouncedValue } from './use-debounced-value';

const SETTLE_MS = 800;

export const useLiveCheck = (
  path: string,
  names: string[],
  queryKey: string,
  everyMs: number,
): string | null => {
  const client = useQueryClient();
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const list = useDebouncedValue([...new Set(names)].sort().join('\n'), SETTLE_MS);

  useEffect(() => {
    if (!list) return;

    const body = { names: list.split('\n') };
    let running = false;
    let stopped = false;

    const run = async () => {
      if (running || document.visibilityState !== 'visible') return;

      running = true;

      try {
        const result = await apiSend<LiveCheck>('POST', path, body);

        if (stopped) return;

        setCheckedAt(result.checkedAt);

        if (result.changed.length > 0) {
          await client.invalidateQueries({ queryKey: [queryKey] });
        }
      } catch {
      } finally {
        running = false;
      }
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') void run();
    };
    const timer = setInterval(() => void run(), everyMs);

    void run();
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [list, path, queryKey, everyMs, client]);

  return checkedAt;
};
