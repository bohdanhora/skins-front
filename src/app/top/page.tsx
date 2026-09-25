'use client';

import { Loader2, SearchX } from 'lucide-react';
import { useState } from 'react';

import {
  CategoryChips,
  FilterBar,
  PriceRange,
  SearchField,
  Toggle,
} from '@/components/items/filters';
import { ItemGrid } from '@/components/items/item-grid';
import { EmptyState } from '@/components/states/empty-state';
import { parseMoney } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useItems, useStatus } from '@/lib/api/queries';
import type { ItemCategory, ItemSort } from '@/lib/api/types';

/** Sold at least this many times a week, so the "usual price" is not a fluke. */
const ACTIVE_WEEK_SALES = 5;
/** Buy orders at 90% of the price or higher: you can get out almost at cost. */
const CLOSE_BID_COVER = 90;

const SORTS: { value: ItemSort; label: string }[] = [
  { value: 'benefit', label: 'Больше скидка в %' },
  { value: 'benefitAmount', label: 'Больше скидка в $' },
  { value: 'bidCover', label: 'Автопокупка ближе к цене' },
  { value: 'priceAsc', label: 'Сначала дешёвые' },
  { value: 'priceDesc', label: 'Сначала дорогие' },
];

const TopPage = () => {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<ItemCategory | undefined>();
  const [minPrice, setMinPrice] = useState('1');
  const [maxPrice, setMaxPrice] = useState('');
  const [activeOnly, setActiveOnly] = useState(true);
  const [closeBidOnly, setCloseBidOnly] = useState(false);
  const [sort, setSort] = useState<ItemSort>('benefit');

  const status = useStatus();
  const search = useDebouncedValue(q);
  const priceFrom = useDebouncedValue(minPrice);
  const priceTo = useDebouncedValue(maxPrice);

  const items = useItems({
    mode: 'top',
    q: search.trim() || undefined,
    category,
    sort,
    minPrice: parseMoney(priceFrom),
    maxPrice: parseMoney(priceTo),
    minWeekSales: activeOnly ? ACTIVE_WEEK_SALES : 0,
    minBidCover: closeBidOnly ? CLOSE_BID_COVER : 0,
  });

  const checked = status.data?.salesChecked ?? 0;
  const total = status.data?.salesTotal ?? 0;
  const scanning = total > 0 && checked < total;

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="page-title">Топ предложения</h1>
        <p className="text-foreground-muted max-w-2xl text-[0.9375rem] leading-relaxed">
          Предметы, которые сейчас продают дешевле, чем их обычно покупали последние две недели.
          Если рядом стоит автопокупка, риск почти нулевой: при желании можно сразу продать обратно.
        </p>
      </section>

      {scanning ? (
        <div className="bg-accent-soft text-accent flex items-center gap-3 rounded-2xl px-4 py-3 text-sm">
          <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
          <p>
            Смотрим историю продаж: проверили {checked.toLocaleString('ru-RU')} из{' '}
            {total.toLocaleString('ru-RU')} предметов. Список пополняется сам.
          </p>
        </div>
      ) : null}

      <FilterBar>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchField
            value={q}
            onChange={setQ}
            placeholder="Например, Karambit или AWP"
            className="lg:w-80"
          />
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
            className="lg:ml-auto lg:w-60"
          />
        </div>
        <CategoryChips value={category} onChange={setCategory} exclude={['sticker']} />
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
          <Toggle
            checked={activeOnly}
            onChange={setActiveOnly}
            label="Часто продаются"
            hint={`Не меньше ${ACTIVE_WEEK_SALES} продаж за неделю, чтобы обычная цена была настоящей`}
          />
          <Toggle
            checked={closeBidOnly}
            onChange={setCloseBidOnly}
            label="Автопокупка рядом"
            hint={`Заявка на покупку не ниже ${CLOSE_BID_COVER}% от цены`}
          />
        </div>
      </FilterBar>

      <ItemGrid
        query={items}
        mode="top"
        empty={
          <EmptyState
            icon={<SearchX className="size-6" aria-hidden />}
            title={scanning && checked < 100 ? 'Собираем историю продаж' : 'Ничего не нашлось'}
            description={
              scanning && checked < 100
                ? 'Первые предложения появятся через пару минут, страница обновится сама.'
                : 'Сейчас ничего не продают заметно дешевле обычного. Попробуй убрать фильтры или загляни позже.'
            }
          />
        }
      />
    </div>
  );
};

export default TopPage;
