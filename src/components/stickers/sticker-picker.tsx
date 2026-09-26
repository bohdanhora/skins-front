'use client';

import { Plus, X } from 'lucide-react';
import { useState } from 'react';

import { SearchField } from '@/components/items/filters';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useItems } from '@/lib/api/queries';
import { formatUsd } from '@/lib/format/money';

const SUGGESTIONS = 8;
const STICKER_PREFIX = 'Sticker | ';

export const stickerLabel = (name: string): string =>
  name.startsWith(STICKER_PREFIX) ? name.slice(STICKER_PREFIX.length) : name;

interface StickerPickerProps {
  selected: string[];
  onChange: (next: string[]) => void;
  max: number;
  allowRepeats?: boolean;
  placeholder?: string;
}

export const StickerPicker = ({
  selected,
  onChange,
  max,
  allowRepeats = false,
  placeholder = 'Найди наклейку: navi katowice 2019',
}: StickerPickerProps) => {
  const [q, setQ] = useState('');
  const search = useDebouncedValue(q, 250);
  const suggestions = useItems(
    { category: 'sticker', q: search.trim(), sort: 'popular', limit: SUGGESTIONS },
    { enabled: search.trim().length >= 2 },
  );
  const found = (suggestions.data?.pages[0]?.items ?? []).filter(
    (item) => allowRepeats || !selected.includes(item.name),
  );
  const full = selected.length >= max;

  return (
    <div className="space-y-3">
      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selected.map((name, index) => (
            <span
              key={`${name}-${index}`}
              className="bg-accent-soft text-accent inline-flex h-9 items-center gap-1.5 rounded-full pr-1.5 pl-3.5 text-sm font-medium"
            >
              {stickerLabel(name)}
              <button
                type="button"
                onClick={() => onChange(selected.filter((_, position) => position !== index))}
                aria-label={`Убрать ${stickerLabel(name)}`}
                className="hover:bg-accent/10 rounded-full p-1"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div className="relative">
        <SearchField
          value={q}
          onChange={setQ}
          placeholder={full ? `Можно выбрать до ${max} наклеек` : placeholder}
          className="h-12 text-base"
        />
        {!full && search.trim().length >= 2 && found.length > 0 ? (
          <ul className="border-border bg-surface-raised absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border shadow-xl">
            {found.map((item) => (
              <li key={item.name}>
                <button
                  type="button"
                  onClick={() => {
                    onChange([...selected, item.name]);
                    setQ('');
                  }}
                  className="hover:bg-surface-muted flex w-full items-center gap-3 px-3 py-2 text-left"
                >
                  <span className="bg-surface-muted flex size-10 shrink-0 items-center justify-center rounded-xl">
                    {item.image ? (
                      <img src={item.image} alt="" className="size-9 object-contain" />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">{stickerLabel(item.name)}</span>
                  <span className="text-foreground-muted numeric text-xs">
                    от{' '}
                    {formatUsd(
                      minPrice(item.whiteMarket?.price, item.dmarket?.price, item.csfloat?.price),
                    )}
                  </span>
                  <Plus className="text-foreground-subtle size-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
};

const minPrice = (...prices: (number | null | undefined)[]): number | null => {
  const known = prices.filter((price): price is number => typeof price === 'number');

  return known.length > 0 ? Math.min(...known) : null;
};
