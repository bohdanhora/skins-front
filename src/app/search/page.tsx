'use client';

import { SearchX } from 'lucide-react';
import type { Route } from 'next';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import {
  CategoryChips,
  FilterBar,
  ItemFilterSelects,
  PriceRange,
  SearchField,
} from '@/components/items/filters';
import { GridSkeleton, ItemGrid } from '@/components/items/item-grid';
import { EmptyState } from '@/components/states/empty-state';
import { Chip } from '@/components/ui/chip';
import { parseMoney } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useItemFacets, useItems } from '@/lib/api/queries';
import type {
  ItemCategory,
  ItemEdition,
  ItemSort,
  ItemWear,
  MarketId,
  MarketPhase,
} from '@/lib/api/types';

const SORTS: { value: ItemSort; label: string }[] = [
  { value: 'popular', label: 'Сначала популярные' },
  { value: 'priceAsc', label: 'Сначала дешёвые' },
  { value: 'priceDesc', label: 'Сначала дорогие' },
  { value: 'benefit', label: 'Больше разница в цене' },
  { value: 'name', label: 'По алфавиту' },
  { value: 'sales8w', label: 'Больше продаж за 8 недель' },
];

const QUICK_SEARCHES = ['AK-47', 'AWP', 'Karambit', 'Butterfly', 'Glock-18', 'Case', 'Doppler'];

const SearchPage = () => {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [category, setCategory] = useState<ItemCategory | undefined>();
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState<ItemSort>('popular');
  const [wear, setWear] = useState<'all' | ItemWear>('all');
  const [edition, setEdition] = useState<'all' | ItemEdition>('all');
  const [phase, setPhase] = useState<'all' | MarketPhase>('all');
  const [cheapestOn, setCheapestOn] = useState<'all' | MarketId>('all');
  const [collection, setCollection] = useState('');
  const facets = useItemFacets();

  const search = useDebouncedValue(q);
  const priceFrom = useDebouncedValue(minPrice);
  const priceTo = useDebouncedValue(maxPrice);

  useEffect(() => {
    const trimmed = search.trim();

    router.replace((trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search') as Route, {
      scroll: false,
    });
  }, [search, router]);

  const items = useItems({
    q: search.trim() || undefined,
    category,
    wear: wear === 'all' ? undefined : wear,
    edition: edition === 'all' ? undefined : edition,
    phase: phase === 'all' ? undefined : phase,
    cheapestOn: cheapestOn === 'all' ? undefined : cheapestOn,
    collection: collection || undefined,
    sort,
    minPrice: parseMoney(priceFrom),
    maxPrice: parseMoney(priceTo),
  });

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="page-title">Поиск по предметам</h1>
        <p className="text-foreground-muted text-[0.9375rem]">
          Напиши название на английском, как на площадках. Порядок слов не важен.
        </p>
      </section>

      <FilterBar>
        <SearchField
          value={q}
          onChange={setQ}
          placeholder="Например, redline ak или karambit fade"
          autoFocus
          className="h-12 text-base"
        />
        {q === '' ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-foreground-subtle text-sm">Часто ищут:</span>
            {QUICK_SEARCHES.map((entry) => (
              <Chip key={entry} onClick={() => setQ(entry)}>
                {entry}
              </Chip>
            ))}
          </div>
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <PriceRange
            min={minPrice}
            max={maxPrice}
            onMinChange={setMinPrice}
            onMaxChange={setMaxPrice}
          />
          <Select
            value={sort}
            onChange={setSort}
            options={SORTS}
            aria-label="Сортировка"
            className="sm:ml-auto sm:w-60"
          />
        </div>
        <CategoryChips value={category} onChange={setCategory} />
        {!q && !collection && facets.data?.collections.length ? (
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {facets.data.collections.slice(0, 12).map((entry) => (
              <button
                key={entry.name}
                type="button"
                onClick={() => setCollection(entry.name)}
                className="border-border bg-surface-muted hover:border-accent/40 flex min-w-44 items-center gap-3 rounded-2xl border p-2 text-left"
              >
                <span className="bg-surface flex size-12 shrink-0 items-center justify-center rounded-xl">
                  {entry.image ? (
                    <Image
                      src={entry.image}
                      alt=""
                      width={44}
                      height={44}
                      className="object-contain"
                    />
                  ) : null}
                </span>
                <span className="line-clamp-2 text-xs font-medium">{entry.name}</span>
              </button>
            ))}
          </div>
        ) : null}
        <ItemFilterSelects
          wear={wear}
          onWearChange={setWear}
          edition={edition}
          onEditionChange={setEdition}
          phase={phase}
          onPhaseChange={setPhase}
          cheapestOn={cheapestOn}
          onCheapestOnChange={setCheapestOn}
          collection={collection}
          onCollectionChange={setCollection}
        />
      </FilterBar>

      <ItemGrid
        query={items}
        mode="all"
        empty={
          <EmptyState
            icon={<SearchX className="size-6" aria-hidden />}
            title="Ничего не нашлось"
            description="Проверь написание или попробуй короче: например, просто «redline»."
          />
        }
      />
    </div>
  );
};

const SearchPageWithParams = () => (
  <Suspense fallback={<GridSkeleton />}>
    <SearchPage />
  </Suspense>
);

export default SearchPageWithParams;
