'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import { recallValue, rememberValue, useRememberedState } from '@/hooks/use-remembered-state';

import { BlueGemPanel } from '@/components/floats/blue-gem-panel';
import {
  FLOAT_SEARCH_KEY,
  FloatSearchPanel,
  type FloatSearchStart,
} from '@/components/floats/float-search-panel';
import { SnipesPanel } from '@/components/floats/snipes-panel';
import { Segmented } from '@/components/ui/segmented';
import { Skeleton } from '@/components/ui/skeleton';
import type { Snipe } from '@/lib/api/types';

type Tab = 'finds' | 'search' | 'blueGem';

const TAB_KEY = 'float.tab';

const FloatPage = () => {
  const params = useSearchParams();
  const [start, setStart] = useState<FloatSearchStart>(() => {
    if (params.get('name') !== null) {
      rememberValue<Tab>(TAB_KEY, 'search');

      return {
        name: params.get('name'),
        from: params.get('from') ?? '',
        to: params.get('to') ?? '',
      };
    }

    return recallValue<FloatSearchStart>(FLOAT_SEARCH_KEY) ?? { name: null, from: '', to: '' };
  });
  const [tab, setTab] = useRememberedState<Tab>(
    TAB_KEY,
    params.get('tab') === 'search'
      ? 'search'
      : params.get('tab') === 'blueGem'
        ? 'blueGem'
        : 'finds',
  );
  const [searchKey, setSearchKey] = useState(0);

  const check = (snipe: Snipe) => {
    setStart({
      name: snipe.name,
      from: snipe.orderFloatRange ? String(snipe.orderFloatRange[0]) : '',
      to: snipe.orderFloatRange ? String(snipe.orderFloatRange[1]) : '',
    });
    setSearchKey((key) => key + 1);
    setTab('search');
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="page-title">Флоат</h1>
      </section>

      <Segmented
        label="Раздел"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'finds', label: 'Находки' },
          { value: 'search', label: 'Поиск по флоату' },
          { value: 'blueGem', label: 'Блюгем' },
        ]}
        className="sm:max-w-lg"
      />

      {tab === 'finds' ? (
        <SnipesPanel onCheck={check} />
      ) : tab === 'blueGem' ? (
        <BlueGemPanel />
      ) : (
        <FloatSearchPanel key={searchKey} initial={start} />
      )}
    </div>
  );
};

const FloatPageWithParams = () => (
  <Suspense fallback={<Skeleton className="h-72 rounded-3xl" />}>
    <FloatPage />
  </Suspense>
);

export default FloatPageWithParams;
