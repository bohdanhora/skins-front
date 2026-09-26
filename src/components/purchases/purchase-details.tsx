'use client';

import { stickerLabel } from '@/components/stickers/sticker-picker';
import type { SellMarketId } from '@/lib/api/types';
import { formatFloat } from '@/lib/format/float';
import { formatSignedUsd, formatUsd } from '@/lib/format/money';
import { plural } from '@/lib/format/time';
import { MARKETS, SELL_MARKET_ORDER } from '@/lib/markets';
import type { SellOption } from '@/lib/purchases/purchases';
import { cn } from '@/lib/utils/cn';

import type { Valuation } from './use-purchase-valuation';

const percent = (value: number): string => `${value.toFixed(1).replace('.', ',')}%`;

interface MarketTableProps {
  options: SellOption[];
  best: SellOption | null;
  amount: number;
  breakEven: (market: SellMarketId) => number;
}

export const MarketTable = ({ options, best, amount, breakEven }: MarketTableProps) => {
  const rows = [
    ...SELL_MARKET_ORDER.map((market) => ({
      key: market,
      market,
      label: MARKETS[market].name,
      option: options.find((entry) => entry.market === market && entry.kind === 'listing'),
      breakEven: breakEven(market),
    })),
    {
      key: 'instant',
      market: 'dmarket' as SellMarketId,
      label: 'Заявка DMarket',
      option: options.find((entry) => entry.kind === 'instant'),
      breakEven: null,
    },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="numeric w-full min-w-[30rem] text-[0.8125rem]">
        <thead className="text-foreground-subtle text-[0.6875rem]">
          <tr className="text-right">
            <th className="py-1.5 text-left font-medium">Площадка</th>
            <th className="py-1.5 font-medium">Цена</th>
            <th className="py-1.5 font-medium">На руки</th>
            <th className="py-1.5 font-medium">Прибыль</th>
            <th className="py-1.5 font-medium">Безубыток</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const top =
              !!row.option && row.option.market === best?.market && row.option.kind === best?.kind;

            return (
              <tr
                key={row.key}
                className={cn('border-border border-t text-right', top ? 'font-semibold' : '')}
              >
                <td className="py-2 text-left">
                  <span className="flex items-center gap-2">
                    <span
                      className={cn('size-2 rounded-full', MARKETS[row.market].dot)}
                      aria-hidden
                    />
                    {row.label}
                  </span>
                </td>
                {row.option ? (
                  <>
                    <td className="py-2">{formatUsd(row.option.price)}</td>
                    <td className="py-2">{formatUsd(row.option.payout * amount)}</td>
                    <td className={cn('py-2', row.option.profit >= 0 ? 'text-gain' : 'text-loss')}>
                      {formatSignedUsd(row.option.profit * amount)}
                    </td>
                  </>
                ) : (
                  <td colSpan={3} className="text-foreground-subtle py-2">
                    нет цены
                  </td>
                )}
                <td className="text-foreground-subtle py-2">
                  {row.breakEven !== null ? formatUsd(row.breakEven) : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export const ValueDetails = ({ valuation }: { valuation: Valuation }) => {
  const { blue, stickers, float } = valuation;

  if (!blue && stickers.length === 0 && !float) return null;

  return (
    <div className="text-foreground-muted grid gap-3 text-[0.8125rem] sm:grid-cols-3">
      {blue ? (
        <section className="space-y-1.5">
          <p className="text-foreground-subtle text-[0.6875rem]">Синий</p>
          <p>
            <span className="text-foreground font-semibold">
              {percent(blue.blue.playside)} / {percent(blue.blue.backside)}
            </span>{' '}
            {blue.source === 'csfloat' ? 'по CSFloat' : 'по калькулятору'}
          </p>
          <p className="text-[0.75rem]">
            {blue.comparableCount}{' '}
            {plural(blue.comparableCount, ['похожая продажа', 'похожие продажи', 'похожих продаж'])}
            {blue.spanDays ? ` за ${blue.spanDays} дн.` : ''}
          </p>
          <ul className="numeric flex flex-wrap gap-1">
            {blue.sales.slice(0, 4).map((sale) => (
              <li
                key={`${sale.name}-${sale.paintSeed}-${sale.soldAt}`}
                className="bg-surface rounded-full px-2 py-0.5 text-[0.6875rem]"
                title={sale.name}
              >
                #{sale.paintSeed} {percent(sale.blue.playside)} · {formatUsd(sale.price)}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {stickers.length > 0 ? (
        <section className="space-y-1.5">
          <p className="text-foreground-subtle text-[0.6875rem]">Наклейки</p>
          <ul className="space-y-1">
            {stickers.map((sticker, index) => (
              <li key={`${sticker.name}-${index}`} className="numeric flex items-center gap-2">
                {sticker.image ? (
                  <img src={sticker.image} alt="" className="size-6 shrink-0 object-contain" />
                ) : null}
                <span className="min-w-0 flex-1 truncate" title={sticker.name}>
                  {stickerLabel(sticker.name)}
                </span>
                <span>{formatUsd(sticker.price)}</span>
                <span
                  className={
                    sticker.mid > 0
                      ? 'text-gain w-14 text-right'
                      : 'text-foreground-subtle w-14 text-right'
                  }
                >
                  {formatSignedUsd(sticker.mid)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {float ? (
        <section className="numeric space-y-1.5">
          <p className="text-foreground-subtle text-[0.6875rem]">
            Флоат {formatFloat(float.float, 4)}
          </p>
          <p>
            {float.betterCount} {plural(float.betterCount, ['лот', 'лота', 'лотов'])} не хуже
            {float.betterCheapest !== null ? `, от ${formatUsd(float.betterCheapest)}` : ''}
          </p>
          <p>Обычный флоат от {formatUsd(float.plain)}</p>
          {float.order !== null ? <p>Заявки на такой флоат до {formatUsd(float.order)}</p> : null}
        </section>
      ) : null}
    </div>
  );
};
