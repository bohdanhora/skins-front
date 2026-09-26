'use client';

import { FlaskConical } from 'lucide-react';

import { useRememberedState } from '@/hooks/use-remembered-state';

import { CraftCalculator } from '@/components/craft/craft-calculator';
import { CraftDeals } from '@/components/craft/craft-deals';
import {
  inputsToGroups,
  useSellFee,
  useTradeUpIndex,
  type CraftGroup,
} from '@/components/craft/craft-shared';
import { CraftTarget } from '@/components/craft/craft-target';
import { EmptyState } from '@/components/states/empty-state';
import { Segmented } from '@/components/ui/segmented';
import { Skeleton } from '@/components/ui/skeleton';
import type { SellMarketId } from '@/lib/api/types';
import type { PricedInput } from '@/lib/trade-up/plans';

type Tab = 'calculator' | 'target' | 'deals';

const NO_GROUPS: CraftGroup[] = [];

const CraftPage = () => {
  const { catalog, index } = useTradeUpIndex();
  const [tab, setTab] = useRememberedState<Tab>('craft.tab', 'calculator');
  const [groups, setGroups] = useRememberedState<CraftGroup[]>('craft.groups', NO_GROUPS);
  const [statTrak, setStatTrak] = useRememberedState('craft.statTrak', false);
  const [sellMarket, setSellMarket] = useRememberedState<SellMarketId>(
    'craft.sellMarket',
    'dmarket',
  );
  const sellFee = useSellFee(sellMarket);

  const open = (inputs: PricedInput[]) => {
    setGroups(inputsToGroups(inputs));
    setTab('calculator');
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="page-title">Крафт</h1>
        <p className="text-foreground-muted max-w-2xl text-[0.9375rem] leading-relaxed">
          Контракт обмена: 10 скинов одной редкости дают один скин следующей, 5 Covert дают нож или
          перчатки из их кейса. Шанс исхода равен доле входов из его коллекции, делённой на число
          скинов следующей редкости в ней. Цены самые низкие по всем площадкам.
        </p>
      </section>

      <Segmented
        label="Раздел"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'calculator', label: 'Калькулятор' },
          { value: 'target', label: 'Хочу скрафтить' },
          { value: 'deals', label: 'Выгодные' },
        ]}
        className="sm:max-w-lg"
      />

      {catalog.isError ? (
        <EmptyState
          icon={<FlaskConical className="size-6" aria-hidden />}
          title="Не получилось загрузить скины"
          description={catalog.error.message}
        />
      ) : !index ? (
        <Skeleton className="h-72 rounded-3xl" />
      ) : tab === 'calculator' ? (
        <CraftCalculator
          index={index}
          groups={groups}
          setGroups={setGroups}
          statTrak={statTrak}
          setStatTrak={setStatTrak}
          sellMarket={sellMarket}
          setSellMarket={setSellMarket}
          sellFee={sellFee}
        />
      ) : tab === 'target' ? (
        <CraftTarget
          index={index}
          statTrak={statTrak}
          setStatTrak={setStatTrak}
          sellFee={sellFee}
          onOpen={open}
        />
      ) : (
        <CraftDeals
          index={index}
          statTrak={statTrak}
          setStatTrak={setStatTrak}
          sellFee={sellFee}
          onOpen={open}
        />
      )}
    </div>
  );
};

export default CraftPage;
