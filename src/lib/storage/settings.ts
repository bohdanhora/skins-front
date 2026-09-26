'use client';

import { useCallback, useMemo } from 'react';

import type { SellMarketId } from '@/lib/api/types';

import { useLocalStore } from './local-store';

export type Fees = Record<SellMarketId, number>;

export const DEFAULT_FEES: Fees = { whiteMarket: 5, dmarket: 5, csfloat: 2 };
export const DEFAULT_WITHDRAWALS: Fees = { whiteMarket: 0, dmarket: 2, csfloat: 2.5 };

const FEES_KEY = 'skins.fees';
const WITHDRAWALS_KEY = 'skins.withdrawals';
const FAVORITES_KEY = 'skins.favorites';
const STEAM_PROFILE_KEY = 'skins.steamProfile';
const NO_FAVORITES: string[] = [];

export const useFeesSetting = (): [Fees, (next: Fees) => void] => {
  const [stored, setStored] = useLocalStore<Partial<Fees>>(FEES_KEY, DEFAULT_FEES);
  const fees = useMemo(() => ({ ...DEFAULT_FEES, ...stored }), [stored]);

  return [fees, setStored];
};

export const useFees = (): Fees => useFeesSetting()[0];

export const useWithdrawalsSetting = (): [Fees, (next: Fees) => void] => {
  const [stored, setStored] = useLocalStore<Partial<Fees>>(WITHDRAWALS_KEY, DEFAULT_WITHDRAWALS);
  const withdrawals = useMemo(() => ({ ...DEFAULT_WITHDRAWALS, ...stored }), [stored]);

  return [withdrawals, setStored];
};

export const useWithdrawals = (): Fees => useWithdrawalsSetting()[0];

export const useSteamProfile = (): [string, (next: string) => void] =>
  useLocalStore<string>(STEAM_PROFILE_KEY, '');

export const useFavorites = () => {
  const [favorites, setFavorites] = useLocalStore<string[]>(FAVORITES_KEY, NO_FAVORITES);

  const toggle = useCallback(
    (name: string) => {
      setFavorites(
        favorites.includes(name)
          ? favorites.filter((entry) => entry !== name)
          : [name, ...favorites],
      );
    },
    [favorites, setFavorites],
  );

  return { favorites, isFavorite: (name: string) => favorites.includes(name), toggle };
};
