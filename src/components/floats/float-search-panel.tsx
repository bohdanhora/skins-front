'use client';

import { Gauge, X } from 'lucide-react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { FloatResults } from '@/components/floats/float-results';
import { FilterBar } from '@/components/items/filters';
import { ItemImage } from '@/components/items/item-image';
import { ItemPicker } from '@/components/items/item-picker';
import { ItemTitle } from '@/components/items/item-title';
import { EmptyState } from '@/components/states/empty-state';
import { Chip } from '@/components/ui/chip';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useItem } from '@/lib/api/queries';
import {
  WEAR_RANGES,
  floatPresets,
  formatRange,
  parseFloatInput,
  type FloatRange,
} from '@/lib/format/float';
import { parseItemName } from '@/lib/format/item-name';

export interface FloatSearchStart {
  name: string | null;
  from: string;
  to: string;
}

export const FloatSearchPanel = ({ initial }: { initial: FloatSearchStart }) => {
  const router = useRouter();
  const [name, setName] = useState<string | null>(initial.name);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);

  const floatFrom = parseFloatInput(useDebouncedValue(from));
  const floatTo = parseFloatInput(useDebouncedValue(to));
  const item = useItem(name);
  const wear = name ? parseItemName(name).wear : null;
  const presets = floatPresets(wear);

  // The address keeps the search, so it can be bookmarked or sent to a friend.
  useEffect(() => {
    const query = new URLSearchParams();

    if (name) query.set('name', name);
    if (floatFrom !== undefined) query.set('from', String(floatFrom));
    if (floatTo !== undefined) query.set('to', String(floatTo));

    const search = query.toString();

    router.replace((search ? `/float?${search}` : '/float?tab=search') as Route, { scroll: false });
  }, [name, floatFrom, floatTo, router]);

  const applyRange = (range: FloatRange | null) => {
    setFrom(range ? String(range[0]) : '');
    setTo(range ? String(range[1]) : '');
  };

  const isPreset = (range: FloatRange) => floatFrom === range[0] && floatTo === range[1];

  return (
    <div className="space-y-6">
      <p className="text-foreground-muted max-w-2xl text-[0.9375rem] leading-relaxed">
        Выбери скин и диапазон флоата. Покажем самые дешёвые лоты с таким флоатом, сколько за него
        доплачивают и есть ли заявки, которые заберут его дороже.
      </p>

      <FilterBar>
        {name ? (
          <div className="flex items-center gap-3">
            {item.data ? (
              <ItemImage
                src={item.data.image}
                alt={name}
                rarityColor={item.data.rarityColor}
                className="size-16 shrink-0"
                imageClassName="p-1"
              />
            ) : (
              <Skeleton className="size-16 rounded-2xl" />
            )}
            <div className="min-w-0 flex-1">
              <ItemTitle name={name} />
            </div>
            <button
              type="button"
              onClick={() => {
                setName(null);
                applyRange(null);
              }}
              aria-label="Выбрать другой предмет"
              title="Выбрать другой предмет"
              className="text-foreground-subtle hover:bg-surface-muted hover:text-foreground rounded-full p-2"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
        ) : (
          <ItemPicker
            onPick={(picked) => {
              setName(picked.name);
              applyRange(null);
            }}
            placeholder="Какой скин ищем? Например, redline ft"
            withFloatOnly
            autoFocus
          />
        )}

        {name ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-foreground-muted text-sm">Флоат</span>
              <Input
                inputMode="decimal"
                value={from}
                onChange={(event) => setFrom(event.target.value.replace(/[^\d.,]/g, ''))}
                placeholder={wear ? String(WEAR_RANGES[wear][0]) : '0'}
                aria-label="Флоат от"
                className="numeric w-24"
              />
              <span className="text-foreground-subtle" aria-hidden>
                ...
              </span>
              <Input
                inputMode="decimal"
                value={to}
                onChange={(event) => setTo(event.target.value.replace(/[^\d.,]/g, ''))}
                placeholder={wear ? String(WEAR_RANGES[wear][1]) : '1'}
                aria-label="Флоат до"
                className="numeric w-24"
              />
            </div>
            {presets.length > 0 ? (
              <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
                <Chip
                  selected={floatFrom === undefined && floatTo === undefined}
                  onClick={() => applyRange(null)}
                >
                  Любой
                </Chip>
                {presets.map((range, index) => (
                  <Chip
                    key={formatRange(range)}
                    selected={isPreset(range)}
                    onClick={() => applyRange(isPreset(range) ? null : range)}
                  >
                    {index === 0 ? `Лучший ${formatRange(range)}` : formatRange(range)}
                  </Chip>
                ))}
              </div>
            ) : null}
          </>
        ) : null}
      </FilterBar>

      {name ? (
        <FloatResults
          name={name}
          range={{ from: floatFrom, to: floatTo }}
          zoom={wear ? WEAR_RANGES[wear] : null}
        />
      ) : (
        <EmptyState
          icon={<Gauge className="size-6" aria-hidden />}
          title="Выбери скин"
          description="Флоат есть только у скинов с износом, поэтому в подсказках только они. Чем ниже флоат, тем новее выглядит скин."
        />
      )}
    </div>
  );
};
