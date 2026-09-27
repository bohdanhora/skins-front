'use client';

import { ReceiptText } from 'lucide-react';
import type { MouseEvent } from 'react';

import { Button } from '@/components/ui/button';
import { markBought } from '@/lib/purchases/bought-lots';
import type { PurchaseMarket } from '@/lib/purchases/purchases';
import { cn } from '@/lib/utils/cn';

import { usePurchaseForm } from './purchase-form';
import { PURCHASE_MARKET_OPTIONS } from './purchase-shared';

export interface BoughtLot {
  name: string;
  image?: string | null;
  rarityColor?: string | null;
  market: string;
  price: number;
  float: number | null;
  paintSeed: number | null;
  url: string;
}

interface BoughtButtonProps {
  lot: BoughtLot;
  onBought?: () => void;
  compact?: boolean;
  className?: string;
}

const toMarket = (market: string): PurchaseMarket =>
  PURCHASE_MARKET_OPTIONS.find((option) => option.value === market)?.value ?? 'other';

export const BoughtButton = ({ lot, onBought, compact = false, className }: BoughtButtonProps) => {
  const form = usePurchaseForm();

  const open = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    form.add(
      {
        name: lot.name,
        image: lot.image ?? null,
        rarityColor: lot.rarityColor ?? null,
        price: lot.price,
        market: toMarket(lot.market),
        boughtAt: new Date().toISOString(),
        float: lot.float,
        paintSeed: lot.paintSeed,
      },
      {
        onSaved: () => {
          markBought(lot.url);
          onBought?.();
        },
      },
    );
  };

  if (compact) {
    return (
      <button
        type="button"
        aria-label="Купил"
        title="Купил, записать в покупки"
        onClick={open}
        className={cn(
          'press text-foreground-subtle hover:text-foreground hover:bg-surface flex size-6 items-center justify-center rounded-lg',
          className,
        )}
      >
        <ReceiptText className="size-3.5" aria-hidden />
      </button>
    );
  }

  return (
    <Button variant="secondary" size="sm" onClick={open} className={className}>
      <ReceiptText className="size-3.5" aria-hidden />
      Купил
    </Button>
  );
};
