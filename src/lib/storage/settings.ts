'use client';

import { useTheme } from 'next-themes';
import { useCallback, useMemo } from 'react';

import {
  type Theme,
  useAccountFavorites,
  useAccountSettings,
  useToggleAccountFavorite,
  useUpdateSettings,
} from '@/lib/api/account-data';
import type { SellMarketId } from '@/lib/api/types';

import { useLocalStore } from './local-store';

export type Fees = Record<SellMarketId, number>;

export const DEFAULT_FEES: Fees = { whiteMarket: 5, dmarket: 5, csfloat: 2 };
export const DEFAULT_WITHDRAWALS: Fees = { whiteMarket: 0, dmarket: 2, csfloat: 2.5 };

export const FEES_KEY = 'skins.fees';
export const WITHDRAWALS_KEY = 'skins.withdrawals';
export const FAVORITES_KEY = 'skins.favorites';
export const STEAM_PROFILE_KEY = 'skins.steamProfile';
const NO_FAVORITES: string[] = [];

const useFeeTable = (
  key: string,
  field: 'fees' | 'withdrawals',
  defaults: Fees,
): [Fees, (next: Fees) => void] => {
  const [stored, setStored] = useLocalStore<Partial<Fees>>(key, defaults);
  const { signedIn, settings } = useAccountSettings();
  const update = useUpdateSettings();
  const remote = settings?.[field] ?? null;
  const value = useMemo(
    () => ({ ...defaults, ...(signedIn && remote ? remote : stored) }),
    [defaults, signedIn, remote, stored],
  );

  const save = useCallback(
    (next: Fees) => {
      setStored(next);

      if (signedIn) update.mutate({ [field]: next });
    },
    [field, setStored, signedIn, update],
  );

  return [value, save];
};

export const useFeesSetting = (): [Fees, (next: Fees) => void] =>
  useFeeTable(FEES_KEY, 'fees', DEFAULT_FEES);

export const useFees = (): Fees => useFeesSetting()[0];

export const useWithdrawalsSetting = (): [Fees, (next: Fees) => void] =>
  useFeeTable(WITHDRAWALS_KEY, 'withdrawals', DEFAULT_WITHDRAWALS);

export const useWithdrawals = (): Fees => useWithdrawalsSetting()[0];

export const useSteamProfile = (): [string, (next: string) => void] => {
  const [stored, setStored] = useLocalStore<string>(STEAM_PROFILE_KEY, '');
  const { signedIn, settings } = useAccountSettings();
  const update = useUpdateSettings();

  const save = useCallback(
    (next: string) => {
      setStored(next);

      if (signedIn) update.mutate({ steamProfile: next });
    },
    [setStored, signedIn, update],
  );

  return [signedIn && settings ? (settings.steamProfile ?? '') : stored, save];
};

export const useThemeSetting = (): [Theme, (next: Theme) => void] => {
  const { theme = 'system', setTheme } = useTheme();
  const { signedIn } = useAccountSettings();
  const update = useUpdateSettings();

  const save = useCallback(
    (next: Theme) => {
      setTheme(next);

      if (signedIn) update.mutate({ theme: next });
    },
    [setTheme, signedIn, update],
  );

  return [theme as Theme, save];
};

export const useFavorites = () => {
  const [local, setLocal] = useLocalStore<string[]>(FAVORITES_KEY, NO_FAVORITES);
  const { signedIn } = useAccountSettings();
  const remote = useAccountFavorites();
  const toggleRemote = useToggleAccountFavorite();
  const favorites = signedIn ? remote : local;

  const toggle = useCallback(
    (name: string) => {
      const follow = !favorites.includes(name);

      if (signedIn) {
        toggleRemote.mutate({ name, follow });
      } else {
        setLocal(follow ? [name, ...local] : local.filter((entry) => entry !== name));
      }
    },
    [favorites, signedIn, toggleRemote, local, setLocal],
  );

  return { favorites, isFavorite: (name: string) => favorites.includes(name), toggle };
};
