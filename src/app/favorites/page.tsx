'use client';

import { Heart } from 'lucide-react';
import Link from 'next/link';

import { ItemGrid } from '@/components/items/item-grid';
import { EmptyState } from '@/components/states/empty-state';
import { Button } from '@/components/ui/button';
import { useItems } from '@/lib/api/queries';
import { useFavorites } from '@/lib/storage/settings';

const FavoritesPage = () => {
  const { favorites } = useFavorites();
  const items = useItems({ names: favorites, sort: 'name' }, { enabled: favorites.length > 0 });

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
      <section className="space-y-2">
        <h1 className="page-title">Избранное</h1>
        <p className="text-foreground-muted text-[0.9375rem]">
          Свежие цены на предметы, за которыми ты следишь.
        </p>
      </section>

      {favorites.length === 0 ? empty : <ItemGrid query={items} mode="all" empty={empty} />}
    </div>
  );
};

export default FavoritesPage;
