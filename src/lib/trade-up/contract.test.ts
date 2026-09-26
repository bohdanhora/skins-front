import { describe, expect, it } from 'vitest';

import type { TradeUpSkin } from '@/lib/api/types';

import {
  buildIndex,
  evaluateContract,
  maxInputFloatFor,
  saleQuoteOf,
  type ContractInput,
} from './contract';
import { findDeals, targetPlans } from './plans';

const skin = (extra: Partial<TradeUpSkin> & Pick<TradeUpSkin, 'name' | 'tier'>): TradeUpSkin => ({
  weapon: extra.name.split(' | ')[0],
  collections: [],
  cases: [],
  minFloat: 0,
  maxFloat: 1,
  wearless: false,
  stattrak: true,
  image: null,
  prices: {},
  ...extra,
});

const alphaInput = skin({
  name: 'P250 | Alpha',
  tier: 'restricted',
  collections: ['Alpha'],
  minFloat: 0,
  maxFloat: 0.5,
  prices: { FN: [100, 50], FT: [40, 50] },
});
const betaInput = skin({
  name: 'MP9 | Beta',
  tier: 'restricted',
  collections: ['Beta'],
  minFloat: 0.1,
  maxFloat: 0.9,
  prices: { FT: [20, 50], WW: [15, 50] },
});
const alphaWin = skin({
  name: 'AK-47 | Alpha Win',
  tier: 'classified',
  collections: ['Alpha'],
  minFloat: 0,
  maxFloat: 0.8,
  prices: { FN: [5000, 10], FT: [2000, 10], MW: [3000, 10] },
});
const alphaLoss = skin({
  name: 'M4A1-S | Alpha Loss',
  tier: 'classified',
  collections: ['Alpha'],
  stattrak: false,
  prices: { FN: [300, 10], FT: [200, 10], MW: [250, 10] },
});
const betaOut = skin({
  name: 'AWP | Beta Out',
  tier: 'classified',
  collections: ['Beta'],
  prices: { FT: [100, 10], MW: [150, 10] },
});
const covert = skin({
  name: 'AK-47 | Covert',
  tier: 'covert',
  collections: ['Alpha'],
  cases: ['Alpha Case'],
  prices: { FT: [1000, 10] },
});
const knife = skin({
  name: '★ Karambit | Fade',
  tier: 'rare',
  cases: ['Alpha Case'],
  minFloat: 0,
  maxFloat: 0.08,
  prices: { FN: [90000, 5] },
});
const gloves = skin({
  name: '★ Sport Gloves | Vice',
  tier: 'rare',
  cases: ['Alpha Case'],
  stattrak: false,
  minFloat: 0.06,
  maxFloat: 0.8,
  prices: { FT: [70000, 5] },
});

const index = buildIndex([
  alphaInput,
  betaInput,
  alphaWin,
  alphaLoss,
  betaOut,
  covert,
  knife,
  gloves,
]);

const input = (value: TradeUpSkin, float: number, price: number): ContractInput => ({
  skin: value,
  float,
  price,
});

