'use client';

import { ChevronDown, Radio, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

import type { BetMatch, BetOffer, BetTeam } from '@/lib/api/types';
import { formatDateTime } from '@/lib/format/time';
import { formatLockLeft } from '@/lib/purchases/purchases';
import { cn } from '@/lib/utils/cn';

const TICK_MS = 60_000;
const FAVORITES = 2;

const pct = (value: number): string => `${Math.round(value * 100)}%`;

const signedPct = (value: number): string => {
  const rounded = Math.round(value * 1000) / 10;

  return `${rounded > 0 ? '+' : ''}${String(rounded).replace('.', ',')}%`;
};

const decimal = (value: number): string => value.toFixed(2).replace('.', ',');

const line = (value: number): string =>
  `${value > 0 ? '+' : value < 0 ? '−' : ''}${String(Math.abs(value)).replace('.', ',')}`;

const short = (team: BetTeam): string => team.acronym ?? team.name;

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

const useNow = (): number => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), TICK_MS);

    return () => window.clearInterval(timer);
  }, []);

  return now;
};

const Logo = ({ team }: { team: BetTeam }) => (
  <span className="bg-surface-muted text-foreground-muted flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-sm font-semibold">
    {team.image ? (
      <img src={team.image} alt="" className="size-11 object-contain" />
    ) : (
      short(team).slice(0, 3).toUpperCase()
    )}
  </span>
);

const Team = ({ team, align }: { team: BetTeam; align: 'left' | 'right' }) => (
  <div
    className={cn(
      'flex min-w-0 items-center gap-3',
      align === 'right' ? 'flex-row-reverse text-right' : '',
    )}
  >
    <Logo team={team} />
    <div className="min-w-0">
      <p className="truncate text-[0.9375rem] font-semibold">{team.name}</p>
      <p className="text-foreground-subtle text-[0.6875rem]">
        {team.rank ? `#${team.rank} Valve` : 'вне рейтинга'}
      </p>
    </div>
  </div>
);

const Scoreboard = ({ match }: { match: BetMatch }) => {
  const likely = match.scores.reduce((top, score) => (score.chance > top.chance ? score : top));
  const favourite = match.win >= 0.5;

  return (
    <div className="flex w-28 shrink-0 flex-col items-center gap-1.5 sm:w-36">
      <p className="numeric text-xl font-semibold tracking-tight sm:text-2xl">
        <span className={favourite ? 'text-foreground' : 'text-foreground-muted'}>
          {pct(match.win)}
        </span>
        <span className="text-foreground-subtle mx-1.5 text-base">:</span>
        <span className={!favourite ? 'text-foreground' : 'text-foreground-muted'}>
          {pct(1 - match.win)}
        </span>
      </p>
      <div className="bg-surface-muted flex h-1.5 w-full overflow-hidden rounded-full">
        <div className="bg-accent rounded-full" style={{ width: `${match.win * 100}%` }} />
      </div>
      <p className="text-foreground-subtle numeric text-[0.6875rem]">
        скорее {likely.first}:{likely.second} · {pct(likely.chance)}
      </p>
    </div>
  );
};

const BestBet = ({ match }: { match: BetMatch }) => {
  const bet = match.bestBet;

  if (!bet) {
    return (
      <div className="bg-surface-muted/60 text-foreground-muted rounded-2xl px-4 py-3 text-[0.8125rem]">
        {match.oddsFound
          ? 'Выгодных ставок нет: коэффициенты не выше прогноза'
          : 'Коэффициентов пока нет'}
      </div>
    );
  }

  return (
    <div className="bg-gain-soft rounded-2xl px-4 py-3">
      <p className="text-gain flex items-center gap-1.5 text-[0.6875rem] font-medium">
        <Sparkles className="size-3.5" aria-hidden />
        Лучшая ставка
      </p>
      <p className="mt-1 text-[0.9375rem] leading-snug font-semibold">{offerLabel(bet, match)}</p>
      <div className="mt-1.5 flex items-end justify-between gap-3">
        <p className="numeric">
          <span className="text-2xl leading-none font-semibold tracking-tight">
            {decimal(bet.odds)}
          </span>
          <span className="text-foreground-muted ml-1.5 text-xs">{bet.bookmaker}</span>
        </p>
        <p className="numeric text-right text-[0.6875rem]">
          <span className="text-gain block text-sm font-semibold">
            {signedPct(bet.expectedValue)}
          </span>
          <span className="text-foreground-muted">
            ставка {signedPct(bet.stake).replace('+', '')} банка
          </span>
        </p>
      </div>
    </div>
  );
};

