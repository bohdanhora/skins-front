'use client';

import {
  ArrowRight,
  ReceiptText,
  ExternalLink,
  Gauge,
  Info,
  TrendingDown,
  TriangleAlert,
  Zap,
} from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { AddToSetButton } from '@/components/favorites/add-to-set';
import { usePurchaseForm } from '@/components/purchases/purchase-form';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { usePurchases } from '@/lib/api/account';
import { useItem, useItemListings, useStatus, useSteamPrice } from '@/lib/api/queries';
import type { Flip, Item, MarketId } from '@/lib/api/types';
import { dealWarning } from '@/lib/deal-warning';
import { parseItemName } from '@/lib/format/item-name';
import { timeAgo } from '@/lib/format/time';
import { formatPercent, formatSignedUsd, formatUsd } from '@/lib/format/money';
import { MARKETS, MARKET_ORDER } from '@/lib/markets';
import { useFees } from '@/lib/storage/settings';
import { cn } from '@/lib/utils/cn';

import { ListingList } from './listing-list';
import { PatternPreview } from './pattern-preview';
import { FavoriteButton } from './favorite-button';
import { ItemImage } from './item-image';
import { ItemTitle } from './item-title';
import { offersLabel } from './price-rows';
import { SalesChart } from './sales-chart';

interface ItemDialogProps {
  name: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ItemDialog = ({ name, open, onOpenChange }: ItemDialogProps) => {
  const item = useItem(open ? name : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={name ?? 'Предмет'} hideHeader>
      {item.data ? (
        <ItemDetails item={item.data} onNavigate={() => onOpenChange(false)} />
      ) : item.isError ? (
        <p className="text-foreground-muted py-10 text-center text-sm">
          Этот предмет сейчас не продаётся ни на одной площадке.
        </p>
      ) : (
        <DetailsSkeleton />
      )}
    </Dialog>
  );
};

const ItemDetails = ({ item, onNavigate }: { item: Item; onNavigate: () => void }) => {
  const status = useStatus();
  const keysReady =
    !!status.data &&
    (status.data.whiteMarket.keysConfigured ||
      status.data.dmarket.keysConfigured ||
      status.data.csfloat.keysConfigured);

  return (
    <div className="space-y-6 pt-3">
      <div className="flex items-center gap-4 pr-8">
        <ItemImage
          src={item.image}
          alt={item.name}
          rarityColor={item.rarityColor}
          className="size-28 shrink-0 sm:size-32"
          imageClassName="p-2"
        />
        <div className="min-w-0 space-y-2">
          <ItemTitle name={item.name} size="lg" />
          <div className="flex items-center gap-2">
            {item.rarity ? (
              <span className="text-foreground-muted flex items-center gap-1.5 text-xs">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: item.rarityColor ?? undefined }}
                  aria-hidden
                />
                {item.rarity}
              </span>
            ) : null}
            <FavoriteButton name={item.name} className="bg-surface-muted" />
            <RecordPurchaseButton item={item} onNavigate={onNavigate} />
            <AddToSetButton name={item.name} />
          </div>
          <OwnPurchases name={item.name} />
        </div>
      </div>

      <Verdict item={item} />

      <div className="grid gap-3 sm:grid-cols-2">
        {MARKET_ORDER.map((market) => (
          <MarketPanel key={market} item={item} market={market} />
        ))}
      </div>

      {item.phase ? null : <SteamRow name={item.name} />}

      <ResaleSection item={item} />

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">История продаж и цены</h3>
        {item.top ? (
          <div className="bg-gain-soft text-gain flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium">
            <TrendingDown className="size-4 shrink-0" aria-hidden />
            На {MARKETS[item.top.market].name} на {formatPercent(item.top.percent)} ниже обычного
            {item.dmarket?.bid
              ? (item.top.bidCover ?? 0) >= 100
                ? `, а заявка DMarket даже после комиссии выше: ${formatUsd(item.dmarket.bid)}`
                : `, скупают за ${formatUsd(item.dmarket.bid)}`
              : ''}
          </div>
        ) : null}
        {item.sales?.eightWeekAverage ? (
          <div className="grid grid-cols-3 gap-2">
            <HistoryStat
              label="Средняя за 8 недель"
              value={formatUsd(item.sales.eightWeekAverage)}
            />
            <HistoryStat
              label="Продаж за 8 недель"
              value={String(item.sales.eightWeekSales ?? 0)}
            />
            <HistoryStat
              label="Тренд за неделю"
              value={
                item.sales.trendPercent === null || item.sales.trendPercent === undefined
                  ? 'мало данных'
                  : formatPercent(item.sales.trendPercent, true)
              }
              tone={
                item.sales.trendPercent === null || item.sales.trendPercent === undefined
                  ? undefined
                  : item.sales.trendPercent >= 0
                    ? 'gain'
                    : 'loss'
              }
            />
          </div>
        ) : null}
        <SalesChart item={item} />
      </section>

