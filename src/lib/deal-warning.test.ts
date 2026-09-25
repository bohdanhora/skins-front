import { describe, expect, it } from 'vitest';

import type { Item, MarketQuote } from '@/lib/api/types';

import { dealWarning } from './deal-warning';

const quote = (price: number, extra: Partial<MarketQuote> = {}): MarketQuote => ({
  price,
  listings: 20,
  bid: null,
  bids: 0,
  url: '',
  ...extra,
});

const item = (whiteMarket: MarketQuote, dmarket: MarketQuote): Item => ({
  name: 'Nova | Smart Gun (Minimal Wear)',
  image: null,
  rarity: null,
  rarityColor: null,
  category: 'heavy',
  whiteMarket,
  dmarket,
  gap: {
    cheaper: whiteMarket.price! < dmarket.price! ? 'whiteMarket' : 'dmarket',
    amount: Math.abs(whiteMarket.price! - dmarket.price!),
    percent: 10,
  },
  flip: null,
  instant: null,
  sales: null,
  top: null,
});

describe('dealWarning', () => {
  it('flags listings far above what DMarket buyers pay', () => {
    const warning = dealWarning(item(quote(464), quote(2607, { bid: 446, bids: 30 })), 'flip');

    expect(warning?.short).toBe('цена под вопросом');
    expect(warning?.long).toContain('$4.46');
  });

  it('flags a comparison with only a couple of listings', () => {
    expect(dealWarning(item(quote(100), quote(120, { listings: 2 })), 'gap')?.short).toBe(
      'мало лотов',
    );
  });

  it('stays quiet for a healthy market', () => {
    expect(dealWarning(item(quote(100), quote(120, { bid: 110, bids: 40 })), 'gap')).toBeNull();
  });

  it('checks buy orders for instant sales', () => {
    expect(dealWarning(item(quote(100), quote(120, { bid: 110, bids: 1 })), 'instant')?.short).toBe(
      'мало заявок',
    );
  });

  it('warns about rarely sold items and suspicious discounts in top offers', () => {
    const base = item(quote(100), quote(120));
    const sales = { floor: 200, lastDay: '2026-09-25', lastAverage: 200, weekSales: 2 };
    const top = { price: 100, reference: 200, discount: 100, percent: 50, bidCover: 90 };

    expect(dealWarning({ ...base, sales, top }, 'top')?.short).toBe('редко продаётся');
    expect(dealWarning({ ...base, sales: { ...sales, weekSales: 40 }, top }, 'top')?.short).toBe(
      'проверь лот',
    );
    expect(
      dealWarning(
        { ...base, sales: { ...sales, weekSales: 40 }, top: { ...top, percent: 12 } },
        'top',
      ),
    ).toBeNull();
  });
});
