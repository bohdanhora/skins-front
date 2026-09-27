import { describe, expect, it } from 'vitest';

import { typicalPrices } from './float-value';

const point = (float: number, price: number) => ({ float, price });

describe('typical price for a float', () => {
  it('flags a low float sold at the price of worse floats', () => {
    const cheap = point(0.03, 1400);
    const points = [
      point(0.001, 2200),
      point(0.005, 2100),
      point(0.01, 2000),
      point(0.02, 1900),
      point(0.025, 1850),
      cheap,
      point(0.035, 1800),
      point(0.04, 1700),
      point(0.05, 1500),
      point(0.06, 1400),
      point(0.065, 1350),
    ];
    const typical = typicalPrices(points);

    expect(typical.get(cheap)).toBeGreaterThan(1600);
    expect(typical.get(points[10]!)).toBeLessThanOrEqual(1500);
  });

  it('never prices a worse float above a better one', () => {
    const points = [0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09].map((float, index) =>
      point(float, [900, 1200, 800, 1100, 700, 1000, 600, 650, 500][index]!),
    );
    const typical = points.map((entry) => typicalPrices(points).get(entry)!);

    typical.slice(1).forEach((price, index) => expect(price).toBeLessThanOrEqual(typical[index]!));
  });

  it('skips thin markets', () => {
    expect(typicalPrices([point(0.01, 100), point(0.02, 90)]).size).toBe(0);
  });
});
