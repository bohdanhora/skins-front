'use client';

import { Heart } from 'lucide-react';
import Link from 'next/link';

import { useRememberedState } from '@/hooks/use-remembered-state';
import { FavoriteSets } from '@/components/favorites/favorite-sets';
import { ItemGrid } from '@/components/items/item-grid';
import { EmptyState } from '@/components/states/empty-state';
import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/ui/segmented';
import { Select } from '@/components/ui/select';
import { useItems } from '@/lib/api/queries';
import type { ItemSort } from '@/lib/api/types';
import { useFavorites } from '@/lib/storage/settings';

const SORTS: { value: ItemSort; label: string }[] = [
  { value: 'name', label: 'По названию' },
  { value: 'priceAsc', label: 'Сначала дешёвые' },
  { value: 'priceDesc', label: 'Сначала дорогие' },
  { value: 'sales8w', label: 'Чаще всего продают' },
  { value: 'belowSales', label: 'Ниже истории продаж' },
  { value: 'benefit', label: 'Больше разница между площадками' },
];

const FavoritesPage = () => {
  const { favorites } = useFavorites();
  const [sort, setSort] = useRememberedState<ItemSort>('favorites.sort', 'name');
  const [tab, setTab] = useRememberedState<'items' | 'sets'>('favorites.tab', 'items');
  const items = useItems({ names: favorites, sort }, { enabled: favorites.length > 0 });

  const empty = (
    <EmptyState
      icon={<Heart className="size-6" aria-hidden />}
      title="Пока пусто"
      description="Жми на сердечко у любого предмета, и он появится здесь. Удобно следить за ценами на то, что хочешь купить."
      action={
        <Button asChild variant="secondary">
          <Link href="/search">Найти предмет</Link>
        </Button>
      }
    />
  );

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="page-title">Избранное</h1>
          <p className="text-foreground-muted text-[0.9375rem]">
            Свежие цены на предметы, за которыми ты следишь, и наборы вроде ножа с перчатками.
          </p>
        </div>
        {tab === 'items' && favorites.length > 0 ? (
          <Select
            value={sort}
            onChange={setSort}
            options={SORTS}
            aria-label="Сортировка"
            className="sm:w-60"
          />
        ) : null}
      </section>

      <Segmented
        value={tab}
        onChange={setTab}
        label="Что показать"
        options={[
          { value: 'items', label: 'Предметы' },
          { value: 'sets', label: 'Наборы' },
        ]}
        className="sm:w-72"
      />

      {tab === 'sets' ? (
        <FavoriteSets />
      ) : favorites.length === 0 ? (
        empty
      ) : (
        <ItemGrid query={items} mode="all" empty={empty} />
      )}
    </div>
  );
};

export default FavoritesPage;
