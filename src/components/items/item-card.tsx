'use client';

import { TriangleAlert } from 'lucide-react';

import type { DealMode, Item } from '@/lib/api/types';
import { dealWarning } from '@/lib/deal-warning';

import { BenefitBadge } from './benefit-badge';
import { FavoriteButton } from './favorite-button';
import { ItemImage } from './item-image';
import { ItemTitle } from './item-title';
import { PriceRows } from './price-rows';

interface ItemCardProps {
  item: Item;
  mode: DealMode;
  onOpen: (name: string) => void;
}

export const ItemCard = ({ item, mode, onOpen }: ItemCardProps) => {
  const warning = dealWarning(item, mode);

  return (
    <article className="group bg-surface relative flex flex-col rounded-3xl p-3 shadow-[var(--shadow-card)] transition-shadow duration-200 hover:shadow-[0_2px_4px_rgb(0_0_0/0.04),0_12px_28px_-12px_rgb(0_0_0/0.25)]">
      <button
        type="button"
        onClick={() => onOpen(item.name)}
        className="absolute inset-0 z-0 rounded-3xl"
        aria-label={`Подробнее: ${item.name}`}
      />

      <div className="pointer-events-none relative">
        <ItemImage
          src={item.image}
          alt={item.name}
          rarityColor={item.rarityColor}
          className="aspect-[4/3]"
          imageClassName="p-3 transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <FavoriteButton name={item.name} className="absolute top-5 right-5 z-10" />

      <div className="pointer-events-none relative flex flex-1 flex-col px-1 pt-3">
        <ItemTitle name={item.name} />
        <div className="mt-3 flex-1">
          <PriceRows item={item} />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <BenefitBadge item={item} mode={mode} />
          {warning ? (
            <span
              className="text-warning flex items-center gap-1 text-[0.6875rem] font-medium"
              title={warning.long}
            >
              <TriangleAlert className="size-3.5" aria-hidden />
              {warning.short}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
};
