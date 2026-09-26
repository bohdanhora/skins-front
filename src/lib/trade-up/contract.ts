import type { TradeUpSkin, TradeUpTier } from '@/lib/api/types';
import { WEAR_RANGES } from '@/lib/format/float';
import type { Wear } from '@/lib/format/item-name';

export const TIER_ORDER: TradeUpTier[] = [
  'consumer',
  'industrial',
  'milspec',
  'restricted',
  'classified',
  'covert',
  'rare',
];

export const TIER_LABELS: Record<TradeUpTier, string> = {
  consumer: 'Ширпотреб',
  industrial: 'Промышленное',
  milspec: 'Армейское',
  restricted: 'Запрещённое',
  classified: 'Засекреченное',
  covert: 'Тайное',
  rare: 'Нож / перчатки',
};

export const WEARS: Wear[] = ['FN', 'MW', 'FT', 'WW', 'BS'];

const ANY_WEAR = 'ANY';

export const nextTier = (tier: TradeUpTier): TradeUpTier | null =>
  TIER_ORDER[TIER_ORDER.indexOf(tier) + 1] ?? null;

export const contractSize = (tier: TradeUpTier): number => (tier === 'covert' ? 5 : 10);

export interface TradeUpIndex {
  skins: TradeUpSkin[];
  byName: Map<string, TradeUpSkin>;
  byCollection: Map<string, TradeUpSkin[]>;
  rareByCase: Map<string, TradeUpSkin[]>;
}

const collectionKey = (collection: string, tier: TradeUpTier) => `${collection}|${tier}`;

export const buildIndex = (skins: TradeUpSkin[]): TradeUpIndex => {
  const byCollection = new Map<string, TradeUpSkin[]>();
  const rareByCase = new Map<string, TradeUpSkin[]>();

  for (const skin of skins) {
    for (const collection of skin.collections) {
      const key = collectionKey(collection, skin.tier);

      byCollection.set(key, [...(byCollection.get(key) ?? []), skin]);
    }

    if (skin.tier === 'rare') {
      for (const crate of skin.cases) {
        rareByCase.set(crate, [...(rareByCase.get(crate) ?? []), skin]);
      }
    }
  }

  return {
    skins,
    byName: new Map(skins.map((skin) => [skin.name, skin])),
    byCollection,
    rareByCase,
  };
};

export const outcomePools = (
  index: TradeUpIndex,
  skin: TradeUpSkin,
  statTrak: boolean,
): TradeUpSkin[][] => {
  const target = nextTier(skin.tier);

  if (!target) return [];

  const groups =
    skin.tier === 'covert'
      ? skin.cases.map((crate) => index.rareByCase.get(crate) ?? [])
      : skin.collections.map(
          (collection) => index.byCollection.get(collectionKey(collection, target)) ?? [],
        );

  return groups
    .map((pool) => (statTrak ? pool.filter((entry) => entry.stattrak) : pool))
    .filter((pool) => pool.length > 0);
};

export const canTradeUp = (index: TradeUpIndex, skin: TradeUpSkin, statTrak: boolean): boolean =>
  skin.tier !== 'rare' &&
  (!statTrak || skin.stattrak) &&
  outcomePools(index, skin, statTrak).length > 0;

export const wearOf = (float: number): Wear =>
  WEARS.find((wear) => float < WEAR_RANGES[wear][1]) ?? 'BS';

export const skinWears = (skin: TradeUpSkin): Wear[] =>
  skin.wearless
    ? []
    : WEARS.filter(
        (wear) => WEAR_RANGES[wear][0] < skin.maxFloat && WEAR_RANGES[wear][1] > skin.minFloat,
      );

export const priceKey = (wear: Wear | null, statTrak: boolean): string =>
  `${statTrak ? 'ST:' : ''}${wear ?? ANY_WEAR}`;

export const quoteOf = (
  skin: TradeUpSkin,
  wear: Wear | null,
  statTrak: boolean,
): { price: number; listings: number } | null => {
  const quote = skin.prices[priceKey(skin.wearless ? null : wear, statTrak)];

  return quote ? { price: quote[0], listings: quote[1] } : null;
};

export const saleQuoteOf = (
  skin: TradeUpSkin,
  wear: Wear | null,
  statTrak: boolean,
): { price: number; listings: number } | null => {
  const quote = quoteOf(skin, wear, statTrak);

  if (!quote || !wear) return quote;

  const better = WEARS.slice(0, WEARS.indexOf(wear)).flatMap((entry) => {
    const value = quoteOf(skin, entry, statTrak);

    return value ? [value.price] : [];
  });

  return { ...quote, price: Math.min(quote.price, ...better) };
};

