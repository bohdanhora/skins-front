'use client';

import { ExternalLink, KeyRound, Zap } from 'lucide-react';
import { useState } from 'react';

import { useRememberedState } from '@/hooks/use-remembered-state';
import { BlueShareTag } from '@/components/items/blue-share-tag';
import { Segmented } from '@/components/ui/segmented';
import { Skeleton } from '@/components/ui/skeleton';
import { useFloatSearch } from '@/lib/api/queries';
import type {
  FloatBuyOrder,
  FloatListing,
  FloatSearch,
  ListingMarketId,
  SteamFloatListing,
} from '@/lib/api/types';
import { formatFloat, formatRange, type FloatRange } from '@/lib/format/float';
import { formatSignedUsd, formatUsd } from '@/lib/format/money';
import { plural } from '@/lib/format/time';
import { MARKETS } from '@/lib/markets';
import { cn } from '@/lib/utils/cn';

import { FloatBar } from './float-bar';

type Order = 'price' | 'float';
type Source = 'all' | ListingMarketId;

interface FloatResultsProps {
  name: string;
  range: Partial<{ from: number; to: number }>;
  zoom: FloatRange | null;
}

export const FloatResults = ({ name, range, zoom }: FloatResultsProps) => {
  const search = useFloatSearch({ name, floatFrom: range.from, floatTo: range.to });
  const [order, setOrder] = useRememberedState<Order>('floatResults.order', 'price');
  const [source, setSource] = useState<Source>('all');

  if (search.isPending) {
    return <Skeleton className="h-72 rounded-3xl" />;
  }

  if (search.isError) {
    return (
      <p className="text-foreground-muted py-8 text-center text-sm">
        Не получилось загрузить лоты. Попробуй ещё раз чуть позже.
      </p>
    );
  }

  const data = search.data;
  const allListings = [
    ...data.dmarket.listings,
    ...data.whiteMarket.listings,
    ...data.csfloat.listings,
  ];
  const listings = allListings
    .filter((listing) => source === 'all' || listing.market === source)
    .sort((left, right) =>
      order === 'price' ? left.price - right.price : (left.float ?? 1) - (right.float ?? 1),
    );
  const best = [...listings].sort((left, right) => left.price - right.price)[0];

  return (
    <div className={cn('space-y-6', search.isFetching ? 'opacity-60 transition-opacity' : '')}>
      <Summary data={data} best={best ?? null} range={range} />
      <BuyOrders orders={data.orders} best={best ?? null} />

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold">
            Лоты в диапазоне{' '}
            <span className="text-foreground-muted font-normal">
              {data.dmarket.total + data.whiteMarket.total + data.csfloat.total}
            </span>
          </h2>
          <div className="flex flex-wrap gap-2">
            <Segmented
              label="Площадка"
              value={source}
              onChange={setSource}
              options={[
                { value: 'all', label: 'Все' },
                { value: 'dmarket', label: 'DMarket' },
                { value: 'whiteMarket', label: 'White' },
                { value: 'csfloat', label: 'CSFloat' },
              ]}
              className="w-auto"
            />
            <Segmented
              label="Сортировка"
              value={order}
              onChange={setOrder}
              options={[
                { value: 'price', label: 'Дешевле' },
                { value: 'float', label: 'Ниже флоат' },
              ]}
              className="w-auto"
            />
          </div>
        </div>
        {data.whiteMarket.status === 'noKeys' ? (
          <p className="text-foreground-muted flex items-center gap-2 text-xs">
            <KeyRound className="size-3.5 shrink-0" aria-hidden />
            Лоты white.market по флоату видны только с ключом, сейчас в списке DMarket и CSFloat.
          </p>
        ) : null}
        {data.csfloat.status === 'noKeys' ? (
          <p className="text-foreground-muted flex items-center gap-2 text-xs">
            <KeyRound className="size-3.5 shrink-0" aria-hidden />
            Добавь CSFLOAT_API_KEY на сервере, чтобы видеть лоты CSFloat с точным флоатом.
          </p>
        ) : null}
        {listings.length === 0 ? (
          <p className="text-foreground-muted py-6 text-center text-sm">
            В этом диапазоне сейчас ничего не продаётся.
          </p>
        ) : (
          <ul className="divide-border border-border bg-surface divide-y overflow-hidden rounded-2xl border">
            {listings.map((listing, index) => (
              <ListingRow
                key={`${listing.market}-${listing.float}-${listing.price}-${index}`}
                listing={listing}
                name={name}
                zoom={zoom}
                cheapest={listing === best}
              />
            ))}
          </ul>
        )}
      </section>

      <SteamListings data={data.steam} name={name} zoom={zoom} />
    </div>
  );
};

