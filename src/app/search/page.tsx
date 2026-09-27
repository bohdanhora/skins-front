'use client';

import { SearchX } from 'lucide-react';
import type { Route } from 'next';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef } from 'react';

import {
  CategoryChips,
  FilterBar,
  ItemFilterSelects,
  PriceRange,
  SearchField,
} from '@/components/items/filters';
import { useRememberedState } from '@/hooks/use-remembered-state';
import { GridSkeleton, ItemGrid } from '@/components/items/item-grid';
import { SmartSearchBar } from '@/components/items/smart-search';
import { EmptyState } from '@/components/states/empty-state';
import { Chip } from '@/components/ui/chip';
import { parseMoney } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useItems } from '@/lib/api/queries';
import type {
  ItemCategory,
  ItemEdition,
  ItemSort,
  ItemWear,
  MarketId,
  MarketPhase,
} from '@/lib/api/types';

const SORTS: { value: ItemSort; label: string }[] = [
  { value: 'sales8w', label: 'Чаще всего продают' },
  { value: 'popular', label: 'Больше всего лотов' },
  { value: 'priceAsc', label: 'Сначала дешёвые' },
  { value: 'priceDesc', label: 'Сначала дорогие' },
  { value: 'benefit', label: 'Больше разница в цене' },
  { value: 'name', label: 'По алфавиту' },
  { value: 'belowSales', label: 'Ниже истории продаж' },
];

const QUICK_SEARCHES = ['AK-47', 'AWP', 'Karambit', 'Butterfly', 'Glock-18', 'Case', 'Doppler'];

const SearchPage = () => {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useRememberedState('search.q', () => params.get('q') ?? '');
  const [category, setCategory] = useRememberedState<ItemCategory | undefined>(
    'search.category',
    undefined,
  );
  const [subcategory, setSubcategory] = useRememberedState<string | undefined>(
    'search.subcategory',
    undefined,
  );
  const [minPrice, setMinPrice] = useRememberedState('search.minPrice', '');
  const [maxPrice, setMaxPrice] = useRememberedState('search.maxPrice', '');
  const [sort, setSort] = useRememberedState<ItemSort>('search.sort', 'sales8w');
  const [wear, setWear] = useRememberedState<'all' | ItemWear>('search.wear', 'all');
  const [edition, setEdition] = useRememberedState<'all' | ItemEdition>('search.edition', 'all');
  const [phase, setPhase] = useRememberedState<'all' | MarketPhase>('search.phase', 'all');
  const [cheapestOn, setCheapestOn] = useRememberedState<'all' | MarketId>(
    'search.cheapestOn',
    'all',
  );
  const [collection, setCollection] = useRememberedState('search.collection', '');

  const linked = useRef(params.get('q'));

  useEffect(() => {
    const incoming = linked.current;

    linked.current = null;

    if (!incoming || incoming === q) return;

    setQ(incoming);
    setCategory(undefined);
    setSubcategory(undefined);
    setMinPrice('');
    setMaxPrice('');
    setWear('all');
    setEdition('all');
    setPhase('all');
    setCheapestOn('all');
    setCollection('');
  }, [
    q,
    setQ,
    setCategory,
    setSubcategory,
    setMinPrice,
    setMaxPrice,
    setWear,
    setEdition,
    setPhase,
    setCheapestOn,
    setCollection,
  ]);

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
    subcategory,
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
        <SmartSearchBar
          onApply={(filters) => {
            setQ(filters.q ?? '');
            setCategory(filters.category);
            setSubcategory(undefined);
            setWear(filters.wear ?? 'all');
            setEdition(filters.edition ?? 'all');
            setPhase(filters.phase ?? 'all');
            setMinPrice(filters.minPrice !== undefined ? String(filters.minPrice) : '');
            setMaxPrice(filters.maxPrice !== undefined ? String(filters.maxPrice) : '');
            if (filters.sort && SORTS.some((option) => option.value === filters.sort)) {
              setSort(filters.sort);
            }
          }}
        />
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
        <CategoryChips
          value={category}
          onChange={setCategory}
          subcategory={subcategory}
          onSubcategoryChange={setSubcategory}
        />
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
