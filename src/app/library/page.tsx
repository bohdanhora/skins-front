'use client';

import { ArrowRight, Search } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useEffect, useMemo } from 'react';

import { useRememberedState } from '@/hooks/use-remembered-state';
import { ItemImage } from '@/components/items/item-image';
import { ItemTitle } from '@/components/items/item-title';
import { EmptyState } from '@/components/states/empty-state';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useItemLibrary } from '@/lib/api/queries';
import type { ItemCategory, ItemLibraryVariant } from '@/lib/api/types';
import { formatUsd } from '@/lib/format/money';
import { CATEGORIES } from '@/lib/markets';
import { cn } from '@/lib/utils/cn';

const LIBRARY_CATEGORIES: ItemCategory[] = [
  'rifle',
  'pistol',
  'smg',
  'heavy',
  'sniper',
  'knife',
  'gloves',
];

const categoryLabel = (category: ItemCategory): string =>
  CATEGORIES.find((entry) => entry.value === category)?.label ?? category;

const variantLabel = (variant: ItemLibraryVariant): string => {
  const wear = variant.name.match(
    /\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)/,
  )?.[1];
  const edition = variant.name.includes('StatTrak™')
    ? 'StatTrak™'
    : variant.name.startsWith('Souvenir ')
      ? 'Souvenir'
      : null;
  const phase = variant.phase
    ? {
        'phase-1': 'Phase 1',
        'phase-2': 'Phase 2',
        'phase-3': 'Phase 3',
        'phase-4': 'Phase 4',
        ruby: 'Ruby',
        sapphire: 'Sapphire',
        emerald: 'Emerald',
        'black-pearl': 'Black Pearl',
      }[variant.phase]
    : null;

  return [edition, wear, phase].filter(Boolean).join(' · ') || 'Обычный';
};

