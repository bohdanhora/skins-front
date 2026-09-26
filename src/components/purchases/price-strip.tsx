'use client';

import { ChevronDown, Loader2 } from 'lucide-react';
import { useState } from 'react';

import { stickerLabel } from '@/components/stickers/sticker-picker';
import { formatFloat } from '@/lib/format/float';
import { formatSignedUsd, formatUsd } from '@/lib/format/money';
import { plural } from '@/lib/format/time';
import { MARKETS } from '@/lib/markets';
import { cn } from '@/lib/utils/cn';

import type { Valuation } from './use-purchase-valuation';

const OPTION_LABELS = {
  quick: 'Быстро',
  recommended: 'Рекомендуем',
  max: 'Максимум',
};

const percent = (value: number): string => `${value.toFixed(1).replace('.', ',')}%`;

const Details = ({ valuation }: { valuation: Valuation }) => {
  const { blue, stickers, float } = valuation;

  return (
    <div className="text-foreground-muted space-y-2 text-[0.8125rem]">
      {blue ? (
        <div className="space-y-1">
          <p>
            <span className="text-foreground font-medium">
              Синий {percent(blue.blue.playside)} / {percent(blue.blue.backside)}
            </span>{' '}
            {blue.source === 'csfloat' ? 'по CSFloat' : 'по калькулятору'} · {blue.comparableCount}{' '}
            {plural(blue.comparableCount, ['похожая продажа', 'похожие продажи', 'похожих продаж'])}
            {blue.spanDays ? ` за ${blue.spanDays} дн.` : ''}
          </p>
          <ul className="numeric flex flex-wrap gap-1.5">
            {blue.sales.slice(0, 6).map((sale) => (
              <li
                key={`${sale.name}-${sale.paintSeed}-${sale.soldAt}`}
                className="bg-surface rounded-full px-2 py-0.5 text-[0.6875rem]"
                title={sale.name}
              >
                #{sale.paintSeed} {percent(sale.blue.playside)} · {formatUsd(sale.price)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {stickers.length > 0 ? (
        <ul className="numeric flex flex-wrap gap-1.5">
          {stickers.map((sticker, index) => (
            <li
              key={`${sticker.name}-${index}`}
              className="bg-surface rounded-full px-2 py-0.5 text-[0.6875rem]"
            >
              {stickerLabel(sticker.name)} · {formatUsd(sticker.price)}
              {sticker.mid > 0 ? (
                <span className="text-gain"> {formatSignedUsd(sticker.mid)}</span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {float ? (
        <p className="numeric">
          Флоат {formatFloat(float.float, 6)}: {float.betterCount}{' '}
          {plural(float.betterCount, ['лот', 'лота', 'лотов'])} не хуже
          {float.betterCheapest !== null ? ` от ${formatUsd(float.betterCheapest)}` : ''}, обычный
          от {formatUsd(float.plain)}
          {float.order !== null ? `, заявки до ${formatUsd(float.order)}` : ''}
        </p>
      ) : null}
    </div>
  );
};

export const PriceStrip = ({ valuation, amount }: { valuation: Valuation; amount: number }) => {
  const [open, setOpen] = useState(false);
  const hasDetails =
    valuation.blue !== null || valuation.stickers.length > 0 || valuation.float !== null;

  if (valuation.options.length === 0 && !valuation.loading) {
    return null;
  }

  return (
    <div className="relative space-y-2">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-stretch">
        <div className="pointer-events-none grid flex-1 grid-cols-3 gap-2">
          {valuation.options.map((option) => (
            <div
              key={option.kind}
              className={cn(
                'rounded-xl px-2.5 py-2',
                option.kind === 'recommended' ? 'bg-accent-soft' : 'bg-surface-muted/60',
              )}
            >
              <p className="text-foreground-muted flex items-center gap-1.5 text-[0.6875rem]">
                <span className={cn('size-1.5 rounded-full', MARKETS[option.market].dot)} />
                {OPTION_LABELS[option.kind]} · {MARKETS[option.market].short}
              </p>
              <p className="numeric mt-0.5 text-[0.9375rem] font-semibold">
                {formatUsd(option.price)}
              </p>
              <p
                className={cn(
                  'numeric text-[0.6875rem] font-medium',
                  option.profit >= 0 ? 'text-gain' : 'text-loss',
                )}
              >
                {formatSignedUsd(option.profit * amount)}
              </p>
            </div>
          ))}
          {valuation.loading ? (
            <div className="text-foreground-subtle flex items-center gap-1.5 px-1 text-[0.75rem]">
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              считаем
            </div>
          ) : null}
        </div>

        {valuation.parts.length > 0 || hasDetails ? (
          <div className="flex flex-wrap items-center gap-1.5 lg:w-72 lg:content-center">
            {valuation.parts.map((part) => (
              <span
                key={part.key}
                className="bg-surface-muted numeric pointer-events-none rounded-full px-2 py-0.5 text-[0.6875rem]"
              >
                {part.label} <span className="text-gain">{formatSignedUsd(part.range.mid)}</span>
              </span>
            ))}
            {hasDetails ? (
              <button
                type="button"
                onClick={() => setOpen(!open)}
                aria-expanded={open}
                className="text-foreground-muted hover:text-foreground relative z-10 flex items-center gap-0.5 text-[0.75rem] font-medium"
              >
                Подробнее
                <ChevronDown
                  className={cn('size-3.5 transition-transform', open ? 'rotate-180' : '')}
                  aria-hidden
                />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {open ? (
        <div className="bg-surface-muted/60 pointer-events-none rounded-xl px-3 py-2.5">
          <Details valuation={valuation} />
        </div>
      ) : null}
    </div>
  );
};
