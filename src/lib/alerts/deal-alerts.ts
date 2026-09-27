import type { Item } from '@/lib/api/types';
import { formatPercent } from '@/lib/format/money';
import { SELL_MARKET_ORDER } from '@/lib/markets';

export interface DealAlert {
  key: string;
  name: string;
  image: string | null;
  rarityColor: string | null;
  price: number;
  percent: number | null;
  score: number | null;
  favorite: boolean;
  reason: string;
}

export const ALERT_RULES = {
  score: 70,
  percent: 8,
  favoriteScore: 65,
  favoritePercent: 6,
};

const cheapest = (item: Item): number | null => {
  const prices = SELL_MARKET_ORDER.map((market) => item[market])
    .filter((quote) => quote && quote.listings > 0 && quote.price !== null)
    .map((quote) => quote!.price!);

  return prices.length > 0 ? Math.min(...prices) : null;
};

export const alertFor = (item: Item, favorite: boolean): DealAlert | null => {
  const percent = item.top?.percent ?? null;
  const score = item.dealScore && item.dealScore.confidence !== 'low' ? item.dealScore.score : null;
  const price = item.top?.price ?? cheapest(item);
  const scoreLimit = favorite ? ALERT_RULES.favoriteScore : ALERT_RULES.score;
  const percentLimit = favorite ? ALERT_RULES.favoritePercent : ALERT_RULES.percent;
  const strongScore = score !== null && score >= scoreLimit;
  const deepDiscount = percent !== null && percent >= percentLimit;

  if (price === null || (!strongScore && !deepDiscount)) return null;

  const parts = [
    favorite ? 'из избранного' : null,
    percent !== null && percent > 0 ? `на ${formatPercent(percent)} ниже рынка` : null,
    score !== null ? `сигнал ${score}` : null,
  ].filter(Boolean);

  return {
    key: `${item.name}:${price}`,
    name: item.name,
    image: item.image,
    rarityColor: item.rarityColor,
    price,
    percent,
    score,
    favorite,
    reason: parts.join(' · '),
  };
};

export const stillWorth = (before: DealAlert, fresh: Item): DealAlert | null => {
  const next = alertFor(fresh, before.favorite);

  return next && next.price <= before.price ? next : null;
};

const SEEN_TTL_MS = 12 * 60 * 60_000;

export const pruneSeen = (seen: Record<string, number>, now: number): Record<string, number> =>
  Object.fromEntries(Object.entries(seen).filter(([, at]) => now - at < SEEN_TTL_MS));
