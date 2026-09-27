'use client';

import { Loader2, SearchX } from 'lucide-react';

import {
  CategoryChips,
  FilterBar,
  ItemFilterSelects,
  PriceRange,
  SearchField,
  Toggle,
} from '@/components/items/filters';
import { useRememberedState } from '@/hooks/use-remembered-state';
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
  { value: 'fresh', label: 'Сначала новые' },
  { value: 'benefit', label: 'Больше скидка в %' },
  { value: 'benefitAmount', label: 'Больше скидка в $' },
  { value: 'bidCover', label: 'Автопокупка ближе к цене' },
  { value: 'priceAsc', label: 'Сначала дешёвые' },
  { value: 'priceDesc', label: 'Сначала дорогие' },
  { value: 'sales8w', label: 'Чаще всего продают' },
  { value: 'popular', label: 'Больше всего лотов' },
];

const TopPage = () => {
  const [q, setQ] = useRememberedState('top.q', '');
  const [category, setCategory] = useRememberedState<ItemCategory | undefined>(
    'top.category',
    undefined,
  );
  const [subcategory, setSubcategory] = useRememberedState<string | undefined>(
    'top.subcategory',
    undefined,
  );
  const [minPrice, setMinPrice] = useRememberedState('top.minPrice', '1');
  const [maxPrice, setMaxPrice] = useRememberedState('top.maxPrice', '');
  const [activeOnly, setActiveOnly] = useRememberedState('top.activeOnly', true);
  const [closeBidOnly, setCloseBidOnly] = useRememberedState('top.closeBidOnly', false);
  const [sort, setSort] = useRememberedState<ItemSort>('top.sort', 'score');
  const [wear, setWear] = useRememberedState<'all' | ItemWear>('top.wear', 'all');
  const [edition, setEdition] = useRememberedState<'all' | ItemEdition>('top.edition', 'all');
  const [phase, setPhase] = useRememberedState<'all' | MarketPhase>('top.phase', 'all');
  const [cheapestOn, setCheapestOn] = useRememberedState<'all' | MarketId>('top.cheapestOn', 'all');
  const [collection, setCollection] = useRememberedState('top.collection', '');
  const [minEightWeekSales, setMinEightWeekSales] = useRememberedState('top.minEightWeekSales', '');
  const [minBenefitPercent, setMinBenefitPercent] = useRememberedState('top.minBenefitPercent', '');

  const status = useStatus();
  const search = useDebouncedValue(q);
  const priceFrom = useDebouncedValue(minPrice);
  const priceTo = useDebouncedValue(maxPrice);

  const items = useItems({
    mode: 'top',
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
    minWeekSales: activeOnly ? ACTIVE_WEEK_SALES : 0,
    minBidCover: closeBidOnly ? CLOSE_BID_COVER : 0,
    minEightWeekSales: Number(minEightWeekSales) || 0,
    minBenefitPercent: Number(minBenefitPercent) || 0,
  });

  const floors = status.data?.floors
    ? [status.data.floors.dmarket, status.data.floors.whiteMarket]
    : [];
  const checked =
    (status.data?.salesChecked ?? 0) + floors.reduce((sum, market) => sum + market.checked, 0);
  const total =
    (status.data?.salesTotal ?? 0) + floors.reduce((sum, market) => sum + market.total, 0);
  const scanning = total > 0 && checked < total;

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="page-title">Топ предложения</h1>
        <p className="text-foreground-muted max-w-2xl text-[0.9375rem] leading-relaxed">
          Предметы, которые сейчас продают дешевле, чем они обычно продаются на той же площадке.
          Ликвидность считается за восемь недель.
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
        <CategoryChips
          value={category}
          onChange={setCategory}
          subcategory={subcategory}
          onSubcategoryChange={setSubcategory}
          exclude={['sticker']}
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
            hint={`Заявка на DMarket после комиссии не ниже ${CLOSE_BID_COVER}% от цены`}
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
