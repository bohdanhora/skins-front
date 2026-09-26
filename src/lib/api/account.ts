'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import type { Purchase, PurchaseInput } from '@/lib/purchases/purchases';
import { useLocalStore } from '@/lib/storage/local-store';

import { API_URL, SESSION_KEY, apiGet, apiSend, writeSession } from './client';

export interface Account {
  steamId: string;
  name: string | null;
  avatar: string | null;
}

export const steamLoginUrl = (next: string): string =>
  `${API_URL}/auth/steam?next=${encodeURIComponent(next)}`;

export const useSessionToken = (): string | null =>
  useLocalStore<string | null>(SESSION_KEY, null)[0];

export const useAccount = () => {
  const token = useSessionToken();
  const me = useQuery({
    queryKey: ['me', token],
    queryFn: ({ signal }) => apiGet<Account>('/auth/me', undefined, signal),
    enabled: token !== null,
    staleTime: 5 * 60_000,
    retry: false,
  });

  return {
    signedIn: token !== null,
    account: token !== null ? (me.data ?? null) : null,
    loading: token !== null && me.isPending,
  };
};

export const useLogout = () => {
  const client = useQueryClient();

  return useCallback(async () => {
    await apiSend('POST', '/auth/logout').catch(() => undefined);
    writeSession(null);
    client.removeQueries({ queryKey: ['me'] });
    client.removeQueries({ queryKey: ['purchases'] });
    client.removeQueries({ queryKey: ['settings'] });
    client.removeQueries({ queryKey: ['favorites'] });
  }, [client]);
};

const PURCHASES_KEY = ['purchases'];

export const usePurchases = () => {
  const token = useSessionToken();

  return useQuery({
    queryKey: [...PURCHASES_KEY, token],
    queryFn: ({ signal }) => apiGet<Purchase[]>('/purchases', undefined, signal),
    enabled: token !== null,
    staleTime: 5 * 60_000,
  });
};

export const useSavePurchase = () => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string | null; input: PurchaseInput }) =>
      id
        ? apiSend<Purchase>('PUT', `/purchases/${id}`, input)
        : apiSend<Purchase>('POST', '/purchases', input),
    onSuccess: () => client.invalidateQueries({ queryKey: PURCHASES_KEY }),
  });
};

export const useDeletePurchase = () => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiSend<void>('DELETE', `/purchases/${id}`),
    onSuccess: () => client.invalidateQueries({ queryKey: PURCHASES_KEY }),
  });
};

export const useImportPurchases = () => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (purchases: PurchaseInput[]) =>
      apiSend<Purchase[]>('POST', '/purchases/import', { purchases }),
    onSuccess: () => client.invalidateQueries({ queryKey: PURCHASES_KEY }),
  });
};
