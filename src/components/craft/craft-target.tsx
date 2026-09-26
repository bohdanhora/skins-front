'use client';

import { useMemo } from 'react';

import { useRememberedState } from '@/hooks/use-remembered-state';

import { FilterBar } from '@/components/items/filters';
import { ItemImage } from '@/components/items/item-image';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import type { Wear } from '@/lib/format/item-name';
import { formatFloat } from '@/lib/format/float';
import { formatSignedUsd, formatUsd } from '@/lib/format/money';
import { TIER_LABELS, quoteOf, skinWears, type TradeUpIndex } from '@/lib/trade-up/contract';
import { inputTier, targetPlans, type PricedInput, type TargetPlan } from '@/lib/trade-up/plans';

import { SkinPicker, formatChance } from './craft-shared';

const PLANS_SHOWN = 15;

export const CraftTarget = ({
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
  const [targetName, setTargetName] = useRememberedState<string | null>('craft.target', null);
  const [wear, setWear] = useRememberedState<Wear | null>('craft.targetWear', null);
  const target = targetName ? (index.byName.get(targetName) ?? null) : null;
  const outputs = useMemo(
    () => index.skins.filter((skin) => inputTier(skin.tier) !== null),
    [index],
  );
  const plans = useMemo(
    () => (target ? targetPlans(index, target, wear, statTrak, sellFee) : null),
    [index, target, wear, statTrak, sellFee],
  );
  const targetQuote = target ? quoteOf(target, wear, statTrak) : null;

  return (
    <div className="space-y-6">
      <FilterBar>
        {target ? (
          <div className="flex items-center gap-3">
            <ItemImage
              src={target.image}
              alt={target.name}
              rarityColor={null}
              className="size-16 shrink-0"
              imageClassName="p-1"
            />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{target.name}</p>
              <p className="text-foreground-muted text-xs">
                {TIER_LABELS[target.tier]} · {target.collections[0] ?? target.cases[0]} · флоат{' '}
                {target.minFloat}–{target.maxFloat}
                {targetQuote ? ` · сейчас от ${formatUsd(targetQuote.price)}` : ''}
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setTargetName(null)}>
              Другой
            </Button>
          </div>
        ) : (
          <SkinPicker
            skins={outputs}
            onPick={(skin) => {
              setTargetName(skin.name);
              setWear(skinWears(skin)[0] ?? null);
            }}
            statTrak={statTrak}
            placeholder="Что хочешь получить? Например, karambit fade"
          />
        )}
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          <Chip selected={statTrak} onClick={() => setStatTrak(!statTrak)}>
            StatTrak™
          </Chip>
          {target && !target.wearless
            ? skinWears(target).map((value) => (
                <Chip key={value} selected={wear === value} onClick={() => setWear(value)}>
                  {value} или лучше
                </Chip>
              ))
            : null}
        </div>
      </FilterBar>

      {!target || !plans ? null : plans.impossible ? (
        <p className="text-foreground-muted text-sm">
          Этот скин нельзя получить крафтом{statTrak ? ' в StatTrak™' : ''}.
        </p>
      ) : plans.plans.length === 0 ? (
        <p className="text-foreground-muted text-sm">
          Нет входов с ценой, которые дадут такой износ.
        </p>
      ) : (
        <section className="space-y-3">
          <p className="text-foreground-muted text-sm">
            Флоат результата должен быть до {formatFloat(plans.outputCap, 4)}. «Цена попытки»
            делённая на шанс показывает, сколько в среднем стоит получить цель.
          </p>
          <ul className="divide-border border-border bg-surface divide-y overflow-hidden rounded-2xl border">
            {plans.plans.slice(0, PLANS_SHOWN).map((plan, position) => (
              <PlanRow key={position} plan={plan} onOpen={() => onOpen(plan.inputs)} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

const InputLine = ({ input, count }: { input: PricedInput; count: number }) => (
  <p className="text-sm">
    <span className="numeric font-semibold">{count}×</span> {input.skin.name}{' '}
    <span className="text-foreground-muted">
      {input.wear ?? ''} {formatUsd(input.price)}
      {input.floatCap !== null ? `, нужен флоат до ${formatFloat(input.floatCap, 4)}` : ''}
    </span>
  </p>
);

const PlanRow = ({ plan, onOpen }: { plan: TargetPlan; onOpen: () => void }) => (
  <li className="flex flex-wrap items-center gap-4 px-4 py-3">
    <div className="min-w-60 flex-1 space-y-0.5">
      <InputLine input={plan.lead} count={plan.leadCount} />
      {plan.filler ? (
        <InputLine input={plan.filler} count={plan.inputs.length - plan.leadCount} />
      ) : null}
    </div>
    <div className="numeric grid grid-cols-4 gap-4 text-right text-sm">
      <div>
        <p className="text-foreground-subtle text-[0.6875rem]">шанс цели</p>
        <p className="font-semibold">{formatChance(plan.chance)}</p>
      </div>
      <div>
        <p className="text-foreground-subtle text-[0.6875rem]">попытка</p>
        <p className="font-semibold">{formatUsd(plan.result.cost)}</p>
      </div>
      <div>
        <p className="text-foreground-subtle text-[0.6875rem]">цель в среднем</p>
        <p className="font-semibold">{formatUsd(Math.round(plan.result.cost / plan.chance))}</p>
      </div>
      <div>
        <p className="text-foreground-subtle text-[0.6875rem]">ожид. прибыль</p>
        <p
          className={
            plan.result.profit >= 0 ? 'text-gain font-semibold' : 'text-loss font-semibold'
          }
        >
          {formatSignedUsd(plan.result.profit)}
        </p>
      </div>
    </div>
    <Button variant="secondary" size="sm" onClick={onOpen}>
      В калькулятор
    </Button>
  </li>
);