const MapChips = ({ match }: { match: BetMatch }) => (
  <div className="flex flex-wrap gap-2">
    {match.maps.map((entry, index) => {
      const firstFavourite = entry.chance >= 0.5;
      const favourite = firstFavourite ? match.team1 : match.team2;
      const chance = firstFavourite ? entry.chance : 1 - entry.chance;
      const picker = entry.pickedBy === 1 ? match.team1 : entry.pickedBy === 2 ? match.team2 : null;

      return (
        <span
          key={entry.map}
          className="bg-surface-muted/70 inline-flex h-8 items-center gap-2 rounded-full pr-3 pl-1 text-xs"
        >
          <span className="bg-surface text-foreground-muted numeric flex size-6 items-center justify-center rounded-full text-[0.6875rem] font-semibold">
            {index + 1}
          </span>
          <span className="font-semibold">{entry.map}</span>
          <span className="text-foreground-subtle">
            {picker ? `пик ${short(picker)}` : 'десайдер'}
          </span>
          <span className="numeric text-foreground-muted">
            {short(favourite)} <span className="text-foreground font-semibold">{pct(chance)}</span>
          </span>
        </span>
      );
    })}
  </div>
);

const Habits = ({ team }: { team: BetTeam }) => {
  const favorites = team.habits.filter((habit) => habit.share > 0).slice(0, FAVORITES);
  const bans = team.habits.filter((habit) => habit.permaban);

  return (
    <div className="space-y-1">
      <p className="text-foreground text-[0.8125rem] font-medium">{team.name}</p>
      <p className="text-foreground-muted numeric text-[0.75rem]">
        {favorites.length > 0
          ? `Чаще всего: ${favorites.map((habit) => `${habit.map} ${pct(habit.share)}`).join(', ')}`
          : 'Мало карт в истории'}
      </p>
      {bans.length > 0 ? (
        <p className="text-loss text-[0.75rem]">
          не играет {bans.map((habit) => habit.map).join(', ')}
        </p>
      ) : null}
    </div>
  );
};

const Veto = ({ match }: { match: BetMatch }) => (
  <ol className="flex flex-wrap gap-1.5 text-[0.75rem]">
    {match.vetoes.map((action, index) => (
      <li
        key={`${action.map}-${index}`}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1',
          action.step === 'pick'
            ? 'bg-accent-soft text-accent'
            : 'bg-surface text-foreground-muted',
        )}
      >
        <span className="font-semibold">
          {short(action.team === 1 ? match.team1 : match.team2)}
        </span>
        {action.step === 'pick' ? 'пик' : 'бан'} {action.map}
      </li>
    ))}
  </ol>
);

const Scores = ({ match }: { match: BetMatch }) => (
  <div className="space-y-1.5">
    <div className="flex h-2 overflow-hidden rounded-full">
      {match.scores.map((score) => (
        <div
          key={`${score.first}:${score.second}`}
          className={score.first > score.second ? 'bg-accent' : 'bg-foreground-subtle'}
          style={{
            width: `${score.chance * 100}%`,
            opacity: 0.45 + Math.abs(score.first - score.second) * 0.25,
          }}
        />
      ))}
    </div>
    <div className="numeric text-foreground-muted flex justify-between text-[0.75rem]">
      {match.scores.map((score) => (
        <span key={`${score.first}:${score.second}`}>
          <span className="text-foreground font-semibold">
            {score.first}:{score.second}
          </span>{' '}
          {pct(score.chance)}
        </span>
      ))}
    </div>
  </div>
);

