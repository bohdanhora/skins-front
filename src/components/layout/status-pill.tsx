'use client';

import { useEffect, useState } from 'react';

import { useStatus } from '@/lib/api/queries';
import { timeAgo } from '@/lib/format/time';
import { cn } from '@/lib/utils/cn';

const TICK_MS = 30_000;

export const StatusPill = ({ className }: { className?: string }) => {
  const status = useStatus();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);

    return () => clearInterval(timer);
  }, []);

  if (status.isError) {
    return (
      <span className={cn(pill, 'text-loss', className)}>
        <span className="bg-loss size-2 rounded-full" aria-hidden />
        Сервер цен недоступен
      </span>
    );
  }

  if (!status.data) {
    return null;
  }

  const { dmarket, refreshing } = status.data;

  return (
    <span
      className={cn(pill, 'text-foreground-muted', className)}
      title="Цены обновляются автоматически каждые несколько минут"
    >
      <span
        className={cn('size-2 rounded-full', refreshing ? 'bg-warning animate-pulse' : 'bg-gain')}
        aria-hidden
      />
      {refreshing && !dmarket.updatedAt
        ? 'Собираем цены...'
        : refreshing
          ? 'Обновляем цены...'
          : `Цены: ${timeAgo(dmarket.updatedAt, now)}`}
    </span>
  );
};

const pill =
  'bg-surface inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-[0.8125rem] font-medium shadow-[var(--shadow-soft)]';
