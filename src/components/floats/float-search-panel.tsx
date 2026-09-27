'use client';

import { Gauge, X } from 'lucide-react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { rememberValue } from '@/hooks/use-remembered-state';

import { FloatPicks } from '@/components/floats/float-picks';
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
import { useItem, useItems } from '@/lib/api/queries';
import type { Item } from '@/lib/api/types';
import {
  WEAR_RANGES,
  floatPresets,
  formatRange,
  parseFloatInput,
  type FloatRange,
} from '@/lib/format/float';
import { formatUsd } from '@/lib/format/money';
import { parseItemName, type Wear } from '@/lib/format/item-name';

export const FLOAT_SEARCH_KEY = 'float.search';

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
  const parsed = name ? parseItemName(name) : null;
  const variants = useItems(
    {
      q: parsed ? `${parsed.base} ${parsed.detail}` : undefined,
      sort: 'priceAsc',
      limit: 100,
    },
    { enabled: !!parsed?.detail },
  );
  const wearVariants = findWearVariants(variants.data?.pages[0]?.items ?? [], parsed);

  useEffect(() => {
    const query = new URLSearchParams();

    if (name) query.set('name', name);
    if (floatFrom !== undefined) query.set('from', String(floatFrom));
    if (floatTo !== undefined) query.set('to', String(floatTo));

    const search = query.toString();

    rememberValue<FloatSearchStart>(FLOAT_SEARCH_KEY, { name, from, to });
    router.replace((search ? `/float?${search}` : '/float?tab=search') as Route, { scroll: false });
  }, [name, from, to, floatFrom, floatTo, router]);

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
            {wearVariants.length > 1 ? (
              <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                {wearVariants.map(({ item: variant, wear: variantWear, price }) => (
                  <button
                    key={variant.name}
                    type="button"
                    onClick={() => {
                      setName(variant.name);
                      applyRange(null);
                    }}
                    className={
                      variant.name === name
                        ? 'border-accent bg-accent-soft text-accent min-w-24 rounded-xl border px-3 py-2 text-left'
                        : 'border-border bg-surface hover:bg-surface-muted min-w-24 rounded-xl border px-3 py-2 text-left'
                    }
                  >
                    <span className="block text-xs font-semibold">{variantWear}</span>
                    <span className="numeric text-foreground mt-0.5 block text-sm font-semibold">
                      {formatUsd(price)}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
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
        <>
          <FloatPicks
            key={`${name}-${floatFrom}-${floatTo}`}
            name={name}
            floatFrom={floatFrom}
            floatTo={floatTo}
          />
          <FloatResults
            name={name}
            range={{ from: floatFrom, to: floatTo }}
            zoom={wear ? WEAR_RANGES[wear] : null}
          />
        </>
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

const WEAR_ORDER: Wear[] = ['FN', 'MW', 'FT', 'WW', 'BS'];

const itemPrice = (item: Item): number | null => {
  const prices = [item.whiteMarket, item.dmarket, item.csfloat]
    .filter((quote) => quote && quote.listings > 0 && quote.price !== null)
    .map((quote) => quote!.price!);

  return prices.length > 0 ? Math.min(...prices) : null;
};

const findWearVariants = (
  items: Item[],
  selected: ReturnType<typeof parseItemName> | null,
): { item: Item; wear: Wear; price: number }[] => {
  if (!selected) return [];

  const byWear = new Map<Wear, { item: Item; wear: Wear; price: number }>();

  for (const item of items) {
    const parsed = parseItemName(item.name);
    const price = itemPrice(item);

    if (
      !parsed.wear ||
      price === null ||
      parsed.base !== selected.base ||
      parsed.detail !== selected.detail ||
      parsed.statTrak !== selected.statTrak ||
      parsed.souvenir !== selected.souvenir ||
      parsed.phase !== selected.phase
    ) {
      continue;
    }

    const current = byWear.get(parsed.wear);

    if (!current || price < current.price) {
      byWear.set(parsed.wear, { item, wear: parsed.wear, price });
    }
  }

  return WEAR_ORDER.flatMap((variantWear) => {
    const value = byWear.get(variantWear);

    return value ? [value] : [];
  });
};
