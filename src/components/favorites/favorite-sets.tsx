'use client';

import { Check, Layers, Pencil, Plus, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { useOpenItem } from '@/components/items/item-dialog-provider';
import { ItemImage } from '@/components/items/item-image';
import { ItemPicker } from '@/components/items/item-picker';
import { ItemTitle } from '@/components/items/item-title';
import { SteamLoginButton } from '@/components/layout/account-menu';
import { EmptyState } from '@/components/states/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useSessionToken } from '@/lib/api/account';
import { useDeleteFavoriteSet, useFavoriteSets, useSaveFavoriteSet } from '@/lib/api/favorite-sets';
import { useItemsByName } from '@/lib/api/queries';
import type { FavoriteSet, Item } from '@/lib/api/types';
import { formatUsd } from '@/lib/format/money';
import { plural } from '@/lib/format/time';
import { MARKETS, SELL_MARKET_ORDER } from '@/lib/markets';
import { cheapestOffer, setTotals } from '@/lib/sets/set-totals';
import { cn } from '@/lib/utils/cn';

const MAX_ITEMS = 12;

const SetCard = ({ set, prices }: { set: FavoriteSet; prices: Map<string, Item> | undefined }) => {
  const save = useSaveFavoriteSet();
  const remove = useDeleteFavoriteSet();
  const openItem = useOpenItem();
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(set.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const totals = setTotals(set.items, prices);
  const markets = SELL_MARKET_ORDER.filter((market) => totals.byMarket[market] !== null);

  const update = (items: string[], nextName = set.name) =>
    save.mutate({ id: set.id, name: nextName, items });

  const rename = (event: FormEvent) => {
    event.preventDefault();

    if (name.trim()) update(set.items, name.trim());
    setRenaming(false);
  };

  return (
    <article className="bg-surface rounded-3xl shadow-[var(--shadow-card)]">
      <header className="flex flex-wrap items-start justify-between gap-3 p-4 sm:p-5">
        <div className="min-w-0 space-y-1">
          {renaming ? (
            <form onSubmit={rename} className="flex gap-2">
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={80}
                autoFocus
                aria-label="Название набора"
                className="h-9"
              />
              <Button type="submit" size="sm" variant="secondary" aria-label="Сохранить">
                <Check className="size-4" aria-hidden />
              </Button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setRenaming(true)}
              className="group flex items-center gap-2 text-left"
            >
              <h3 className="truncate text-base font-semibold">{set.name}</h3>
              <Pencil
                className="text-foreground-subtle size-3.5 opacity-0 transition-opacity group-hover:opacity-100"
                aria-hidden
              />
            </button>
          )}
          <p className="text-foreground-subtle text-xs">
            {set.items.length} {plural(set.items.length, ['предмет', 'предмета', 'предметов'])}
            {totals.missing > 0 ? ` · ${totals.missing} без цены` : ''}
          </p>
        </div>
        <div className="text-right">
          <p className="numeric text-2xl leading-tight font-semibold tracking-tight">
            {set.items.length > 0 ? formatUsd(totals.cheapest) : '—'}
          </p>
          <p className="text-foreground-subtle text-[0.6875rem]">по самой низкой цене каждого</p>
        </div>
      </header>

      {markets.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 px-4 pb-3 sm:px-5">
          {markets.map((market) => (
            <span
              key={market}
              className="bg-surface-muted text-foreground-muted numeric inline-flex h-6 items-center gap-1.5 rounded-full px-2 text-[0.6875rem]"
            >
              <span className={cn('size-1.5 rounded-full', MARKETS[market].dot)} aria-hidden />
              всё на {MARKETS[market].short} {formatUsd(totals.byMarket[market])}
            </span>
          ))}
        </div>
      ) : null}

      {set.items.length > 0 ? (
        <ul className="grid grid-cols-2 gap-2 px-4 sm:grid-cols-3 sm:px-5 lg:grid-cols-4">
          {set.items.map((itemName) => {
            const item = prices?.get(itemName);
            const offer = cheapestOffer(item);

            return (
              <li
                key={itemName}
                className="bg-surface-muted/60 relative flex items-center gap-2.5 rounded-2xl p-2 pr-7"
              >
                <button
                  type="button"
                  onClick={() => openItem(itemName)}
                  className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                >
                  <ItemImage
                    src={item?.image ?? null}
                    alt={itemName}
                    rarityColor={item?.rarityColor ?? null}
                    className="size-14 shrink-0"
                    imageClassName="p-1"
                  />
                  <span className="min-w-0 space-y-0.5">
                    <ItemTitle name={itemName} />
                    <span className="text-foreground-muted numeric flex items-center gap-1 text-xs">
                      {offer ? (
                        <>
                          <span
                            className={cn('size-1.5 rounded-full', MARKETS[offer.market].dot)}
                            aria-hidden
                          />
                          {formatUsd(offer.price)}
                        </>
                      ) : (
                        'нет в продаже'
                      )}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => update(set.items.filter((entry) => entry !== itemName))}
                  aria-label={`Убрать ${itemName}`}
                  className="text-foreground-subtle hover:text-foreground hover:bg-surface absolute top-1.5 right-1.5 rounded-lg p-1"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
        <div className="min-w-0 flex-1">
          {set.items.length < MAX_ITEMS ? (
            <ItemPicker
              placeholder="Добавить в набор: нож, перчатки, AK..."
              onPick={(picked) => {
                if (!set.items.includes(picked.name)) update([...set.items, picked.name]);
              }}
            />
          ) : (
            <p className="text-foreground-subtle text-xs">
              В наборе максимум {MAX_ITEMS} предметов.
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-loss self-end sm:self-center"
          disabled={remove.isPending}
          onClick={() => (confirmDelete ? remove.mutate(set.id) : setConfirmDelete(true))}
        >
          {confirmDelete ? 'Точно удалить?' : 'Удалить набор'}
        </Button>
      </div>
    </article>
  );
};

export const FavoriteSets = () => {
  const signedIn = useSessionToken() !== null;
  const sets = useFavoriteSets();
  const save = useSaveFavoriteSet();
  const [name, setName] = useState('');
  const names = [...new Set((sets.data ?? []).flatMap((set) => set.items))];
  const prices = useItemsByName(names);

  if (!signedIn) {
    return (
      <EmptyState
        icon={<Layers className="size-6" aria-hidden />}
        title="Наборы хранятся в аккаунте"
        description="Собери нож, перчатки и оружие в один набор и следи за его ценой."
        action={<SteamLoginButton />}
      />
    );
  }

  const create = (event: FormEvent) => {
    event.preventDefault();

    if (!name.trim()) return;

    save.mutate({ id: null, name: name.trim(), items: [] }, { onSuccess: () => setName('') });
  };

  return (
    <div className="space-y-4">
      <form onSubmit={create} className="flex gap-2">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={80}
          placeholder="Название нового набора, например «Гамма сет»"
          aria-label="Название нового набора"
          className="sm:w-96"
        />
        <Button type="submit" disabled={save.isPending || !name.trim()}>
          <Plus className="size-4" aria-hidden />
          Создать
        </Button>
      </form>
      {save.isError ? <p className="text-loss text-sm">{save.error.message}</p> : null}

      {!sets.data ? (
        <div className="space-y-3">
          <Skeleton className="h-48 rounded-3xl" />
        </div>
      ) : sets.data.length === 0 ? (
        <EmptyState
          icon={<Layers className="size-6" aria-hidden />}
          title="Наборов пока нет"
          description="Назови набор и добавь в него нож, перчатки или что угодно. Покажем, сколько стоит всё вместе и где выгоднее собрать."
        />
      ) : (
        <div className="space-y-3">
          {sets.data.map((set) => (
            <SetCard key={set.id} set={set} prices={prices.data} />
          ))}
        </div>
      )}
    </div>
  );
};
