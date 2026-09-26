'use client';

import { KeyRound, SearchX, Sticker } from 'lucide-react';
import { useState } from 'react';

import { FilterBar, PriceRange, SearchField } from '@/components/items/filters';
import { ItemGrid } from '@/components/items/item-grid';
import { ListingList } from '@/components/items/listing-list';
import { EmptyState } from '@/components/states/empty-state';
import { ItemFilter } from '@/components/stickers/item-filter';
import { StickerPicker } from '@/components/stickers/sticker-picker';
import { parseMoney } from '@/components/ui/input';
import { Segmented } from '@/components/ui/segmented';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import {
  useItems,
  useSkinsWithStickers,
  useStatus,
  type StickerSkinsSort,
} from '@/lib/api/queries';
import type { ItemSort } from '@/lib/api/types';

type Tab = 'prices' | 'skins';

const MAX_STICKERS = 5;

const SKIN_SORTS: { value: StickerSkinsSort; label: string }[] = [
  { value: 'deal', label: 'Выгоднее всего' },
  { value: 'overpay', label: 'Меньше доплата в долларах' },
  { value: 'price', label: 'Сначала дешёвые' },
];

const SORTS: { value: ItemSort; label: string }[] = [
  { value: 'sales8w', label: 'Чаще всего продают' },
  { value: 'popular', label: 'Больше всего лотов' },
  { value: 'benefit', label: 'Больше разница в цене' },
  { value: 'priceAsc', label: 'Сначала дешёвые' },
  { value: 'priceDesc', label: 'Сначала дорогие' },
];

const StickersPage = () => {
  const [tab, setTab] = useState<Tab>('prices');

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="page-title">Наклейки</h1>
        <p className="text-foreground-muted max-w-2xl text-[0.9375rem] leading-relaxed">
          Сравни цены на сами наклейки или найди скины, на которые они уже наклеены.
        </p>
      </section>

      <Segmented
        label="Раздел"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'prices', label: 'Цены на наклейки' },
          { value: 'skins', label: 'Скины с наклейками' },
        ]}
        className="sm:max-w-md"
      />

      {tab === 'prices' ? <StickerPrices /> : <SkinsWithStickers />}
    </div>
  );
};

const StickerPrices = () => {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<ItemSort>('popular');
  const search = useDebouncedValue(q);
  const items = useItems({ category: 'sticker', q: search.trim() || undefined, sort });

  return (
    <div className="space-y-6">
      <FilterBar>
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchField
            value={q}
            onChange={setQ}
            placeholder="Команда, игрок или турнир: s1mple, navi, katowice"
            className="sm:w-[28rem]"
          />
          <Select
            value={sort}
            onChange={setSort}
            options={SORTS}
            aria-label="Сортировка"
            className="sm:ml-auto sm:w-60"
          />
        </div>
      </FilterBar>
      <ItemGrid
        query={items}
        mode="all"
        empty={
          <EmptyState
            icon={<SearchX className="size-6" aria-hidden />}
            title="Таких наклеек не нашлось"
            description="Попробуй другое написание: названия на площадках на английском."
          />
        }
      />
    </div>
  );
};

const SkinsWithStickers = () => {
  const status = useStatus();
  const [stickers, setStickers] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [item, setItem] = useState('');
  const [sort, setSort] = useState<StickerSkinsSort>('deal');
  const priceFrom = useDebouncedValue(minPrice);
  const priceTo = useDebouncedValue(maxPrice);
  const itemText = useDebouncedValue(item).trim();

  const keysReady =
    !!status.data &&
    (status.data.whiteMarket.keysConfigured ||
      status.data.dmarket.keysConfigured ||
      status.data.csfloat.keysConfigured);

  const skins = useSkinsWithStickers(
    {
      stickers,
      item: itemText || undefined,
      sort,
      minPrice: parseMoney(priceFrom),
      maxPrice: parseMoney(priceTo),
    },
    keysReady,
  );

  if (status.data && !keysReady) {
    return (
      <EmptyState
        icon={<KeyRound className="size-6" aria-hidden />}
        title="Нужны ключи площадок"
        description="Искать скины с конкретными наклейками площадки разрешают только через личный ключ. Как только ключ одной из площадок будет подключён к серверу, поиск заработает здесь."
      />
    );
  }

  return (
    <div className="space-y-6">
      <FilterBar>
        <StickerPicker selected={stickers} onChange={setStickers} max={MAX_STICKERS} />
        <ItemFilter value={item} onChange={setItem} />
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <span className="text-foreground-muted text-sm">Цена скина</span>
            <PriceRange
              min={minPrice}
              max={maxPrice}
              onMinChange={setMinPrice}
              onMaxChange={setMaxPrice}
            />
          </div>
          <Select
            value={sort}
            onChange={setSort}
            options={SKIN_SORTS}
            aria-label="Сортировка"
            className="lg:ml-auto lg:w-72"
          />
        </div>
      </FilterBar>

      {stickers.length === 0 ? (
        <EmptyState
          icon={<Sticker className="size-6" aria-hidden />}
          title="Выбери наклейку"
          description="Покажем скины с ней на всех площадках. Сверху будут те, где за наклейку почти не доплачивают. Если выбрать несколько, найдём скины, где есть все сразу."
        />
      ) : skins.isPending ? (
        <Skeleton className="h-64 rounded-3xl" />
      ) : skins.isError ? (
        <EmptyState
          icon={<SearchX className="size-6" aria-hidden />}
          title="Не получилось найти"
          description="Площадки сейчас не отвечают. Попробуй чуть позже."
        />
      ) : (
        <div className="space-y-3">
          {sort === 'deal' ? (
            <p className="text-foreground-muted max-w-3xl text-sm leading-relaxed">
              Сравниваем цену лота с самым дешёвым таким же скином и смотрим, сколько ты
              доплачиваешь за наклейки по сравнению с их ценой по отдельности. Помни: наклейку
              нельзя снять целой, поэтому на оружии её обычно ценят дешевле, чем отдельно, кроме
              редких турниров.
            </p>
          ) : null}
          <ListingList data={skins.data} deal />
        </div>
      )}
    </div>
  );
};

export default StickersPage;
