'use client';

import { Loader2, SearchX } from 'lucide-react';
import { useState } from 'react';

import {
  CategoryChips,
  FilterBar,
  ItemFilterSelects,
  PriceRange,
  SearchField,
  Toggle,
} from '@/components/items/filters';
import { ItemGrid } from '@/components/items/item-grid';
import { EmptyState } from '@/components/states/empty-state';
import { Input, parseMoney } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useItems, useStatus } from '@/lib/api/queries';
import type {
  ItemCategory,
  ItemEdition,
  ItemSort,
  ItemWear,
  MarketId,
  MarketPhase,
} from '@/lib/api/types';

const ACTIVE_WEEK_SALES = 5;
const CLOSE_BID_COVER = 90;

const SORTS: { value: ItemSort; label: string }[] = [
  { value: 'score', label: 'Лучший сигнал' },
  { value: 'benefit', label: 'Больше скидка в %' },
  { value: 'benefitAmount', label: 'Больше скидка в $' },
  { value: 'bidCover', label: 'Автопокупка ближе к цене' },
  { value: 'priceAsc', label: 'Сначала дешёвые' },
  { value: 'priceDesc', label: 'Сначала дорогие' },
  { value: 'sales8w', label: 'Больше продаж за 8 недель' },
];

const TopPage = () => {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<ItemCategory | undefined>();
  const [minPrice, setMinPrice] = useState('1');
  const [maxPrice, setMaxPrice] = useState('');
  const [activeOnly, setActiveOnly] = useState(true);
  const [closeBidOnly, setCloseBidOnly] = useState(false);
  const [sort, setSort] = useState<ItemSort>('score');
  const [wear, setWear] = useState<'all' | ItemWear>('all');
  const [edition, setEdition] = useState<'all' | ItemEdition>('all');
  const [phase, setPhase] = useState<'all' | MarketPhase>('all');
  const [cheapestOn, setCheapestOn] = useState<'all' | MarketId>('all');
  const [collection, setCollection] = useState('');
  const [minEightWeekSales, setMinEightWeekSales] = useState('');
  const [minBenefitPercent, setMinBenefitPercent] = useState('');

  const status = useStatus();
  const search = useDebouncedValue(q);
  const priceFrom = useDebouncedValue(minPrice);
  const priceTo = useDebouncedValue(maxPrice);

  const items = useItems({
    mode: 'top',
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
    minWeekSales: activeOnly ? ACTIVE_WEEK_SALES : 0,
    minBidCover: closeBidOnly ? CLOSE_BID_COVER : 0,
    minEightWeekSales: Number(minEightWeekSales) || 0,
    minBenefitPercent: Number(minBenefitPercent) || 0,
  });

  const checked = status.data?.salesChecked ?? 0;
  const total = status.data?.salesTotal ?? 0;
  const scanning = total > 0 && checked < total;

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="page-title">Топ предложения</h1>
        <p className="text-foreground-muted max-w-2xl text-[0.9375rem] leading-relaxed">
          Предметы, которые сейчас продают дешевле недавних продаж. Ликвидность считается за восемь
          недель. Если рядом стоит автопокупка, риск почти нулевой: при желании можно сразу продать
          обратно.
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
        <div className="grid gap-3 sm:grid-cols-2 lg:max-w-xl">
          <Input
            type="number"
            min="0"
            step="1"
            value={minEightWeekSales}
            onChange={(event) => setMinEightWeekSales(event.target.value)}
            placeholder="Продаж за 8 недель, от"
            aria-label="Минимум продаж за 8 недель"
          />
          <Input
            type="number"
            min="0"
            step="0.1"
            value={minBenefitPercent}
            onChange={(event) => setMinBenefitPercent(event.target.value)}
            placeholder="Скидка к истории, от %"
            aria-label="Минимальная скидка к истории продаж"
          />
        </div>
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
