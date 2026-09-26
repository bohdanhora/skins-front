import type { InventoryTotals, SellMarketId } from '@/lib/api/types';
import { formatUsd } from '@/lib/format/money';
import { plural } from '@/lib/format/time';
import { MARKETS, SELL_MARKET_ORDER } from '@/lib/markets';
import { cn } from '@/lib/utils/cn';

const itemsLabel = (count: number): string =>
  `${count} ${plural(count, ['предмет', 'предмета', 'предметов'])}`;

interface TileProps {
  label: string;
  value: number;
  hint: string;
  dot?: string;
  highlight?: boolean;
}

const Tile = ({ label, value, hint, dot, highlight }: TileProps) => (
  <div
    className={cn(
      'rounded-2xl p-4',
      highlight ? 'bg-gain-soft' : 'bg-surface shadow-[var(--shadow-card)]',
    )}
  >
    <p className="text-foreground-muted flex items-center gap-2 text-[0.8125rem]">
      {dot ? <span className={cn('size-2 rounded-full', dot)} aria-hidden /> : null}
      {label}
    </p>
    <p
      className={cn(
        'numeric mt-1.5 text-2xl font-semibold tracking-tight',
        highlight ? 'text-gain' : 'text-foreground',
      )}
    >
      {formatUsd(value)}
    </p>
    <p className="text-foreground-subtle mt-1 text-xs">{hint}</p>
  </div>
);

const bestMarket = (totals: InventoryTotals): SellMarketId | null =>
  SELL_MARKET_ORDER.reduce<SellMarketId | null>(
    (top, market) =>
      totals.listing[market] > 0 && (!top || totals.listing[market] > totals.listing[top])
        ? market
        : top,
    null,
  );

export const InventorySummary = ({ totals }: { totals: InventoryTotals }) => {
  const leader = bestMarket(totals);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Tile
          label="На руки, если продавать каждый предмет там, где выгоднее"
          value={totals.best}
          hint={`После комиссий продажи и вывода, ${itemsLabel(totals.pricedItems)}`}
          highlight
        />
        <Tile
          label="Минимум по рынку"
          value={totals.marketPrice}
          hint="Самые дешёвые лоты среди всех площадок, без комиссий. На отдельной площадке цена бывает выше"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SELL_MARKET_ORDER.map((market) => (
          <Tile
            key={market}
            label={`Всё на ${MARKETS[market].name}`}
            value={totals.listing[market]}
            dot={MARKETS[market].dot}
            hint={`${leader === market ? 'Лучшая площадка целиком. ' : ''}Выставить на цент дешевле, оценено ${itemsLabel(totals.listingItems[market])}`}
          />
        ))}
        <Tile
          label="Сразу в заявки DMarket"
          value={totals.instant}
          dot={MARKETS.dmarket.dot}
          hint={`Без ожидания, ${itemsLabel(totals.instantItems)}`}
        />
      </div>
      {totals.unsellableItems > 0 ? (
        <p className="text-foreground-subtle text-xs">
          Ещё {itemsLabel(totals.unsellableItems)} нельзя продать: медали, монеты, значки.
        </p>
      ) : null}
    </div>
  );
};