const LibraryPage = () => {
  const [category, setCategory] = useRememberedState<ItemCategory>('library.category', 'rifle');
  const [weapon, setWeapon] = useRememberedState<string | null>('library.weapon', null);
  const [skin, setSkin] = useRememberedState<string | null>('library.skin', null);
  const [search, setSearch] = useRememberedState('library.search', '');
  const library = useItemLibrary(category, weapon, null);
  const variants = useItemLibrary(category, weapon, skin, skin !== null);

  useEffect(() => {
    if (!weapon && library.data?.weapons[0]) {
      setWeapon(library.data.weapons[0].value);
    }
  }, [library.data?.weapons, weapon, setWeapon]);

  const skins = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return needle
      ? (library.data?.skins ?? []).filter((entry) => entry.value.toLowerCase().includes(needle))
      : (library.data?.skins ?? []);
  }, [library.data?.skins, search]);

  const chooseCategory = (next: ItemCategory) => {
    setCategory(next);
    setWeapon(null);
    setSkin(null);
    setSearch('');
  };

  const chooseWeapon = (next: string) => {
    setWeapon(next);
    setSkin(null);
    setSearch('');
  };

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="page-title">Библиотека скинов</h1>
        <p className="text-foreground-muted max-w-2xl text-[0.9375rem] leading-relaxed">
          Выбери оружие по картинке, найди нужный скин и открой его в сравнении цен или поиске по
          флоату.
        </p>
      </section>

      <div className="bg-surface rounded-3xl p-2 shadow-[var(--shadow-card)]">
        <div className="flex gap-1 overflow-x-auto">
          {LIBRARY_CATEGORIES.map((entry) => (
            <button
              key={entry}
              type="button"
              onClick={() => chooseCategory(entry)}
              className={cn(
                'press min-w-28 flex-1 rounded-2xl px-4 py-3 text-sm font-medium whitespace-nowrap',
                category === entry
                  ? 'bg-surface-muted text-foreground'
                  : 'text-foreground-muted hover:text-foreground',
              )}
            >
              {categoryLabel(entry)}
            </button>
          ))}
        </div>
      </div>

      {library.isPending && !library.data ? (
        <LibrarySkeleton />
      ) : (
        <>
          <div className="grid items-start gap-4 lg:grid-cols-[19rem_minmax(0,1fr)]">
            <aside className="border-border bg-surface rounded-3xl border p-3 lg:sticky lg:top-20">
              <div className="mb-3 px-1">
                <h2 className="font-semibold">Выбери оружие</h2>
                <p className="text-foreground-muted mt-0.5 text-xs">
                  {library.data?.weapons.length ?? 0} вариантов
                </p>
              </div>
              <div className="grid max-h-[calc(100dvh-10rem)] grid-cols-2 gap-2 overflow-y-auto pr-1">
                {(library.data?.weapons ?? []).map((entry) => (
                  <button
                    key={entry.value}
                    type="button"
                    onClick={() => chooseWeapon(entry.value)}
                    className={cn(
                      'group press rounded-2xl p-2 text-center',
                      weapon === entry.value
                        ? 'bg-accent-soft text-accent ring-accent/30 ring-1'
                        : 'bg-surface-muted text-foreground hover:bg-border',
                    )}
                  >
                    <ItemImage
                      src={entry.image}
                      alt={entry.value}
                      rarityColor={null}
                      className="aspect-[4/3]"
                      imageClassName="p-2 transition-transform duration-300 group-hover:scale-105"
                    />
                    <span className="mt-2 block truncate text-xs font-semibold">{entry.value}</span>
                  </button>
                ))}
              </div>
            </aside>

            <section className="min-w-0 space-y-4">
              <div className="border-border bg-surface flex flex-col gap-3 rounded-3xl border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{weapon ?? categoryLabel(category)}</h2>
                  <p className="text-foreground-muted mt-1 text-sm">
                    {skins.length.toLocaleString('ru-RU')} скинов с изображениями и ценами
                  </p>
                </div>
                <label className="relative sm:w-72">
                  <Search
                    className="text-foreground-subtle pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
                    aria-hidden
                  />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Найти скин"
                    className="pl-10"
                  />
                </label>
              </div>

              {skins.length === 0 ? (
                <EmptyState
                  icon={<Search className="size-6" aria-hidden />}
                  title="Скин не найден"
                  description="Попробуй другое название или выбери другое оружие."
                />
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {skins.map((entry) => (
                    <button
                      key={entry.value}
                      type="button"
                      onClick={() => setSkin(entry.value)}
                      className={cn(
                        'group bg-surface press overflow-hidden rounded-3xl p-3 text-left shadow-[var(--shadow-card)]',
                        skin === entry.value ? 'ring-accent ring-2' : '',
                      )}
                    >
                      <ItemImage
                        src={entry.image}
                        alt={`${weapon} | ${entry.value}`}
                        rarityColor={null}
                        className="aspect-[4/3]"
                        imageClassName="p-3 transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="px-1 pt-3">
                        <p className="truncate text-sm font-semibold">{entry.value}</p>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <span className="text-foreground-muted numeric text-xs">
                            от {formatUsd(entry.price)}
                          </span>
                          <span className="text-foreground-subtle text-[0.6875rem]">
                            {entry.count} вар.
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>

          {skin ? (
            <Dialog
              open
              onOpenChange={(open) => {
                if (!open) setSkin(null);
              }}
              title={`${weapon} | ${skin}`}
              description="Выбери износ, версию или точную фазу."
              className="sm:max-w-4xl"
            >
              {variants.isFetching ? (
                <Skeleton className="h-56 rounded-3xl" />
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {(variants.data?.variants ?? []).map((variant) => (
                    <article
                      key={variant.name}
                      className="border-border bg-surface flex items-center gap-3 rounded-3xl border p-3"
                    >
                      <ItemImage
                        src={variant.image}
                        alt={variant.name}
                        rarityColor={null}
                        className="size-24 shrink-0"
                        imageClassName="p-1.5"
                      />
                      <div className="min-w-0 flex-1">
                        <ItemTitle name={variant.name} />
                        <p className="text-foreground-muted mt-1 text-xs">
                          {variantLabel(variant)}
                        </p>
                        <p className="numeric mt-2 text-base font-semibold">
                          от {formatUsd(variant.price)}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button asChild size="sm" variant="secondary">
                            <Link href={`/search?q=${encodeURIComponent(variant.name)}` as Route}>
                              Цены
                            </Link>
                          </Button>
                          <Button asChild size="sm">
                            <Link
                              href={
                                `/float?tab=search&name=${encodeURIComponent(variant.name)}` as Route
                              }
                            >
                              Флоат
                              <ArrowRight className="size-3.5" aria-hidden />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </Dialog>
          ) : null}
        </>
      )}
    </div>
  );
};

const LibrarySkeleton = () => (
  <div className="space-y-5">
    <Skeleton className="h-16 rounded-3xl" />
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {Array.from({ length: 10 }, (_, index) => (
        <Skeleton key={index} className="aspect-[4/3] rounded-3xl" />
      ))}
    </div>
  </div>
);

export default LibraryPage;
