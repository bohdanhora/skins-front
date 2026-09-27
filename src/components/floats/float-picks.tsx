'use client';

import { ExternalLink, Loader2, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useSessionToken } from '@/lib/api/account';
import { useFloatPicks } from '@/lib/api/assistant';
import { formatFloat } from '@/lib/format/float';
import { formatSignedUsd, formatUsd } from '@/lib/format/money';
import { useFees } from '@/lib/storage/settings';

const MARKET_NAMES: Record<string, string> = {
  whiteMarket: 'white.market',
  dmarket: 'DMarket',
  csfloat: 'CSFloat',
  steam: 'Steam',
};

interface FloatPicksProps {
  name: string;
  floatFrom?: number;
  floatTo?: number;
}

export const FloatPicks = ({ name, floatFrom, floatTo }: FloatPicksProps) => {
  const signedIn = useSessionToken() !== null;
  const fees = useFees();
  const picks = useFloatPicks();

  if (!signedIn) return null;

  const data = picks.data;

  return (
    <section className="bg-surface space-y-3 rounded-3xl p-4 shadow-[var(--shadow-card)] sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Что стоящее</h3>
          <p className="text-foreground-muted text-[0.8125rem]">
            Лоты дешевле любого лота с худшим флоатом и лоты, которые заявка DMarket уже купит
            дороже.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          disabled={picks.isPending}
          onClick={() => picks.mutate({ name, floatFrom, floatTo, feeDmarket: fees.dmarket })}
        >
          {picks.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Sparkles className="size-4" aria-hidden />
          )}
          {data ? 'Проверить ещё раз' : 'Найти стоящее'}
        </Button>
      </div>

      {data && data.picks.length === 0 ? (
        <p className="text-foreground-muted text-[0.8125rem]">
          Проверили {data.checked} лотов: ни один не дешевле лотов с худшим флоатом и не окупается
          через заявки.
        </p>
      ) : null}

      {data && data.picks.length > 0 ? (
        <ol className="space-y-2">
          {data.picks.map((pick) => (
            <li key={pick.url} className="bg-surface-muted/60 rounded-2xl px-3 py-2.5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <p className="numeric min-w-0 flex-1 text-[0.8125rem] font-semibold">
                  {formatUsd(pick.price)} · флоат {formatFloat(pick.float, 5)}
                </p>
                {pick.saving > 0 ? (
                  <span className="bg-gain-soft text-gain numeric rounded-full px-2 py-0.5 text-xs font-semibold">
                    {formatUsd(pick.saving)} дешевле худших флоатов
                  </span>
                ) : null}
                {pick.orderProfit !== null && pick.orderProfit > 0 ? (
                  <span className="bg-accent-soft text-accent numeric rounded-full px-2 py-0.5 text-xs font-semibold">
                    заявка {formatSignedUsd(pick.orderProfit)}
                  </span>
                ) : null}
                <a
                  href={pick.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-foreground-muted hover:text-foreground flex items-center gap-1 text-xs"
                >
                  {MARKET_NAMES[pick.market] ?? pick.market}
                  <ExternalLink className="size-3" aria-hidden />
                </a>
              </div>
              <p className="text-foreground-muted numeric mt-1 text-xs">
                {pick.worseCheapest !== null
                  ? `самый дешёвый лот с худшим флоатом ${formatUsd(pick.worseCheapest)}`
                  : 'лотов с худшим флоатом мало для сравнения'}
                {pick.orderPrice !== null
                  ? ` · заявка на такой флоат ${formatUsd(pick.orderPrice)}, после комиссии ${formatSignedUsd(pick.orderProfit ?? 0)}`
                  : ''}
              </p>
              {pick.reason ? <p className="mt-1 text-[0.8125rem]">{pick.reason}</p> : null}
            </li>
          ))}
        </ol>
      ) : null}

      {data?.summary ? (
        <p className="text-foreground-muted text-[0.8125rem]">{data.summary}</p>
      ) : null}
      {picks.isError ? <p className="text-loss text-[0.8125rem]">{picks.error.message}</p> : null}
    </section>
  );
};
