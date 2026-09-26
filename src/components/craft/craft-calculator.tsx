'use client';

import { ArrowRightLeft, Gauge, Minus, Plus, X } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { FilterBar } from '@/components/items/filters';
import { ItemImage } from '@/components/items/item-image';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Input } from '@/components/ui/input';
import { Segmented } from '@/components/ui/segmented';
import { Select } from '@/components/ui/select';
import type { SellMarketId, TradeUpSkin } from '@/lib/api/types';
import { WEAR_RANGES, formatFloat } from '@/lib/format/float';
import type { Wear } from '@/lib/format/item-name';
import { formatSignedUsd, formatUsd } from '@/lib/format/money';
import {
  TIER_LABELS,
  canTradeUp,
  contractSize,
  evaluateContract,
  quoteOf,
  skinWears,
  worstFloatInWear,
  type TradeUpIndex,
} from '@/lib/trade-up/contract';
import { pricedInput, type PricedInput } from '@/lib/trade-up/plans';

import { ContractProblems, ContractStats, OutcomeList } from './contract-summary';
import {
  SELL_MARKET_OPTIONS,
  SkinPicker,
  formatChance,
  groupInputs,
  newGroup,
  type CraftGroup,
} from './craft-shared';

type ReplaceOrder = 'profit' | 'cost' | 'chance';

const REPLACEMENTS_SHOWN = 8;

