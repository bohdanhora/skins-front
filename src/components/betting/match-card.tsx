'use client';

import { ChevronDown, Radio, Sparkles } from 'lucide-react';
import { useState } from 'react';

import type { BetMatch, BetOffer, BetTeam } from '@/lib/api/types';
import { formatDateTime } from '@/lib/format/time';
import { cn } from '@/lib/utils/cn';

const pct = (value: number): string => `${Math.round(value * 100)}%`;

const signedPct = (value: number): string => {
  const rounded = Math.round(value * 1000) / 10;

  return `${rounded > 0 ? '+' : ''}${String(rounded).replace('.', ',')}%`;
};

const decimal = (value: number): string => value.toFixed(2).replace('.', ',');

const line = (value: number): string =>
  `${value > 0 ? '+' : value < 0 ? '−' : ''}${String(Math.abs(value)).replace('.', ',')}`;

export const offerLabel = (offer: BetOffer, match: BetMatch): string => {
  const team = offer.side === 1 ? match.team1.name : match.team2.name;

  if (offer.kind === 'winner') return `Победа ${team}`;

  if (offer.kind === 'map') {
    const map = offer.mapIndex !== null ? match.maps[offer.mapIndex - 1]?.map : null;

    return `${team} берёт карту ${offer.mapIndex}${map ? ` (${map})` : ''}`;
  }

  if (offer.kind === 'handicap') {
    return `${team} ${line(offer.side === 1 ? offer.line : -offer.line)} по картам`;
  }

  return `${offer.side === 1 ? 'Больше' : 'Меньше'} ${String(offer.line).replace('.', ',')} карт`;
};

const TeamBlock = ({ team, align }: { team: BetTeam; align: 'left' | 'right' }) => (
  <div
    className={cn(
      'flex min-w-0 flex-1 items-center gap-3',
      align === 'right' ? 'flex-row-reverse text-right' : '',
    )}
  >
    <span className="bg-surface-muted flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl">
      {team.image ? <img src={team.image} alt="" className="size-9 object-contain" /> : null}
    </span>
    <div className="min-w-0">
      <p className="truncate font-semibold">{team.name}</p>
      <p className="text-foreground-subtle text-xs">
        {team.rank ? `#${team.rank} в рейтинге Valve` : 'вне рейтинга Valve'}
      </p>
    </div>
  </div>
);

const record = (entry: { games: number; wins: number } | null): string =>
  entry && entry.games > 0 ? `${entry.wins}–${entry.games - entry.wins}` : '—';

const BestBet = ({ match }: { match: BetMatch }) => {
  const bet = match.bestBet;

  if (!match.oddsFound) {
    return (
      <p className="bg-surface-muted/60 text-foreground-muted rounded-xl px-3 py-2.5 text-[0.8125rem]">
        Коэффициентов на этот матч пока нет.
      </p>
    );
  }

  if (!bet) {
    return (
      <p className="bg-surface-muted/60 text-foreground-muted rounded-xl px-3 py-2.5 text-[0.8125rem]">
        Выгодных ставок сейчас нет: коэффициенты не выше того, что даёт прогноз.
      </p>
    );
  }

  return (
    <div className="bg-gain-soft rounded-xl px-3 py-2.5 text-[0.8125rem]">
      <p className="text-gain flex items-center gap-1.5 font-semibold">
        <Sparkles className="size-4" aria-hidden />
        {offerLabel(bet, match)} за {decimal(bet.odds)} на {bet.bookmaker}
      </p>
      <p className="text-foreground-muted numeric mt-1">
        Наша оценка {pct(bet.chance)}
        {bet.market !== null ? `, у букмекеров ${pct(bet.market)}` : ''}. Выгода{' '}
        {signedPct(bet.expectedValue)} на ставку, ставить до {signedPct(bet.stake).replace('+', '')}{' '}
        банка.
      </p>
    </div>
  );
};

