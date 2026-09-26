'use client';

import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';

import type { SellMarketId } from './types';
import { apiGet, apiSend } from './client';
import { useSessionToken } from './account';

export type Theme = 'light' | 'dark' | 'system';
export type MarketFees = Record<SellMarketId, number>;

export interface AccountSettings {
  fees: MarketFees | null;
  withdrawals: MarketFees | null;
  steamProfile: string | null;
  theme: Theme | null;
}

export type SettingsPatch = Partial<{
  fees: MarketFees;
  withdrawals: MarketFees;
  steamProfile: string;
  theme: Theme;
}>;

const settingsKey = (token: string | null) => ['settings', token];
const favoritesKey = (token: string | null) => ['favorites', token];
const NO_NAMES: string[] = [];

export const fetchSettings = (client: QueryClient, token: string) =>
  client.fetchQuery({
    queryKey: settingsKey(token),
    queryFn: ({ signal }) => apiGet<AccountSettings>('/settings', undefined, signal),
    staleTime: 5 * 60_000,
  });

export const useAccountSettings = () => {
  const token = useSessionToken();
  const query = useQuery({
    queryKey: settingsKey(token),
    queryFn: ({ signal }) => apiGet<AccountSettings>('/settings', undefined, signal),
    enabled: token !== null,
    staleTime: 5 * 60_000,
  });

  return { signedIn: token !== null, settings: token !== null ? (query.data ?? null) : null };
};

export const saveSettings = async (
  client: QueryClient,
  token: string,
  patch: SettingsPatch,
): Promise<AccountSettings> => {
  const saved = await apiSend<AccountSettings>('PATCH', '/settings', patch);

  client.setQueryData(settingsKey(token), saved);
  return saved;
};

export const useUpdateSettings = () => {
  const client = useQueryClient();
  const token = useSessionToken();

  return useMutation({
    mutationFn: (patch: SettingsPatch) => saveSettings(client, token!, patch),
    onMutate: (patch) => {
      const previous = client.getQueryData<AccountSettings>(settingsKey(token));

      if (previous) {
        client.setQueryData<AccountSettings>(settingsKey(token), { ...previous, ...patch });
      }

      return { previous };
    },
    onError: (_error, _patch, context) => {
      if (context?.previous) client.setQueryData(settingsKey(token), context.previous);
    },
  });
};

export const useAccountFavorites = () => {
  const token = useSessionToken();
  const query = useQuery({
    queryKey: favoritesKey(token),
    queryFn: ({ signal }) => apiGet<string[]>('/favorites', undefined, signal),
    enabled: token !== null,
    staleTime: 5 * 60_000,
  });

  return query.data ?? NO_NAMES;
};

export const useToggleAccountFavorite = () => {
  const client = useQueryClient();
  const token = useSessionToken();

  return useMutation({
    mutationFn: ({ name, follow }: { name: string; follow: boolean }) =>
      follow
        ? apiSend<void>('POST', '/favorites', { name })
        : apiSend<void>('DELETE', `/favorites?name=${encodeURIComponent(name)}`),
    onMutate: ({ name, follow }) => {
      const previous = client.getQueryData<string[]>(favoritesKey(token)) ?? NO_NAMES;
      const rest = previous.filter((entry) => entry !== name);

      client.setQueryData(favoritesKey(token), follow ? [name, ...rest] : rest);
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context) client.setQueryData(favoritesKey(token), context.previous);
    },
  });
};

export const importFavorites = async (
  client: QueryClient,
  token: string,
  names: string[],
): Promise<void> => {
  const saved = await apiSend<string[]>('POST', '/favorites/import', { names });

  client.setQueryData(favoritesKey(token), saved);
};
