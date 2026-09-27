'use client';

import { CloudOff, Crosshair, Loader2, ShieldAlert } from 'lucide-react';

import { useRememberedState } from '@/hooks/use-remembered-state';
import { FilterBar, PriceRange, SearchField, Toggle } from '@/components/items/filters';
import { EmptyState } from '@/components/states/empty-state';
import { Button } from '@/components/ui/button';
import { Input, parseMoney } from '@/components/ui/input';
import { Segmented } from '@/components/ui/segmented';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useSnipes } from '@/lib/api/queries';
import type { MarketPhase, Snipe, SnipeSort, SnipesQuery } from '@/lib/api/types';
import { parseFloatInput } from '@/lib/format/float';
import { plural } from '@/lib/format/time';
import { PHASE_FILTERS } from '@/lib/markets';

import { SnipeCard } from './snipe-card';

const SORTS: { value: SnipeSort; label: string }[] = [
  { value: 'profit', label: 'Больше прибыль в $' },
  { value: 'percent', label: 'Больше прибыль в %' },
  { value: 'priceAsc', label: 'Сначала дешёвые' },
  { value: 'fresh', label: 'Сначала свежие' },
];

const SOURCES: { value: NonNullable<SnipesQuery['source']>; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'dmarket', label: 'Лот на DMarket' },
  { value: 'whiteMarket', label: 'Лот на White' },
  { value: 'csfloat', label: 'Лот на CSFloat' },
];

const GRID = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3';

export const SnipesPanel = ({ onCheck }: { onCheck: (snipe: Snipe) => void }) => {
  const [q, setQ] = useRememberedState('snipes.q', '');
  const [minPrice, setMinPrice] = useRememberedState('snipes.minPrice', '');
  const [maxPrice, setMaxPrice] = useRememberedState('snipes.maxPrice', '');
  const [specialOnly, setSpecialOnly] = useRememberedState('snipes.specialOnly', true);
  const [source, setSource] = useRememberedState<NonNullable<SnipesQuery['source']>>(
    'snipes.source',
    'all',
  );
  const [sort, setSort] = useRememberedState<SnipeSort>('snipes.sort', 'profit');
  const [floatFrom, setFloatFrom] = useRememberedState('snipes.floatFrom', '');
  const [floatTo, setFloatTo] = useRememberedState('snipes.floatTo', '');
  const [phase, setPhase] = useRememberedState<'all' | MarketPhase>('snipes.phase', 'all');

  const search = useDebouncedValue(q);
  const priceFrom = useDebouncedValue(minPrice);
  const priceTo = useDebouncedValue(maxPrice);
  const debouncedFloatFrom = useDebouncedValue(floatFrom);
  const debouncedFloatTo = useDebouncedValue(floatTo);

  const snipes = useSnipes({
    q: search.trim() || undefined,
    minPrice: parseMoney(priceFrom),
    maxPrice: parseMoney(priceTo),
    minFloat: parseFloatInput(debouncedFloatFrom),
    maxFloat: parseFloatInput(debouncedFloatTo),
    phase: phase === 'all' ? undefined : phase,
    specialOnly,
    source,
    sort,
  });

  const first = snipes.data?.pages[0];
  const scanning = !!first && first.checked < first.candidates;
  const items = snipes.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="space-y-6">
      <p className="text-foreground-muted max-w-2xl text-[0.9375rem] leading-relaxed">
        Лоты, которые уже подходят под заявку на DMarket или CSFloat дороже своей цены. Например,
        флоат 0.16 продают по обычной цене, а за флоат 0.15-0.18 кто-то платит вдвое больше. Купил и
        сразу отдал в заявку. Прибыль уже с учётом комиссии.
      </p>

      <div className="bg-warning-soft text-warning flex gap-2.5 rounded-2xl px-4 py-3 text-sm leading-relaxed">
        <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p>
          Перед покупкой на DMarket посмотри на значок щита у лота: это защита сделки, продавец
          может отменить её в течение нескольких дней, и тогда деньги вернутся, а скина не будет.
          Кнопка «Открыть» ведёт прямо на этот лот.
        </p>
      </div>

      {scanning ? (
        <div className="bg-accent-soft text-accent flex items-center gap-3 rounded-2xl px-4 py-3 text-sm">
          <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
          <p>
            Смотрим лоты и заявки: проверили {first.checked.toLocaleString('ru-RU')} из{' '}
            {first.candidates.toLocaleString('ru-RU')} скинов. Находки появляются сами.
          </p>
        </div>
      ) : null}

      <FilterBar>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchField
            value={q}
            onChange={setQ}
            placeholder="Например, AK-47 или Doppler"
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <span className="text-foreground-muted text-sm">Флоат</span>
            <Input
              inputMode="decimal"
              value={floatFrom}
              onChange={(event) => setFloatFrom(event.target.value.replace(/[^\d.,]/g, ''))}
              placeholder="от"
              aria-label="Флоат от"
              className="numeric w-24"
            />
            <span className="text-foreground-subtle">...</span>
            <Input
              inputMode="decimal"
              value={floatTo}
              onChange={(event) => setFloatTo(event.target.value.replace(/[^\d.,]/g, ''))}
              placeholder="до"
              aria-label="Флоат до"
              className="numeric w-24"
            />
          </div>
          <Select
            value={phase}
            onChange={setPhase}
            options={PHASE_FILTERS}
            aria-label="Фаза Doppler"
            className="sm:ml-auto sm:w-48"
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Toggle
            checked={specialOnly}
            onChange={setSpecialOnly}
            label="Только за флоат, паттерн или фазу"
            hint="Скрыть обычные заявки, которые платят за любой экземпляр"
          />
          <Segmented
            label="Где лот"
            value={source}
            onChange={setSource}
            options={SOURCES}
            className="sm:w-auto"
          />
        </div>
      </FilterBar>

      {snipes.isPending ? (
        <div className={GRID}>
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-80 rounded-3xl" />
          ))}
        </div>
      ) : snipes.isError ? (
        <EmptyState
          icon={<CloudOff className="size-6" aria-hidden />}
          title="Не получилось загрузить находки"
          description="Похоже, сервер сейчас недоступен. Попробуй ещё раз."
          action={
            <Button variant="secondary" onClick={() => void snipes.refetch()}>
              Попробовать снова
            </Button>
          }
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Crosshair className="size-6" aria-hidden />}
          title={scanning ? 'Пока ищем' : 'Сейчас находок нет'}
          description={
            scanning
              ? 'Такие лоты попадаются нечасто, их разбирают быстро. Список пополняется по ходу проверки.'
              : 'Все подходящие лоты уже разобрали. Сканер продолжает смотреть, загляни чуть позже.'
          }
        />
      ) : (
        <div className="space-y-4">
          <p className="text-foreground-muted text-sm">
            Нашлось{' '}
            <span className="text-foreground numeric font-semibold">{first?.total ?? 0}</span>{' '}
            {plural(first?.total ?? 0, ['находка', 'находки', 'находок'])}
          </p>
          <div className={GRID}>
            {items.map((snipe, index) => (
              <SnipeCard
                key={`${snipe.name}-${snipe.source}-${snipe.float}-${snipe.listingPrice}-${index}`}
                snipe={snipe}
                onCheck={onCheck}
              />
            ))}
          </div>
          {snipes.hasNextPage ? (
            <div className="flex justify-center pt-2">
              <Button
                variant="secondary"
                onClick={() => void snipes.fetchNextPage()}
                disabled={snipes.isFetchingNextPage}
                className="min-w-44"
              >
                Показать ещё
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
