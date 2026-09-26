import { describe, expect, it } from 'vitest';

import type { Item, MarketQuote } from '@/lib/api/types';

import {
  bestOption,
  breakEvenPrice,
  findPurchase,
  formatLockLeft,
  lockLeft,
  lowFloatRange,
  parseBackup,
  payoutFor,
  sellAdvice,
  sellOptions,
  unlockFrom,
  type Purchase,
} from './purchases';

const fees = { whiteMarket: 5, dmarket: 5, csfloat: 2 };
const withdrawals = { whiteMarket: 0, dmarket: 2, csfloat: 2.5 };

const quote = (price: number, extra: Partial<MarketQuote> = {}): MarketQuote => ({
  price,
  listings: 10,
  bid: null,
  bids: 0,
  url: '',
  ...extra,
});

const item = (extra: Partial<Item> = {}): Item => ({
  name: 'AK-47 | Redline (Field-Tested)',
  image: null,
  rarity: null,
  rarityColor: null,
  category: 'rifle',
  whiteMarket: quote(10_000),
  dmarket: quote(10_500, { bid: 9_000 }),
  csfloat: quote(9_800),
  gap: null,
  flip: null,
  instant: null,
  sales: null,
  top: null,
  ...extra,
});

const purchase = (extra: Partial<Purchase> = {}): Purchase => ({
  id: 'a',
  name: 'AK-47 | Redline (Field-Tested)',
  image: null,
  rarityColor: null,
  price: 9_000,
  amount: 1,
  market: 'csfloat',
  boughtAt: '2026-09-20T10:00:00.000Z',
  unlockAt: '2026-09-27T10:00:00.000Z',
  float: 0.2512,
  paintSeed: 661,
  note: '',
  stickers: [],
  assetId: null,
  sale: null,
  ...extra,
});

describe('payoutFor', () => {
  it('takes the sale fee and then the withdrawal fee', () => {
    expect(payoutFor(10_000, 'csfloat', fees, withdrawals)).toBe(9_555);
  });
});

describe('breakEvenPrice', () => {
  it('finds the lowest price that returns the cost', () => {
    const price = breakEvenPrice(9_000, 'dmarket', fees, withdrawals);

    expect(payoutFor(price, 'dmarket', fees, withdrawals)).toBeGreaterThanOrEqual(9_000);
    expect(payoutFor(price - 1, 'dmarket', fees, withdrawals)).toBeLessThan(9_000);
  });
});

describe('sellOptions', () => {
  it('lists a cent below each market and sells into the DMarket bid', () => {
    const options = sellOptions(item(), 9_000, fees, withdrawals);

    expect(options.map((option) => [option.market, option.kind, option.price])).toEqual([
      ['whiteMarket', 'listing', 9_999],
      ['dmarket', 'listing', 10_499],
      ['csfloat', 'listing', 9_799],
      ['dmarket', 'instant', 9_000],
    ]);
    expect(bestOption(options)?.market).toBe('dmarket');
    expect(options[3].profit).toBeLessThan(0);
  });
});

describe('trade lock', () => {
  it('counts down to the unlock time', () => {
    const now = Date.parse('2026-09-25T08:00:00.000Z');
    const left = lockLeft(purchase(), now);

    expect(formatLockLeft(left)).toBe('2 дн. 2 ч');
    expect(lockLeft(purchase(), Date.parse('2026-09-28T00:00:00.000Z'))).toBe(0);
  });

  it('adds whole days to the purchase time', () => {
    expect(unlockFrom('2026-09-20T10:00:00.000Z', 7)).toBe('2026-09-27T10:00:00.000Z');
  });
});

describe('sellAdvice', () => {
  const option = (profit: number) => ({
    market: 'whiteMarket' as const,
    kind: 'listing' as const,
    price: 10_000,
    payout: 9_000 + profit,
    profit,
    percent: 0,
  });
  const sales = (eightWeekAverage: number, trendPercent: number | null) => ({
    floor: 0,
    lastDay: '2026-09-25',
    lastAverage: 0,
    weekSales: 10,
    eightWeekAverage,
    trendPercent,
  });

  it('calls a profit above the average a good moment', () => {
    expect(sellAdvice(option(500), 11_000, sales(10_000, 0)).text).toContain('Хороший момент');
  });

  it('warns when the profit is melting', () => {
    expect(sellAdvice(option(500), 10_000, sales(10_000, -8)).tone).toBe('warning');
  });

  it('suggests waiting on a loss while the price grows', () => {
    expect(sellAdvice(option(-500), 10_000, sales(10_000, 6)).text).toContain('подождать');
  });

  it('reports a plain loss', () => {
    expect(sellAdvice(option(-500), 10_000, sales(10_000, 0)).tone).toBe('loss');
  });
});

describe('findPurchase', () => {
  it('matches by asset id first and by name with float otherwise', () => {
    const byAsset = purchase({ id: 'b', assetId: '42', float: null });
    const list = [purchase(), byAsset];

    expect(findPurchase(list, { name: 'x', assetIds: ['42'], float: null })?.id).toBe('b');
    expect(
      findPurchase(list, { name: 'AK-47 | Redline (Field-Tested)', assetIds: [], float: 0.2512 })
        ?.id,
    ).toBe('a');
    expect(findPurchase(list, { name: 'x', assetIds: [], float: 0.2512 })).toBeNull();
  });

  it('skips sold purchases', () => {
    const sold = purchase({ sale: { market: 'csfloat', received: 1, soldAt: '' } });

    expect(findPurchase([sold], { name: sold.name, assetIds: [], float: sold.float })).toBeNull();
  });
});

describe('lowFloatRange', () => {
  it('flags floats in the lower part of their wear', () => {
    expect(lowFloatRange('AK-47 | Nouveau Rouge (Minimal Wear)', 0.085673)).toEqual([
      0.07, 0.085673,
    ]);
    expect(lowFloatRange('AK-47 | Nouveau Rouge (Minimal Wear)', 0.14)).toBeNull();
    expect(lowFloatRange('Sticker | Natus Vincere (Holo) | Cologne 2014', 0.01)).toBeNull();
  });
});

describe('parseBackup', () => {
  it('reads an exported file and fills missing fields', () => {
    const [entry] = parseBackup(
      JSON.stringify({
        purchases: [{ id: 'a', name: 'n', price: 1, boughtAt: 'x', unlockAt: 'y' }],
      }),
    )!;

    expect(entry.amount).toBe(1);
    expect(entry.sale).toBeNull();
    expect(entry.stickers).toEqual([]);
    expect(entry).not.toHaveProperty('id');
  });

  it('rejects anything else', () => {
    expect(parseBackup('{"purchases":[{"name":1}]}')).toBeNull();
    expect(parseBackup('nope')).toBeNull();
  });
});
