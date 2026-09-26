'use client';

import { CheckCircle2, Lock, Pencil } from 'lucide-react';

import { ItemImage } from '@/components/items/item-image';
import { ItemTitle } from '@/components/items/item-title';
import { Button } from '@/components/ui/button';
import type { Item, SellMarketId } from '@/lib/api/types';
import { isCaseHardened } from '@/lib/format/blue';
import { formatFloat } from '@/lib/format/float';
import { formatPercent, formatSignedUsd, formatUsd } from '@/lib/format/money';
import { daysBetween, formatDate, formatDateTime, plural } from '@/lib/format/time';
import { MARKETS, SELL_MARKET_ORDER } from '@/lib/markets';
import {
  bestOption,
  breakEvenPrice,
  formatLockLeft,
  lockLeft,
  marketPrice,
  sellAdvice,
  sellOptions,
  type FeeTable,
  type Purchase,
  type SellOption,
} from '@/lib/purchases/purchases';
import { cn } from '@/lib/utils/cn';

import { BlueValuePanel } from './blue-value-panel';
import { usePurchaseForm } from './purchase-form';
import { purchaseMarketDot, purchaseMarketName } from './purchase-shared';

const ADVICE_TONES = {
  gain: 'bg-gain-soft text-gain',
  loss: 'bg-loss-soft text-loss',
  warning: 'bg-warning-soft text-warning',
  muted: 'bg-surface-muted text-foreground-muted',
};

interface CellProps {
  label: string;
  dot: string;
  option: SellOption | undefined;
  best: boolean;
  amount: number;
  detail: string;
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
            option.profit >= 0 ? 'text-gain' : 'text-loss',
          )}
        >
          {formatSignedUsd(option.profit * amount)}
        </p>
        <p className="text-foreground-subtle numeric text-[0.6875rem]">
          на руки {formatUsd(option.payout * amount)}
        </p>
      </>
    ) : (
      <p className="text-foreground-subtle mt-0.5 text-[0.8125rem]">нет цены</p>
    )}
    <p className="text-foreground-subtle numeric text-[0.6875rem]">{detail}</p>
  </div>
);

const Meta = ({ purchase }: { purchase: Purchase }) => (
  <p className="text-foreground-subtle numeric mt-1 flex flex-wrap items-center gap-x-2 text-xs">
    <span className="flex items-center gap-1">
      <span className={cn('size-1.5 rounded-full', purchaseMarketDot(purchase.market))} />
      {formatUsd(purchase.price)}
      {purchase.amount > 1 ? ` × ${purchase.amount}` : ''} на {purchaseMarketName(purchase.market)}
    </span>
    <span>{formatDate(purchase.boughtAt)}</span>
    {purchase.float !== null ? <span>флоат {formatFloat(purchase.float, 6)}</span> : null}
    {purchase.paintSeed !== null ? <span>паттерн {purchase.paintSeed}</span> : null}
  </p>
);

const LockBadge = ({ purchase, now }: { purchase: Purchase; now: number }) => {
  const left = lockLeft(purchase, now);

  return left > 0 ? (
    <span
      className="bg-warning-soft text-warning inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.6875rem] font-medium"
      title={`До ${formatDateTime(purchase.unlockAt)}`}
    >
      <Lock className="size-3" aria-hidden />
      трейдбан ещё {formatLockLeft(left)}
    </span>
  ) : (
    <span className="bg-gain-soft text-gain inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.6875rem] font-medium">
      <CheckCircle2 className="size-3" aria-hidden />
      можно продавать
    </span>
  );
};

interface PurchaseRowProps {
  purchase: Purchase;
  item: Item | undefined;
  fees: FeeTable;
  withdrawals: FeeTable;
  now: number;
  onOpen: (name: string) => void;
}