      {parseItemName(item.name).wear ? (
        <Button asChild variant="secondary" className="w-full">
          <Link href={`/float?name=${encodeURIComponent(item.name)}` as Route} onClick={onNavigate}>
            <Gauge className="size-4" aria-hidden />
            Искать этот скин по флоату
          </Link>
        </Button>
      ) : null}

      {parseItemName(item.name).wear ? <PatternPreview name={item.name} /> : null}

      {keysReady ? (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Самые дешёвые лоты</h3>
          <ItemListings name={item.name} />
        </section>
      ) : null}
    </div>
  );
};

const RecordPurchaseButton = ({ item, onNavigate }: { item: Item; onNavigate: () => void }) => {
  const form = usePurchaseForm();

  return (
    <button
      type="button"
      aria-label="Записать покупку"
      title="Записать покупку"
      onClick={() => {
        onNavigate();
        form.add({ name: item.name, image: item.image, rarityColor: item.rarityColor });
      }}
      className="press bg-surface-muted text-foreground-subtle hover:text-foreground flex size-9 items-center justify-center rounded-full"
    >
      <ReceiptText className="size-[1.125rem]" aria-hidden />
    </button>
  );
};

const OwnPurchases = ({ name }: { name: string }) => {
  const purchases = usePurchases();
  const held = (purchases.data ?? []).filter(
    (purchase) => purchase.name === name && purchase.sale === null,
  );

  if (held.length === 0) {
    return null;
  }

  return (
    <p className="text-foreground-muted numeric text-xs">
      Куплено за {held.map((purchase) => formatUsd(purchase.price)).join(', ')}
    </p>
  );
};

const HistoryStat = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'gain' | 'loss';
}) => (
  <div className="bg-surface-muted rounded-xl px-3 py-2.5">
    <p className="text-foreground-subtle text-[0.6875rem] leading-tight">{label}</p>
    <p
      className={cn(
        'numeric mt-1 text-sm font-semibold',
        tone === 'gain' ? 'text-gain' : tone === 'loss' ? 'text-loss' : 'text-foreground',
      )}
    >
      {value}
    </p>
  </div>
);

const Verdict = ({ item }: { item: Item }) => {
  if (!item.gap) {
    return null;
  }

  const cheaper = MARKETS[item.gap.cheaper];
  const warning = dealWarning(item, 'gap');

  return (
    <div className="space-y-2">
      <div className="bg-gain-soft text-gain rounded-2xl px-4 py-3 text-[0.9375rem] font-medium">
        На {cheaper.name} дешевле на {formatUsd(item.gap.amount)} ({formatPercent(item.gap.percent)}
        )
      </div>
      {warning ? (
        <div className="bg-warning-soft text-warning flex gap-2.5 rounded-2xl px-4 py-3 text-sm leading-relaxed">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>{warning.long}</p>
        </div>
      ) : null}
    </div>
  );
};

const STALE_MS = 15 * 60_000;

const Freshness = ({ item, market }: { item: Item; market: MarketId }) => {
  if (market === 'lisSkins' || !item.checkedAt) return null;

  const checked = item.checkedAt[market];
  const paused =
    market === 'csfloat' &&
    !!item.csfloatPausedUntil &&
    Date.parse(item.csfloatPausedUntil) > Date.now();
  const stale = !checked || Date.now() - Date.parse(checked) > STALE_MS;

  return (
    <p
      className={cn(
        'mt-0.5 text-[0.6875rem]',
        paused || stale ? 'text-warning' : 'text-foreground-subtle',
      )}
      title={paused ? 'CSFloat временно не отвечает, цена может быть устаревшей' : undefined}
    >
      {paused
        ? `цена от ${checked ? timeAgo(checked) : 'давно'}, CSFloat на паузе`
        : `проверено ${timeAgo(checked)}`}
    </p>
  );
};

const MarketPanel = ({ item, market }: { item: Item; market: MarketId }) => {
  const quote = item[market];
  const meta = MARKETS[market];
  const listed = !!quote && quote.listings > 0 && quote.price !== null;
  const cheaper = item.gap?.cheaper === market;

  return (
    <div
      className={cn(
        'flex flex-col rounded-2xl border p-4',
        cheaper ? 'border-gain/40 bg-gain-soft/40' : 'border-border',
      )}
    >
      <p className="flex items-center gap-2 text-sm font-medium">
        <span className={cn('size-2 rounded-full', meta.dot)} aria-hidden />
        {meta.name}
      </p>
      <p className="numeric mt-3 text-2xl font-semibold tracking-tight">
        {listed ? formatUsd(quote.price) : '-'}
      </p>
      <p className="text-foreground-muted mt-0.5 text-xs">
        {listed ? offersLabel(quote.listings) : 'сейчас нет в продаже'}
      </p>
      <Freshness item={item} market={market} />
      {quote?.bid ? (
        <p className="text-foreground-muted mt-2 text-xs">
          Скупают за{' '}
          <span className="text-foreground numeric font-medium">{formatUsd(quote.bid)}</span>
        </p>
      ) : null}
      <div className="mt-auto pt-4">
        <Button asChild variant={market} size="sm" className="w-full">
          <a
            href={
              quote?.url ??
              (market === 'whiteMarket'
                ? 'https://white.market'
                : market === 'dmarket'
                  ? 'https://dmarket.com'
                  : 'https://csfloat.com')
            }
            target="_blank"
            rel="noreferrer"
          >
            Открыть
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </Button>
      </div>
    </div>
  );
};

