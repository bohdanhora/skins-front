'use client';

import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { ItemImage } from '@/components/items/item-image';
import { IconInput } from '@/components/ui/input';
import { useTradeUpCatalog } from '@/lib/api/queries';
import type { SellMarketId, TradeUpSkin } from '@/lib/api/types';
import type { Wear } from '@/lib/format/item-name';
import { formatUsd } from '@/lib/format/money';
import { MARKETS, SELL_MARKET_ORDER } from '@/lib/markets';
import { useFees } from '@/lib/storage/settings';
import {
  TIER_LABELS,
  buildIndex,
  quoteOf,
  skinWears,
  worstFloatInWear,
  type TradeUpIndex,
} from '@/lib/trade-up/contract';
import type { PricedInput } from '@/lib/trade-up/plans';

export interface CraftGroup {
  name: string;
  wear: Wear | null;
  float: number;
  count: number;
}

export const useTradeUpIndex = () => {
  const catalog = useTradeUpCatalog();
  const index = useMemo(
    () => (catalog.data ? buildIndex(catalog.data.skins) : null),
    [catalog.data],
  );

  return { catalog, index };
};

export const useSellFee = (market: SellMarketId): number => useFees()[market];

export const SELL_MARKET_OPTIONS = SELL_MARKET_ORDER.map((market) => ({
  value: market,
  label: `Продаю на ${MARKETS[market].name}`,
}));

export const groupInputs = (
  index: TradeUpIndex,
  groups: CraftGroup[],
  statTrak: boolean,
): PricedInput[] =>
  groups.flatMap((group) => {
    const skin = index.byName.get(group.name);

    if (!skin) return [];

    const quote = quoteOf(skin, group.wear, statTrak);
    const input: PricedInput = {
      skin,
      wear: group.wear,
      float: group.float,
      price: quote?.price ?? null,
      listings: quote?.listings ?? 0,
      floatCap: null,
    };

    return Array.from({ length: group.count }, () => input);
  });

export const inputsToGroups = (inputs: PricedInput[]): CraftGroup[] => {
  const groups: CraftGroup[] = [];

  for (const input of inputs) {
    const current = groups.find(
      (group) =>
        group.name === input.skin.name && group.wear === input.wear && group.float === input.float,
    );

    if (current) current.count += 1;
    else groups.push({ name: input.skin.name, wear: input.wear, float: input.float, count: 1 });
  }

  return groups;
};

export const cheapestWear = (skin: TradeUpSkin, statTrak: boolean): Wear | null => {
  const wears = skinWears(skin);

  if (wears.length === 0) return null;

  return (
    wears
      .map((wear) => ({ wear, quote: quoteOf(skin, wear, statTrak) }))
      .filter((entry) => entry.quote)
      .sort((left, right) => left.quote!.price - right.quote!.price)[0]?.wear ?? wears[0]
  );
};

export const newGroup = (skin: TradeUpSkin, statTrak: boolean, count: number): CraftGroup => {
  const wear = cheapestWear(skin, statTrak);

  return {
    name: skin.name,
    wear,
    float: wear ? worstFloatInWear(skin, wear) : skin.maxFloat,
    count,
  };
};

export const formatChance = (value: number): string => {
  const percent = value * 100;

  return `${percent >= 10 ? Math.round(percent) : percent.toFixed(1).replace('.', ',')}%`;
};

export const SkinPicker = ({
  skins,
  onPick,
  placeholder,
  statTrak,
}: {
  skins: TradeUpSkin[];
  onPick: (skin: TradeUpSkin) => void;
  placeholder: string;
  statTrak: boolean;
}) => {
  const [query, setQuery] = useState('');
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const matches =
    words.length === 0
      ? []
      : skins
          .filter((skin) => {
            const text =
              `${skin.name} ${skin.collections.join(' ')} ${skin.cases.join(' ')}`.toLowerCase();

            return words.every((word) => text.includes(word));
          })
          .slice(0, 12);

  return (
    <div className="relative">
      <IconInput
        icon={<Search className="size-4" aria-hidden />}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      {matches.length > 0 ? (
        <ul className="border-border bg-surface-raised absolute inset-x-0 top-full z-20 mt-1 max-h-96 overflow-y-auto rounded-2xl border p-1 shadow-[var(--shadow-card)]">
          {matches.map((skin) => {
            const wear = cheapestWear(skin, statTrak);
            const quote = quoteOf(skin, wear, statTrak);

            return (
              <li key={skin.name}>
                <button
                  type="button"
                  onClick={() => {
                    onPick(skin);
                    setQuery('');
                  }}
                  className="hover:bg-surface-muted flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left"
                >
                  <ItemImage
                    src={skin.image}
                    alt={skin.name}
                    rarityColor={null}
                    className="size-10 shrink-0"
                    imageClassName="p-0.5"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{skin.name}</span>
                    <span className="text-foreground-muted block truncate text-xs">
                      {TIER_LABELS[skin.tier]} · {skin.collections[0] ?? skin.cases[0] ?? ''}
                    </span>
                  </span>
                  <span className="numeric text-foreground-muted text-xs whitespace-nowrap">
                    {quote ? `от ${formatUsd(quote.price)}` : 'нет цены'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
};
