'use client';

import { Loader2 } from 'lucide-react';

import { useBlueValue } from '@/lib/api/queries';
import { blueSidesLabel } from '@/lib/format/blue';
import { formatSignedUsd, formatUsd } from '@/lib/format/money';
import { plural } from '@/lib/format/time';
import { payoutFor, type FeeTable, type Purchase } from '@/lib/purchases/purchases';
import { cn } from '@/lib/utils/cn';

const NOTABLE_MULTIPLIER = 1.05;

const percent = (value: number): string => `${value.toFixed(1).replace('.', ',')}%`;

const times = (value: number): string => `×${value.toFixed(2).replace('.', ',')}`;

interface BlueValuePanelProps {
  purchase: Purchase;
  fees: FeeTable;
  withdrawals: FeeTable;
}

export const BlueValuePanel = ({ purchase, fees, withdrawals }: BlueValuePanelProps) => {
  const value = useBlueValue(purchase.name, purchase.paintSeed, true);

  if (value.isPending) {
    return (
      <p className="text-foreground-subtle flex items-center gap-2 px-1 text-[0.8125rem]">
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
        Считаем, сколько стоит синий
      </p>
    );
  }

  if (!value.data) {
    return null;
  }

  const data = value.data;
  const notable = data.multiplier !== null && data.multiplier >= NOTABLE_MULTIPLIER;
  const payout =
    data.estimate !== null ? payoutFor(data.estimate, 'csfloat', fees, withdrawals) : null;
  const profit = payout !== null ? (payout - purchase.price) * purchase.amount : null;
  const days = data.spanDays ?? 0;

  return (
    <div
      className={cn(
        'pointer-events-none space-y-1.5 rounded-xl px-3 py-2.5 text-[0.8125rem]',
        notable ? 'bg-market-dm-soft' : 'bg-surface-muted/60',
      )}
    >
      <p className="text-foreground">
        <span className="font-semibold">
          Синий {percent(data.blue.playside)} / {percent(data.blue.backside)}
        </span>
        <span className="text-foreground-subtle">
          {' '}
          {data.source === 'csfloat'
            ? 'лицевая / обратная сторона, по CSFloat'
            : `${blueSidesLabel(purchase.name)}, по калькулятору: CSFloat этот паттерн ещё не видел`}
        </span>
      </p>

      {data.multiplier !== null ? (
        <p className="text-foreground-muted">
          {notable ? (
            <>
              Похожий синий продают в среднем{' '}
              <span className="text-foreground font-semibold">{times(data.multiplier)}</span> к
              обычному паттерну: около{' '}
              <span className="text-foreground numeric font-semibold">
                {formatUsd(data.estimate)}
              </span>
              {data.premium !== null ? ` (${formatSignedUsd(data.premium)} к рынку)` : ''}.
            </>
          ) : (
            'Такой синий почти не добавляет к цене, похожие уходят по рынку.'
          )}
          {notable && payout !== null && profit !== null ? (
            <>
              {' '}
              На CSFloat на руки {formatUsd(payout * purchase.amount)},{' '}
              <span
                className={cn('numeric font-semibold', profit >= 0 ? 'text-gain' : 'text-loss')}
              >
                {formatSignedUsd(profit)}
              </span>
              .
            </>
          ) : null}
        </p>
      ) : (
        <p className="text-foreground-muted">Похожих по синему продаж мало, наценку не оценить.</p>
      )}

      <p className="text-foreground-subtle">
        {data.comparableCount}{' '}
        {plural(data.comparableCount, ['похожая продажа', 'похожие продажи', 'похожих продаж'])} на
        CSFloat ({percent(data.band[0])}–{percent(data.band[1])} синего)
        {days > 0 ? ` за ${days} ${plural(days, ['день', 'дня', 'дней'])}` : ''}
      </p>

      {data.sales.length > 0 ? (
        <ul className="numeric flex flex-wrap gap-1.5 pt-0.5">
          {data.sales.slice(0, 4).map((sale) => (
            <li
              key={`${sale.name}-${sale.paintSeed}-${sale.soldAt}`}
              className="bg-surface text-foreground-muted rounded-full px-2 py-0.5 text-[0.6875rem]"
              title={sale.name}
            >
              #{sale.paintSeed} · {percent(sale.blue.playside)} · {formatUsd(sale.price)} ·{' '}
              {times(sale.ratio)}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};
