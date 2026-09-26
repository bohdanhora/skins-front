'use client';

import { useDeferredValue, useMemo } from 'react';

import { useRememberedState } from '@/hooks/use-remembered-state';

import { FilterBar } from '@/components/items/filters';
import { ItemImage } from '@/components/items/item-image';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Input, MoneyInput, parseMoney } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type { TradeUpTier } from '@/lib/api/types';
import { formatPercent, formatSignedUsd, formatUsd } from '@/lib/format/money';
import { TIER_LABELS, nextTier, type TradeUpIndex } from '@/lib/trade-up/contract';
import { findDeals, type Deal, type PricedInput } from '@/lib/trade-up/plans';

import { formatChance, inputsToGroups } from './craft-shared';

const INPUT_TIERS: TradeUpTier[] = [
  'consumer',
  'industrial',
  'milspec',
  'restricted',
  'classified',
  'covert',
];

const DEALS_SHOWN = 30;

export const CraftDeals = ({
  index,
  statTrak,
  setStatTrak,
  sellFee,
  onOpen,
}: {
  index: TradeUpIndex;
  statTrak: boolean;
  setStatTrak: (value: boolean) => void;
  sellFee: number;
  onOpen: (inputs: PricedInput[]) => void;
}) => {
  const [tier, setTier] = useRememberedState<TradeUpTier>('craft.dealTier', 'restricted');
  const [minListings, setMinListings] = useRememberedState('craft.minListings', '10');
  const [maxCost, setMaxCost] = useRememberedState('craft.maxCost', '');
  const request = useMemo(
    () => ({ tier, statTrak, sellFeePercent: sellFee, minListings: Number(minListings) || 0 }),
    [tier, statTrak, sellFee, minListings],
  );
  const search = useDeferredValue(request);
  const deals = useMemo(() => findDeals(index, search), [index, search]);
  const costCap = parseMoney(maxCost);
  const shown = deals
    .filter((deal) => costCap === undefined || deal.result.cost <= costCap * 100)
    .slice(0, DEALS_SHOWN);

  return (
    <div className="space-y-6">
      <FilterBar>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={tier}
            onChange={setTier}
            options={INPUT_TIERS.map((value) => ({
              value,
              label: `${TIER_LABELS[value]} → ${TIER_LABELS[nextTier(value)!]}`,
            }))}
            aria-label="Редкость входов"
            className="w-72"
          />
          <Chip selected={statTrak} onClick={() => setStatTrak(!statTrak)}>
            StatTrak™
          </Chip>
          <MoneyInput
            value={maxCost}
            onChange={setMaxCost}
            placeholder="Контракт до"
            aria-label="Стоимость контракта до"
            className="w-36"
          />
          <div className="flex items-center gap-2">
            <span className="text-foreground-muted text-sm">Лотов входа от</span>
            <Input
              inputMode="numeric"
              value={minListings}
              onChange={(event) => setMinListings(event.target.value.replace(/\D/g, ''))}
              aria-label="Минимум лотов у входа"
              className="numeric w-20"
            />
          </div>
        </div>
        <p className="text-foreground-muted text-sm">
          Перебираем самый дешёвый скин каждой коллекции в каждом износе, с наполнителем и без.
          Флоат входов берём худший в износе, так что с флоатом пониже результат может быть лучше.
        </p>
      </FilterBar>

      {shown.length === 0 ? (
        <p className="text-foreground-muted text-sm">Под эти условия контрактов нет.</p>
      ) : (
        <ul className="divide-border border-border bg-surface divide-y overflow-hidden rounded-2xl border">
          {shown.map((deal) => (
            <DealRow key={deal.key} deal={deal} onOpen={() => onOpen(deal.inputs)} />
          ))}
        </ul>
      )}
    </div>
  );
};

const DealRow = ({ deal, onOpen }: { deal: Deal; onOpen: () => void }) => {
  const groups = inputsToGroups(deal.inputs);
  const best = deal.result.outcomes[0];

  return (
    <li className="flex flex-wrap items-center gap-4 px-4 py-3">
      <div className="min-w-60 flex-1 space-y-0.5">
        {groups.map((group) => (
          <p key={`${group.name}-${group.wear}`} className="text-sm">
            <span className="numeric font-semibold">{group.count}×</span> {group.name}{' '}
            <span className="text-foreground-muted">{group.wear ?? ''}</span>
          </p>
        ))}
        {best ? (
          <div className="text-foreground-muted flex items-center gap-2 text-xs">
            <ItemImage
              src={best.skin.image}
              alt={best.skin.name}
              rarityColor={null}
              className="size-6 shrink-0"
              imageClassName="p-0"
            />
            лучший исход {best.skin.name} {best.wear ?? ''}, {formatChance(best.probability)}
          </div>
        ) : null}
      </div>
      <div className="numeric grid grid-cols-4 gap-4 text-right text-sm">
        <div>
          <p className="text-foreground-subtle text-[0.6875rem]">стоимость</p>
          <p className="font-semibold">{formatUsd(deal.result.cost)}</p>
        </div>
        <div>
          <p className="text-foreground-subtle text-[0.6875rem]">прибыль</p>
          <p
            className={
              deal.result.profit >= 0 ? 'text-gain font-semibold' : 'text-loss font-semibold'
            }
          >
            {formatSignedUsd(deal.result.profit)}
          </p>
        </div>
        <div>
          <p className="text-foreground-subtle text-[0.6875rem]">окупаемость</p>
          <p className={deal.roi >= 0 ? 'text-gain font-semibold' : 'text-loss font-semibold'}>
            {formatPercent(deal.roi * 100, true)}
          </p>
        </div>
        <div>
          <p className="text-foreground-subtle text-[0.6875rem]">шанс в плюс</p>
          <p className="font-semibold">{formatChance(deal.result.profitChance)}</p>
        </div>
      </div>
      <Button variant="secondary" size="sm" onClick={onOpen}>
        В калькулятор
      </Button>
    </li>
  );
};
