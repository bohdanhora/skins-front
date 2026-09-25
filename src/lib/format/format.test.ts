import { describe, expect, it } from 'vitest';

import { parseItemName } from './item-name';
import { formatPercent, formatSignedUsd, formatUsd } from './money';
import { plural, timeAgo } from './time';

describe('money', () => {
  it('formats cents as dollars', () => {
    expect(formatUsd(123456)).toBe('$1,234.56');
    expect(formatUsd(null)).toBe('-');
    expect(formatSignedUsd(120)).toBe('+$1.20');
    expect(formatSignedUsd(-40)).toBe('-$0.40');
  });

  it('keeps one decimal only for small percents', () => {
    expect(formatPercent(5.94)).toBe('5,9%');
    expect(formatPercent(83.82)).toBe('84%');
    expect(formatPercent(2, true)).toBe('+2%');
  });
});

describe('parseItemName', () => {
  it('splits a StatTrak skin', () => {
    expect(parseItemName('StatTrak™ AK-47 | Redline (Field-Tested)')).toEqual({
      base: 'AK-47',
      detail: 'Redline',
      wear: 'FT',
      statTrak: true,
      souvenir: false,
    });
  });

  it('handles knives, stickers and plain items', () => {
    expect(parseItemName('★ StatTrak™ Karambit | Doppler (Factory New)')).toMatchObject({
      base: 'Karambit',
      detail: 'Doppler',
      wear: 'FN',
      statTrak: true,
    });
    expect(parseItemName('Sticker | Natus Vincere | Katowice 2019')).toMatchObject({
      base: 'Sticker',
      detail: 'Natus Vincere | Katowice 2019',
      wear: null,
    });
    expect(parseItemName('Souvenir P90 | Scorched (Minimal Wear)')).toMatchObject({
      base: 'P90',
      souvenir: true,
    });
    expect(parseItemName('Revolution Case')).toMatchObject({ base: 'Revolution Case', detail: '' });
  });
});

describe('time', () => {
  it('picks the Russian plural form', () => {
    expect(plural(1, ['минута', 'минуты', 'минут'])).toBe('минута');
    expect(plural(3, ['минута', 'минуты', 'минут'])).toBe('минуты');
    expect(plural(11, ['минута', 'минуты', 'минут'])).toBe('минут');
    expect(plural(21, ['минута', 'минуты', 'минут'])).toBe('минута');
  });

  it('describes how long ago prices were refreshed', () => {
    const now = Date.parse('2026-09-25T12:00:00Z');

    expect(timeAgo('2026-09-25T11:59:30Z', now)).toBe('только что');
    expect(timeAgo('2026-09-25T11:55:00Z', now)).toBe('5 минут назад');
    expect(timeAgo('2026-09-25T09:00:00Z', now)).toBe('3 часа назад');
    expect(timeAgo(null, now)).toBe('ещё не обновлялось');
  });
});
