'use client';

import { ArrowRight, CheckCircle2, ChevronDown, Lock, Pencil } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { FloatBar } from '@/components/floats/float-bar';
import { canGenerate, GenerateButton } from '@/components/items/generate-button';
import { ItemImage } from '@/components/items/item-image';
import { ItemTitle } from '@/components/items/item-title';
import { stickerLabel } from '@/components/stickers/sticker-picker';
import { Button } from '@/components/ui/button';
import type { Item, SellMarketId } from '@/lib/api/types';
import { WEAR_RANGES } from '@/lib/format/float';
import { parseItemName } from '@/lib/format/item-name';
import { formatPercent, formatSignedUsd, formatUsd } from '@/lib/format/money';
import { daysBetween, formatDateTime, plural } from '@/lib/format/time';
import { MARKETS } from '@/lib/markets';
import {
  bestOption,
  breakEvenPrice,
  formatLockLeft,
  lockLeft,
  marketPrice,
  sellAdvice,
  sellOptions,
  type Advice,
  type FeeTable,
  type Purchase,
} from '@/lib/purchases/purchases';
import { withPremium, type PriceOption } from '@/lib/purchases/valuation';
import { cn } from '@/lib/utils/cn';

import { MarketTable, ValueDetails } from './purchase-details';
import { usePurchaseForm } from './purchase-form';
import { purchaseMarketDot, purchaseMarketName } from './purchase-shared';
import { usePurchaseValuation, type Valuation } from './use-purchase-valuation';

const ADVICE_DOTS: Record<Advice['tone'], string> = {
  gain: 'bg-gain',
  loss: 'bg-loss',
  warning: 'bg-warning',
  muted: 'bg-foreground-subtle',
};

const shortDate = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' });

const ProfitPill = ({ profit, cost }: { profit: number; cost: number }) => (
  <span
    className={cn(
      'numeric inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
      profit >= 0 ? 'bg-gain-soft text-gain' : 'bg-loss-soft text-loss',
    )}
  >
    {formatSignedUsd(profit)}
    {cost > 0 ? (
      <span className="ml-1 font-medium opacity-80">
        {formatPercent((profit / cost) * 100, true)}
      </span>
    ) : null}
  </span>
);

