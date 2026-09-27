import { describe, expect, it } from 'vitest';

import type { Item, MarketQuote } from '@/lib/api/types';

import { alertFor, pruneSeen, stillWorth } from './deal-alerts';

const MIN_PRICE = 500;

const quote = (price: number): MarketQuote => ({ price, listings: 5, bid: null, bids: 0, url: '' });

const sales = (eightWeekSales: number) => ({
  floor: 0,
  lastDay: '2026-09-26',
  lastAverage: 0,
  weekSales: 10,
  eightWeekSales,
});

const item = (extra: Partial<Item> = {}): Item => ({
  name: 'AK-47 | Redline (Field-Tested)',
  image: null,
  rarityColor: null,
  category: 'rifle',
  rarity: null,
  whiteMarket: quote(2_000),
  dmarket: quote(2_100),
  csfloat: quote(1_950),
  gap: null,
  flip: null,
  instant: null,
  sales: sales(200),
  top: null,
  ...extra,
});

const top = (percent: number, price = 1_950, discount = 200) => ({
  price,
  reference: price + discount,
  discount,
  percent,
  bidCover: null,
});

describe('deal alerts', () => {
  it('stays quiet for ordinary prices', () => {
    expect(alertFor(item({ top: top(3) }), false, MIN_PRICE)).toBeNull();
  });

  it('fires on a deep discount worth real money', () => {
    expect(alertFor(item({ top: top(9) }), false, MIN_PRICE)?.reason).toBe(
      'на 9% ниже рынка, $2.00',
    );
  });

  it('skips cheap items where the percent means cents', () => {
    const penny = item({ top: top(29, 12, 5), sales: sales(500) });

    expect(alertFor(penny, false, MIN_PRICE)).toBeNull();
    expect(alertFor(item({ top: top(29, 700, 50) }), false, MIN_PRICE)).toBeNull();
  });

  it('skips items that rarely sell', () => {
    expect(alertFor(item({ top: top(9), sales: sales(5) }), false, MIN_PRICE)).toBeNull();
  });

  it('needs money on the table for a signal too', () => {
    expect(
      alertFor(item({ dealScore: { score: 80, confidence: 'high' } }), false, MIN_PRICE),
    ).toBeNull();
    expect(
      alertFor(
        item({ top: top(4), dealScore: { score: 72, confidence: 'high' } }),
        false,
        MIN_PRICE,
      )?.reason,
    ).toBe('на 4% ниже рынка, $2.00 · сигнал 72');
  });

  it('ignores a signal built on little data', () => {
    expect(
      alertFor(
        item({ top: top(4), dealScore: { score: 90, confidence: 'low' } }),
        false,
        MIN_PRICE,
      ),
    ).toBeNull();
  });

  it('uses softer limits for favourites and no price floor', () => {
    expect(alertFor(item({ top: top(6.5) }), false, MIN_PRICE)).toBeNull();
    expect(alertFor(item({ top: top(6.5, 300, 120), sales: null }), true, MIN_PRICE)?.reason).toBe(
      'из избранного · на 6,5% ниже рынка, $1.20',
    );
  });

  it('keeps an alert only if a fresh look agrees', () => {
    const before = alertFor(item({ top: top(9) }), false, MIN_PRICE)!;

    expect(stillWorth(before, item({ top: top(9) }), MIN_PRICE)).not.toBeNull();
    expect(stillWorth(before, item({ top: top(2) }), MIN_PRICE)).toBeNull();
    expect(stillWorth(before, item({ top: top(10, 2_050) }), MIN_PRICE)).toBeNull();
  });

  it('forgets alerts after half a day', () => {
    const now = Date.parse('2026-09-27T12:00:00Z');

    expect(pruneSeen({ a: now - 1000, b: now - 13 * 3600_000 }, now)).toEqual({ a: now - 1000 });
  });
});
