'use client';

import { Backpack, Loader2, RefreshCw, SearchX, UserRound } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';

import { useRememberedState } from '@/hooks/use-remembered-state';
import { InventoryItemRow } from '@/components/inventory/inventory-item-row';
import { InventorySummary } from '@/components/inventory/inventory-summary';
import { useOpenItem } from '@/components/items/item-dialog-provider';
import { FilterBar, SearchField, Toggle } from '@/components/items/filters';
import { EmptyState } from '@/components/states/empty-state';
import { Button } from '@/components/ui/button';
import { IconInput } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useInventory } from '@/lib/api/queries';
import type { InventoryItem } from '@/lib/api/types';
import { timeAgo } from '@/lib/format/time';
import { useSteamProfile } from '@/lib/storage/settings';

type InventorySort = 'payoutDesc' | 'payoutAsc' | 'popular' | 'float' | 'name';

const SORTS: { value: InventorySort; label: string }[] = [
  { value: 'payoutDesc', label: 'Сначала дорогие' },
  { value: 'payoutAsc', label: 'Сначала дешёвые' },
  { value: 'popular', label: 'Сначала популярные' },
  { value: 'float', label: 'Флоат ниже' },
  { value: 'name', label: 'По названию' },
];

const worth = (item: InventoryItem): number => (item.best?.payout ?? -1) * item.amount;

const COMPARATORS: Record<InventorySort, (left: InventoryItem, right: InventoryItem) => number> = {
  payoutDesc: (left, right) => worth(right) - worth(left),
  payoutAsc: (left, right) =>
    (left.best ? worth(left) : Infinity) - (right.best ? worth(right) : Infinity),
  popular: (left, right) =>
    (right.sales?.eightWeekSales ?? -1) - (left.sales?.eightWeekSales ?? -1) ||
    worth(right) - worth(left),
  float: (left, right) => (left.float ?? Infinity) - (right.float ?? Infinity),
  name: (left, right) => left.name.localeCompare(right.name),
};

const InventoryPage = () => {
  const [profile, setProfile] = useSteamProfile();
  const [draft, setDraft] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sort, setSort] = useRememberedState<InventorySort>('inventory.sort', 'payoutDesc');
  const [search, setSearch] = useRememberedState('inventory.search', '');
  const [sellableOnly, setSellableOnly] = useRememberedState('inventory.sellableOnly', true);
  const openItem = useOpenItem();
  const inventory = useInventory(profile, refreshKey);
  const value = draft ?? profile;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setProfile(value.trim());
    setDraft(null);
  };

  const items = useMemo(() => {
    const words = search.toLowerCase().split(/\s+/).filter(Boolean);

    return (inventory.data?.items ?? [])
      .filter((item) => !sellableOnly || item.marketable)
      .filter((item) => words.every((word) => item.name.toLowerCase().includes(word)))
      .sort(COMPARATORS[sort]);
  }, [inventory.data, search, sellableOnly, sort]);

  const data = inventory.data;

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="page-title">Инвентарь</h1>
        <p className="text-foreground-muted max-w-2xl text-[0.9375rem] leading-relaxed">
          Сколько стоит твой инвентарь CS2 и сколько придёт на руки на каждой площадке после
          комиссии продажи и вывода. Комиссии меняются в настройках. Инвентарь должен быть открытым.
        </p>
      </section>

      <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
        <IconInput
          icon={<UserRound className="size-[1.125rem]" aria-hidden />}
          value={value}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ссылка на профиль Steam или SteamID64"
          aria-label="Профиль Steam"
          className="sm:w-[28rem]"
        />
        <div className="flex gap-2">
          <Button type="submit" disabled={value.trim() === ''}>
            Показать
          </Button>
          {data ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setRefreshKey((key) => key + 1)}
              disabled={inventory.isFetching}
              title="Заново загрузить инвентарь из Steam"
            >
              <RefreshCw
                className={inventory.isFetching ? 'size-4 animate-spin' : 'size-4'}
                aria-hidden
              />
              Обновить
            </Button>
          ) : null}
        </div>
      </form>

      {profile === '' ? (
        <EmptyState
          icon={<Backpack className="size-6" aria-hidden />}
          title="Укажи свой профиль"
          description="Вставь ссылку на профиль Steam, например steamcommunity.com/id/name. Она сохранится в этом браузере."
        />
      ) : inventory.isError && !data ? (
        <EmptyState
          icon={<SearchX className="size-6" aria-hidden />}
          title="Не получилось загрузить инвентарь"
          description={inventory.error.message}
        />
      ) : !data ? (
        <div className="space-y-3">
          <div className="text-foreground-muted flex items-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Загружаем инвентарь из Steam
          </div>
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-24 rounded-3xl" />
          <Skeleton className="h-24 rounded-3xl" />
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3">
            {data.avatar ? <img src={data.avatar} alt="" className="size-10 rounded-full" /> : null}
            <div>
              <p className="font-semibold">{data.name ?? data.steamId}</p>
              <p className="text-foreground-subtle text-xs">
                Инвентарь загружен {timeAgo(data.fetchedAt)}
              </p>
            </div>
          </div>

          <InventorySummary totals={data.totals} />

          <FilterBar>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <SearchField
                value={search}
                onChange={setSearch}
                placeholder="Найти в инвентаре"
                className="lg:w-80"
              />
              <Toggle
                checked={sellableOnly}
                onChange={setSellableOnly}
                label="Только то, что можно продать"
              />
              <Select
                value={sort}
                onChange={setSort}
                options={SORTS}
                aria-label="Сортировка"
                className="lg:ml-auto lg:w-60"
              />
            </div>
          </FilterBar>

          {items.length === 0 ? (
            <EmptyState
              icon={<SearchX className="size-6" aria-hidden />}
              title="Ничего не нашлось"
              description="Попробуй изменить поиск или показать все предметы."
            />
          ) : (
            <div className="space-y-2.5">
              {items.map((item) => (
                <InventoryItemRow key={item.assetIds[0]} item={item} onOpen={openItem} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InventoryPage;