export const CraftCalculator = ({
  index,
  groups,
  setGroups,
  statTrak,
  setStatTrak,
  sellMarket,
  setSellMarket,
  sellFee,
}: {
  index: TradeUpIndex;
  groups: CraftGroup[];
  setGroups: (groups: CraftGroup[]) => void;
  statTrak: boolean;
  setStatTrak: (value: boolean) => void;
  sellMarket: SellMarketId;
  setSellMarket: (value: SellMarketId) => void;
  sellFee: number;
}) => {
  const [replacing, setReplacing] = useState<number | null>(null);
  const inputs = useMemo(() => groupInputs(index, groups, statTrak), [index, groups, statTrak]);
  const result = useMemo(
    () => evaluateContract(index, inputs, statTrak, sellFee),
    [index, inputs, statTrak, sellFee],
  );
  const tier = inputs[0]?.skin.tier ?? null;
  const size = tier ? contractSize(tier) : 10;
  const filled = groups.reduce((sum, group) => sum + group.count, 0);
  const pickable = useMemo(
    () =>
      index.skins.filter(
        (skin) => (!tier || skin.tier === tier) && canTradeUp(index, skin, statTrak),
      ),
    [index, tier, statTrak],
  );

  const update = (position: number, next: Partial<CraftGroup>) =>
    setGroups(groups.map((group, index) => (index === position ? { ...group, ...next } : group)));

  const add = (skin: TradeUpSkin) =>
    setGroups([...groups, newGroup(skin, statTrak, Math.max(1, contractSize(skin.tier) - filled))]);

  return (
    <div className="space-y-6">
      <FilterBar>
        <div className="flex flex-wrap items-center gap-2">
          <Chip selected={statTrak} onClick={() => setStatTrak(!statTrak)}>
            StatTrak™
          </Chip>
          <Select
            value={sellMarket}
            onChange={setSellMarket}
            options={SELL_MARKET_OPTIONS}
            aria-label="Где продаю результат"
            className="w-64"
          />
          <span className="text-foreground-muted text-sm">комиссия {sellFee}%</span>
          {groups.length > 0 ? (
            <Button variant="secondary" size="sm" className="ml-auto" onClick={() => setGroups([])}>
              Очистить
            </Button>
          ) : null}
        </div>
        <SkinPicker
          skins={pickable}
          onPick={add}
          statTrak={statTrak}
          placeholder={
            tier
              ? `Добавить ${TIER_LABELS[tier].toLowerCase()} скин`
              : 'Какой скин кладём в контракт?'
          }
        />
        <p className="text-foreground-muted text-sm">
          В контракте {filled} из {size}
          {tier ? ` · ${TIER_LABELS[tier]}` : ''}. Флоат по умолчанию худший в износе, цена самого
          дешёвого лота этого износа на всех площадках.
        </p>
      </FilterBar>

      {groups.length > 0 ? (
        <ul className="divide-border border-border bg-surface divide-y rounded-2xl border">
          {groups.map((group, position) => {
            const skin = index.byName.get(group.name);

            if (!skin) return null;

            return (
              <li key={`${group.name}-${position}`} className="space-y-3 px-4 py-3">
                <GroupRow
                  skin={skin}
                  group={group}
                  statTrak={statTrak}
                  onChange={(next) => update(position, next)}
                  onRemove={() => setGroups(groups.filter((_, index) => index !== position))}
                  onReplace={() => setReplacing(replacing === position ? null : position)}
                  replacing={replacing === position}
                />
                {replacing === position ? (
                  <Replacements
                    index={index}
                    groups={groups}
                    position={position}
                    statTrak={statTrak}
                    sellFee={sellFee}
                    baseProfit={result.profit}
                    onPick={(input) => {
                      update(position, {
                        name: input.skin.name,
                        wear: input.wear,
                        float: input.float,
                      });
                      setReplacing(null);
                    }}
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      {groups.length > 0 ? (
        <section className="space-y-3">
          <ContractProblems problems={result.problems} />
          <ContractStats result={result} />
          <p className="text-foreground-muted text-xs">
            Средний нормализованный флоат {formatFloat(result.averageNormalized, 4)}. У результата
            флоат = минимум + это значение × (максимум − минимум) его диапазона.
          </p>
          {result.outcomes.length > 0 ? <OutcomeList result={result} /> : null}
        </section>
      ) : null}
    </div>
  );
};

const GroupRow = ({
  skin,
  group,
  statTrak,
  onChange,
  onRemove,
  onReplace,
  replacing,
}: {
  skin: TradeUpSkin;
  group: CraftGroup;
  statTrak: boolean;
  onChange: (next: Partial<CraftGroup>) => void;
  onRemove: () => void;
  onReplace: () => void;
  replacing: boolean;
}) => {
  const [floatText, setFloatText] = useState(String(group.float));
  const wears = skinWears(skin);
  const quote = quoteOf(skin, group.wear, statTrak);
  const floatSearch = group.wear
    ? `/float?name=${encodeURIComponent(`${statTrak ? 'StatTrak™ ' : ''}${skin.name} (${WEAR_FULL[group.wear]})`)}&to=${group.float}`
    : null;

  const setFloat = (text: string) => {
    setFloatText(text);

    const value = Number(text.replace(',', '.'));

    if (text !== '' && Number.isFinite(value) && value >= skin.minFloat && value <= skin.maxFloat) {
      onChange({ float: value });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <ItemImage
        src={skin.image}
        alt={skin.name}
        rarityColor={null}
        className="size-14 shrink-0"
        imageClassName="p-1"
      />
      <div className="min-w-40 flex-1">
        <p className="text-sm font-medium">{skin.name}</p>
        <p className="text-foreground-muted text-xs">
          {skin.collections[0] ?? skin.cases[0]} · флоат {skin.minFloat}–{skin.maxFloat}
        </p>
      </div>
      {wears.length > 0 ? (
        <Select
          value={group.wear ?? wears[0]}
          onChange={(wear: Wear) => {
            const float = worstFloatInWear(skin, wear);

            setFloatText(String(float));
            onChange({ wear, float });
          }}
          options={wears.map((wear) => {
            const price = quoteOf(skin, wear, statTrak);

            return { value: wear, label: `${wear} ${price ? formatUsd(price.price) : '—'}` };
          })}
          aria-label="Износ"
          className="w-36"
        />
      ) : null}
      <Input
        inputMode="decimal"
        value={floatText}
        onChange={(event) => setFloat(event.target.value.replace(/[^\d.,]/g, ''))}
        aria-label="Флоат"
        title={
          group.wear ? `${WEAR_RANGES[group.wear][0]}–${WEAR_RANGES[group.wear][1]}` : undefined
        }
        className="numeric w-28"
      />
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Меньше"
          onClick={() => (group.count > 1 ? onChange({ count: group.count - 1 }) : onRemove())}
          className="hover:bg-surface-muted rounded-full p-1.5"
        >
          <Minus className="size-4" aria-hidden />
        </button>
        <span className="numeric w-6 text-center text-sm font-semibold">{group.count}</span>
        <button
          type="button"
          aria-label="Больше"
          onClick={() => onChange({ count: group.count + 1 })}
          className="hover:bg-surface-muted rounded-full p-1.5"
        >
          <Plus className="size-4" aria-hidden />
        </button>
      </div>
      <div className="w-24 text-right">
        <p className="numeric text-sm font-semibold">
          {quote ? formatUsd(quote.price * group.count) : 'нет цены'}
        </p>
        {quote ? (
          <p className="text-foreground-subtle numeric text-xs">{formatUsd(quote.price)} шт.</p>
        ) : null}
      </div>
      <div className="flex items-center gap-1">
        {floatSearch ? (
          <Link
            href={floatSearch as Route}
            title="Найти лоты с таким флоатом"
            className="text-foreground-muted hover:bg-surface-muted hover:text-foreground rounded-full p-2"
          >
            <Gauge className="size-4" aria-hidden />
          </Link>
        ) : null}
        <button
          type="button"
          onClick={onReplace}
          aria-pressed={replacing}
          title="Чем заменить"
          className="text-foreground-muted hover:bg-surface-muted hover:text-foreground rounded-full p-2"
        >
          <ArrowRightLeft className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Убрать"
          className="text-foreground-muted hover:bg-surface-muted hover:text-foreground rounded-full p-2"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
};

const WEAR_FULL: Record<Wear, string> = {
  FN: 'Factory New',
  MW: 'Minimal Wear',
  FT: 'Field-Tested',
  WW: 'Well-Worn',
  BS: 'Battle-Scarred',
};

const Replacements = ({
  index,
  groups,
  position,
  statTrak,
  sellFee,
  baseProfit,
  onPick,
}: {
  index: TradeUpIndex;
  groups: CraftGroup[];
  position: number;
  statTrak: boolean;
  sellFee: number;
  baseProfit: number;
  onPick: (input: PricedInput) => void;
}) => {
  const [order, setOrder] = useState<ReplaceOrder>('profit');
  const current = groups[position];
  const base = useMemo(() => {
    const inputs = groupInputs(index, groups, statTrak);
    const top = evaluateContract(index, inputs, statTrak, sellFee).outcomes[0];

    return top?.skin.name ?? null;
  }, [index, groups, statTrak, sellFee]);
  const options = useMemo(() => {
    const skin = index.byName.get(current.name);

    if (!skin) return [];

    const others = groups.filter((_, index) => index !== position);

    return index.skins
      .filter((entry) => entry.tier === skin.tier && canTradeUp(index, entry, statTrak))
      .flatMap((entry) =>
        (skinWears(entry).length > 0 ? skinWears(entry) : [null]).map((wear) =>
          pricedInput(entry, wear, statTrak),
        ),
      )
      .flatMap((input) => {
        if (!input) return [];

        const inputs = [
          ...groupInputs(index, others, statTrak),
          ...Array.from({ length: current.count }, () => input),
        ];
        const result = evaluateContract(index, inputs, statTrak, sellFee);
        const chance =
          result.outcomes.find((outcome) => outcome.skin.name === base)?.probability ?? 0;

        return [{ input, result, chance }];
      });
  }, [index, groups, position, current, statTrak, sellFee, base]);

  const sorted = [...options]
    .sort((left, right) =>
      order === 'profit'
        ? right.result.profit - left.result.profit
        : order === 'cost'
          ? left.result.cost - right.result.cost
          : right.chance - left.chance,
    )
    .slice(0, REPLACEMENTS_SHOWN);

  return (
    <div className="bg-surface-muted space-y-3 rounded-2xl p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">Чем заменить {current.count} шт.</span>
        <Segmented
          label="Сортировка замен"
          value={order}
          onChange={setOrder}
          options={[
            { value: 'profit', label: 'Прибыльнее' },
            { value: 'cost', label: 'Дешевле' },
            { value: 'chance', label: base ? 'Шанс лучшего' : 'Шанс' },
          ]}
          className="w-auto"
        />
      </div>
      <ul className="space-y-1">
        {sorted.map(({ input, result, chance }) => (
          <li key={`${input.skin.name}-${input.wear}`}>
            <button
              type="button"
              onClick={() => onPick(input)}
              className="hover:bg-surface flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left"
            >
              <ItemImage
                src={input.skin.image}
                alt={input.skin.name}
                rarityColor={null}
                className="size-10 shrink-0"
                imageClassName="p-0.5"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">
                  {input.skin.name} {input.wear ?? ''}
                </span>
                <span className="text-foreground-muted block truncate text-xs">
                  {input.skin.collections[0] ?? input.skin.cases[0]} · {formatUsd(input.price)} шт.
                </span>
              </span>
              <span className="numeric text-foreground-muted w-28 text-right text-xs whitespace-nowrap">
                {base ? `${formatChance(chance)} лучшего` : ''}
              </span>
              <span
                className={
                  result.profit - baseProfit >= 0
                    ? 'text-gain numeric w-24 text-right text-sm font-semibold'
                    : 'text-loss numeric w-24 text-right text-sm font-semibold'
                }
              >
                {formatSignedUsd(result.profit - baseProfit)}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="text-foreground-muted text-xs">
        Справа как изменится ожидаемая прибыль, «лучший» это самый дорогой исход сейчас.
      </p>
    </div>
  );
};
