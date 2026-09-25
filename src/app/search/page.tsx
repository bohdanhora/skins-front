'use client';

import { SearchX } from 'lucide-react';
import type { Route } from 'next';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { CategoryChips, FilterBar, PriceRange, SearchField } from '@/components/items/filters';
import { GridSkeleton, ItemGrid } from '@/components/items/item-grid';
import { EmptyState } from '@/components/states/empty-state';
import { Chip } from '@/components/ui/chip';
import { parseMoney } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useItems } from '@/lib/api/queries';
import type { ItemCategory, ItemSort } from '@/lib/api/types';

const SORTS: { value: ItemSort; label: string }[] = [
  { value: 'popular', label: 'Сначала популярные' },
  { value: 'priceAsc', label: 'Сначала дешёвые' },
  { value: 'priceDesc', label: 'Сначала дорогие' },
  { value: 'benefit', label: 'Больше разница в цене' },
  { value: 'name', label: 'По алфавиту' },
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

  const search = useDebouncedValue(q);
  const priceFrom = useDebouncedValue(minPrice);
  const priceTo = useDebouncedValue(maxPrice);

  // Keep the query in the address bar, so a search can be shared or bookmarked.
  useEffect(() => {
    const trimmed = search.trim();

    router.replace((trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search') as Route, {
      scroll: false,
    });
  }, [search, router]);

  const items = useItems({
    q: search.trim() || undefined,
    category,
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
