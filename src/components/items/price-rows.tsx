import type { Item, MarketId } from '@/lib/api/types';
import { formatUsd } from '@/lib/format/money';
import { plural } from '@/lib/format/time';
import { MARKETS, MARKET_ORDER } from '@/lib/markets';
import { cn } from '@/lib/utils/cn';

export const offersLabel = (count: number): string =>
  `${count} ${plural(count, ['лот', 'лота', 'лотов'])}`;

/** Both market prices one under the other, the cheaper one highlighted. */
export const PriceRows = ({ item }: { item: Item }) => (
  <div className="space-y-1">
    {MARKET_ORDER.map((market) => (
      <PriceRow key={market} item={item} market={market} />
    ))}
  </div>
);

const PriceRow = ({ item, market }: { item: Item; market: MarketId }) => {
  const quote = item[market];
  const listed = quote && quote.listings > 0 && quote.price !== null;
  const cheaper = item.gap?.cheaper === market;

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 rounded-xl px-2.5 py-1.5',
        cheaper ? 'bg-gain-soft' : '',
      )}
    >
      <span className="text-foreground-muted flex min-w-0 items-center gap-2 text-[0.8125rem]">
        <span className={cn('size-2 shrink-0 rounded-full', MARKETS[market].dot)} aria-hidden />
        <span className="truncate">{MARKETS[market].short}</span>
      </span>
      {listed ? (
        <span className="flex items-baseline gap-2">
          <span className="text-foreground-subtle numeric hidden text-[0.6875rem] sm:inline">
            {offersLabel(quote.listings)}
          </span>
          <span
            className={cn(
              'numeric text-[0.9375rem] font-semibold',
              cheaper ? 'text-gain' : 'text-foreground',
            )}
          >
            {formatUsd(quote.price)}
          </span>
        </span>
      ) : (
        <span className="text-foreground-subtle text-[0.8125rem]">нет в продаже</span>
      )}
    </div>
  );
};
