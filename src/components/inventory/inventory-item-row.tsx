import { Lock } from 'lucide-react';

import { BlueShareTag } from '@/components/items/blue-share-tag';
import { ItemImage } from '@/components/items/item-image';
import { ItemTitle } from '@/components/items/item-title';
import type { InventoryItem, MarketId, SaleOption } from '@/lib/api/types';
import { formatFloat } from '@/lib/format/float';
import { formatUsd } from '@/lib/format/money';
import { MARKETS, SELL_MARKET_ORDER } from '@/lib/markets';
import { cn } from '@/lib/utils/cn';

interface CellProps {
  label: string;
  dot: string;
  option: SaleOption | undefined;
  best: boolean;
  amount: number;
  detail: (option: SaleOption) => string;
}

const Cell = ({ label, dot, option, best, amount, detail }: CellProps) => (
  <div className={cn('rounded-xl px-2.5 py-2', best ? 'bg-gain-soft' : 'bg-surface-muted/60')}>
    <p className="text-foreground-muted flex items-center gap-1.5 text-[0.6875rem]">
      <span className={cn('size-1.5 rounded-full', dot)} aria-hidden />
      {label}
    </p>
    {option ? (
      <>
        <p
          className={cn(
            'numeric mt-0.5 text-[0.9375rem] font-semibold',
            best ? 'text-gain' : 'text-foreground',
          )}
        >
          {formatUsd(option.payout * amount)}
        </p>
        <p className="text-foreground-subtle numeric text-[0.6875rem]">{detail(option)}</p>
      </>
    ) : (
      <p className="text-foreground-subtle mt-0.5 text-[0.8125rem]">нет цены</p>
    )}
  </div>
);

const findOption = (
  item: InventoryItem,
  market: MarketId,
  kind: SaleOption['kind'],
): SaleOption | undefined =>
  item.options.find((option) => option.market === market && option.kind === kind);

const isBest = (item: InventoryItem, option: SaleOption | undefined): boolean =>
  !!option && !!item.best && option.market === item.best.market && option.kind === item.best.kind;

interface InventoryItemRowProps {
  item: InventoryItem;
  onOpen: (name: string) => void;
}

export const InventoryItemRow = ({ item, onOpen }: InventoryItemRowProps) => {
  const instant = findOption(item, 'dmarket', 'instant');

  return (
    <article className="bg-surface relative flex flex-col gap-3 rounded-3xl p-3 shadow-[var(--shadow-card)] lg:flex-row lg:items-center">
      <button
        type="button"
        onClick={() => onOpen(item.name)}
        className="absolute inset-0 z-0 rounded-3xl"
        aria-label={`Подробнее: ${item.name}`}
      />
      <div className="pointer-events-none relative flex min-w-0 items-center gap-3 lg:w-80 lg:shrink-0">
        <ItemImage
          src={item.image}
          alt={item.name}
          rarityColor={item.rarityColor}
          className="size-20 shrink-0"
          imageClassName="p-1.5"
        />
        <div className="min-w-0">
          <ItemTitle name={item.name} />
          <p className="text-foreground-subtle numeric mt-1 flex flex-wrap items-center gap-x-2 text-xs">
            {item.amount > 1 ? <span>× {item.amount}</span> : null}
            {item.float !== null ? <span>флоат {formatFloat(item.float, 6)}</span> : null}
            {item.paintSeed !== null ? <span>паттерн {item.paintSeed}</span> : null}
            {item.blue ? <BlueShareTag blue={item.blue} name={item.name} /> : null}
            {item.sales?.eightWeekSales ? (
              <span>{item.sales.eightWeekSales} продаж за 8 нед.</span>
            ) : null}
            {!item.tradable && item.marketable ? (
              <span className="text-warning flex items-center gap-1">
                <Lock className="size-3" aria-hidden />
                трейд-бан
              </span>
            ) : null}
          </p>
        </div>
      </div>

      {item.marketable ? (
        <div className="pointer-events-none relative grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
          {SELL_MARKET_ORDER.map((market) => {
            const option = findOption(item, market, 'listing');

            return (
              <Cell
                key={market}
                label={MARKETS[market].short}
                dot={MARKETS[market].dot}
                option={option}
                best={isBest(item, option)}
                amount={item.amount}
                detail={(entry) => `выставить ${formatUsd(entry.price)}`}
              />
            );
          })}
          <Cell
            label="Заявка DMarket"
            dot={MARKETS.dmarket.dot}
            option={instant}
            best={isBest(item, instant)}
            amount={item.amount}
            detail={(entry) => `продать сразу ${formatUsd(entry.price)}`}
          />
        </div>
      ) : (
        <p className="text-foreground-subtle relative flex-1 text-sm">Не продаётся</p>
      )}
    </article>
  );
};