const ResaleSection = ({ item }: { item: Item }) => {
  const fees = useFees();

  if (!item.flip && !item.instant) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">Если перепродать</h3>
      <div className="divide-border border-border divide-y rounded-2xl border">
        {item.flip ? (
          <ResaleRow
            icon={<ArrowRight className="size-4" aria-hidden />}
            title={`Купить на ${MARKETS[item.flip.buyOn].short}, выставить на ${MARKETS[item.flip.sellOn].short}`}
            note={`по ${formatUsd(item.flip.sellPrice)}, чуть дешевле всех`}
            flip={item.flip}
          />
        ) : null}
        {item.instant ? (
          <ResaleRow
            icon={<Zap className="size-4" aria-hidden />}
            title="Купить на White, сразу продать по заявке DMarket"
            note={`заявка ${formatUsd(item.instant.sellPrice)}, ждать не нужно`}
            flip={item.instant}
          />
        ) : null}
      </div>
      <p className="text-foreground-subtle text-xs">
        Уже вычтена комиссия продавца: white.market {fees.whiteMarket}%, DMarket {fees.dmarket}%,
        CSFloat {fees.csfloat}%. Поменять можно в настройках.
      </p>
    </section>
  );
};

const ResaleRow = ({
  icon,
  title,
  note,
  flip,
}: {
  icon: ReactNode;
  title: string;
  note: string;
  flip: Flip;
}) => (
  <div className="flex items-center gap-3 px-4 py-3">
    <span className="bg-surface-muted text-foreground-muted flex size-9 shrink-0 items-center justify-center rounded-xl">
      {icon}
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium">{title}</p>
      <p className="text-foreground-muted text-xs">{note}</p>
    </div>
    <div className="text-right">
      <p
        className={cn(
          'numeric text-[0.9375rem] font-semibold',
          flip.profit > 0 ? 'text-gain' : 'text-loss',
        )}
      >
        {formatSignedUsd(flip.profit)}
      </p>
      <p className="text-foreground-subtle numeric text-xs">{formatPercent(flip.percent, true)}</p>
    </div>
  </div>
);

const ItemListings = ({ name }: { name: string }) => {
  const listings = useItemListings(name, true);

  if (listings.isPending) {
    return <Skeleton className="h-32 rounded-2xl" />;
  }

  if (listings.isError) {
    return <Hint>Не удалось загрузить лоты. Попробуй открыть предмет ещё раз.</Hint>;
  }

  return <ListingList data={listings.data} compact />;
};

export const Hint = ({ children }: { children: ReactNode }) => (
  <div className="bg-surface-muted text-foreground-muted flex gap-3 rounded-2xl px-4 py-3 text-sm leading-relaxed">
    <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
    <p>{children}</p>
  </div>
);

const DetailsSkeleton = () => (
  <div className="space-y-6 pt-3">
    <div className="flex items-center gap-4">
      <Skeleton className="size-28 rounded-2xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-48" />
      </div>
    </div>
    <Skeleton className="h-12 rounded-2xl" />
    <div className="grid grid-cols-2 gap-3">
      <Skeleton className="h-40 rounded-2xl" />
      <Skeleton className="h-40 rounded-2xl" />
    </div>
  </div>
);

const SteamRow = ({ name }: { name: string }) => {
  const steam = useSteamPrice(name, true);

  if (steam.isPending) {
    return <Skeleton className="h-14 rounded-2xl" />;
  }

  if (steam.isError || (!steam.data.lowest && !steam.data.median)) {
    return null;
  }

  return (
    <a
      href={steam.data.url}
      target="_blank"
      rel="noreferrer"
      className="border-border hover:bg-surface-muted flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl border px-4 py-3 text-sm"
    >
      <span className="font-medium">Steam Market</span>
      <span className="text-foreground-muted">
        лот от{' '}
        <span className="text-foreground numeric font-semibold">
          {formatUsd(steam.data.lowest)}
        </span>
      </span>
      <span className="text-foreground-muted">
        медиана <span className="text-foreground numeric">{formatUsd(steam.data.median)}</span>, за
        сутки {steam.data.volume}
      </span>
    </a>
  );
};
