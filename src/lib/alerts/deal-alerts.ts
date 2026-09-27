import type { Item } from '@/lib/api/types';
import { formatPercent, formatUsd } from '@/lib/format/money';
import { SELL_MARKET_ORDER } from '@/lib/markets';

export interface DealAlert {
  key: string;
  name: string;
  image: string | null;
  rarityColor: string | null;
  price: number;
  percent: number | null;
  discount: number | null;
  score: number | null;
  favorite: boolean;
  reason: string;
}

export const ALERT_RULES = {
  score: 70,
  percent: 8,
  favoriteScore: 65,
  favoritePercent: 6,
  minDiscount: 100,
  minEightWeekSales: 20,
  defaultMinPrice: 500,
};

const cheapest = (item: Item): number | null => {
  const prices = SELL_MARKET_ORDER.map((market) => item[market])
    .filter((quote) => quote && quote.listings > 0 && quote.price !== null)
    .map((quote) => quote!.price!);

  return prices.length > 0 ? Math.min(...prices) : null;
};

export const alertFor = (item: Item, favorite: boolean, minPrice: number): DealAlert | null => {
  const percent = item.top?.percent ?? null;
  const discount = item.top?.discount ?? null;
  const score = item.dealScore && item.dealScore.confidence !== 'low' ? item.dealScore.score : null;
  const price = item.top?.price ?? cheapest(item);

  if (price === null) return null;

  if (!favorite) {
    const sales = item.sales?.eightWeekSales ?? 0;

    if (price < minPrice || sales < ALERT_RULES.minEightWeekSales) return null;
  }

  const scoreLimit = favorite ? ALERT_RULES.favoriteScore : ALERT_RULES.score;
  const percentLimit = favorite ? ALERT_RULES.favoritePercent : ALERT_RULES.percent;
  const worthMoney = discount !== null && discount >= ALERT_RULES.minDiscount;
  const strongScore = score !== null && score >= scoreLimit && worthMoney;
  const deepDiscount = percent !== null && percent >= percentLimit && worthMoney;

  if (!strongScore && !deepDiscount) return null;

  const parts = [
    favorite ? 'из избранного' : null,
    percent !== null && discount !== null
      ? `на ${formatPercent(percent)} ниже рынка, ${formatUsd(discount)}`
      : null,
    score !== null ? `сигнал ${score}` : null,
  ].filter(Boolean);

  return {
    key: `${item.name}:${price}`,
    name: item.name,
    image: item.image,
    rarityColor: item.rarityColor,
    price,
    percent,
    discount,
    score,
    favorite,
    reason: parts.join(' · '),
  };
};

export const stillWorth = (before: DealAlert, fresh: Item, minPrice: number): DealAlert | null => {
  const next = alertFor(fresh, before.favorite, minPrice);

  return next && next.price <= before.price ? next : null;
};

const SEEN_TTL_MS = 12 * 60 * 60_000;

export const pruneSeen = (seen: Record<string, number>, now: number): Record<string, number> =>
  Object.fromEntries(Object.entries(seen).filter(([, at]) => now - at < SEEN_TTL_MS));
