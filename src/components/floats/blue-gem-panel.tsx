'use client';

import { ExternalLink, Eye, Gem, KeyRound } from 'lucide-react';
import { useMemo, useRef } from 'react';

import { useRememberedState } from '@/hooks/use-remembered-state';

import { FilterBar } from '@/components/items/filters';
import { PatternPreview } from '@/components/items/pattern-preview';
import { EmptyState } from '@/components/states/empty-state';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Input, MoneyInput } from '@/components/ui/input';
import { Segmented } from '@/components/ui/segmented';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useBlueGemWeapons, useBlueGems } from '@/lib/api/queries';

import { BluePicks } from './blue-picks';
import type { BlueGemListing, BlueGemSearch, BlueGemWear } from '@/lib/api/types';
import { blueSidesLabel, formatBlue } from '@/lib/format/blue';
import { formatFloat } from '@/lib/format/float';
import { parseItemName } from '@/lib/format/item-name';
import { formatPercent, formatUsd } from '@/lib/format/money';
import { MARKETS } from '@/lib/markets';
import { cn } from '@/lib/utils/cn';

import { FloatBar } from './float-bar';

type Order = 'blue' | 'price' | 'overpay';
type Source = 'all' | BlueGemListing['market'];

const PAGE = 60;
const GUNS = new Set(['AK-47', 'Five-SeveN', 'MAC-10']);
const WEARS: BlueGemWear[] = ['FN', 'MW', 'FT', 'WW', 'BS'];

const SOURCES: { value: Source; label: string }[] = [
  { value: 'all', label: 'Все площадки' },
  { value: 'whiteMarket', label: 'white.market' },
  { value: 'dmarket', label: 'DMarket' },
  { value: 'csfloat', label: 'CSFloat' },
  { value: 'steam', label: 'Steam' },
];

const marketStyle = (market: BlueGemListing['market']) =>
  market === 'steam' ? { name: 'Steam', dot: 'bg-[#66c0f4]' } : MARKETS[market];

const overpay = (listing: BlueGemListing): number | null =>
  listing.price !== null && listing.floorPrice !== null ? listing.price - listing.floorPrice : null;

const overpayPercent = (listing: BlueGemListing): number | null => {
  const amount = overpay(listing);

  return amount !== null && listing.floorPrice ? (amount / listing.floorPrice) * 100 : null;
};

const skinName = (weapon: string): string =>
  `${GUNS.has(weapon) ? '' : '★ '}${weapon} | Case Hardened`;

const parseNumber = (value: string): number | undefined => {
  const parsed = Number(value.replace(',', '.'));

  return value.trim() !== '' && Number.isFinite(parsed) ? parsed : undefined;
};

