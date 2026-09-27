'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSessionToken } from './account';
import { apiGet, apiSend } from './client';
import type { FavoriteSet } from './types';

const setsKey = (token: string | null) => ['favorite-sets', token];

export const useFavoriteSets = () => {
  const token = useSessionToken();

  return useQuery({
    queryKey: setsKey(token),
    queryFn: ({ signal }) => apiGet<FavoriteSet[]>('/favorite-sets', undefined, signal),
    enabled: token !== null,
    staleTime: 5 * 60_000,
  });
};

export const useSaveFavoriteSet = () => {
  const client = useQueryClient();
  const token = useSessionToken();

  return useMutation({
    mutationFn: ({ id, name, items }: { id: string | null; name: string; items: string[] }) =>
      id
        ? apiSend<FavoriteSet>('PUT', `/favorite-sets/${id}`, { name, items })
        : apiSend<FavoriteSet>('POST', '/favorite-sets', { name, items }),
    onMutate: ({ id, name, items }) => {
      const previous = client.getQueryData<FavoriteSet[]>(setsKey(token));

      if (previous && id) {
        client.setQueryData<FavoriteSet[]>(
          setsKey(token),
          previous.map((set) => (set.id === id ? { ...set, name, items } : set)),
        );
      }

      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) client.setQueryData(setsKey(token), context.previous);
    },
    onSettled: () => client.invalidateQueries({ queryKey: ['favorite-sets'] }),
  });
};

export const useDeleteFavoriteSet = () => {
  const client = useQueryClient();
  const token = useSessionToken();

  return useMutation({
    mutationFn: (id: string) => apiSend<void>('DELETE', `/favorite-sets/${id}`),
    onMutate: (id) => {
      const previous = client.getQueryData<FavoriteSet[]>(setsKey(token));

      if (previous) {
        client.setQueryData<FavoriteSet[]>(
          setsKey(token),
          previous.filter((set) => set.id !== id),
        );
      }

      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) client.setQueryData(setsKey(token), context.previous);
    },
    onSettled: () => client.invalidateQueries({ queryKey: ['favorite-sets'] }),
  });
};
