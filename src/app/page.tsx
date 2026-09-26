'use client';

import { SearchX } from 'lucide-react';
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
import { Segmented } from '@/components/ui/segmented';
import { Select } from '@/components/ui/select';
import { parseMoney } from '@/components/ui/input';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useItems, useStatus } from '@/lib/api/queries';
import type {
  DealMode,
  ItemCategory,
  ItemEdition,
  ItemSort,
  ItemWear,
  MarketId,
  MarketPhase,
} from '@/lib/api/types';
import { DEAL_MODES } from '@/lib/markets';

type Mode = Exclude<DealMode, 'all'>;

const LIQUID_LISTINGS = 5;

const SORTS: { value: ItemSort; label: string }[] = [
  { value: 'benefit', label: 'Больше выгода в %' },
  { value: 'benefitAmount', label: 'Больше выгода в $' },
  { value: 'priceAsc', label: 'Сначала дешёвые' },
  { value: 'priceDesc', label: 'Сначала дорогие' },
  { value: 'sales8w', label: 'Чаще всего продают' },
  { value: 'belowSales', label: 'Ниже истории продаж' },
  { value: 'popular', label: 'Больше всего лотов' },
];

const DealsPage = () => {
  const [mode, setMode] = useState<Mode>('gap');
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<ItemCategory | undefined>();
  const [subcategory, setSubcategory] = useState<string | undefined>();
  const [minPrice, setMinPrice] = useState('1');
  const [maxPrice, setMaxPrice] = useState('');
  const [liquidOnly, setLiquidOnly] = useState(true);
  const [sort, setSort] = useState<ItemSort>('benefit');
  const [wear, setWear] = useState<'all' | ItemWear>('all');
  const [edition, setEdition] = useState<'all' | ItemEdition>('all');
  const [phase, setPhase] = useState<'all' | MarketPhase>('all');
  const [cheapestOn, setCheapestOn] = useState<'all' | MarketId>('all');
  const [collection, setCollection] = useState('');

  const status = useStatus();
  const search = useDebouncedValue(q);
  const priceFrom = useDebouncedValue(minPrice);
  const priceTo = useDebouncedValue(maxPrice);

  const items = useItems({
    mode,
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
    minListings: liquidOnly ? LIQUID_LISTINGS : 0,
    onlyProfitable: true,
  });

  const activeMode = DEAL_MODES.find((entry) => entry.value === mode)!;
  const compared = status.data?.comparedItems;

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="page-title">Где сейчас выгоднее</h1>
        <p className="text-foreground-muted max-w-2xl text-[0.9375rem] leading-relaxed">
          Сравниваем цены white.market, DMarket, CSFloat и lis-skins
          {compared ? ` на ${compared.toLocaleString('ru-RU')} предметов` : ''} и показываем, где
          купить дешевле и на чём можно заработать.
        </p>
      </section>

      <section className="space-y-2.5">
        <Segmented
          label="Что ищем"
          value={mode}
          onChange={setMode}
          options={DEAL_MODES}
          className="sm:max-w-xl"
        />
        <p className="text-foreground-muted text-sm">{activeMode.hint}</p>
      </section>

      <FilterBar>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchField
            value={q}
            onChange={setQ}
            placeholder="Например, AK-47 Redline"
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
            className="lg:ml-auto lg:w-56"
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
        <Toggle
          checked={liquidOnly}
          onChange={setLiquidOnly}
          label="Только ходовые предметы"
          hint={`Минимум ${LIQUID_LISTINGS} лотов на каждой площадке, чтобы цена была настоящей`}
        />
      </FilterBar>

      <ItemGrid
        query={items}
        mode={mode}
        empty={
          <EmptyState
            icon={<SearchX className="size-6" aria-hidden />}
            title={status.data?.refreshing && !compared ? 'Собираем цены' : 'Ничего не нашлось'}
            description={
              status.data?.refreshing && !compared
                ? 'Первый сбор цен занимает меньше минуты. Страница обновится сама.'
                : 'Попробуй убрать часть фильтров или поменять диапазон цен.'
            }
          />
        }
      />
    </div>
  );
};

export default DealsPage;
