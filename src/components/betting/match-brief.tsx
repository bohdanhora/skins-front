'use client';

import { ExternalLink, Loader2, Newspaper, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useSessionToken } from '@/lib/api/account';
import { useAssistantReady, useMatchBrief } from '@/lib/api/assistant';
import type { BetMatch, MatchBrief as Brief } from '@/lib/api/types';
import { timeAgo } from '@/lib/format/time';
import { cn } from '@/lib/utils/cn';

const VERDICTS: Record<Brief['verdict'], { label: string; tone: string }> = {
  confirm: { label: 'Новости за ставку', tone: 'bg-gain-soft text-gain' },
  caution: { label: 'Есть риски', tone: 'bg-warning-soft text-warning' },
  avoid: { label: 'Лучше не ставить', tone: 'bg-loss-soft text-loss' },
  no_bet: { label: 'Ставки нет', tone: 'bg-surface-muted text-foreground-muted' },
};

const host = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

const Result = ({ brief, match }: { brief: Brief; match: BetMatch }) => {
  const verdict = VERDICTS[brief.verdict];
  const lineups = [
    { team: match.team1.acronym ?? match.team1.name, players: brief.lineups.team1 },
    { team: match.team2.acronym ?? match.team2.name, players: brief.lineups.team2 },
  ].filter((entry) => entry.players.length > 0);

  return (
    <div className="space-y-3 text-[0.8125rem]">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', verdict.tone)}>
          {verdict.label}
        </span>
        {match.bestBet ? (
          <span
            className={cn(
              'rounded-full px-2.5 py-1 text-xs font-medium',
              brief.betCheck.status === 'ok'
                ? 'bg-surface text-foreground-muted'
                : 'bg-warning-soft text-warning',
            )}
            title={brief.betCheck.reason}
          >
            {brief.betCheck.status === 'ok' ? 'ставка выглядит честно' : 'ставку стоит проверить'}
          </span>
        ) : null}
      </div>

      <p className="text-foreground leading-relaxed">{brief.summary}</p>

      {brief.warnings.length > 0 ? (
        <ul className="space-y-1">
          {brief.warnings.map((warning) => (
            <li key={warning} className="text-foreground-muted flex gap-2">
              <span className="bg-warning mt-1.5 size-1.5 shrink-0 rounded-full" aria-hidden />
              {warning}
            </li>
          ))}
        </ul>
      ) : null}

      {brief.betCheck.reason && match.bestBet ? (
        <p className="text-foreground-muted">
          <span className="text-foreground font-medium">Про ставку:</span> {brief.betCheck.reason}
        </p>
      ) : null}

      {lineups.length > 0 ? (
        <p className="text-foreground-muted">
          {lineups.map((entry) => `${entry.team}: ${entry.players.join(', ')}`).join(' · ')}
        </p>
      ) : null}

      {brief.sources.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {brief.sources.map((source) => (
            <a
              key={source.url}
              href={source.url}
              target="_blank"
              rel="noreferrer"
              title={source.title}
              className="bg-surface text-foreground-muted hover:text-foreground inline-flex max-w-56 items-center gap-1 truncate rounded-full px-2.5 py-1 text-[0.6875rem]"
            >
              <ExternalLink className="size-3 shrink-0" aria-hidden />
              <span className="truncate">{host(source.url)}</span>
            </a>
          ))}
        </div>
      ) : null}

      <p className="text-foreground-subtle text-[0.6875rem]">
        {brief.model} · {timeAgo(brief.createdAt)}
        {brief.searched ? '' : ' · без поиска в интернете, только по нашим данным'}
      </p>
    </div>
  );
};

export const MatchBrief = ({ match }: { match: BetMatch }) => {
  const signedIn = useSessionToken() !== null;
  const ready = useAssistantReady();
  const brief = useMatchBrief(match.id);

  if (!signedIn || !ready) {
    return (
      <p className="text-foreground-subtle text-[0.8125rem]">
        Подключи ассистента в настройках, и он проверит новости команд перед ставкой.
      </p>
    );
  }

  if (brief.isPending) {
    return (
      <p className="text-foreground-muted flex items-center gap-2 text-[0.8125rem]">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Ищем новости о составах и форме команд, это до минуты
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {brief.data ? <Result brief={brief.data} match={match} /> : null}
      {brief.isError ? <p className="text-loss text-[0.8125rem]">{brief.error.message}</p> : null}
      <Button
        variant={brief.data ? 'ghost' : 'secondary'}
        size="sm"
        onClick={() => brief.mutate(!!brief.data)}
      >
        {brief.data ? (
          <RefreshCw className="size-4" aria-hidden />
        ) : (
          <Newspaper className="size-4" aria-hidden />
        )}
        {brief.data ? 'Проверить ещё раз' : 'Проверить новости команд'}
      </Button>
    </div>
  );
};
