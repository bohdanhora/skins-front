'use client';

import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
  type InfiniteData,
} from '@tanstack/react-query';

import { useFees, useWithdrawals } from '@/lib/storage/settings';

import { apiGet } from './client';
import type {
  BettingOverview,
  BlueGemSearch,
  BlueValue,
  InspectGen,
  CheapestPattern,
  PatternImages,
  TradeUpCatalog,
  BlueGemWear,
  FloatSearch,
  Inventory,
  Item,
  ItemFacets,
  ItemLibrary,
  ItemsPage,
  ItemsQuery,
  Listings,
  SalesChart,
  SnipesPage,
  SnipesQuery,
  Status,
  SteamPrice,
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

const NAMES_PER_REQUEST = 100;

export const useItemsByName = (names: string[]) => {
  const fees = useFees();
  const sorted = [...new Set(names)].sort();

  return useQuery({
    queryKey: ['items-by-name', sorted, fees],
    queryFn: async ({ signal }) => {
      const chunks: string[][] = [];

      for (let index = 0; index < sorted.length; index += NAMES_PER_REQUEST) {
        chunks.push(sorted.slice(index, index + NAMES_PER_REQUEST));
      }

      const pages = await Promise.all(
        chunks.map((chunk) =>
          apiGet<ItemsPage>(
            '/items',
            {
              names: chunk,
              limit: NAMES_PER_REQUEST,
              feeWhiteMarket: fees.whiteMarket,
              feeDmarket: fees.dmarket,
              feeCsfloat: fees.csfloat,
            },
            signal,
          ),
        ),
      );

      return new Map(pages.flatMap((page) => page.items).map((item) => [item.name, item]));
    },
    enabled: sorted.length > 0,
    placeholderData: keepPreviousData,
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

export const useItemLibrary = (
  category: string,
  weapon: string | null,
  skin: string | null,
  enabled = true,
) =>
  useQuery({
    queryKey: ['item-library', category, weapon, skin],
    queryFn: ({ signal }) =>
      apiGet<ItemLibrary>(
        '/items/library',
        { category, weapon: weapon ?? undefined, skin: skin ?? undefined },
        signal,
      ),
    staleTime: 10 * 60_000,
    enabled,
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

export const useBlueGemWeapons = () =>
  useQuery({
    queryKey: ['blue-gems', 'weapons'],
    queryFn: ({ signal }) => apiGet<{ weapons: string[] }>('/items/blue-gems/weapons', {}, signal),
    staleTime: Infinity,
  });

export const useBlueGems = (weapon: string | null, wear: BlueGemWear | null) =>
  useQuery({
    queryKey: ['blue-gems', weapon, wear],
    queryFn: ({ signal }) =>
      apiGet<BlueGemSearch>(
        '/items/blue-gems',
        { weapon: weapon ?? '', wear: wear ?? undefined },
        signal,
      ),
    enabled: weapon !== null,
    staleTime: 5 * 60_000,
  });

export const useCheapestPatterns = (name: string, enabled: boolean) =>
  useQuery({
    queryKey: ['blue-gems', 'cheapest', name],
    queryFn: ({ signal }) =>
      apiGet<{ listings: CheapestPattern[] }>('/items/blue-gems/cheapest', { name }, signal),
    enabled,
    staleTime: 5 * 60_000,
  });

export const useBlueValue = (name: string, paintSeed: number | null, enabled: boolean) =>
  useQuery({
    queryKey: ['blue-value', name, paintSeed],
    queryFn: ({ signal }) =>
      apiGet<BlueValue>('/items/blue-gems/value', { name, paintSeed: paintSeed ?? 0 }, signal),
    enabled: enabled && paintSeed !== null,
    staleTime: 30 * 60_000,
    retry: false,
  });

export const useInspectGen = (
  params: { name: string; float?: number; seed?: number; stickers?: string[] },
  enabled: boolean,
) =>
  useQuery({
    queryKey: ['inspect-gen', params],
    queryFn: ({ signal }) => apiGet<InspectGen>('/items/gen', params, signal),
    enabled,
    staleTime: Infinity,
    retry: false,
  });

export const usePatternImages = (name: string | null) =>
  useQuery({
    queryKey: ['patterns', name],
    queryFn: ({ signal }) => apiGet<PatternImages>('/items/patterns', { name: name ?? '' }, signal),
    enabled: name !== null,
    staleTime: Infinity,
    retry: false,
  });

export const useTradeUpCatalog = () =>
  useQuery({
    queryKey: ['trade-ups', 'catalog'],
    queryFn: ({ signal }) => apiGet<TradeUpCatalog>('/trade-ups/catalog', {}, signal),
    staleTime: 5 * 60_000,
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

export const useInventory = (profile: string, refreshKey: number) => {
  const fees = useFees();
  const withdrawals = useWithdrawals();

  return useQuery({
    queryKey: ['inventory', profile, fees, withdrawals, refreshKey],
    queryFn: ({ signal }) =>
      apiGet<Inventory>(
        '/inventory',
        {
          profile,
          refresh: refreshKey > 0 ? true : undefined,
          feeWhiteMarket: fees.whiteMarket,
          feeDmarket: fees.dmarket,
          feeCsfloat: fees.csfloat,
          withdrawWhiteMarket: withdrawals.whiteMarket,
          withdrawDmarket: withdrawals.dmarket,
          withdrawCsfloat: withdrawals.csfloat,
        },
        signal,
      ),
    enabled: profile.trim() !== '',
    placeholderData: keepPreviousData,
    retry: false,
  });
};

export const useSteamPrice = (name: string, enabled: boolean) =>
  useQuery({
    queryKey: ['steam-price', name],
    queryFn: ({ signal }) => apiGet<SteamPrice>('/items/steam', { name }, signal),
    enabled,
    staleTime: 15 * 60_000,
    retry: false,
  });

export const useBettingMatches = () =>
  useQuery({
    queryKey: ['betting'],
    queryFn: ({ signal }) => apiGet<BettingOverview>('/betting/matches', undefined, signal),
    refetchInterval: 5 * 60_000,
    staleTime: 60_000,
  });
