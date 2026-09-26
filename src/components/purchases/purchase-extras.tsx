'use client';

import { Loader2 } from 'lucide-react';

import { stickerLabel } from '@/components/stickers/sticker-picker';
import { useFloatSearch, useItemsByName } from '@/lib/api/queries';
import { formatFloat } from '@/lib/format/float';
import { formatSignedUsd, formatUsd } from '@/lib/format/money';
import { plural } from '@/lib/format/time';
import {
  STICKER_PREMIUM,
  lowFloatRange,
  marketPrice,
  stickerPremium,
  type Purchase,
} from '@/lib/purchases/purchases';

const percent = (share: number): string => `${Math.round(share * 100)}%`;

const StickersLine = ({ stickers }: { stickers: string[] }) => {
  const prices = useItemsByName(stickers);
  const priced = stickers.map((name) => ({
    name,
    price: prices.data?.get(name) ? marketPrice(prices.data.get(name)!) : null,
  }));
  const total = priced.reduce((sum, entry) => sum + (entry.price ?? 0), 0);
  const [low, high] = stickerPremium(total);

  return (
    <div className="space-y-1.5">
      <p className="text-foreground-muted">
        Наклейки на{' '}
        <span className="text-foreground numeric font-semibold">
          {prices.data ? formatUsd(total) : '…'}
        </span>{' '}
        по рынку
        {prices.data && total > 0
          ? `, к цене скина обычно добавляют ${percent(STICKER_PREMIUM[0])}–${percent(STICKER_PREMIUM[1])}: ${formatSignedUsd(low)}…${formatSignedUsd(high)}`
          : ''}
        .
      </p>
      <ul className="numeric flex flex-wrap gap-1.5">
        {priced.map((entry, index) => (
          <li
            key={`${entry.name}-${index}`}
            className="bg-surface text-foreground-muted rounded-full px-2 py-0.5 text-[0.6875rem]"
          >
            {stickerLabel(entry.name)} · {formatUsd(entry.price)}
          </li>
        ))}
      </ul>
    </div>
  );
};

const FloatLine = ({ purchase, range }: { purchase: Purchase; range: [number, number] }) => {
  const search = useFloatSearch({
    name: purchase.name,
    floatFrom: range[0],
    floatTo: range[1],
  });

  if (!search.data) {
    return (
      <p className="text-foreground-subtle flex items-center gap-2">
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
        Ищем лоты с таким же низким флоатом
      </p>
    );
  }

  const data = search.data;
  const float = range[1];
  const prices = [
    ...[data.dmarket, data.whiteMarket, data.csfloat].flatMap((source) =>
      source.listings
        .filter((listing) => listing.float !== null && listing.float <= float)
        .map((listing) => listing.price),
    ),
    ...data.steam.listings
      .filter((listing) => listing.float !== null && listing.float <= float)
      .flatMap((listing) => (listing.price !== null ? [listing.price] : [])),
  ];
  const cheapest = prices.length > 0 ? Math.min(...prices) : null;
  const orders = data.orders
    .filter((order) => order.range && order.range[0] <= float && float <= order.range[1])
    .map((order) => order.price);
  const bestOrder = orders.length > 0 ? Math.max(...orders) : null;
  const plain = data.cheapestAnyFloat;

  return (
    <p className="text-foreground-muted">
      Флоат {formatFloat(float, 6)} в нижней части износа.{' '}
      {cheapest !== null ? (
        <>
          С флоатом не хуже {prices.length} {plural(prices.length, ['лот', 'лота', 'лотов'])} от{' '}
          <span className="text-foreground numeric font-semibold">{formatUsd(cheapest)}</span>
          {plain !== null
            ? ` (обычный от ${formatUsd(plain)}, ${formatSignedUsd(cheapest - plain)})`
            : ''}
          .
        </>
      ) : (
        'Лотов с таким же низким флоатом сейчас нет, можно ставить выше рынка.'
      )}
      {bestOrder !== null ? ` Заявки на такой флоат до ${formatUsd(bestOrder)}.` : ''}
    </p>
  );
};

export const PurchaseExtras = ({ purchase }: { purchase: Purchase }) => {
  const range = lowFloatRange(purchase.name, purchase.float);

  if (purchase.stickers.length === 0 && !range) {
    return null;
  }

  return (
    <div className="bg-surface-muted/60 pointer-events-none space-y-1.5 rounded-xl px-3 py-2.5 text-[0.8125rem]">
      {purchase.stickers.length > 0 ? <StickersLine stickers={purchase.stickers} /> : null}
      {range ? <FloatLine purchase={purchase} range={range} /> : null}
    </div>
  );
};
