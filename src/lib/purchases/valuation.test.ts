import { describe, expect, it } from 'vitest';

import type { Item, MarketQuote } from '@/lib/api/types';

import {
  bluePremium,
  floatPremium,
  priceOptions,
  stickerShare,
  stickerValues,
  sumRanges,
  withPremium,
} from './valuation';

const fees = { whiteMarket: 5, dmarket: 5, csfloat: 2 };
const withdrawals = { whiteMarket: 0, dmarket: 0, csfloat: 0 };

const quote = (price: number, extra: Partial<MarketQuote> = {}): MarketQuote => ({
  price,
  listings: 10,
  bid: null,
  bids: 0,
  url: '',
  ...extra,
});

const item: Item = {
  name: 'AK-47 | Nouveau Rouge (Minimal Wear)',
  image: null,
  rarity: null,
  rarityColor: null,
  category: 'rifle',
  whiteMarket: quote(2_000),
  dmarket: quote(2_100, { bid: 1_900 }),
  csfloat: quote(1_990),
  gap: null,
  flip: null,
  instant: null,
  sales: null,
  top: null,
};

describe('stickers', () => {
  it('adds nothing for cheap stickers and more for rare ones', () => {
    expect(stickerShare('Sticker | Team EnVyUs | Cluj-Napoca 2015', 50)).toBe(0);
    expect(stickerShare('Sticker | mousesports | Cluj-Napoca 2015', 7_31)).toBeCloseTo(0.05);
    expect(stickerShare('Sticker | Natus Vincere (Holo) | Cologne 2014', 71_40)).toBeCloseTo(
      0.08 * 1.3 * 1.5,
    );
  });

  it('pays extra for a craft of the same sticker', () => {
    const single = stickerShare('Sticker | a (Holo) | X 2020', 10_00, 1);

    expect(stickerShare('Sticker | a (Holo) | X 2020', 10_00, 4)).toBeCloseTo(single * 1.5);
  });

  it('prices every sticker with a range', () => {
    const [navi] = stickerValues([
      { name: 'Sticker | Natus Vincere (Holo) | Cologne 2014', price: 71_40 },
    ]);

    expect(navi.mid).toBe(Math.round(71_40 * 0.08 * 1.3 * 1.5));
    expect(navi.low).toBeLessThan(navi.mid);
    expect(navi.high).toBeGreaterThan(navi.mid);
  });
});

describe('premiums', () => {
  it('prices a low float just under better listings', () => {
    expect(floatPremium(24_00, 19_82)).toEqual({ low: 209, mid: 417, high: 417 });
    expect(floatPremium(14_06, 14_28)).toEqual({ low: 0, mid: 0, high: 0 });
    expect(floatPremium(null, 14_28)).toBeNull();
  });

  it('takes the blue premium from similar sales', () => {
    expect(bluePremium(170_77, [1.08, 1.17, 1.23, 1.37])).toEqual({
      low: Math.round(170_77 * 0.17),
      mid: Math.round(170_77 * 0.23),
      high: Math.round(170_77 * 0.37),
    });
  });

  it('adds premiums together', () => {
    expect(sumRanges([{ low: 1, mid: 2, high: 3 }, null, { low: 1, mid: 1, high: 1 }])).toEqual({
      low: 2,
      mid: 3,
      high: 4,
    });
  });

  it('raises every listing by the premium', () => {
    expect(withPremium(item, 500).csfloat?.price).toBe(2_490);
    expect(withPremium(item, 0)).toBe(item);
  });
});

describe('priceOptions', () => {
  it('offers a quick sale, a recommended price and a ceiling', () => {
    const options = priceOptions(
      item,
      { low: 200, mid: 400, high: 600 },
      2_323,
      2_271,
      fees,
      withdrawals,
    );

    expect(options.map((option) => [option.kind, option.market, option.price])).toEqual([
      ['quick', 'dmarket', 2_323],
      ['recommended', 'dmarket', 2_499],
      ['max', 'dmarket', 2_699],
    ]);
    expect(options[1].profit).toBe(Math.floor(2_499 * 0.95) - 2_271);
  });

  it('drops the ceiling when there is no premium', () => {
    const options = priceOptions(item, { low: 0, mid: 0, high: 0 }, null, 2_000, fees, withdrawals);

    expect(options.map((option) => option.kind)).toEqual(['recommended']);
  });
});
