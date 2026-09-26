'use client';

import { Download, Plus, ReceiptText, SearchX, Upload } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';

import { useRememberedState } from '@/hooks/use-remembered-state';
import { useOpenItem } from '@/components/items/item-dialog-provider';
import { FilterBar, SearchField } from '@/components/items/filters';
import { SteamLoginButton } from '@/components/layout/account-menu';
import { usePurchaseForm } from '@/components/purchases/purchase-form';
import { PurchaseRow, SoldRow } from '@/components/purchases/purchase-row';
import { EmptyState } from '@/components/states/empty-state';
import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/ui/segmented';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAccount, useImportPurchases, usePurchases } from '@/lib/api/account';
import { useItemsByName } from '@/lib/api/queries';
import type { Item } from '@/lib/api/types';
import { formatSignedUsd, formatUsd } from '@/lib/format/money';
import { plural } from '@/lib/format/time';
import {
  bestOption,
  formatLockLeft,
  lockLeft,
  parseBackup,
  sellOptions,
  toInput,
  type FeeTable,
  type Purchase,
} from '@/lib/purchases/purchases';
import { useFees, useWithdrawals } from '@/lib/storage/settings';
import { cn } from '@/lib/utils/cn';

type Tab = 'held' | 'sold';
type HeldSort = 'unlock' | 'profit' | 'newest';

const SORTS: { value: HeldSort; label: string }[] = [
  { value: 'unlock', label: 'Скоро можно продать' },
  { value: 'profit', label: 'Больше прибыль' },
  { value: 'newest', label: 'Недавно купленные' },
];

const CLOCK_MS = 60_000;

const useNow = (): number => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), CLOCK_MS);

    return () => window.clearInterval(timer);
  }, []);

  return now;
};

const itemsLabel = (count: number): string =>
  `${count} ${plural(count, ['предмет', 'предмета', 'предметов'])}`;

interface TileProps {
  label: string;
  value: string;
  hint: string;
  tone?: 'gain' | 'loss';
}

const Tile = ({ label, value, hint, tone }: TileProps) => (
  <div className="bg-surface rounded-2xl p-4 shadow-[var(--shadow-card)]">
    <p className="text-foreground-muted text-[0.8125rem]">{label}</p>
    <p
      className={cn(
        'numeric mt-1.5 text-2xl font-semibold tracking-tight',
        tone === 'gain' ? 'text-gain' : tone === 'loss' ? 'text-loss' : 'text-foreground',
      )}
    >
      {value}
    </p>
    <p className="text-foreground-subtle mt-1 text-xs">{hint}</p>
  </div>
);

const bestProfit = (
  purchase: Purchase,
  item: Item | undefined,
  fees: FeeTable,
  withdrawals: FeeTable,
): number | null => {
  const best = item ? bestOption(sellOptions(item, purchase.price, fees, withdrawals)) : null;

  return best ? best.profit * purchase.amount : null;
};

const Summary = ({
  held,
  sold,
  prices,
  fees,
  withdrawals,
  now,
}: {
  held: Purchase[];
  sold: Purchase[];
  prices: Map<string, Item> | undefined;
  fees: FeeTable;
  withdrawals: FeeTable;
  now: number;
}) => {
  const invested = held.reduce((sum, purchase) => sum + purchase.price * purchase.amount, 0);
  let priced = 0;
  let profit = 0;

  for (const purchase of held) {
    const value = bestProfit(purchase, prices?.get(purchase.name), fees, withdrawals);

    if (value !== null) {
      priced += purchase.amount;
      profit += value;
    }
  }

  const realized = sold.reduce(
    (sum, purchase) => sum + purchase.sale!.received - purchase.price * purchase.amount,
    0,
  );
  const locked = held.filter((purchase) => lockLeft(purchase, now) > 0);
  const nextUnlock = Math.min(...locked.map((purchase) => lockLeft(purchase, now)));

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Tile label="Вложено" value={formatUsd(invested)} hint={itemsLabel(held.length)} />
      <Tile
        label="Прибыль, если продать сейчас"
        value={prices ? formatSignedUsd(profit) : '-'}
        hint={`По лучшей площадке после комиссий, оценено ${itemsLabel(priced)}`}
        tone={profit > 0 ? 'gain' : profit < 0 ? 'loss' : undefined}
      />
      <Tile
        label="В трейдбане"
        value={String(locked.length)}
        hint={
          locked.length > 0
            ? `Ближайший откроется через ${formatLockLeft(nextUnlock)}`
            : 'Всё можно продавать'
        }
      />
      <Tile
        label="Заработано на продажах"
        value={formatSignedUsd(realized)}
        hint={itemsLabel(sold.length)}
        tone={realized > 0 ? 'gain' : realized < 0 ? 'loss' : undefined}
      />
    </div>
  );
};