export const clampFloat = (skin: TradeUpSkin, float: number): number =>
  Math.min(skin.maxFloat, Math.max(skin.minFloat, float));

export const worstFloatInWear = (skin: TradeUpSkin, wear: Wear): number =>
  clampFloat(skin, WEAR_RANGES[wear][1] - 0.0001);

export const normalizedFloat = (skin: TradeUpSkin, float: number): number =>
  skin.maxFloat > skin.minFloat
    ? (clampFloat(skin, float) - skin.minFloat) / (skin.maxFloat - skin.minFloat)
    : 0;

export const outputFloat = (skin: TradeUpSkin, averageNormalized: number): number =>
  skin.minFloat + averageNormalized * (skin.maxFloat - skin.minFloat);

export interface ContractInput {
  skin: TradeUpSkin;
  float: number;
  price: number | null;
}

export interface ContractOutcome {
  skin: TradeUpSkin;
  probability: number;
  float: number;
  wear: Wear | null;
  price: number | null;
  listings: number;
  net: number | null;
}

export type ContractProblem =
  'empty' | 'size' | 'mixedTier' | 'noTradeUp' | 'noStatTrak' | 'missingPrice';

export interface ContractResult {
  size: number;
  tier: TradeUpTier | null;
  problems: ContractProblem[];
  outcomes: ContractOutcome[];
  cost: number;
  expected: number;
  profit: number;
  profitChance: number;
  averageNormalized: number;
}

export const evaluateContract = (
  index: TradeUpIndex,
  inputs: ContractInput[],
  statTrak: boolean,
  sellFeePercent: number,
): ContractResult => {
  const tier = inputs[0]?.skin.tier ?? null;
  const size = tier ? contractSize(tier) : 10;
  const problems: ContractProblem[] = [];

  if (inputs.length === 0) problems.push('empty');
  else if (inputs.length !== size) problems.push('size');
  if (inputs.some((input) => input.skin.tier !== tier)) problems.push('mixedTier');
  if (statTrak && inputs.some((input) => !input.skin.stattrak)) problems.push('noStatTrak');
  if (inputs.some((input) => !canTradeUp(index, input.skin, statTrak))) problems.push('noTradeUp');
  if (inputs.some((input) => input.price === null)) problems.push('missingPrice');

  const averageNormalized =
    inputs.length > 0
      ? inputs.reduce((sum, input) => sum + normalizedFloat(input.skin, input.float), 0) /
        inputs.length
      : 0;
  const weights = new Map<string, number>();

  for (const input of inputs) {
    const pools = outcomePools(index, input.skin, statTrak);

    for (const pool of pools) {
      for (const outcome of pool) {
        weights.set(
          outcome.name,
          (weights.get(outcome.name) ?? 0) + 1 / inputs.length / pools.length / pool.length,
        );
      }
    }
  }

  const keep = 1 - sellFeePercent / 100;
  const cost = inputs.reduce((sum, input) => sum + (input.price ?? 0), 0);
  const outcomes: ContractOutcome[] = [...weights.entries()]
    .map(([name, probability]) => {
      const skin = index.byName.get(name)!;
      const float = outputFloat(skin, averageNormalized);
      const wear = skin.wearless ? null : wearOf(float);
      const quote = saleQuoteOf(skin, wear, statTrak);

      return {
        skin,
        probability,
        float,
        wear,
        price: quote?.price ?? null,
        listings: quote?.listings ?? 0,
        net: quote ? Math.round(quote.price * keep) : null,
      };
    })
    .sort((left, right) => (right.net ?? -1) - (left.net ?? -1));
  const expected = outcomes.reduce(
    (sum, outcome) => sum + outcome.probability * (outcome.net ?? 0),
    0,
  );

  return {
    size,
    tier,
    problems,
    outcomes,
    cost,
    expected: Math.round(expected),
    profit: Math.round(expected - cost),
    profitChance: outcomes
      .filter((outcome) => outcome.net !== null && outcome.net > cost)
      .reduce((sum, outcome) => sum + outcome.probability, 0),
    averageNormalized,
  };
};

export const maxInputFloatFor = (
  input: TradeUpSkin,
  output: TradeUpSkin,
  outputMaxFloat: number,
): number | null => {
  if (output.maxFloat <= output.minFloat) return input.maxFloat;

  const share = (outputMaxFloat - output.minFloat) / (output.maxFloat - output.minFloat);

  if (share <= 0) return null;

  return Math.min(
    input.maxFloat,
    input.minFloat + Math.min(1, share) * (input.maxFloat - input.minFloat),
  );
};
