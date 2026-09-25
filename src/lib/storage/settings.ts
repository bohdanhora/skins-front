'use client';

import { useCallback } from 'react';

import { useLocalStore } from './local-store';

export interface Fees {
  /** Seller fee in percent. */
  whiteMarket: number;
  dmarket: number;
}

export const DEFAULT_FEES: Fees = { whiteMarket: 5, dmarket: 5 };

const FEES_KEY = 'skins.fees';
const FAVORITES_KEY = 'skins.favorites';
const NO_FAVORITES: string[] = [];

export const useFeesSetting = () => useLocalStore<Fees>(FEES_KEY, DEFAULT_FEES);

export const useFees = (): Fees => useFeesSetting()[0];

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
