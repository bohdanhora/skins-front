'use client';

import { ExternalLink, Loader2, Sparkles } from 'lucide-react';

import { BoughtButton } from '@/components/purchases/bought-button';
import { Button } from '@/components/ui/button';
import { useSessionToken } from '@/lib/api/account';
import { useBluePicks } from '@/lib/api/assistant';
import type { BlueGemWear } from '@/lib/api/types';
import { formatBlue } from '@/lib/format/blue';
import { formatFloat } from '@/lib/format/float';
import { formatSignedUsd, formatUsd } from '@/lib/format/money';
import { plural } from '@/lib/format/time';
import { useBoughtLots } from '@/lib/purchases/bought-lots';
import { cn } from '@/lib/utils/cn';

const clock = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' });

export const BluePicks = ({
  weapon,
  wear,
}: {
  weapon: string | null;
  wear: BlueGemWear | null;
}) => {
  const signedIn = useSessionToken() !== null;
  const picks = useBluePicks();
  const bought = useBoughtLots();

  if (!signedIn || !weapon) return null;

  const data = picks.data;
  const paused =
    data?.csfloatPausedUntil && Date.parse(data.csfloatPausedUntil) > Date.now()
      ? data.csfloatPausedUntil
      : null;

  return (
    <section className="bg-surface space-y-3 rounded-3xl p-4 shadow-[var(--shadow-card)] sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Что недооценено</h3>
          <p className="text-foreground-muted text-[0.8125rem]">
            Синие лоты не дороже трёх обычных, сравнённые с тем, за сколько похожий синий продавали
            на CSFloat.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          disabled={picks.isPending}
          onClick={() => picks.mutate({ weapon, wear: wear ?? undefined })}
        >
          {picks.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Sparkles className="size-4" aria-hidden />
          )}
          {data ? 'Проверить ещё раз' : 'Найти недооценённые'}
        </Button>
      </div>

      {picks.isPending ? (
        <p className="text-foreground-muted text-[0.8125rem]">
          Сверяем лоты с продажами, это до минуты
        </p>
      ) : null}

      {data && data.picks.length === 0 ? (
        <p className="text-foreground-muted text-[0.8125rem]">
          {paused
            ? `CSFloat на паузе до ${clock.format(new Date(paused))}, без истории его продаж оценить синий нельзя.`
            : `Проверили ${data.checked} синих лотов, которые стоят не дороже трёх обычных: ни один не дешевле того, за сколько похожий синий продавали. Лоты дороже продаются коллекционерам по своей цене, их так не оценить.`}
        </p>
      ) : null}

      {data && data.picks.length > 0 ? (
        <ol className="space-y-2">
          {data.picks
            .filter((pick) => !bought.has(pick.url))
            .map((pick) => (
              <li key={pick.id} className="bg-surface-muted/60 rounded-2xl px-3 py-2.5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p className="min-w-0 flex-1 truncate text-[0.8125rem] font-semibold">
                    {pick.name}
                  </p>
                  <span
                    className={cn(
                      'numeric rounded-full px-2 py-0.5 text-xs font-semibold',
                      pick.margin > 0 ? 'bg-gain-soft text-gain' : 'bg-loss-soft text-loss',
                    )}
                  >
                    {formatSignedUsd(pick.margin)} к оценке
                  </span>
                  <a
                    href={pick.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-foreground-muted hover:text-foreground flex items-center gap-1 text-xs"
                  >
                    {pick.market}
                    <ExternalLink className="size-3" aria-hidden />
                  </a>
                  <BoughtButton
                    compact
                    lot={{
                      name: pick.name,
                      market: pick.market,
                      price: pick.price,
                      float: pick.float,
                      paintSeed: pick.paintSeed,
                      url: pick.url,
                    }}
                  />
                </div>
                <p className="text-foreground-muted numeric mt-1 text-xs">
                  #{pick.paintSeed} · {formatBlue(pick.name, pick.blue, pick.source)}
                  {pick.source === 'csfloat' ? ' (CSFloat)' : ''}
                  {pick.float !== null ? ` · флоат ${formatFloat(pick.float, 4)}` : ''} · цена{' '}
                  <span className="text-foreground font-medium">{formatUsd(pick.price)}</span>,
                  похожие уходили около {formatUsd(pick.estimate)} · {pick.comparableCount}{' '}
                  {plural(pick.comparableCount, ['продажа', 'продажи', 'продаж'])}
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