const Summary = ({
  data,
  best,
  range,
}: {
  data: FloatSearch;
  best: FloatListing | null;
  range: FloatResultsProps['range'];
}) => {
  const premium =
    best && data.cheapestAnyFloat !== null ? best.price - data.cheapestAnyFloat : null;
  const wmCheapest = data.whiteMarketCheapest;

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Tile label="Дешевле всего в диапазоне">
        {best ? (
          <>
            <p className="numeric text-2xl font-semibold tracking-tight">{formatUsd(best.price)}</p>
            <p className="text-foreground-muted mt-1 flex items-center gap-1.5 text-xs">
              <span className={cn('size-2 rounded-full', MARKETS[best.market].dot)} aria-hidden />
              {MARKETS[best.market].name}, флоат{' '}
              {best.float !== null ? formatFloat(best.float) : '?'}
            </p>
          </>
        ) : (
          <p className="text-foreground-muted text-sm">нет лотов</p>
        )}
      </Tile>
      <Tile label="Доплата за такой флоат">
        {premium !== null ? (
          <>
            <p className="numeric text-2xl font-semibold tracking-tight">
              {premium > 0 ? formatSignedUsd(premium) : 'нет'}
            </p>
            <p className="text-foreground-muted mt-1 text-xs">
              к самому дешёвому лоту с любым флоатом ({formatUsd(data.cheapestAnyFloat)})
            </p>
          </>
        ) : (
          <p className="text-foreground-muted text-sm">-</p>
        )}
      </Tile>
      <Tile label="Самый дешёвый на white.market">
        {wmCheapest ? (
          <>
            <p className="numeric text-2xl font-semibold tracking-tight">
              {formatUsd(wmCheapest.price)}
            </p>
            <p className="text-foreground-muted mt-1 text-xs">
              {wmCheapest.float !== null
                ? `флоат ${formatFloat(wmCheapest.float)}${
                    outside(wmCheapest.float, range) ? ', не в твоём диапазоне' : ''
                  }`
                : 'флоат не указан'}
            </p>
          </>
        ) : (
          <p className="text-foreground-muted text-sm">нет в продаже</p>
        )}
      </Tile>
    </div>
  );
};

const outside = (value: number, range: FloatResultsProps['range']): boolean =>
  (range.from !== undefined && value < range.from) || (range.to !== undefined && value > range.to);

const Tile = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="bg-surface rounded-2xl p-4 shadow-[var(--shadow-card)]">
    <p className="text-foreground-muted mb-2 text-xs font-medium">{label}</p>
    {children}
  </div>
);

const SteamListings = ({
  data,
  name,
  zoom,
}: {
  data: FloatSearch['steam'];
  name: string;
  zoom: FloatRange | null;
}) => {
  if (data.status === 'error') {
    return (
      <p className="text-foreground-muted text-xs">
        Steam временно не отдал лоты. Остальные площадки продолжают работать.
      </p>
    );
  }

  if (data.listings.length === 0) return null;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base font-semibold">
          Steam Market <span className="text-foreground-muted font-normal">{data.total}</span>
        </h2>
        <p className="text-foreground-muted text-sm">
          Цена показана в валюте Steam. Баланс Steam не выводится, поэтому эти лоты не смешиваются с
          долларовым рейтингом других площадок.
        </p>
      </div>
      <ul className="divide-border border-border bg-surface divide-y overflow-hidden rounded-2xl border">
        {data.listings.map((listing) => (
          <SteamListingRow key={listing.id} listing={listing} name={name} zoom={zoom} />
        ))}
      </ul>
    </section>
  );
};

