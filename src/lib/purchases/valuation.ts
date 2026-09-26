import type { Item, SellMarketId } from '@/lib/api/types';
import { SELL_MARKET_ORDER } from '@/lib/markets';

import { payoutFor, type FeeTable } from './purchases';

export interface PremiumRange {
  low: number;
  mid: number;
  high: number;
}

export interface StickerValue extends PremiumRange {
  name: string;
  price: number | null;
  image: string | null;
}

const STICKER_TIERS: [number, number][] = [
  [100_00, 0.12],
  [20_00, 0.08],
  [5_00, 0.05],
  [1_00, 0.02],
];
const FINISH_BONUS: [RegExp, number][] = [
  [/\((Holo|Foil|Lenticular)\)/, 1.3],
  [/\(Gold\)/, 1.2],
];
const OLD_MAJOR = /(Katowice 2014|Cologne 2014|DreamHack 2014|Katowice 2015)/;
const OLD_MAJOR_BONUS = 1.5;
const CRAFT_BONUS = 1.5;
const CRAFT_SIZE = 3;
const RANGE_LOW = 0.6;
const RANGE_HIGH = 1.4;
const ONE_CENT = 1;

export const stickerShare = (name: string, price: number, copies = 1): number => {
  const base = STICKER_TIERS.find(([floor]) => price >= floor)?.[1] ?? 0;
  const finish = FINISH_BONUS.find(([pattern]) => pattern.test(name))?.[1] ?? 1;
  const era = OLD_MAJOR.test(name) ? OLD_MAJOR_BONUS : 1;
  const craft = copies >= CRAFT_SIZE ? CRAFT_BONUS : 1;

  return base * finish * era * craft;
};

const range = (mid: number): PremiumRange => ({
  low: Math.round(mid * RANGE_LOW),
  mid: Math.round(mid),
  high: Math.round(mid * RANGE_HIGH),
});

export const stickerValues = (
  stickers: { name: string; price: number | null; image?: string | null }[],
): StickerValue[] =>
  stickers.map((sticker) => {
    const copies = stickers.filter((entry) => entry.name === sticker.name).length;
    const share = sticker.price ? stickerShare(sticker.name, sticker.price, copies) : 0;

    return { ...sticker, image: sticker.image ?? null, ...range((sticker.price ?? 0) * share) };
  });

export const sumRanges = (ranges: (PremiumRange | null)[]): PremiumRange =>
  ranges.reduce<PremiumRange>(
    (total, entry) =>
      entry
        ? { low: total.low + entry.low, mid: total.mid + entry.mid, high: total.high + entry.high }
        : total,
    { low: 0, mid: 0, high: 0 },
  );

export const floatPremium = (
  betterCheapest: number | null,
  plainFloor: number | null,
): PremiumRange | null => {
  if (betterCheapest === null || plainFloor === null) return null;

  const mid = Math.max(0, betterCheapest - ONE_CENT - plainFloor);

  return { low: Math.round(mid / 2), mid, high: mid };
};

export const bluePremium = (market: number | null, ratios: number[]): PremiumRange | null => {
  if (market === null || ratios.length === 0) return null;

  const sorted = [...ratios].sort((left, right) => left - right);
  const at = (share: number) =>
    sorted[Math.min(sorted.length - 1, Math.floor(share * sorted.length))];
  const premium = (ratio: number) => Math.max(0, Math.round(market * (ratio - 1)));

  return { low: premium(at(0.25)), mid: premium(at(0.5)), high: premium(at(0.75)) };
};

export const withPremium = (item: Item, premium: number): Item => {
  if (premium <= 0) return item;

  const next = { ...item };

  for (const market of SELL_MARKET_ORDER) {
    const quote = item[market];

    if (quote && quote.price !== null) {
      next[market] = { ...quote, price: quote.price + premium };
    }
  }

  return next;
};

export interface PriceOption {
  kind: 'quick' | 'recommended' | 'max';
  market: SellMarketId;
  price: number;
  payout: number;
  profit: number;
}

const listed = (item: Item, market: SellMarketId): number | null => {
  const quote = item[market];

  return quote && quote.listings > 0 && quote.price !== null && quote.price > ONE_CENT
    ? quote.price - ONE_CENT
    : null;
};

const bestListing = (
  item: Item,
  premium: number,
  cost: number,
  fees: FeeTable,
  withdrawals: FeeTable,
): Omit<PriceOption, 'kind'> | null =>
  SELL_MARKET_ORDER.reduce<Omit<PriceOption, 'kind'> | null>((top, market) => {
    const base = listed(item, market);

    if (base === null) return top;

    const price = base + premium;
    const payout = payoutFor(price, market, fees, withdrawals);

    return !top || payout > top.payout ? { market, price, payout, profit: payout - cost } : top;
  }, null);

export const priceOptions = (
  item: Item,
  premium: PremiumRange,
  instant: number | null,
  cost: number,
  fees: FeeTable,
  withdrawals: FeeTable,
): PriceOption[] => {
  const options: PriceOption[] = [];

  if (instant !== null && instant > 0) {
    const payout = payoutFor(instant, 'dmarket', fees, withdrawals);

    options.push({
      kind: 'quick',
      market: 'dmarket',
      price: instant,
      payout,
      profit: payout - cost,
    });
  }

  const recommended = bestListing(item, premium.mid, cost, fees, withdrawals);
  const max = bestListing(item, premium.high, cost, fees, withdrawals);

  if (recommended) options.push({ kind: 'recommended', ...recommended });
  if (max && max.price > (recommended?.price ?? 0)) options.push({ kind: 'max', ...max });

  return options;
};