export const BlueGemPanel = () => {
  const weapons = useBlueGemWeapons();
  const [weapon, setWeapon] = useRememberedState<string | null>('blueGem.weapon', 'AK-47');
  const [wear, setWear] = useRememberedState<BlueGemWear | null>('blueGem.wear', null);
  const [order, setOrder] = useRememberedState<Order>('blueGem.order', 'blue');
  const [source, setSource] = useRememberedState<Source>('blueGem.source', 'all');
  const [minBlue, setMinBlue] = useRememberedState('blueGem.minBlue', '');
  const [maxPrice, setMaxPrice] = useRememberedState('blueGem.maxPrice', '');
  const [maxOverpay, setMaxOverpay] = useRememberedState('blueGem.maxOverpay', '');
  const [previewSeed, setPreviewSeed] = useRememberedState('blueGem.previewSeed', '');
  const [shown, setShown] = useRememberedState('blueGem.shown', PAGE);
  const previewRef = useRef<HTMLDivElement>(null);
  const search = useBlueGems(weapon, wear);

  const list = weapons.data?.weapons ?? [];
  const guns = list.filter((name) => GUNS.has(name));
  const knives = list.filter((name) => !GUNS.has(name));

  const listings = useMemo(() => {
    const blueFloor = parseNumber(minBlue);
    const priceCap = parseNumber(maxPrice);
    const overpayCap = parseNumber(maxOverpay);
    const rows = (search.data?.listings ?? []).filter((listing) => {
      const percent = overpayPercent(listing);

      return (
        (source === 'all' || listing.market === source) &&
        (blueFloor === undefined || listing.blue.playside >= blueFloor) &&
        (priceCap === undefined ||
          (listing.price !== null && listing.price <= Math.round(priceCap * 100))) &&
        (overpayCap === undefined || (percent !== null && percent <= overpayCap))
      );
    });

    if (order === 'price') {
      return [...rows].sort((left, right) => (left.price ?? Infinity) - (right.price ?? Infinity));
    }

    if (order === 'overpay') {
      return [...rows].sort(
        (left, right) =>
          (overpay(left) ?? Infinity) - (overpay(right) ?? Infinity) ||
          right.blue.playside - left.blue.playside,
      );
    }

    return rows;
  }, [search.data, source, minBlue, maxPrice, maxOverpay, order]);

  const preview = (seed: number) => {
    setPreviewSeed(String(seed));
    previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const pick = (next: string) => {
    setWeapon(next);
    setShown(PAGE);
  };

  return (
    <div className="space-y-6">
      <p className="text-foreground-muted max-w-2xl text-[0.9375rem] leading-relaxed">
        Case Hardened со всех площадок, отсортированные по доле синего. Процент считается по
        паттерну: первое число для лицевой стороны (у AK-47 для верха), второе для обратной (у AK-47
        для магазина).
      </p>

      <FilterBar>
        <div className="space-y-2">
          {[guns, knives].map((group, index) =>
            group.length > 0 ? (
              <div
                key={index}
                className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0"
              >
                {group.map((name) => (
                  <Chip key={name} selected={name === weapon} onClick={() => pick(name)}>
                    {name}
                  </Chip>
                ))}
              </div>
            ) : null,
          )}
          {weapons.isPending ? <Skeleton className="h-9 w-full rounded-full" /> : null}
        </div>

        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          <Chip selected={wear === null} onClick={() => setWear(null)}>
            Любой износ
          </Chip>
          {WEARS.map((value) => (
            <Chip
              key={value}
              selected={wear === value}
              onClick={() => setWear(wear === value ? null : value)}
            >
              {value}
            </Chip>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-foreground-muted text-sm">Синий от</span>
            <Input
              inputMode="decimal"
              value={minBlue}
              onChange={(event) => setMinBlue(event.target.value.replace(/[^\d.,]/g, ''))}
              placeholder="0"
              aria-label="Минимальный процент синего"
              className="numeric w-20"
            />
            <span className="text-foreground-muted text-sm">%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-foreground-muted text-sm">Переплата до</span>
            <Input
              inputMode="decimal"
              value={maxOverpay}
              onChange={(event) => setMaxOverpay(event.target.value.replace(/[^\d.,]/g, ''))}
              placeholder="любая"
              aria-label="Максимальная переплата к самой низкой цене, процент"
              className="numeric w-20"
            />
            <span className="text-foreground-muted text-sm">%</span>
          </div>
          <MoneyInput
            value={maxPrice}
            onChange={setMaxPrice}
            placeholder="Цена до"
            aria-label="Цена до"
            className="w-32"
          />
          <Select
            value={source}
            onChange={setSource}
            options={SOURCES}
            aria-label="Площадка"
            className="w-44"
          />
          <Segmented
            label="Сортировка"
            value={order}
            onChange={setOrder}
            options={[
              { value: 'blue', label: 'Синее' },
              { value: 'price', label: 'Дешевле' },
              { value: 'overpay', label: 'Меньше переплата' },
            ]}
            className="w-auto"
          />
        </div>
      </FilterBar>

      <BluePicks weapon={weapon} wear={wear} />

      {weapon ? (
        <div ref={previewRef} className="scroll-mt-24">
          <FilterBar>
            <div>
              <PatternPreview
                name={skinName(weapon)}
                seed={previewSeed}
                onSeedChange={setPreviewSeed}
              />
            </div>
          </FilterBar>
        </div>
      ) : null}

      {!weapon ? (
        <EmptyState
          icon={<Gem className="size-6" aria-hidden />}
          title="Выбери предмет"
          description="Процент синего известен для всех Case Hardened."
        />
      ) : search.isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : search.isError ? (
        <EmptyState
          icon={<Gem className="size-6" aria-hidden />}
          title="Не получилось загрузить лоты"
          description={search.error.message}
          action={<Button onClick={() => search.refetch()}>Повторить</Button>}
        />
      ) : (
        <section className="space-y-3">
          <SourceNotes data={search.data} wear={wear} />
          <p className="text-foreground-muted text-sm">
            {listings.length} из {search.data.listings.length} лотов
          </p>
          {listings.length === 0 ? (
            <p className="text-foreground-muted py-6 text-center text-sm">
              Под эти условия сейчас ничего не продаётся.
            </p>
          ) : (
            <ul className="divide-border border-border bg-surface divide-y overflow-hidden rounded-2xl border">
              {listings.slice(0, shown).map((listing) => (
                <BlueGemRow
                  key={`${listing.market}-${listing.id}`}
                  listing={listing}
                  onPreview={preview}
                />
              ))}
            </ul>
          )}
          {listings.length > shown ? (
            <div className="flex justify-center">
              <Button variant="secondary" onClick={() => setShown((count) => count + PAGE)}>
                Показать ещё
              </Button>
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
};

const SourceNotes = ({ data, wear }: { data: BlueGemSearch; wear: BlueGemWear | null }) => {
  const notes: { key: string; text: string; keyIcon?: boolean }[] = [];
  const seeds = data.csfloatSeeds.map((entry) => entry.seed).join(', ');

  if (data.sources.whiteMarket === 'noKeys') {
    notes.push({ key: 'wm', text: 'Лоты white.market видны только с ключом.', keyIcon: true });
  }
  if (data.sources.csfloat === 'noKeys') {
    notes.push({
      key: 'cf',
      text: 'Добавь CSFLOAT_API_KEY, чтобы искать на CSFloat.',
      keyIcon: true,
    });
  } else if (data.sources.csfloat === 'error') {
    notes.push({
      key: 'cf',
      text: 'CSFloat сейчас не ответил, скорее всего кончился лимит запросов.',
    });
  } else if (seeds) {
    notes.push({ key: 'cf', text: `На CSFloat проверены только самые синие паттерны: ${seeds}.` });
  }
  if (data.sources.dmarket === 'error') {
    notes.push({ key: 'dm', text: 'DMarket сейчас не ответил.' });
  }
  if (data.sources.whiteMarket === 'error') {
    notes.push({ key: 'wm', text: 'white.market сейчас не ответил.' });
  }
  if (!wear) {
    notes.push({ key: 'steam', text: 'Steam проверяется, когда выбран износ.' });
  } else if (data.sources.steam === 'error') {
    notes.push({ key: 'steam', text: 'Steam временно не отдал лоты.' });
  }

  if (notes.length === 0) return null;

  return (
    <div className="space-y-1">
      {notes.map((note) => (
        <p key={note.key} className="text-foreground-muted flex items-center gap-2 text-xs">
          {note.keyIcon ? <KeyRound className="size-3.5 shrink-0" aria-hidden /> : null}
          {note.text}
        </p>
      ))}
    </div>
  );
};

const BlueGemRow = ({
  listing,
  onPreview,
}: {
  listing: BlueGemListing;
  onPreview: (seed: number) => void;
}) => {
  const market = marketStyle(listing.market);
  const parsed = parseItemName(listing.name);
  const extra = overpay(listing);
  const extraPercent = overpayPercent(listing);

  return (
    <li className="hover:bg-surface-muted flex items-center transition-colors">
      <button
        type="button"
        onClick={() => onPreview(listing.paintSeed)}
        title="Показать паттерн"
        className="w-28 shrink-0 self-stretch py-3 pl-4 text-left sm:w-36"
      >
        <span className="numeric flex items-center gap-1.5 text-base font-semibold">
          #{listing.paintSeed}
          <Eye className="text-foreground-subtle size-3.5" aria-hidden />
        </span>
        <span className="bg-surface-muted mt-1.5 block h-1.5 overflow-hidden rounded-full">
          <span
            className="bg-accent block h-full rounded-full"
            style={{ width: `${Math.min(100, listing.blue.playside)}%` }}
          />
        </span>
      </button>
      <a
        href={listing.url}
        target="_blank"
        rel="noreferrer"
        className="flex min-w-0 flex-1 items-center gap-4 py-3 pr-4 pl-4"
      >
        <div className="min-w-0 flex-1 text-xs">
          <p
            title={blueSidesLabel(listing.name)}
            className="text-accent numeric text-sm font-semibold"
          >
            {formatBlue(listing.blue)}
          </p>
          <p className="text-foreground-muted mt-0.5 flex flex-wrap items-center gap-x-2">
            <span className="flex items-center gap-1.5">
              <span className={cn('size-2 rounded-full', market.dot)} aria-hidden />
              {market.name}
            </span>
            <span>
              {[parsed.statTrak ? 'StatTrak™' : null, parsed.wear].filter(Boolean).join(' ')}
            </span>
            {listing.float !== null ? (
              <span className="numeric">флоат {formatFloat(listing.float, 4)}</span>
            ) : null}
          </p>
          {listing.float !== null ? (
            <div className="mt-1 hidden max-w-48 sm:block">
              <FloatBar value={listing.float} />
            </div>
          ) : null}
        </div>
        <div className="text-right whitespace-nowrap">
          <p className="numeric text-[0.9375rem] font-semibold">
            {listing.price !== null ? formatUsd(listing.price) : listing.priceLabel}
          </p>
          {listing.market === 'steam' && listing.price !== null ? (
            <p className="text-foreground-subtle numeric text-xs">{listing.priceLabel}</p>
          ) : null}
          {listing.floorPrice !== null ? (
            <p className="text-foreground-muted numeric mt-0.5 text-xs">
              мин. {formatUsd(listing.floorPrice)}
              {extra !== null && extra > 0 && extraPercent !== null ? (
                <span className="text-foreground-subtle"> · +{formatPercent(extraPercent)}</span>
              ) : null}
            </p>
          ) : null}
        </div>
        <ExternalLink className="text-foreground-subtle size-3.5 shrink-0" aria-hidden />
      </a>
    </li>
  );
};
