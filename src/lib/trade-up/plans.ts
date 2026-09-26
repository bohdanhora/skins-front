import type { TradeUpSkin, TradeUpTier } from '@/lib/api/types';
import { WEAR_RANGES } from '@/lib/format/float';
import type { Wear } from '@/lib/format/item-name';

import {
  TIER_ORDER,
  canTradeUp,
  clampFloat,
  contractSize,
  evaluateContract,
  maxInputFloatFor,
  outcomePools,
  quoteOf,
  skinWears,
  worstFloatInWear,
  type ContractInput,
  type ContractResult,
  type TradeUpIndex,
} from './contract';

const EDGE = 0.0001;

export interface PricedInput extends ContractInput {
  wear: Wear | null;
  listings: number;
  floatCap: number | null;
}

export const pricedInput = (
  skin: TradeUpSkin,
  wear: Wear | null,
  statTrak: boolean,
  float?: number,
): PricedInput | null => {
  const quote = quoteOf(skin, wear, statTrak);

  if (!quote) return null;

  return {
    skin,
    wear,
    float: float ?? (wear ? worstFloatInWear(skin, wear) : skin.maxFloat),
    price: quote.price,
    listings: quote.listings,
    floatCap: null,
  };
};

export const cheapestInput = (
  skin: TradeUpSkin,
  statTrak: boolean,
  floatCap: number | null = null,
): PricedInput | null => {
  const options = skinWears(skin).flatMap((wear) => {
    if (floatCap !== null && WEAR_RANGES[wear][0] >= floatCap) return [];

    const quote = quoteOf(skin, wear, statTrak);

    if (!quote) return [];

    const worst = worstFloatInWear(skin, wear);
    const float = floatCap !== null ? Math.min(worst, clampFloat(skin, floatCap)) : worst;

    return [
      {
        skin,
        wear,
        float,
        price: quote.price,
        listings: quote.listings,
        floatCap: floatCap !== null && worst > floatCap ? floatCap : null,
      },
    ];
  });

  return options.sort((left, right) => left.price - right.price)[0] ?? null;
};

const repeat = <T>(value: T, count: number): T[] => Array.from({ length: count }, () => value);

const leadsTo = (
  index: TradeUpIndex,
  skin: TradeUpSkin,
  target: TradeUpSkin,
  statTrak: boolean,
): boolean =>
  outcomePools(index, skin, statTrak).some((pool) =>
    pool.some((entry) => entry.name === target.name),
  );

export const inputTier = (tier: TradeUpTier): TradeUpTier | null =>
  TIER_ORDER[TIER_ORDER.indexOf(tier) - 1] ?? null;

export interface TargetPlan {
  lead: PricedInput;
  filler: PricedInput | null;
  leadCount: number;
  chance: number;
  inputs: PricedInput[];
  result: ContractResult;
}

export interface TargetPlans {
  plans: TargetPlan[];
  outputCap: number;
  impossible: boolean;
}

export const targetPlans = (
  index: TradeUpIndex,
  target: TradeUpSkin,
  wear: Wear | null,
  statTrak: boolean,
  sellFeePercent: number,
): TargetPlans => {
  const tier = inputTier(target.tier);
  const outputCap = wear && !target.wearless ? WEAR_RANGES[wear][1] - EDGE : target.maxFloat;

  if (!tier || (statTrak && !target.stattrak)) {
    return { plans: [], outputCap, impossible: true };
  }

  const size = contractSize(tier);
  const candidates = index.skins.filter(
    (skin) => skin.tier === tier && canTradeUp(index, skin, statTrak),
  );
  const priced = (skin: TradeUpSkin) => {
    const cap = maxInputFloatFor(skin, target, outputCap);

    return cap === null ? null : cheapestInput(skin, statTrak, cap);
  };
  const leads = candidates
    .filter((skin) => leadsTo(index, skin, target, statTrak))
    .flatMap((skin) => {
      const input = priced(skin);

      return input ? [input] : [];
    });
  const filler =
    candidates
      .filter((skin) => !leadsTo(index, skin, target, statTrak))
      .flatMap((skin) => {
        const input = priced(skin);

        return input ? [input] : [];
      })
      .sort((left, right) => left.price! - right.price!)[0] ?? null;

  if (leads.length === 0) {
    return { plans: [], outputCap, impossible: true };
  }

  const chanceOf = (result: ContractResult) =>
    result.outcomes.find((outcome) => outcome.skin.name === target.name)?.probability ?? 0;
  const plans = leads.flatMap((lead) =>
    Array.from({ length: size }, (_, index) => size - index)
      .filter((count) => count === size || filler !== null)
      .map((leadCount) => {
        const inputs = [...repeat(lead, leadCount), ...repeat(filler!, size - leadCount)];
        const result = evaluateContract(index, inputs, statTrak, sellFeePercent);

        return {
          lead,
          filler: leadCount === size ? null : filler,
          leadCount,
          chance: chanceOf(result),
          inputs,
          result,
        };
      }),
  );

  return {
    plans: plans
      .filter((plan) => plan.chance > 0)
      .sort((left, right) => left.result.cost / left.chance - right.result.cost / right.chance),
    outputCap,
    impossible: false,
  };
};

