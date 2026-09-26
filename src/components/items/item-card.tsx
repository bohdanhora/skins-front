'use client';

import { Clock, TrendingDown, TriangleAlert } from 'lucide-react';

import type { DealMode, Item } from '@/lib/api/types';
import { dealWarning } from '@/lib/deal-warning';
import { isCaseHardened } from '@/lib/format/blue';
import { formatPercent, formatUsd } from '@/lib/format/money';
import { timeAgo } from '@/lib/format/time';

import { BenefitBadge } from './benefit-badge';
import { CheapestPatterns } from './cheapest-patterns';
import { FavoriteButton } from './favorite-button';
import { ItemImage } from './item-image';
import { ItemTitle } from './item-title';
import { PriceRows } from './price-rows';

interface ItemCardProps {
  item: Item;
  mode: DealMode;
  onOpen: (name: string) => void;
}

const FRESH_MS = 30 * 60_000;

export const ItemCard = ({ item, mode, onOpen }: ItemCardProps) => {
  const warning = dealWarning(item, mode);
  const changedAt = item.priceChangedAt ? Date.parse(item.priceChangedAt) : null;
  const fresh = changedAt !== null && Date.now() - changedAt < FRESH_MS;

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
      {fresh && mode !== 'all' ? (
        <span className="bg-accent text-accent-foreground pointer-events-none absolute top-5 left-5 z-10 flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold">
          <Clock className="size-3" aria-hidden />
          {timeAgo(item.priceChangedAt ?? null)}
        </span>
      ) : null}

      <div className="pointer-events-none relative flex flex-1 flex-col px-1 pt-3">
        <ItemTitle name={item.name} />
        <div className="mt-3 flex-1">
          <PriceRows item={item} />
          {isCaseHardened(item.name) ? <CheapestPatterns name={item.name} /> : null}
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
        {mode !== 'top' && item.top ? (
          <p
            className="text-gain mt-2 flex items-center gap-1 text-[0.6875rem] font-medium"
            title={`Недавно продавали от ${formatUsd(item.top.reference)}`}
          >
            <TrendingDown className="size-3.5" aria-hidden />
            Ниже истории продаж на {formatPercent(item.top.percent)}
          </p>
        ) : null}
      </div>
    </article>
  );
};
