import { describe, expect, it } from 'vitest';

import type { Snipe } from '@/lib/api/types';

import { snipeReason } from './snipe-card';

const snipe = (extra: Partial<Snipe>): Snipe => ({
  name: 'AK-47 | Redline (Field-Tested)',
  image: null,
  rarityColor: null,
  category: 'rifle',
  source: 'dmarket',
  listingPrice: 2700,
  float: 0.16,
  paintSeed: 661,
  blue: null,
  phase: null,
  orderPrice: 5400,
  orderAmount: 4,
  orderFloatPart: null,
  orderFloatRange: null,
  orderPaintSeed: null,
  orderPhase: null,
  profit: 2430,
  percent: 90,
  checkedAt: '2026-09-25T10:00:00Z',
  listingUrl: '',
  ...extra,
});

describe('snipeReason', () => {
  it('names every condition the order pays for', () => {
    expect(snipeReason(snipe({ orderFloatPart: 'FT-0', orderFloatRange: [0.15, 0.18] }))).toBe(
      'Платят за флоат 0.15-0.18',
    );
    expect(snipeReason(snipe({ orderPaintSeed: 661, orderPhase: 'ruby' }))).toBe(
      'Платят за паттерн 661, фазу Ruby',
    );
  });

  it('says so when the order takes any float', () => {
    expect(snipeReason(snipe({}))).toBe('Заявка на любой флоат');
  });
});
