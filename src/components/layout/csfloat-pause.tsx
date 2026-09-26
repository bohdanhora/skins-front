'use client';

import { Hourglass } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useStatus } from '@/lib/api/queries';
import { formatLockLeft } from '@/lib/purchases/purchases';
import { cn } from '@/lib/utils/cn';

const TICK_MS = 15_000;

const clock = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' });

export const useCsfloatPause = (): number | null => {
  const status = useStatus();
  const [now, setNow] = useState(() => Date.now());
  const until = status.data?.csfloatQuota?.pausedUntil;
  const time = until ? Date.parse(until) : null;

  useEffect(() => {
    if (time === null) return;

    const timer = window.setInterval(() => setNow(Date.now()), TICK_MS);

    return () => window.clearInterval(timer);
  }, [time]);

  return time !== null && time > now ? time : null;
};

export const CsfloatPause = ({ className }: { className?: string }) => {
  const until = useCsfloatPause();

  if (until === null) return null;

  return (
    <span
      className={cn(
        'bg-warning-soft text-warning numeric inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[0.8125rem] font-medium whitespace-nowrap',
        className,
      )}
      title={`CSFloat исчерпал лимит запросов, снова через ${formatLockLeft(until - Date.now())}. Цены, синий и лоты с CSFloat вернутся сами`}
    >
      <Hourglass className="size-3.5" aria-hidden />
      <span className="sr-only">CSFloat на паузе до</span>
      {clock.format(new Date(until))}
    </span>
  );
};

export const describeCsfloatQuota = (quota: {
  limit: number | null;
  remaining: number | null;
  resetAt: string | null;
  pausedUntil: string | null;
}): string | null => {
  if (quota.pausedUntil && Date.parse(quota.pausedUntil) > Date.now()) {
    return `лимит запросов исчерпан, снова в ${clock.format(new Date(quota.pausedUntil))}`;
  }

  if (quota.remaining !== null && quota.limit !== null) {
    return `осталось ${quota.remaining} из ${quota.limit} запросов${
      quota.resetAt ? `, пополнится в ${clock.format(new Date(quota.resetAt))}` : ''
    }`;
  }

  return null;
};
