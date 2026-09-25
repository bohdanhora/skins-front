'use client';

import { Heart } from 'lucide-react';

import { useFavorites } from '@/lib/storage/settings';
import { cn } from '@/lib/utils/cn';

export const FavoriteButton = ({ name, className }: { name: string; className?: string }) => {
  const { isFavorite, toggle } = useFavorites();
  const active = isFavorite(name);

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? 'Убрать из избранного' : 'В избранное'}
      title={active ? 'Убрать из избранного' : 'В избранное'}
      onClick={(event) => {
        event.stopPropagation();
        toggle(name);
      }}
      className={cn(
        'press bg-surface/80 flex size-9 items-center justify-center rounded-full backdrop-blur',
        active ? 'text-market-wm' : 'text-foreground-subtle hover:text-foreground',
        className,
      )}
    >
      <Heart className={cn('size-[1.125rem]', active ? 'fill-current' : '')} aria-hidden />
    </button>
  );
};
