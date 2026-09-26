'use client';

import { useBlueValue, useFloatSearch, useItemsByName } from '@/lib/api/queries';
import type { BlueValue, FloatSearch, Item } from '@/lib/api/types';
import { isCaseHardened } from '@/lib/format/blue';
import {
  lowFloatRange,
  marketPrice,
  type FeeTable,
  type Purchase,
} from '@/lib/purchases/purchases';
import {
  bluePremium,
  floatPremium,
  priceOptions,
  stickerValues,
  sumRanges,
  type PremiumRange,
  type PriceOption,
  type StickerValue,
} from '@/lib/purchases/valuation';

const NOTABLE_BLUE = 1.05;

export interface FloatFacts {
  float: number;
  betterCount: number;
  betterCheapest: number | null;
  plain: number | null;
  order: number | null;
}

export interface Valuation {
  total: PremiumRange;
  parts: { key: 'blue' | 'float' | 'stickers'; label: string; range: PremiumRange }[];
  options: PriceOption[];
  blue: BlueValue | null;
  stickers: StickerValue[];
  float: FloatFacts | null;
  loading: boolean;
}

const floatFacts = (data: FloatSearch, float: number): FloatFacts => {
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
  const orders = data.orders
    .filter((order) => order.range && order.range[0] <= float && float <= order.range[1])
    .map((order) => order.price);

  return {
    float,
    betterCount: prices.length,
    betterCheapest: prices.length > 0 ? Math.min(...prices) : null,
    plain: data.cheapestAnyFloat,
    order: orders.length > 0 ? Math.max(...orders) : null,
  };
};

export const usePurchaseValuation = (
  purchase: Purchase,
  item: Item | undefined,
  fees: FeeTable,
  withdrawals: FeeTable,
): Valuation => {
  const range = lowFloatRange(purchase.name, purchase.float);
  const blueQuery = useBlueValue(purchase.name, purchase.paintSeed, isCaseHardened(purchase.name));
  const stickerQuery = useItemsByName(purchase.stickers);
  const floatQuery = useFloatSearch({
    name: range ? purchase.name : null,
    floatFrom: range?.[0],
    floatTo: range?.[1],
  });

  const blue = blueQuery.data ?? null;
  const blueRange =
    blue && blue.multiplier !== null && blue.multiplier >= NOTABLE_BLUE
      ? bluePremium(
          blue.market,
          blue.sales.map((sale) => sale.ratio),
        )
      : null;
  const stickers = stickerValues(
    purchase.stickers.map((name) => {
      const found = stickerQuery.data?.get(name);

      return { name, price: found ? marketPrice(found) : null };
    }),
  );
  const stickerRange = stickers.length > 0 ? sumRanges(stickers) : null;
  const float = range && floatQuery.data ? floatFacts(floatQuery.data, range[1]) : null;
  const floatRange =
    float && !isCaseHardened(purchase.name)
      ? floatPremium(float.betterCheapest, float.plain)
      : null;
  const parts = [
    { key: 'blue' as const, label: 'синий', range: blueRange },
    { key: 'float' as const, label: 'флоат', range: floatRange },
    { key: 'stickers' as const, label: 'наклейки', range: stickerRange },
  ].filter(
    (part): part is Valuation['parts'][number] => part.range !== null && part.range.high > 0,
  );
  const total = sumRanges(parts.map((part) => part.range));
  const instant = Math.max(item?.dmarket?.bid ?? 0, float?.order ?? 0) || null;

  return {
    total,
    parts,
    options: item ? priceOptions(item, total, instant, purchase.price, fees, withdrawals) : [],
    blue,
    stickers,
    float,
    loading:
      (isCaseHardened(purchase.name) && purchase.paintSeed !== null && blueQuery.isPending) ||
      (purchase.stickers.length > 0 && stickerQuery.isPending) ||
      (range !== null && floatQuery.isPending),
  };
};
