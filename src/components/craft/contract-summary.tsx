import { ItemImage } from '@/components/items/item-image';
import { formatFloat } from '@/lib/format/float';
import { formatPercent, formatSignedUsd, formatUsd } from '@/lib/format/money';
import type { ContractProblem, ContractResult } from '@/lib/trade-up/contract';
import { cn } from '@/lib/utils/cn';

import { formatChance } from './craft-shared';

const PROBLEMS: Record<ContractProblem, string> = {
  empty: 'Добавь скины в контракт.',
  size: 'Нужно ровно 10 скинов, для ножа 5 Covert.',
  mixedTier: 'Все скины должны быть одной редкости.',
  noTradeUp: 'У одного из скинов нет следующей редкости в коллекции, его нельзя крафтить.',
  noStatTrak: 'Не у всех скинов есть StatTrak™.',
  missingPrice: 'Для части скинов нет цены в этом износе.',
};

export const ContractProblems = ({ problems }: { problems: ContractProblem[] }) =>
  problems.length > 0 ? (
    <ul className="text-warning space-y-1 text-sm">
      {problems.map((problem) => (
        <li key={problem}>{PROBLEMS[problem]}</li>
      ))}
    </ul>
  ) : null;

const Stat = ({ label, value, tone }: { label: string; value: string; tone?: 'gain' | 'loss' }) => (
  <div className="bg-surface-muted rounded-xl px-3 py-2.5">
    <p className="text-foreground-subtle text-[0.6875rem] leading-tight">{label}</p>
    <p
      className={cn(
        'numeric mt-1 text-sm font-semibold',
        tone === 'gain' ? 'text-gain' : tone === 'loss' ? 'text-loss' : 'text-foreground',
      )}
    >
      {value}
    </p>
  </div>
);

export const ContractStats = ({ result }: { result: ContractResult }) => (
  <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
    <Stat label="Стоимость входов" value={formatUsd(result.cost)} />
    <Stat label="Ожидаемо после комиссии" value={formatUsd(result.expected)} />
    <Stat
      label="Ожидаемая прибыль"
      value={formatSignedUsd(result.profit)}
      tone={result.profit >= 0 ? 'gain' : 'loss'}
    />
    <Stat
      label="Окупаемость"
      value={result.cost > 0 ? formatPercent((result.profit / result.cost) * 100, true) : '-'}
      tone={result.profit >= 0 ? 'gain' : 'loss'}
    />
    <Stat label="Шанс окупиться" value={formatChance(result.profitChance)} />
  </div>
);

export const OutcomeList = ({ result }: { result: ContractResult }) => (
  <ul className="divide-border border-border bg-surface divide-y overflow-hidden rounded-2xl border">
    {result.outcomes.map((outcome) => {
      const pays = outcome.net !== null && outcome.net > result.cost;

      return (
        <li
          key={outcome.skin.name}
          className={cn('flex items-center gap-3 px-4 py-2.5', pays ? 'bg-gain-soft/50' : '')}
        >
          <ItemImage
            src={outcome.skin.image}
            alt={outcome.skin.name}
            rarityColor={null}
            className="size-12 shrink-0"
            imageClassName="p-0.5"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{outcome.skin.name}</p>
            <p className="text-foreground-muted numeric text-xs">
              {[
                outcome.wear,
                outcome.skin.wearless ? null : `флоат ${formatFloat(outcome.float)}`,
                outcome.listings > 0 ? `${outcome.listings} лотов` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
          <span className="numeric w-14 text-right text-sm font-semibold">
            {formatChance(outcome.probability)}
          </span>
          <div className="w-24 text-right">
            <p className={cn('numeric text-sm font-semibold', pays ? 'text-gain' : '')}>
              {outcome.price !== null ? formatUsd(outcome.price) : 'нет цены'}
            </p>
            {outcome.net !== null ? (
              <p className="text-foreground-subtle numeric text-xs">
                {formatUsd(outcome.net)} на руки
              </p>
            ) : null}
          </div>
        </li>
      );
    })}
  </ul>
);
