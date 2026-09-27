import type { Item, SellMarketId } from '@/lib/api/types';
import { SELL_MARKET_ORDER } from '@/lib/markets';

export interface ItemPrice {
  price: number;
  market: SellMarketId;
}

export interface SetTotals {
  cheapest: number;
  priced: number;
  missing: number;
  byMarket: Record<SellMarketId, number | null>;
}

export const cheapestOffer = (item: Item | undefined): ItemPrice | null => {
  if (!item) return null;

  return SELL_MARKET_ORDER.reduce<ItemPrice | null>((best, market) => {
    const quote = item[market];

    if (!quote || quote.listings <= 0 || quote.price === null) return best;

    return !best || quote.price < best.price ? { price: quote.price, market } : best;
  }, null);
};

export const setTotals = (names: string[], items: Map<string, Item> | undefined): SetTotals => {
  const offers = names.map((name) => cheapestOffer(items?.get(name)));
  const byMarket = Object.fromEntries(
    SELL_MARKET_ORDER.map((market) => {
      const prices = names.map((name) => {
        const quote = items?.get(name)?.[market];

        return quote && quote.listings > 0 && quote.price !== null ? quote.price : null;
      });

      return [
        market,
        names.length > 0 && prices.every((price) => price !== null)
          ? prices.reduce((sum, price) => sum! + price!, 0)
          : null,
      ];
    }),
  ) as Record<SellMarketId, number | null>;

  return {
    cheapest: offers.reduce((sum, offer) => sum + (offer?.price ?? 0), 0),
    priced: offers.filter(Boolean).length,
    missing: offers.filter((offer) => offer === null).length,
    byMarket,
  };
};