const SteamListingRow = ({
  listing,
  name,
  zoom,
}: {
  listing: SteamFloatListing;
  name: string;
  zoom: FloatRange | null;
}) => (
  <li>
    <a
      href={listing.url}
      target="_blank"
      rel="noreferrer"
      className="hover:bg-surface-muted flex items-center gap-4 px-4 py-3 transition-colors"
    >
      <div className="w-28 shrink-0 space-y-1.5 sm:w-40">
        <p className="numeric text-sm font-semibold">
          {listing.float !== null ? formatFloat(listing.float, 6) : 'без флоата'}
        </p>
        {listing.float !== null ? (
          <FloatBar value={listing.float} zoom={zoom ?? undefined} />
        ) : null}
      </div>
      <div className="text-foreground-muted min-w-0 flex-1 text-xs">
        <p className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#66c0f4]" aria-hidden />
          Steam
        </p>
        <p className="mt-0.5">
          {[listing.paintSeed !== null ? `паттерн ${listing.paintSeed}` : null, listing.phase]
            .filter(Boolean)
            .join(', ')}
        </p>
        {listing.blue ? <BlueShareTag blue={listing.blue} name={name} /> : null}
      </div>
      <div className="text-right whitespace-nowrap">
        <p className="numeric text-[0.9375rem] font-semibold">
          {listing.price !== null ? formatUsd(listing.price) : listing.priceLabel}
        </p>
        {listing.price !== null ? (
          <p className="text-foreground-subtle numeric text-xs">{listing.priceLabel}</p>
        ) : null}
      </div>
      <ExternalLink className="text-foreground-subtle size-3.5 shrink-0" aria-hidden />
    </a>
  </li>
);

const BuyOrders = ({ orders, best }: { orders: FloatBuyOrder[]; best: FloatListing | null }) => {
  if (orders.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base font-semibold">Автопокупка на DMarket</h2>
        <p className="text-foreground-muted text-sm">
          Заявки, которые подходят под этот флоат. Если заявка выше цены лота, его можно купить и
          сразу продать.
        </p>
      </div>
      <ul className="divide-border border-border bg-surface divide-y overflow-hidden rounded-2xl border">
        {orders.map((order, index) => {
          const profitable = best !== null && order.price > best.price;

          return (
            <li
              key={`${order.price}-${order.floatPart}-${index}`}
              className="flex items-center gap-3 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {order.range ? `Флоат ${formatRange(order.range)}` : 'Любой флоат'}
                </p>
                <p className="text-foreground-muted text-xs">
                  {order.amount} {plural(order.amount, ['заявка', 'заявки', 'заявок'])}
                  {order.floatPart ? `, группа ${order.floatPart}` : ''}
                </p>
              </div>
              {profitable ? (
                <span className="bg-gain-soft text-gain inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold">
                  <Zap className="size-3.5" aria-hidden />
                  выше лота на {formatUsd(order.price - best.price)}
                </span>
              ) : null}
              <span className="numeric text-[0.9375rem] font-semibold">
                {formatUsd(order.price)}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

const ListingRow = ({
  listing,
  name,
  zoom,
  cheapest,
}: {
  listing: FloatListing;
  name: string;
  zoom: FloatRange | null;
  cheapest: boolean;
}) => (
  <li>
    <a
      href={listing.url}
      target="_blank"
      rel="noreferrer"
      className={cn(
        'hover:bg-surface-muted flex items-center gap-4 px-4 py-3 transition-colors',
        cheapest ? 'bg-gain-soft/50' : '',
      )}
    >
      <div className="w-28 shrink-0 space-y-1.5 sm:w-40">
        <p className="numeric text-sm font-semibold">
          {listing.float !== null ? formatFloat(listing.float, 6) : 'без флоата'}
        </p>
        {listing.float !== null ? (
          <FloatBar value={listing.float} zoom={zoom ?? undefined} />
        ) : null}
      </div>
      <div className="text-foreground-muted min-w-0 flex-1 text-xs">
        <p className="flex items-center gap-1.5">
          <span className={cn('size-2 rounded-full', MARKETS[listing.market].dot)} aria-hidden />
          {MARKETS[listing.market].name}
        </p>
        {listing.paintSeed !== null ? <p className="mt-0.5">паттерн {listing.paintSeed}</p> : null}
        {listing.blue ? <BlueShareTag blue={listing.blue} name={name} /> : null}
      </div>
      <span className="numeric text-[0.9375rem] font-semibold">{formatUsd(listing.price)}</span>
      <ExternalLink className="text-foreground-subtle size-3.5 shrink-0" aria-hidden />
    </a>
  </li>
);
