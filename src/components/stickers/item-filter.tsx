'use client';

import { Crosshair, X } from 'lucide-react';
import { useState } from 'react';

import { IconInput } from '@/components/ui/input';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useItems } from '@/lib/api/queries';

const SUGGESTIONS = 6;
const MIN_QUERY = 2;

interface ItemFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export const ItemFilter = ({ value, onChange }: ItemFilterProps) => {
  const [focused, setFocused] = useState(false);
  const search = useDebouncedValue(value, 250).trim();
  const suggestions = useItems(
    { q: search, sort: 'popular', limit: SUGGESTIONS * 2 },
    { enabled: focused && search.length >= MIN_QUERY },
  );
  const found = (suggestions.data?.pages[0]?.items ?? [])
    .filter((item) => item.category !== 'sticker' && item.name !== value)
    .slice(0, SUGGESTIONS);

  return (
    <div className="relative">
      <IconInput
        icon={<Crosshair className="size-[1.125rem]" aria-hidden />}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder="На каком предмете? Любой, AK-47 или точный скин"
        aria-label="Предмет, на котором должна быть наклейка"
        trailing={
          value ? (
            <button
              type="button"
              onClick={() => onChange('')}
              aria-label="Любой предмет"
              className="text-foreground-subtle hover:bg-surface-muted hover:text-foreground rounded-lg p-1.5"
            >
              <X className="size-4" aria-hidden />
            </button>
          ) : null
        }
      />
      {focused && search.length >= MIN_QUERY && found.length > 0 ? (
        <ul className="border-border bg-surface-raised absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border shadow-xl">
          {found.map((item) => (
            <li key={item.name}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(item.name);
                  setFocused(false);
                }}
                className="hover:bg-surface-muted flex w-full items-center gap-3 px-3 py-2 text-left"
              >
                <span className="bg-surface-muted flex size-9 shrink-0 items-center justify-center rounded-xl">
                  {item.image ? (
                    <img src={item.image} alt="" className="size-8 object-contain" />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">{item.name}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};
