'use client';

import { useCallback, useMemo } from 'react';

import { useLocalStore } from './local-store';

export interface Fees {
  whiteMarket: number;
  dmarket: number;
  csfloat: number;
}

export const DEFAULT_FEES: Fees = { whiteMarket: 5, dmarket: 5, csfloat: 2 };

const FEES_KEY = 'skins.fees';
const FAVORITES_KEY = 'skins.favorites';
const NO_FAVORITES: string[] = [];

export const useFeesSetting = (): [Fees, (next: Fees) => void] => {
  const [stored, setStored] = useLocalStore<Partial<Fees>>(FEES_KEY, DEFAULT_FEES);
  const fees = useMemo(() => ({ ...DEFAULT_FEES, ...stored }), [stored]);

  return [fees, setStored];
};

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
