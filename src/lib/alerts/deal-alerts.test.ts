import { describe, expect, it } from 'vitest';

import type { Item, MarketQuote } from '@/lib/api/types';

import { alertFor, pruneSeen, stillWorth } from './deal-alerts';

const quote = (price: number): MarketQuote => ({ price, listings: 5, bid: null, bids: 0, url: '' });

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
  sales: null,
  top: null,
  ...extra,
});

const top = (percent: number, price = 1_950) => ({
  price,
  reference: 2_150,
  discount: 200,
  percent,
  bidCover: null,
});

describe('deal alerts', () => {
  it('stays quiet for ordinary prices', () => {
    expect(alertFor(item({ top: top(3) }), false)).toBeNull();
  });

  it('fires on a deep discount or a strong signal', () => {
    expect(alertFor(item({ top: top(9) }), false)?.reason).toBe('на 9% ниже рынка');
    expect(alertFor(item({ dealScore: { score: 72, confidence: 'high' } }), false)?.reason).toBe(
      'сигнал 72',
    );
  });

  it('ignores a signal built on little data', () => {
    expect(alertFor(item({ dealScore: { score: 90, confidence: 'low' } }), false)).toBeNull();
  });

  it('uses softer limits for favourites', () => {
    expect(alertFor(item({ top: top(6.5) }), false)).toBeNull();
    expect(alertFor(item({ top: top(6.5) }), true)?.reason).toBe(
      'из избранного · на 6,5% ниже рынка',
    );
  });

  it('keeps an alert only if a fresh look agrees', () => {
    const before = alertFor(item({ top: top(9) }), false)!;

    expect(stillWorth(before, item({ top: top(9) }))).not.toBeNull();
    expect(stillWorth(before, item({ top: top(2) }))).toBeNull();
    expect(stillWorth(before, item({ top: top(10, 2_050) }))).toBeNull();
  });

  it('forgets alerts after half a day', () => {
    const now = Date.parse('2026-09-27T12:00:00Z');

    expect(pruneSeen({ a: now - 1000, b: now - 13 * 3600_000 }, now)).toEqual({ a: now - 1000 });
  });
});
