import { describe, expect, it } from 'vitest';

import type { Item, MarketQuote } from '@/lib/api/types';

import { cheapestOffer, setTotals } from './set-totals';

const quote = (price: number, listings = 3): MarketQuote => ({
  price,
  listings,
  bid: null,
  bids: 0,
  url: '',
});

const item = (
  name: string,
  prices: Partial<Record<'whiteMarket' | 'dmarket' | 'csfloat', number>>,
): Item => ({
  name,
  image: null,
  rarity: null,
  rarityColor: null,
  category: 'knife',
  whiteMarket: prices.whiteMarket ? quote(prices.whiteMarket) : null,
  dmarket: prices.dmarket ? quote(prices.dmarket) : null,
  csfloat: prices.csfloat ? quote(prices.csfloat) : null,
  gap: null,
  flip: null,
  instant: null,
  sales: null,
  top: null,
});

const items = new Map([
  ['Knife', item('Knife', { whiteMarket: 50_000, dmarket: 48_000, csfloat: 49_000 })],
  ['Gloves', item('Gloves', { whiteMarket: 30_000, csfloat: 29_000 })],
]);

describe('set totals', () => {
  it('finds the cheapest market for an item', () => {
    expect(cheapestOffer(items.get('Knife'))).toEqual({ price: 48_000, market: 'dmarket' });
    expect(cheapestOffer(undefined)).toBeNull();
  });

  it('adds the cheapest prices and prices the whole set per market', () => {
    const totals = setTotals(['Knife', 'Gloves'], items);

    expect(totals.cheapest).toBe(77_000);
    expect(totals.byMarket).toEqual({ whiteMarket: 80_000, dmarket: null, csfloat: 78_000 });
    expect(totals.missing).toBe(0);
  });

  it('counts items with no price', () => {
    const totals = setTotals(['Knife', 'Gone'], items);

    expect(totals.priced).toBe(1);
    expect(totals.missing).toBe(1);
    expect(totals.byMarket.csfloat).toBeNull();
  });
});
