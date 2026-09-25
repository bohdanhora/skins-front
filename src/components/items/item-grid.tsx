'use client';

import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query';
import { CloudOff, Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

import { EmptyState } from '@/components/states/empty-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { DealMode, ItemsPage } from '@/lib/api/types';
import { plural } from '@/lib/format/time';

import { ItemCard } from './item-card';
import { useOpenItem } from './item-dialog-provider';

interface ItemGridProps {
  query: UseInfiniteQueryResult<InfiniteData<ItemsPage>, Error>;
  mode: DealMode;
  empty: ReactNode;
  /** Shown above the grid, next to the result count. */
  toolbar?: ReactNode;
}

const GRID = 'grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

export const ItemGrid = ({ query, mode, empty, toolbar }: ItemGridProps) => {
  const openItem = useOpenItem();

  if (query.isPending) {
    return <GridSkeleton />;
  }

  if (query.isError) {
    return (
      <EmptyState
        icon={<CloudOff className="size-6" aria-hidden />}
        title="Не получилось загрузить цены"
        description="Похоже, сервер цен сейчас недоступен. Проверь, что он запущен, и попробуй ещё раз."
        action={
          <Button variant="secondary" onClick={() => void query.refetch()}>
            Попробовать снова
          </Button>
        }
      />
    );
  }

  const items = query.data.pages.flatMap((page) => page.items);
  const total = query.data.pages[0]?.total ?? 0;

  if (items.length === 0) {
    return <>{empty}</>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-foreground-muted text-sm">
          Нашлось{' '}
          <span className="text-foreground numeric font-semibold">
            {total.toLocaleString('ru-RU')}
          </span>{' '}
          {plural(total, ['предмет', 'предмета', 'предметов'])}
          {query.isFetching && !query.isFetchingNextPage ? (
            <Loader2 className="ml-2 inline size-3.5 animate-spin" aria-hidden />
          ) : null}
        </p>
        {toolbar}
      </div>

      <div className={GRID}>
        {items.map((item) => (
          <ItemCard key={item.name} item={item} mode={mode} onOpen={openItem} />
        ))}
      </div>

      {query.hasNextPage ? (
        <div className="flex justify-center pt-2">
          <Button
            variant="secondary"
            onClick={() => void query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
            className="min-w-44"
          >
            {query.isFetchingNextPage ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            Показать ещё
          </Button>
        </div>
      ) : null}
    </div>
  );
};

export const GridSkeleton = () => (
  <div className={GRID} aria-busy>
    {Array.from({ length: 8 }, (_, index) => (
      <div key={index} className="bg-surface space-y-3 rounded-3xl p-3">
        <Skeleton className="aspect-[4/3] rounded-2xl" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-8" />
        <Skeleton className="h-8" />
      </div>
    ))}
  </div>
);