describe('trade-up contract', () => {
  it('splits the chance by collection share and outcomes in that collection', () => {
    const inputs = [
      ...Array.from({ length: 7 }, () => input(alphaInput, 0.25, 40)),
      ...Array.from({ length: 3 }, () => input(betaInput, 0.5, 20)),
    ];
    const result = evaluateContract(index, inputs, false, 0);
    const chance = Object.fromEntries(
      result.outcomes.map((outcome) => [outcome.skin.name, outcome.probability]),
    );

    expect(result.problems).toEqual([]);
    expect(chance['AK-47 | Alpha Win']).toBeCloseTo(0.35);
    expect(chance['M4A1-S | Alpha Loss']).toBeCloseTo(0.35);
    expect(chance['AWP | Beta Out']).toBeCloseTo(0.3);
    expect(result.cost).toBe(340);
  });

  it('maps the average normalized float into the output range', () => {
    const inputs = [
      ...Array.from({ length: 5 }, () => input(alphaInput, 0.25, 40)),
      ...Array.from({ length: 5 }, () => input(betaInput, 0.5, 20)),
    ];
    const result = evaluateContract(index, inputs, false, 0);
    const win = result.outcomes.find((outcome) => outcome.skin.name === 'AK-47 | Alpha Win')!;

    expect(result.averageNormalized).toBeCloseTo(0.5);
    expect(win.float).toBeCloseTo(0.4);
    expect(win.wear).toBe('WW');
    expect(win.price).toBeNull();
  });

  it('counts the sell fee and the chance to beat the cost', () => {
    const inputs = Array.from({ length: 10 }, () => input(alphaInput, 0.01, 100));
    const result = evaluateContract(index, inputs, false, 10);

    expect(result.outcomes[0]).toMatchObject({ wear: 'FN', price: 5000, net: 4500 });
    expect(result.expected).toBe(Math.round(0.5 * 4500 + 0.5 * 270));
    expect(result.profitChance).toBeCloseTo(0.5);
  });

  it('takes five Coverts into the case knives and gloves', () => {
    const inputs = Array.from({ length: 5 }, () => input(covert, 0.2, 1000));
    const normal = evaluateContract(index, inputs, false, 0);
    const statTrak = evaluateContract(index, inputs, true, 0);

    expect(normal.size).toBe(5);
    expect(normal.outcomes.map((outcome) => outcome.skin.name).sort()).toEqual([
      '★ Karambit | Fade',
      '★ Sport Gloves | Vice',
    ]);
    expect(statTrak.outcomes.map((outcome) => outcome.skin.name)).toEqual(['★ Karambit | Fade']);
  });

  it('flags broken contracts', () => {
    expect(evaluateContract(index, [input(alphaInput, 0.1, 1)], false, 0).problems).toContain(
      'size',
    );
    expect(
      evaluateContract(
        index,
        [...Array.from({ length: 9 }, () => input(alphaInput, 0.1, 1)), input(covert, 0.1, 1)],
        false,
        0,
      ).problems,
    ).toContain('mixedTier');
  });

  it('never values a worse wear above a better one', () => {
    const odd = skin({
      name: 'SG 553 | Odd',
      tier: 'classified',
      prices: { FN: [189, 70], FT: [137, 9], BS: [150000, 2] },
    });

    expect(saleQuoteOf(odd, 'BS', false)).toEqual({ price: 137, listings: 2 });
    expect(saleQuoteOf(odd, 'FN', false)?.price).toBe(189);
  });

  it('finds the float cap that keeps the output in a wear', () => {
    expect(maxInputFloatFor(betaInput, alphaWin, 0.07)).toBeCloseTo(0.1 + (0.07 / 0.8) * 0.8);
    expect(maxInputFloatFor(betaInput, gloves, 0.05)).toBeNull();
  });
});

describe('trade-up plans', () => {
  it('builds plans for a wanted skin with fillers', () => {
    const plans = targetPlans(index, alphaWin, 'FN', false, 0);
    const full = plans.plans.find((plan) => plan.leadCount === 10)!;

    expect(plans.impossible).toBe(false);
    expect(full.lead.skin.name).toBe('P250 | Alpha');
    expect(full.lead.wear).toBe('FN');
    expect(full.chance).toBeCloseTo(0.5);
    expect(plans.plans.some((plan) => plan.filler?.skin.name === 'MP9 | Beta')).toBe(true);
  });

  it('ranks contracts by return', () => {
    const deals = findDeals(index, {
      tier: 'restricted',
      statTrak: false,
      sellFeePercent: 0,
      minListings: 1,
    });

    expect(deals.length).toBeGreaterThan(0);
    expect(deals[0].roi).toBeGreaterThanOrEqual(deals[deals.length - 1].roi);
  });
});
