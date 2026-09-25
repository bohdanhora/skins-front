'use client';

import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
  type InfiniteData,
} from '@tanstack/react-query';

import { useFees } from '@/lib/storage/settings';

import { apiGet } from './client';
import type {
  FloatSearch,
  Item,
  ItemFacets,
  ItemsPage,
  ItemsQuery,
  Listings,
  SalesChart,
  SnipesPage,
  SnipesQuery,
  Status,
} from './types';

const PAGE_SIZE = 24;
const STATUS_POLL_MS = 30_000;
const SNIPES_POLL_MS = 60_000;

export const useStatus = () =>
  useQuery({
    queryKey: ['status'],
    queryFn: ({ signal }) => apiGet<Status>('/status', undefined, signal),
    refetchInterval: STATUS_POLL_MS,
  });

export const useItems = (query: ItemsQuery, options: { enabled?: boolean } = {}) => {
  const fees = useFees();
  const status = useStatus().data;
  const pricesAt = [
    status?.whiteMarket.updatedAt,
    status?.dmarket.updatedAt,
    status?.csfloat.updatedAt,
  ];
  const fullQuery = {
    ...query,
    feeWhiteMarket: fees.whiteMarket,
    feeDmarket: fees.dmarket,
    feeCsfloat: fees.csfloat,
  };

  return useInfiniteQuery<ItemsPage, Error, InfiniteData<ItemsPage>, unknown[], number>({
    queryKey: ['items', fullQuery, pricesAt],
    queryFn: ({ pageParam, signal }) =>
      apiGet<ItemsPage>(
        '/items',
        { ...fullQuery, limit: query.limit ?? PAGE_SIZE, offset: pageParam },
        signal,
      ),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.reduce((sum, page) => sum + page.items.length, 0);

      return loaded < lastPage.total ? loaded : undefined;
    },
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
  });
};

export const useItem = (name: string | null) => {
  const fees = useFees();

  return useQuery({
    queryKey: ['item', name, fees],
    queryFn: ({ signal }) =>
      apiGet<Item>(
        '/items/one',
        {
          name: name ?? '',
          feeWhiteMarket: fees.whiteMarket,
          feeDmarket: fees.dmarket,
          feeCsfloat: fees.csfloat,
        },
        signal,
      ),
    enabled: name !== null,
  });
};

export const useItemFacets = () =>
  useQuery({
    queryKey: ['item-facets'],
    queryFn: ({ signal }) => apiGet<ItemFacets>('/items/facets', undefined, signal),
    staleTime: 60 * 60_000,
  });

export const useSalesChart = (name: string | null) =>
  useQuery({
    queryKey: ['sales', name],
    queryFn: ({ signal }) => apiGet<SalesChart>('/items/sales', { name: name ?? '' }, signal),
    enabled: name !== null,
    staleTime: 10 * 60_000,
  });

export interface FloatQuery {
  name: string | null;
  floatFrom?: number;
  floatTo?: number;
}

export const useFloatSearch = ({ name, floatFrom, floatTo }: FloatQuery) =>
  useQuery({
    queryKey: ['floats', name, floatFrom, floatTo],
    queryFn: ({ signal }) =>
      apiGet<FloatSearch>('/items/floats', { name: name ?? '', floatFrom, floatTo }, signal),
    enabled: name !== null,
    placeholderData: keepPreviousData,
  });

export const useItemListings = (name: string | null, enabled: boolean) =>
  useQuery({
    queryKey: ['listings', name],
    queryFn: ({ signal }) => apiGet<Listings>('/items/listings', { name: name ?? '' }, signal),
    enabled: name !== null && enabled,
  });

export type StickerSkinsSort = 'deal' | 'overpay' | 'price';

export interface StickerSkinsQuery {
  stickers: string[];
  item?: string;
  sort: StickerSkinsSort;
  minPrice?: number;
  maxPrice?: number;
}

export const useSkinsWithStickers = (query: StickerSkinsQuery, enabled: boolean) =>
  useQuery({
    queryKey: ['sticker-skins', query],
    queryFn: ({ signal }) =>
      apiGet<Listings>(
        '/stickers/skins',
        {
          stickers: query.stickers,
          item: query.item,
          sort: query.sort,
          minPrice: query.minPrice,
          maxPrice: query.maxPrice,
        },
        signal,
      ),
    enabled: enabled && query.stickers.length > 0,
    placeholderData: keepPreviousData,
  });

export const useSnipes = (query: SnipesQuery) => {
  const fees = useFees();
  const fullQuery = { ...query, feeDmarket: fees.dmarket };

  return useInfiniteQuery<SnipesPage, Error, InfiniteData<SnipesPage>, unknown[], number>({
    queryKey: ['snipes', fullQuery],
    queryFn: ({ pageParam, signal }) =>
      apiGet<SnipesPage>('/snipes', { ...fullQuery, limit: PAGE_SIZE, offset: pageParam }, signal),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.reduce((sum, page) => sum + page.items.length, 0);

      return loaded < lastPage.total ? loaded : undefined;
    },
    placeholderData: keepPreviousData,
    refetchInterval: SNIPES_POLL_MS,
  });
};
