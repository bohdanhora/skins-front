'use client';

import { ExternalLink, Loader2, Minus, Plus, Sparkles } from 'lucide-react';

import { SteamLoginButton } from '@/components/layout/account-menu';
import { Button } from '@/components/ui/button';
import { useSessionToken } from '@/lib/api/account';
import { useAssistantSettings, useItemAnalysis } from '@/lib/api/assistant';
import type { ItemAnalysis, MarketId } from '@/lib/api/types';
import { formatFloat, formatRange } from '@/lib/format/float';
import { formatUsd } from '@/lib/format/money';
import { plural } from '@/lib/format/time';
import { MARKETS } from '@/lib/markets';
import { useFees } from '@/lib/storage/settings';
import { cn } from '@/lib/utils/cn';

const VERDICTS: Record<ItemAnalysis['verdict'], string> = {
  buy: 'Брать',
  consider: 'Можно подумать',
  skip: 'Не брать',
};

const tone = (score: number): string =>
  score >= 60
    ? 'bg-gain-soft text-gain'
    : score >= 40
      ? 'bg-warning-soft text-warning'
      : 'bg-loss-soft text-loss';

const marketName = (market: string): string => MARKETS[market as MarketId]?.name ?? market;

const Result = ({ data }: { data: ItemAnalysis }) => {
  const { lot, similarSales } = data;

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'numeric flex size-14 shrink-0 flex-col items-center justify-center rounded-2xl',
            tone(data.score),
          )}
        >
          <span className="text-xl leading-none font-semibold">{data.score}</span>
          <span className="text-[0.625rem] opacity-80">из 100</span>
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold">{VERDICTS[data.verdict]}</p>
          {data.summary ? <p className="text-[0.8125rem] leading-relaxed">{data.summary}</p> : null}
        </div>
      </div>

      {lot ? (
        <a
          href={lot.url}
          target="_blank"
          rel="noreferrer"
          className="bg-surface hover:bg-surface-muted numeric flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-xl px-3 py-2 text-xs"
        >
          <span className="text-foreground-muted">Лот на {marketName(lot.market)}</span>
          <span className="font-semibold">{formatUsd(lot.price)}</span>
          {lot.float !== null ? <span>флоат {formatFloat(lot.float, 4)}</span> : null}
          {lot.paintSeed !== null ? <span>паттерн {lot.paintSeed}</span> : null}
          {lot.fade !== null ? (
            <span className="font-medium text-amber-500">фейд {lot.fade}%</span>
          ) : null}
          {lot.blue !== null ? (
            <span className="text-accent font-medium">синего {Math.round(lot.blue)}%</span>
          ) : null}
          <ExternalLink className="text-foreground-subtle ml-auto size-3" aria-hidden />
        </a>
      ) : null}

      {similarSales ? (
        <p className="text-foreground-muted numeric text-xs">
          Флоат {formatRange(similarSales.floatRange)} на CSFloat: {similarSales.count}{' '}
          {plural(similarSales.count, ['продажа', 'продажи', 'продаж'])}, медиана{' '}
          {formatUsd(similarSales.median)} ({formatUsd(similarSales.low)}–
          {formatUsd(similarSales.high)})
        </p>
      ) : null}

      {data.pros.length > 0 || data.cons.length > 0 ? (
        <ul className="space-y-1 text-[0.8125rem]">
          {data.pros.map((text) => (
            <li key={`pro-${text}`} className="flex gap-2">
              <Plus className="text-gain mt-0.5 size-3.5 shrink-0" aria-hidden />
              {text}
            </li>
          ))}
          {data.cons.map((text) => (
            <li key={`con-${text}`} className="flex gap-2">
              <Minus className="text-loss mt-0.5 size-3.5 shrink-0" aria-hidden />
              {text}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};

export const ItemAnalysisPanel = ({ name }: { name: string }) => {
  const signedIn = useSessionToken() !== null;
  const fees = useFees();
  const analysis = useItemAnalysis();
  const settings = useAssistantSettings();
  const ready = signedIn && !!settings.data?.provider;

  const run = (refresh: boolean) =>
    analysis.mutate({
      name,
      feeWhiteMarket: fees.whiteMarket,
      feeDmarket: fees.dmarket,
      feeCsfloat: fees.csfloat,
      refresh,
    });

  return (
    <section className="bg-surface-muted/60 space-y-3 rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="text-accent size-4" aria-hidden />
          Анализ ИИ
        </h3>
        <Button
          variant="secondary"
          size="sm"
          disabled={analysis.isPending || !ready}
          onClick={() => run(analysis.data !== undefined)}
        >
          {analysis.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {analysis.data ? 'Ещё раз' : 'Разобрать покупку'}
        </Button>
      </div>

      {!signedIn ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-foreground-muted text-[0.8125rem]">
            Войди, чтобы ИИ оценил покупку от 1 до 100.
          </p>
          <SteamLoginButton />
        </div>
      ) : settings.data && !settings.data.provider ? (
        <p className="text-foreground-muted text-[0.8125rem]">
          Подключи ассистента в настройках, чтобы ИИ оценил покупку от 1 до 100.
        </p>
      ) : null}
      {analysis.isPending ? (
        <p className="text-foreground-muted text-[0.8125rem]">
          Смотрим флоат, паттерн, продажи и перепродажу, это до минуты
        </p>
      ) : null}
      {analysis.isError ? (
        <p className="text-loss text-[0.8125rem]">{analysis.error.message}</p>
      ) : null}
      {analysis.data && !analysis.isPending ? <Result data={analysis.data} /> : null}
    </section>
  );
};
