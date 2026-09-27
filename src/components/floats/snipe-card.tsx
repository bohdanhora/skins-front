'use client';

import { ArrowDown, ExternalLink, Search } from 'lucide-react';
import type { Ref } from 'react';

import { BlueShareTag } from '@/components/items/blue-share-tag';
import { canGenerate, GenerateButton } from '@/components/items/generate-button';
import { ItemImage } from '@/components/items/item-image';
import { ItemTitle } from '@/components/items/item-title';
import { BoughtButton } from '@/components/purchases/bought-button';
import { Button } from '@/components/ui/button';
import type { Snipe } from '@/lib/api/types';
import { formatFloat, formatRange } from '@/lib/format/float';
import { formatPercent, formatSignedUsd, formatUsd } from '@/lib/format/money';
import { plural, timeAgo } from '@/lib/format/time';
import { MARKETS } from '@/lib/markets';
import { cn } from '@/lib/utils/cn';

const PHASES: Record<string, string> = {
  'phase-1': 'Phase 1',
  'phase-2': 'Phase 2',
  'phase-3': 'Phase 3',
  'phase-4': 'Phase 4',
  ruby: 'Ruby',
  sapphire: 'Sapphire',
  emerald: 'Emerald',
  'black-pearl': 'Black Pearl',
};

const phaseLabel = (phase: string): string => PHASES[phase] ?? phase;

export const snipeReason = (snipe: Snipe): string => {
  const reasons = [
    snipe.orderFloatRanges.length > 0
      ? `флоат ${snipe.orderFloatRanges.map(formatRange).join(', ')}`
      : null,
    snipe.orderPaintSeed !== null ? `паттерн ${snipe.orderPaintSeed}` : null,
    snipe.orderPhase ? `фазу ${phaseLabel(snipe.orderPhase)}` : null,
  ].filter(Boolean);

  return reasons.length > 0 ? `Платят за ${reasons.join(', ')}` : 'Заявка на любой флоат';
};

interface SnipeCardProps {
  snipe: Snipe;
  onCheck: (snipe: Snipe) => void;
  ref?: Ref<HTMLElement>;
}

export const SnipeCard = ({ snipe, onCheck, ref }: SnipeCardProps) => {
  const market = MARKETS[snipe.source];
  const orderMarket = MARKETS[snipe.orderMarket];

  return (
    <article
      ref={ref}
      className="bg-surface flex flex-col rounded-3xl p-4 shadow-[var(--shadow-card)]"
    >
      <div className="flex items-center gap-3">
        <ItemImage
          src={snipe.image}
          alt={snipe.name}
          rarityColor={snipe.rarityColor}
          className="size-20 shrink-0"
          imageClassName="p-1.5"
        />
        <ItemTitle name={snipe.name} />
        {canGenerate(snipe.category) ? (
          <GenerateButton
            name={snipe.name}
            float={snipe.float}
            seed={snipe.paintSeed}
            className="ml-auto self-start"
          />
        ) : null}
      </div>

      <div className="mt-4 space-y-1.5">
        <div className="bg-surface-muted rounded-2xl px-3.5 py-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-foreground-muted flex items-center gap-2 text-xs">
              <span className={cn('size-2 rounded-full', market.dot)} aria-hidden />
              Лот на {market.name}
            </span>
            <span className="numeric text-[0.9375rem] font-semibold">
              {formatUsd(snipe.listingPrice)}
            </span>
          </div>
          <p className="text-foreground-muted numeric mt-1 text-xs">
            {[
              snipe.float !== null ? `флоат ${formatFloat(snipe.float)}` : null,
              snipe.paintSeed !== null ? `паттерн ${snipe.paintSeed}` : null,
              snipe.phase ? phaseLabel(snipe.phase) : null,
            ]
              .filter(Boolean)
              .join(', ')}
          </p>
          {snipe.blue ? (
            <BlueShareTag blue={snipe.blue} name={snipe.name} className="mt-0.5 block text-xs" />
          ) : null}
        </div>

        <div className="text-foreground-subtle flex justify-center" aria-hidden>
          <ArrowDown className="size-4" />
        </div>

        <div className={cn('rounded-2xl px-3.5 py-3', orderMarket.soft)}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-foreground-muted text-xs">
              Заявка на {orderMarket.name}, {snipe.orderAmount}{' '}
              {plural(snipe.orderAmount, ['штука', 'штуки', 'штук'])}
            </span>
            <span className="numeric text-[0.9375rem] font-semibold">
              {formatUsd(snipe.orderPrice)}
            </span>
          </div>
          <p className="text-foreground mt-1 text-xs font-medium">{snipeReason(snipe)}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="bg-gain-soft text-gain numeric inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[0.8125rem] font-semibold">
          {formatSignedUsd(snipe.profit)}
          <span className="opacity-70">· {formatPercent(snipe.percent, true)}</span>
        </span>
        <span className="text-foreground-subtle text-xs">проверено {timeAgo(snipe.checkedAt)}</span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Button variant="secondary" size="sm" onClick={() => onCheck(snipe)}>
          <Search className="size-3.5" aria-hidden />
          Проверить
        </Button>
        <BoughtButton
          lot={{
            name: snipe.name,
            image: snipe.image,
            rarityColor: snipe.rarityColor,
            market: snipe.source,
            price: snipe.listingPrice,
            float: snipe.float,
            paintSeed: snipe.paintSeed,
            url: snipe.listingUrl,
          }}
        />
        <Button asChild variant={snipe.source} size="sm">
          <a href={snipe.listingUrl} target="_blank" rel="noreferrer">
            Открыть
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </Button>
      </div>
    </article>
  );
};