export interface Replacement {
  input: PricedInput;
  result: ContractResult;
}

export const replacementsFor = (
  index: TradeUpIndex,
  inputs: PricedInput[],
  slot: number,
  statTrak: boolean,
  sellFeePercent: number,
): Replacement[] => {
  const tier = inputs[slot]?.skin.tier;

  if (!tier) return [];

  return index.skins
    .filter((skin) => skin.tier === tier && canTradeUp(index, skin, statTrak))
    .flatMap((skin) =>
      skinWears(skin).length > 0
        ? skinWears(skin).map((wear) => pricedInput(skin, wear, statTrak))
        : [pricedInput(skin, null, statTrak)],
    )
    .flatMap((input) => {
      if (!input) return [];

      const next = inputs.map((current, index) => (index === slot ? input : current));

      return [{ input, result: evaluateContract(index, next, statTrak, sellFeePercent) }];
    });
};

export interface Deal {
  key: string;
  inputs: PricedInput[];
  result: ContractResult;
  roi: number;
}

export interface DealSearch {
  tier: TradeUpTier;
  statTrak: boolean;
  sellFeePercent: number;
  minListings: number;
}

const groupsOf = (skin: TradeUpSkin): string[] =>
  skin.tier === 'covert' ? skin.cases : skin.collections;

export const findDeals = (index: TradeUpIndex, search: DealSearch): Deal[] => {
  const { tier, statTrak, sellFeePercent, minListings } = search;
  const size = contractSize(tier);
  const options = index.skins
    .filter((skin) => skin.tier === tier && canTradeUp(index, skin, statTrak))
    .flatMap((skin) =>
      (skin.wearless ? [null] : skinWears(skin)).flatMap((wear) => {
        const input = pricedInput(skin, wear, statTrak);

        return input && input.listings >= minListings ? [input] : [];
      }),
    );
  const fillers = [...options].sort((left, right) => left.price! - right.price!).slice(0, 3);
  const leads = new Map<string, PricedInput>();

  for (const option of options) {
    for (const group of groupsOf(option.skin)) {
      const key = `${group}|${option.wear}`;
      const current = leads.get(key);

      if (!current || option.price! < current.price!) leads.set(key, option);
    }
  }

  const counts = size === 10 ? [10, 9, 8, 7, 6, 5] : [5, 4, 3];
  const deals = new Map<string, Deal>();

  for (const lead of leads.values()) {
    for (const filler of fillers) {
      for (const count of counts) {
        if (count === size && filler !== fillers[0]) continue;
        if (count < size && filler.skin.name === lead.skin.name) continue;

        const inputs = [...repeat(lead, count), ...repeat(filler, size - count)];
        const result = evaluateContract(index, inputs, statTrak, sellFeePercent);

        if (result.problems.length > 0 || result.outcomes.some((outcome) => outcome.net === null)) {
          continue;
        }

        const key = `${lead.skin.name}|${lead.wear}|${count}|${count < size ? `${filler.skin.name}|${filler.wear}` : ''}`;

        deals.set(key, { key, inputs, result, roi: result.profit / result.cost });
      }
    }
  }

  return [...deals.values()].sort((left, right) => right.roi - left.roi);
};
