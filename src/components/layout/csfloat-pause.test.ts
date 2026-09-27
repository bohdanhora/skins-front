import { describe, expect, it } from 'vitest';

import { countdown } from './csfloat-pause';

describe('countdown', () => {
  it('counts minutes and seconds, then hours', () => {
    expect(countdown(65_000)).toBe('1:05');
    expect(countdown(3_725_000)).toBe('1:02:05');
    expect(countdown(-5)).toBe('0:00');
  });
});
