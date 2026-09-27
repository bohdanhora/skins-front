import { ArrowRight, TrendingDown, Zap } from 'lucide-react';

import type { DealMode, Item } from '@/lib/api/types';
import { formatPercent, formatSignedUsd, formatUsd } from '@/lib/format/money';
import { MARKETS } from '@/lib/markets';
import { cn } from '@/lib/utils/cn';

interface BenefitBadgeProps {
  item: Item;
  mode: DealMode;
}

const tone = (amount: number): string =>
  amount > 0 ? 'bg-gain-soft text-gain' : 'bg-loss-soft text-loss';

export const BenefitBadge = ({ item, mode }: BenefitBadgeProps) => {
  if (mode === 'top' && item.top) {
    const { top } = item;

    return (
      <div className="space-y-1.5">
        <div className="flex flex-wrap gap-1.5">
          <Pill className="bg-gain-soft text-gain">
            <TrendingDown className="size-3.5" aria-hidden />
            Ниже обычного на {formatPercent(top.percent)}
            <span className="opacity-70">· {formatUsd(top.discount)}</span>
          </Pill>
          {item.dealScore ? (
            <Pill className="bg-accent-soft text-accent">Сигнал {item.dealScore.score}/100</Pill>
          ) : null}
        </div>
        <p className="text-foreground-muted text-xs">
          <span className={MARKETS[top.market].text}>{MARKETS[top.market].short}</span>, обычно от{' '}
          {formatUsd(top.reference)}
          {item.dmarket?.bid ? `, скупают за ${formatUsd(item.dmarket.bid)}` : ''}
          {item.sales?.eightWeekSales ? `, ${item.sales.eightWeekSales} продаж за 8 недель` : ''}
        </p>
        {item.flip && item.flip.profit > 0 && item.flip.buyOn === top.market ? (
          <p className="text-foreground-muted flex flex-wrap items-center gap-1 text-xs">
            Перепродать на
            <span className={MARKETS[item.flip.sellOn].text}>
              {MARKETS[item.flip.sellOn].short}
            </span>
            за {formatUsd(item.flip.sellPrice)}:
            <span className="text-gain font-semibold">
              {formatSignedUsd(item.flip.profit)} после комиссии
            </span>
          </p>
        ) : null}
      </div>
    );
  }

  if (mode === 'flip' && item.flip) {
    const { flip } = item;

    return (
      <div className="space-y-1.5">
        <Pill className={tone(flip.profit)}>
          {flip.profit > 0 ? 'Прибыль' : 'Убыток'} {formatSignedUsd(flip.profit)}
          <span className="opacity-70">· {formatPercent(flip.percent, true)}</span>
        </Pill>
        <p className="text-foreground-muted flex items-center gap-1 text-xs">
          <span className={MARKETS[flip.buyOn].text}>{MARKETS[flip.buyOn].short}</span>
          <ArrowRight className="size-3" aria-hidden />
          <span className={MARKETS[flip.sellOn].text}>{MARKETS[flip.sellOn].short}</span>
          <span>за {formatUsd(flip.sellPrice)}</span>
        </p>
      </div>
    );
  }

  if (mode === 'instant' && item.instant) {
    const { instant } = item;

    return (
      <div className="space-y-1.5">
        <Pill className={tone(instant.profit)}>
          <Zap className="size-3.5" aria-hidden />
          {formatSignedUsd(instant.profit)}
          <span className="opacity-70">· {formatPercent(instant.percent, true)}</span>
        </Pill>
        <p className="text-foreground-muted text-xs">
          Заявка на DMarket: {formatUsd(instant.sellPrice)}
        </p>
      </div>
    );
  }

  if (item.gap) {
    return (
      <Pill className="bg-gain-soft text-gain">
        Экономия {formatUsd(item.gap.amount)}
        <span className="opacity-70">· {formatPercent(item.gap.percent)}</span>
      </Pill>
    );
  }

  const only = item.whiteMarket?.listings
    ? 'whiteMarket'
    : item.dmarket?.listings
      ? 'dmarket'
      : null;

  return (
    <Pill className="bg-surface-muted text-foreground-muted">
      {only ? `Есть только на ${MARKETS[only].name}` : 'Сейчас нет в продаже'}
    </Pill>
  );
};

const Pill = ({ children, className }: { children: React.ReactNode; className: string }) => (
  <span
    className={cn(
      'numeric inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[0.8125rem] font-semibold',
      className,
    )}
  >
    {children}
  </span>
);
