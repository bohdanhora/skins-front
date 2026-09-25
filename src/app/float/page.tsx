'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import { FloatSearchPanel, type FloatSearchStart } from '@/components/floats/float-search-panel';
import { SnipesPanel } from '@/components/floats/snipes-panel';
import { Segmented } from '@/components/ui/segmented';
import { Skeleton } from '@/components/ui/skeleton';
import type { Snipe } from '@/lib/api/types';

type Tab = 'finds' | 'search';

const FloatPage = () => {
  const params = useSearchParams();
  const [tab, setTab] = useState<Tab>(
    params.get('name') || params.get('tab') === 'search' ? 'search' : 'finds',
  );
  const [start, setStart] = useState<FloatSearchStart>({
    name: params.get('name'),
    from: params.get('from') ?? '',
    to: params.get('to') ?? '',
  });
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
        ]}
        className="sm:max-w-md"
      />

      {tab === 'finds' ? (
        <SnipesPanel onCheck={check} />
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
