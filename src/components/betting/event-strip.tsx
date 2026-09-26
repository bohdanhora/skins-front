'use client';

import { useEffect, useState } from 'react';

import type { BetEvent } from '@/lib/api/types';
import { formatLockLeft } from '@/lib/purchases/purchases';
import { cn } from '@/lib/utils/cn';

const TICK_MS = 60_000;

const dayMonth = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' });

const shortDate = (iso: string): string => dayMonth.format(new Date(iso));

const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter((word) => /^[A-Za-zА-Яа-я]/.test(word))
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');

const status = (event: BetEvent, now: number): { text: string; live: boolean } => {
  const begins = event.beginsAt ? Date.parse(event.beginsAt) : null;
  const ends = event.endsAt ? Date.parse(event.endsAt) : null;

  if (begins !== null && begins > now) {
    return { text: `через ${formatLockLeft(begins - now)}`, live: false };
  }

  return {
    text: ends !== null ? `идёт до ${shortDate(event.endsAt!)}` : 'идёт',
    live: true,
  };
};

export const EventStrip = ({ events }: { events: BetEvent[] }) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), TICK_MS);

    return () => window.clearInterval(timer);
  }, []);

  if (events.length === 0) return null;

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {events.map((event) => {
        const state = status(event, now);

        return (
          <article
            key={event.id}
            className="bg-surface flex items-center gap-3 rounded-2xl p-3 shadow-[var(--shadow-card)]"
          >
            <span className="bg-surface-muted text-foreground-muted flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl text-sm font-semibold">
              {event.image ? (
                <img src={event.image} alt="" className="size-10 object-contain" />
              ) : (
                initials(event.name)
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{event.name}</p>
              <p className="text-foreground-subtle numeric text-xs">
                {event.beginsAt ? shortDate(event.beginsAt) : ''}
                {event.endsAt ? ` – ${shortDate(event.endsAt)}` : ''}
                {event.tier ? ` · ${event.tier.toUpperCase()}-Tier` : ''}
              </p>
            </div>
            <span
              className={cn(
                'numeric shrink-0 rounded-full px-2.5 py-1 text-xs font-medium',
                state.live ? 'bg-loss-soft text-loss' : 'bg-accent-soft text-accent',
              )}
            >
              {state.text}
            </span>
          </article>
        );
      })}
    </div>
  );
};
