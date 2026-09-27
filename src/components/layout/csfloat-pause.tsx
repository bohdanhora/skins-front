'use client';

import { Hourglass } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useStatus } from '@/lib/api/queries';

const clock = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' });

const pad = (value: number): string => String(value).padStart(2, '0');

export const countdown = (ms: number): string => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
};

export const CsfloatCountdown = () => {
  const status = useStatus();
  const until = status.data?.csfloatQuota?.pausedUntil;
  const time = until ? Date.parse(until) : null;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (time === null) return;

    const timer = window.setInterval(() => setNow(Date.now()), 1000);

    return () => window.clearInterval(timer);
  }, [time]);

  if (time === null || time <= now) return null;

  return (
    <span
      className="border-border text-warning numeric flex items-center gap-1 border-l pl-2"
      title={`CSFloat исчерпал лимит запросов и вернётся в ${clock.format(new Date(time))}. Цены, синий и лоты с CSFloat подтянутся сами`}
    >
      <Hourglass className="size-3.5" aria-hidden />
      <span className="sr-only">CSFloat вернётся через</span>
      {countdown(time - now)}
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