const Markets = ({ match }: { match: BetMatch }) => (
  <div className="overflow-x-auto">
    <table className="numeric w-full min-w-[34rem] text-[0.8125rem]">
      <thead className="text-foreground-subtle text-[0.6875rem]">
        <tr className="text-right">
          <th className="py-1.5 text-left font-medium">Ставка</th>
          <th className="py-1.5 font-medium">Модель</th>
          <th className="py-1.5 font-medium">Букмекеры</th>
          <th className="py-1.5 font-medium">Лучший кэф</th>
          <th className="py-1.5 font-medium">Выгода</th>
        </tr>
      </thead>
      <tbody>
        {match.markets.map((offer) => (
          <tr
            key={`${offer.kind}-${offer.line}-${offer.mapIndex}-${offer.side}`}
            className="border-border border-t text-right"
          >
            <td className="py-2 pr-2 text-left">{offerLabel(offer, match)}</td>
            <td className="py-2">{pct(offer.model)}</td>
            <td className="py-2">{offer.market !== null ? pct(offer.market) : '—'}</td>
            <td className="py-2" title={`${offer.bookmakers} букмекеров`}>
              {decimal(offer.odds)}{' '}
              <span className="text-foreground-subtle text-[0.6875rem]">{offer.bookmaker}</span>
            </td>
            <td
              className={cn(
                'py-2 font-semibold',
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

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-2">
    <h4 className="text-foreground-subtle text-[0.6875rem] font-medium">{title}</h4>
    {children}
  </section>
);

export const MatchCard = ({ match }: { match: BetMatch }) => {
  const [open, setOpen] = useState(false);
  const now = useNow();
  const left = Date.parse(match.startsAt) - now;

  return (
    <article className="bg-surface overflow-hidden rounded-3xl shadow-[var(--shadow-card)]">
      <header className="border-border text-foreground-subtle flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-4 py-2.5 text-[0.75rem] sm:px-5">
        {match.live ? (
          <span className="bg-loss-soft text-loss inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium">
            <Radio className="size-3" aria-hidden />
            идёт
          </span>
        ) : (
          <span className="text-foreground font-medium">
            {left > 0 ? `через ${formatLockLeft(left)}` : 'скоро'}
          </span>
        )}
        <span className="numeric">{formatDateTime(match.startsAt)}</span>
        <span className="bg-surface-muted rounded-full px-2 py-0.5 font-medium">
          Bo{match.bestOf}
        </span>
        <span className="min-w-0 truncate">
          {match.event}
          {match.stage ? ` · ${match.stage}` : ''}
        </span>
        {match.confidence === 'low' ? (
          <span className="bg-warning-soft text-warning ml-auto rounded-full px-2 py-0.5 font-medium">
            мало данных по картам
          </span>
        ) : null}
      </header>

      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto] lg:items-center lg:gap-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
          <Team team={match.team1} align="left" />
          <Scoreboard match={match} />
          <Team team={match.team2} align="right" />
        </div>

        <BestBet match={match} />

        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label="Разбор матча"
          title="Разбор матча"
          className="press text-foreground-muted hover:bg-surface-muted hover:text-foreground flex items-center justify-center gap-1 self-center rounded-xl px-3 py-2 text-[0.8125rem] font-medium lg:px-2"
        >
          <span className="lg:sr-only">Разбор матча</span>
          <ChevronDown
            className={cn('size-4 transition-transform', open ? 'rotate-180' : '')}
            aria-hidden
          />
        </button>
      </div>

      <div className="border-border border-t px-4 py-3 sm:px-5">
        <MapChips match={match} />
      </div>

      {open ? (
        <div className="border-border bg-surface-muted/40 space-y-5 border-t px-4 py-4 sm:px-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <Section title="Прогноз вето">
              <Veto match={match} />
            </Section>
            <Section title="Счёт">
              <Scores match={match} />
            </Section>
          </div>
          <Section title="Карты команд за полгода">
            <div className="grid gap-3 sm:grid-cols-2">
              <Habits team={match.team1} />
              <Habits team={match.team2} />
            </div>
          </Section>
          {match.markets.length > 0 ? (
            <Section title={`Все ставки · ${match.markets.length}`}>
              <Markets match={match} />
            </Section>
          ) : null}
        </div>
      ) : null}
    </article>
  );
};