const Chip = ({
  children,
  className,
  title,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) => (
  <span
    title={title}
    className={cn(
      'bg-surface-muted text-foreground-muted numeric inline-flex h-6 items-center gap-1.5 rounded-full px-2 text-[0.6875rem]',
      className,
    )}
  >
    {children}
  </span>
);

const Traits = ({
  purchase,
  valuation,
  now,
}: {
  purchase: Purchase;
  valuation: Valuation;
  now: number;
}) => {
  const wear = parseItemName(purchase.name).wear;
  const left = lockLeft(purchase, now);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {wear && purchase.float !== null ? (
        <Chip title={`Флоат ${purchase.float}`}>
          <FloatBar value={purchase.float} zoom={WEAR_RANGES[wear]} className="w-10" />
          {purchase.float.toFixed(4)}
        </Chip>
      ) : null}
      {wear && purchase.paintSeed !== null ? <Chip>#{purchase.paintSeed}</Chip> : null}
      {valuation.stickers.length > 0 ? (
        <Chip title={purchase.stickers.map(stickerLabel).join(', ')}>
          <span className="flex -space-x-1">
            {valuation.stickers.map((sticker, index) =>
              sticker.image ? (
                <img
                  key={`${sticker.name}-${index}`}
                  src={sticker.image}
                  alt=""
                  className="size-4 object-contain"
                />
              ) : null,
            )}
          </span>
          {purchase.stickers.length}{' '}
          {plural(purchase.stickers.length, ['наклейка', 'наклейки', 'наклеек'])}
        </Chip>
      ) : null}
      {left > 0 ? (
        <Chip
          className="bg-warning-soft text-warning"
          title={`До ${formatDateTime(purchase.unlockAt)}`}
        >
          <Lock className="size-3" aria-hidden />
          {formatLockLeft(left)}
        </Chip>
      ) : (
        <Chip className="bg-gain-soft text-gain">
          <CheckCircle2 className="size-3" aria-hidden />
          можно продавать
        </Chip>
      )}
    </div>
  );
};

const Decision = ({
  purchase,
  valuation,
  pending,
}: {
  purchase: Purchase;
  valuation: Valuation;
  pending: boolean;
}) => {
  const find = (kind: PriceOption['kind']) =>
    valuation.options.find((option) => option.kind === kind);
  const recommended = find('recommended');
  const quick = find('quick');
  const max = find('max');
  const cost = purchase.price * purchase.amount;

  return (
    <div className="min-w-0 space-y-2">
      <div className="flex items-end gap-3 sm:gap-4">
        <div className="min-w-0">
          <p className="text-foreground-subtle text-[0.6875rem]">Купил</p>
          <p className="numeric text-lg font-semibold">{formatUsd(cost)}</p>
          <p className="text-foreground-subtle flex items-center gap-1 text-[0.6875rem]">
            <span className={cn('size-1.5 rounded-full', purchaseMarketDot(purchase.market))} />
            {purchaseMarketName(purchase.market)} · {shortDate.format(new Date(purchase.boughtAt))}
          </p>
        </div>
        <ArrowRight className="text-foreground-subtle mb-5 size-4 shrink-0" aria-hidden />
        {recommended ? (
          <div className="min-w-0">
            <p className="text-foreground-subtle flex items-center gap-1 text-[0.6875rem]">
              <span className={cn('size-1.5 rounded-full', MARKETS[recommended.market].dot)} />
              Выставить на {MARKETS[recommended.market].name}
            </p>
            <p className="numeric text-2xl leading-tight font-semibold tracking-tight">
              {formatUsd(recommended.price * purchase.amount)}
            </p>
            <p className="flex flex-wrap items-center gap-1.5 text-[0.6875rem]">
              <span className="text-foreground-subtle numeric">
                на руки {formatUsd(recommended.payout * purchase.amount)}
              </span>
              <ProfitPill profit={recommended.profit * purchase.amount} cost={cost} />
            </p>
          </div>
        ) : (
          <p className="text-foreground-subtle mb-5 text-sm">
            {pending ? 'Загружаем цены' : 'Нет цен'}
          </p>
        )}
      </div>
      {quick || max ? (
        <p className="text-foreground-muted numeric flex flex-wrap gap-x-3 gap-y-1 text-[0.75rem]">
          {quick ? (
            <span>
              Сразу {formatUsd(quick.price * purchase.amount)} на {MARKETS[quick.market].short}{' '}
              <span className={quick.profit >= 0 ? 'text-gain' : 'text-loss'}>
                {formatSignedUsd(quick.profit * purchase.amount)}
              </span>
            </span>
          ) : null}
          {max ? (
            <span>
              Максимум {formatUsd(max.price * purchase.amount)}{' '}
              <span className={max.profit >= 0 ? 'text-gain' : 'text-loss'}>
                {formatSignedUsd(max.profit * purchase.amount)}
              </span>
            </span>
          ) : null}
        </p>
      ) : null}
    </div>
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
  const [open, setOpen] = useState(false);
  const valuation = usePurchaseValuation(purchase, item, fees, withdrawals);
  const priced = item ? withPremium(item, valuation.total.mid) : undefined;
  const options = priced ? sellOptions(priced, purchase.price, fees, withdrawals) : [];
  const best = bestOption(options);
  const advice = item ? sellAdvice(best, marketPrice(item), item.sales) : null;
  const breakEven = (market: SellMarketId) =>
    breakEvenPrice(purchase.price, market, fees, withdrawals);
  const recommended = valuation.options.find((option) => option.kind === 'recommended');

  return (
    <article className="bg-surface overflow-hidden rounded-3xl shadow-[var(--shadow-card)]">
      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_auto] lg:items-center lg:gap-6">
        <div className="flex min-w-0 items-center gap-4">
          <button
            type="button"
            onClick={() => onOpen(purchase.name)}
            aria-label={`Подробнее: ${purchase.name}`}
            className="press shrink-0"
          >
            <ItemImage
              src={purchase.image ?? item?.image ?? null}
              alt={purchase.name}
              rarityColor={purchase.rarityColor ?? item?.rarityColor ?? null}
              className="size-20 sm:size-24"
              imageClassName="p-2"
            />
          </button>
          <div className="min-w-0 space-y-2">
            <button
              type="button"
              onClick={() => onOpen(purchase.name)}
              className="block min-w-0 text-left"
            >
              <ItemTitle name={purchase.name} />
            </button>
            <Traits purchase={purchase} valuation={valuation} now={now} />
          </div>
        </div>

        <Decision purchase={purchase} valuation={valuation} pending={!item || valuation.loading} />

        <div className="flex items-center gap-2 lg:flex-col lg:items-stretch">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 lg:flex-none"
            onClick={() =>
              form.sell(
                purchase,
                recommended
                  ? { market: recommended.market, received: recommended.payout * purchase.amount }
                  : undefined,
              )
            }
          >
            Продал
          </Button>
          <div className="flex items-center gap-1">
            {!item || canGenerate(item.category) ? (
              <GenerateButton
                name={purchase.name}
                float={purchase.float}
                seed={purchase.paintSeed}
                stickers={purchase.stickers}
              />
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              aria-label="Изменить"
              title="Изменить"
              onClick={() => form.edit(purchase)}
            >
              <Pencil className="size-4" aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-expanded={open}
              aria-label="Все площадки"
              title="Все площадки"
              onClick={() => setOpen(!open)}
            >
              <ChevronDown
                className={cn('size-4 transition-transform', open ? 'rotate-180' : '')}
                aria-hidden
              />
            </Button>
          </div>
        </div>
      </div>

      {advice || valuation.parts.length > 0 || purchase.note ? (
        <div className="border-border flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t px-4 py-2.5 text-[0.75rem] sm:px-5">
          {advice ? (
            <span className="text-foreground-muted flex items-center gap-2">
              <span
                className={cn('size-1.5 shrink-0 rounded-full', ADVICE_DOTS[advice.tone])}
                aria-hidden
              />
              {advice.text}
            </span>
          ) : null}
          {purchase.note ? (
            <span className="text-foreground-subtle max-w-xs truncate italic" title={purchase.note}>
              {purchase.note}
            </span>
          ) : null}
          {valuation.parts.length > 0 ? (
            <span className="flex flex-wrap gap-1.5 sm:ml-auto">
              {valuation.parts.map((part) => (
                <Chip key={part.key}>
                  {part.label} <span className="text-gain">{formatSignedUsd(part.range.mid)}</span>
                </Chip>
              ))}
            </span>
          ) : null}
        </div>
      ) : null}

      {open ? (
        <div className="border-border bg-surface-muted/40 space-y-4 border-t px-4 py-4 sm:px-5">
          <MarketTable
            options={options}
            best={best}
            amount={purchase.amount}
            breakEven={breakEven}
          />
          <ValueDetails name={purchase.name} valuation={valuation} />
        </div>
      ) : null}
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
    <article className="bg-surface grid gap-4 rounded-3xl p-4 shadow-[var(--shadow-card)] sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_auto] lg:items-center lg:gap-6">
      <div className="flex min-w-0 items-center gap-4">
        <button
          type="button"
          onClick={() => onOpen(purchase.name)}
          className="press shrink-0"
          aria-label={`Подробнее: ${purchase.name}`}
        >
          <ItemImage
            src={purchase.image}
            alt={purchase.name}
            rarityColor={purchase.rarityColor}
            className="size-16"
            imageClassName="p-1.5"
          />
        </button>
        <div className="min-w-0 space-y-1">
          <ItemTitle name={purchase.name} />
          <p className="text-foreground-subtle text-[0.6875rem]">
            держал {held} {plural(held, ['день', 'дня', 'дней'])}
          </p>
        </div>
      </div>

      <div className="flex items-end gap-4">
        <div>
          <p className="text-foreground-subtle text-[0.6875rem]">Купил</p>
          <p className="numeric text-lg font-semibold">{formatUsd(cost)}</p>
          <p className="text-foreground-subtle text-[0.6875rem]">
            {purchaseMarketName(purchase.market)} · {shortDate.format(new Date(purchase.boughtAt))}
          </p>
        </div>
        <ArrowRight className="text-foreground-subtle mb-5 size-4 shrink-0" aria-hidden />
        <div>
          <p className="text-foreground-subtle text-[0.6875rem]">Получил</p>
          <p className="numeric text-lg font-semibold">{formatUsd(sale.received)}</p>
          <p className="text-foreground-subtle text-[0.6875rem]">
            {purchaseMarketName(sale.market)} · {shortDate.format(new Date(sale.soldAt))}
          </p>
        </div>
        <span className="mb-5">
          <ProfitPill profit={profit} cost={cost} />
        </span>
      </div>

      <Button
        variant="ghost"
        size="sm"
        aria-label="Изменить продажу"
        title="Изменить продажу"
        onClick={() => form.sell(purchase)}
      >
        <Pencil className="size-4" aria-hidden />
      </Button>
    </article>
  );
};