const downloadBackup = (purchases: Purchase[]) => {
  const blob = new Blob([JSON.stringify({ purchases: purchases.map(toInput) }, null, 2)], {
    type: 'application/json',
  });
  const link = document.createElement('a');

  link.href = URL.createObjectURL(blob);
  link.download = `skinscout-purchases-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
};

const PurchasesPage = () => {
  const { signedIn } = useAccount();
  const purchases = usePurchases();
  const form = usePurchaseForm();
  const openItem = useOpenItem();
  const fees = useFees();
  const withdrawals = useWithdrawals();
  const now = useNow();
  const importPurchases = useImportPurchases();
  const fileInput = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [tab, setTab] = useRememberedState<Tab>('purchases.tab', 'held');
  const [sort, setSort] = useRememberedState<HeldSort>('purchases.sort', 'unlock');
  const [search, setSearch] = useRememberedState('purchases.search', '');

  const all = useMemo(() => purchases.data ?? [], [purchases.data]);
  const held = useMemo(() => all.filter((purchase) => purchase.sale === null), [all]);
  const sold = useMemo(() => all.filter((purchase) => purchase.sale !== null), [all]);
  const prices = useItemsByName(held.map((purchase) => purchase.name));

  const visible = useMemo(() => {
    const words = search.toLowerCase().split(/\s+/).filter(Boolean);
    const matches = (purchase: Purchase) =>
      words.every(
        (word) =>
          purchase.name.toLowerCase().includes(word) ||
          purchase.note.toLowerCase().includes(word) ||
          String(purchase.paintSeed ?? '') === word,
      );

    if (tab === 'sold') {
      return sold
        .filter(matches)
        .sort((left, right) => Date.parse(right.sale!.soldAt) - Date.parse(left.sale!.soldAt));
    }

    const profitOf = (purchase: Purchase) =>
      bestProfit(purchase, prices.data?.get(purchase.name), fees, withdrawals) ?? -Infinity;

    return held.filter(matches).sort((left, right) => {
      if (sort === 'profit') return profitOf(right) - profitOf(left);
      if (sort === 'newest') return Date.parse(right.boughtAt) - Date.parse(left.boughtAt);
      return Date.parse(left.unlockAt) - Date.parse(right.unlockAt);
    });
  }, [tab, sold, held, search, sort, prices.data, fees, withdrawals]);

  const onImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    event.target.value = '';

    if (!file) return;

    const parsed = parseBackup(await file.text());

    if (!parsed) {
      setImportError('Это не файл с покупками');
      return;
    }

    setImportError(null);
    importPurchases.mutate(parsed, { onError: (failure) => setImportError(failure.message) });
  };

  const header = (
    <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <h1 className="page-title">Покупки</h1>
        <p className="text-foreground-muted max-w-2xl text-[0.9375rem] leading-relaxed">
          За сколько купил, когда закончится трейдбан и сколько получишь на каждой площадке прямо
          сейчас после комиссий продажи и вывода.
        </p>
      </div>
      {signedIn ? (
        <Button onClick={() => form.add()}>
          <Plus className="size-4" aria-hidden />
          Записать покупку
        </Button>
      ) : null}
    </section>
  );

  if (!signedIn) {
    return (
      <div className="space-y-6">
        {header}
        <EmptyState
          icon={<ReceiptText className="size-6" aria-hidden />}
          title="Войди через Steam"
          description="Покупки хранятся в аккаунте и видны с любого устройства."
          action={<SteamLoginButton />}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}

      {!purchases.data ? (
        purchases.isError ? (
          <EmptyState
            icon={<SearchX className="size-6" aria-hidden />}
            title="Не получилось загрузить покупки"
            description={purchases.error.message}
          />
        ) : (
          <div className="space-y-3">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-36 rounded-3xl" />
            <Skeleton className="h-36 rounded-3xl" />
          </div>
        )
      ) : all.length === 0 ? (
        <EmptyState
          icon={<ReceiptText className="size-6" aria-hidden />}
          title="Пока ничего не записано"
          description="Запиши покупку сразу после сделки: цену, флоат и паттерн. Трейдбан посчитается сам."
          action={
            <Button onClick={() => form.add()}>
              <Plus className="size-4" aria-hidden />
              Записать покупку
            </Button>
          }
        />
      ) : (
        <>
          <Summary
            held={held}
            sold={sold}
            prices={prices.data}
            fees={fees}
            withdrawals={withdrawals}
            now={now}
          />

          <FilterBar>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <Segmented
                value={tab}
                onChange={setTab}
                label="Какие покупки показать"
                options={[
                  { value: 'held', label: `Держу · ${held.length}` },
                  { value: 'sold', label: `Продано · ${sold.length}` },
                ]}
                className="lg:w-72"
              />
              <SearchField
                value={search}
                onChange={setSearch}
                placeholder="Название, заметка или паттерн"
                className="lg:w-80"
              />
              {tab === 'held' ? (
                <Select
                  value={sort}
                  onChange={setSort}
                  options={SORTS}
                  aria-label="Сортировка"
                  className="lg:ml-auto lg:w-60"
                />
              ) : null}
            </div>
          </FilterBar>

          {visible.length === 0 ? (
            <EmptyState
              icon={<SearchX className="size-6" aria-hidden />}
              title="Ничего не нашлось"
              description={
                tab === 'sold' && sold.length === 0
                  ? 'Когда продашь предмет, нажми «Продал», и он переедет сюда с итоговой прибылью.'
                  : 'Попробуй изменить поиск.'
              }
            />
          ) : (
            <div className="space-y-2.5">
              {visible.map((purchase) =>
                tab === 'sold' ? (
                  <SoldRow key={purchase.id} purchase={purchase} onOpen={openItem} />
                ) : (
                  <PurchaseRow
                    key={purchase.id}
                    purchase={purchase}
                    item={prices.data?.get(purchase.name)}
                    fees={fees}
                    withdrawals={withdrawals}
                    now={now}
                    onOpen={openItem}
                  />
                ),
              )}
            </div>
          )}
        </>
      )}

      {purchases.data ? (
        <div className="flex flex-wrap items-center gap-2">
          {all.length > 0 ? (
            <Button variant="ghost" size="sm" onClick={() => downloadBackup(all)}>
              <Download className="size-4" aria-hidden />
              Скачать копию
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            disabled={importPurchases.isPending}
            onClick={() => fileInput.current?.click()}
          >
            <Upload className="size-4" aria-hidden />
            Загрузить из файла
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => void onImport(event)}
          />
          {importError ? <p className="text-loss text-sm">{importError}</p> : null}
        </div>
      ) : null}
    </div>
  );
};

export default PurchasesPage;