export const PurchaseRow = ({
  purchase,
  item,
  fees,
  withdrawals,
  now,
  onOpen,
}: PurchaseRowProps) => {
  const form = usePurchaseForm();
  const options = item ? sellOptions(item, purchase.price, fees, withdrawals) : [];
  const best = bestOption(options);
  const advice = item ? sellAdvice(best, marketPrice(item), item.sales) : null;
  const listing = (market: SellMarketId) =>
    options.find((option) => option.market === market && option.kind === 'listing');
  const instant = options.find((option) => option.kind === 'instant');
  const isBest = (option: SellOption | undefined) =>
    !!option && option.market === best?.market && option.kind === best?.kind;

  return (
    <article className="bg-surface relative flex flex-col gap-3 rounded-3xl p-3 shadow-[var(--shadow-card)]">
      <button
        type="button"
        onClick={() => onOpen(purchase.name)}
        className="absolute inset-0 z-0 rounded-3xl"
        aria-label={`Подробнее: ${purchase.name}`}
      />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="pointer-events-none relative flex min-w-0 items-center gap-3 lg:w-80 lg:shrink-0">
          <ItemImage
            src={purchase.image ?? item?.image ?? null}
            alt={purchase.name}
            rarityColor={purchase.rarityColor ?? item?.rarityColor ?? null}
            className="size-20 shrink-0"
            imageClassName="p-1.5"
          />
          <div className="min-w-0">
            <ItemTitle name={purchase.name} />
            <Meta purchase={purchase} />
            <div className="mt-1.5">
              <LockBadge purchase={purchase} now={now} />
            </div>
          </div>
        </div>

        <div className="pointer-events-none relative grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
          {SELL_MARKET_ORDER.map((market) => (
            <Cell
              key={market}
              label={MARKETS[market].short}
              dot={MARKETS[market].dot}
              option={listing(market)}
              best={isBest(listing(market))}
              amount={purchase.amount}
              detail={`безубыток ${formatUsd(breakEvenPrice(purchase.price, market, fees, withdrawals))}`}
            />
          ))}
          <Cell
            label="Заявка DMarket"
            dot={MARKETS.dmarket.dot}
            option={instant}
            best={isBest(instant)}
            amount={purchase.amount}
            detail={instant ? `скупают за ${formatUsd(instant.price)}` : ''}
          />
        </div>
      </div>

      {isCaseHardened(purchase.name) && purchase.paintSeed !== null ? (
        <BlueValuePanel purchase={purchase} fees={fees} withdrawals={withdrawals} />
      ) : null}

      <div className="relative flex flex-col gap-2 sm:flex-row sm:items-center">
        {advice ? (
          <p
            className={cn(
              'pointer-events-none flex-1 rounded-xl px-3 py-2 text-[0.8125rem] font-medium',
              ADVICE_TONES[advice.tone],
            )}
          >
            {advice.text}
            {best && best.profit > 0 ? `, лучше на ${MARKETS[best.market].name}` : ''}
            {best ? ` (${formatPercent(best.percent, true)})` : ''}
          </p>
        ) : (
          <p className="text-foreground-subtle pointer-events-none flex-1 px-1 text-[0.8125rem]">
            Загружаем цены
          </p>
        )}
        {purchase.note ? (
          <p className="text-foreground-muted pointer-events-none px-1 text-[0.8125rem] sm:max-w-xs sm:truncate">
            {purchase.note}
          </p>
        ) : null}
        <div className="z-10 flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              form.sell(
                purchase,
                best ? { market: best.market, received: best.payout * purchase.amount } : undefined,
              )
            }
          >
            Продал
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Изменить"
            title="Изменить"
            onClick={() => form.edit(purchase)}
          >
            <Pencil className="size-4" aria-hidden />
          </Button>
        </div>
      </div>
    </article>
  );
};

export const SoldRow = ({
  purchase,
  onOpen,
}: {
  purchase: Purchase;
  onOpen: (name: string) => void;
}) => {
  const form = usePurchaseForm();
  const sale = purchase.sale!;
  const cost = purchase.price * purchase.amount;
  const profit = sale.received - cost;
  const held = daysBetween(purchase.boughtAt, sale.soldAt);

  return (
    <article className="bg-surface relative flex flex-col gap-3 rounded-3xl p-3 shadow-[var(--shadow-card)] sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={() => onOpen(purchase.name)}
        className="absolute inset-0 z-0 rounded-3xl"
        aria-label={`Подробнее: ${purchase.name}`}
      />
      <div className="pointer-events-none relative flex min-w-0 flex-1 items-center gap-3">
        <ItemImage
          src={purchase.image}
          alt={purchase.name}
          rarityColor={purchase.rarityColor}
          className="size-16 shrink-0"
          imageClassName="p-1.5"
        />
        <div className="min-w-0">
          <ItemTitle name={purchase.name} />
          <Meta purchase={purchase} />
        </div>
      </div>
      <div className="pointer-events-none relative text-sm sm:text-right">
        <p className="numeric">
          продано за {formatUsd(sale.received)} на {purchaseMarketName(sale.market)}
        </p>
        <p className="text-foreground-subtle numeric text-xs">
          {formatDate(sale.soldAt)}, держал {held} {plural(held, ['день', 'дня', 'дней'])}
        </p>
      </div>
      <p
        className={cn(
          'numeric pointer-events-none relative text-lg font-semibold sm:w-32 sm:text-right',
          profit >= 0 ? 'text-gain' : 'text-loss',
        )}
      >
        {formatSignedUsd(profit)}
        <span className="block text-xs font-normal">
          {cost > 0 ? formatPercent((profit / cost) * 100, true) : ''}
        </span>
      </p>
      <Button
        variant="ghost"
        size="sm"
        className="relative z-10 self-end sm:self-center"
        aria-label="Изменить продажу"
        title="Изменить продажу"
        onClick={() => form.sell(purchase)}
      >
        <Pencil className="size-4" aria-hidden />
      </Button>
    </article>
  );
};
