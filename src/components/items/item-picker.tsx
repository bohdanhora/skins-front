'use client';

import { useState } from 'react';

import { SearchField } from '@/components/items/filters';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useItems } from '@/lib/api/queries';
import type { Item } from '@/lib/api/types';
import { formatUsd } from '@/lib/format/money';

const SUGGESTIONS = 8;
const MIN_QUERY = 2;

interface ItemPickerProps {
  onPick: (item: Item) => void;
  placeholder: string;
  withFloatOnly?: boolean;
  autoFocus?: boolean;
}

const HAS_WEAR = /\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$/;

export const ItemPicker = ({ onPick, placeholder, withFloatOnly, autoFocus }: ItemPickerProps) => {
  const [q, setQ] = useState('');
  const search = useDebouncedValue(q, 250).trim();
  const suggestions = useItems(
    { q: search, sort: 'popular', limit: withFloatOnly ? SUGGESTIONS * 2 : SUGGESTIONS },
    { enabled: search.length >= MIN_QUERY },
  );
  const found = (suggestions.data?.pages[0]?.items ?? [])
    .filter((item) => !withFloatOnly || HAS_WEAR.test(item.name))
    .slice(0, SUGGESTIONS);

  return (
    <div className="relative">
      <SearchField
        value={q}
        onChange={setQ}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="h-12 text-base"
      />
      {search.length >= MIN_QUERY && found.length > 0 ? (
        <ul className="border-border bg-surface-raised absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border shadow-xl">
          {found.map((item) => (
            <li key={item.name}>
              <button
                type="button"
                onClick={() => {
                  onPick(item);
                  setQ('');
                }}
                className="hover:bg-surface-muted flex w-full items-center gap-3 px-3 py-2 text-left"
              >
                <span className="bg-surface-muted flex size-10 shrink-0 items-center justify-center rounded-xl">
                  {item.image ? (
                    <img src={item.image} alt="" className="size-9 object-contain" />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">{item.name}</span>
                <span className="text-foreground-muted numeric text-xs">
                  от {formatUsd(cheapest(item))}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};

const cheapest = (item: Item): number | null => {
  const prices = [item.whiteMarket, item.dmarket, item.csfloat]
    .filter((quote) => quote && quote.listings > 0 && quote.price !== null)
    .map((quote) => quote!.price!);

  return prices.length > 0 ? Math.min(...prices) : null;
};