const Markets = ({ match }: { match: BetMatch }) => (
  <div className="overflow-x-auto">
    <table className="numeric w-full min-w-[34rem] text-left text-[0.8125rem]">
      <thead className="text-foreground-subtle text-[0.6875rem]">
        <tr>
          <th className="py-1.5 font-medium">Ставка</th>
          <th className="py-1.5 text-right font-medium">Модель</th>
          <th className="py-1.5 text-right font-medium">Букмекеры</th>
          <th className="py-1.5 text-right font-medium">Лучший кэф</th>
          <th className="py-1.5 text-right font-medium">Выгода</th>
        </tr>
      </thead>
      <tbody>
        {match.markets.map((offer) => (
          <tr
            key={`${offer.kind}-${offer.line}-${offer.mapIndex}-${offer.side}`}
            className="border-border border-t"
          >
            <td className="py-1.5 pr-2">{offerLabel(offer, match)}</td>
            <td className="py-1.5 text-right">{pct(offer.model)}</td>
            <td className="py-1.5 text-right">{offer.market !== null ? pct(offer.market) : '—'}</td>
            <td className="py-1.5 text-right" title={`${offer.bookmakers} букмекеров`}>
              {decimal(offer.odds)}{' '}
              <span className="text-foreground-subtle">{offer.bookmaker}</span>
            </td>
            <td
              className={cn(
                'py-1.5 text-right font-semibold',
                offer.expectedValue > 0 ? 'text-gain' : 'text-foreground-subtle',
              )}
            >
              {signedPct(offer.expectedValue)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const MatchCard = ({ match }: { match: BetMatch }) => {
  const [open, setOpen] = useState(false);
  const short = (side: 1 | 2) => (side === 1 ? match.team1.name : match.team2.name);

  return (
    <article className="bg-surface space-y-4 rounded-3xl p-4 shadow-[var(--shadow-card)] sm:p-5">
      <header className="text-foreground-subtle flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        {match.live ? (
          <span className="bg-loss-soft text-loss inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium">
            <Radio className="size-3" aria-hidden />
            идёт
          </span>
        ) : (
          <span className="text-foreground font-medium">{formatDateTime(match.startsAt)}</span>
        )}
        <span>Bo{match.bestOf}</span>
        <span className="truncate">
          {match.event}
          {match.stage ? `, ${match.stage}` : ''}
        </span>
        {match.confidence === 'low' ? (
          <span className="bg-warning-soft text-warning rounded-full px-2 py-0.5 font-medium">
            мало данных по картам
          </span>
        ) : null}
      </header>

      <div className="flex items-center gap-3">
        <TeamBlock team={match.team1} align="left" />
        <div className="numeric shrink-0 text-center">
          <p className="text-lg font-semibold">
            {pct(match.win)} <span className="text-foreground-subtle">:</span> {pct(1 - match.win)}
          </p>
          <p className="text-foreground-subtle text-[0.6875rem]">шансы на победу</p>
        </div>
        <TeamBlock team={match.team2} align="right" />
      </div>

      <div className="bg-surface-muted flex h-1.5 overflow-hidden rounded-full">
        <div className="bg-accent" style={{ width: `${match.win * 100}%` }} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {match.scores.map((score) => (
          <span
            key={`${score.first}:${score.second}`}
            className="bg-surface-muted numeric rounded-full px-2.5 py-1 text-xs"
          >
            <span className="font-semibold">
              {score.first}:{score.second}
            </span>{' '}
            <span className="text-foreground-muted">{pct(score.chance)}</span>
          </span>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {match.maps.map((entry, index) => (
          <div key={entry.map} className="bg-surface-muted/60 rounded-xl px-3 py-2">
            <p className="text-foreground-subtle text-[0.6875rem]">
              Карта {index + 1} · {entry.pickedBy ? `пик ${short(entry.pickedBy)}` : 'десайдер'}
            </p>
            <p className="font-semibold">{entry.map}</p>
            <p className="numeric mt-1 flex justify-between text-xs">
              <span className={entry.chance >= 0.5 ? 'text-gain font-semibold' : ''}>
                {pct(entry.chance)}
              </span>
              <span className={entry.chance < 0.5 ? 'text-gain font-semibold' : ''}>
                {pct(1 - entry.chance)}
              </span>
            </p>
            <p className="text-foreground-subtle numeric flex justify-between text-[0.6875rem]">
              <span>{record(entry.team1)}</span>
              <span>{record(entry.team2)}</span>
            </p>
          </div>
        ))}
      </div>

      <BestBet match={match} />

      {match.markets.length > 0 ? (
        <div>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            className="text-foreground-muted hover:text-foreground flex items-center gap-1 text-[0.8125rem] font-medium"
          >
            <ChevronDown
              className={cn('size-4 transition-transform', open ? 'rotate-180' : '')}
              aria-hidden
            />
            Все ставки ({match.markets.length})
          </button>
          {open ? (
            <div className="mt-2">
              <Markets match={match} />
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
};
