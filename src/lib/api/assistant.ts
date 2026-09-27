'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSessionToken } from './account';
import { apiGet, apiSend } from './client';
import type {
  AssistantProvider,
  AssistantSettings,
  BluePicks,
  FloatPicks,
  MatchBrief,
  PurchaseDraft,
  SmartSearch,
} from './types';

const settingsKey = (token: string | null) => ['assistant-settings', token];

export const useAssistantProviders = () =>
  useQuery({
    queryKey: ['assistant-providers'],
    queryFn: ({ signal }) => apiGet<AssistantProvider[]>('/assistant/providers', undefined, signal),
    staleTime: Infinity,
  });

export const useAssistantSettings = () => {
  const token = useSessionToken();

  return useQuery({
    queryKey: settingsKey(token),
    queryFn: ({ signal }) => apiGet<AssistantSettings>('/assistant/settings', undefined, signal),
    enabled: token !== null,
    staleTime: 5 * 60_000,
  });
};

export const useAssistantReady = (): boolean => {
  const settings = useAssistantSettings();

  return !!settings.data?.provider;
};

export const useAssistantModels = (provider: string, enabled: boolean) => {
  const token = useSessionToken();

  return useQuery({
    queryKey: ['assistant-models', token, provider],
    queryFn: ({ signal }) => apiGet<string[]>('/assistant/models', { provider }, signal),
    enabled: token !== null && enabled,
    staleTime: 10 * 60_000,
    retry: false,
  });
};

export const useSaveAssistant = () => {
  const client = useQueryClient();
  const token = useSessionToken();

  return useMutation({
    mutationFn: (input: { provider: string; model: string; apiKey?: string }) =>
      apiSend<AssistantSettings>('PUT', '/assistant/settings', input),
    onSuccess: (saved) => {
      client.setQueryData(settingsKey(token), saved);
      void client.invalidateQueries({ queryKey: ['assistant-models'] });
    },
  });
};

export const useRemoveAssistant = () => {
  const client = useQueryClient();
  const token = useSessionToken();

  return useMutation({
    mutationFn: () => apiSend<void>('DELETE', '/assistant/settings'),
    onSuccess: () => {
      client.setQueryData<AssistantSettings | undefined>(settingsKey(token), (current) =>
        current ? { ...current, provider: null, model: null, keyHint: null } : current,
      );
    },
  });
};

export const useMatchBrief = (matchId: number) =>
  useMutation({
    mutationFn: (refresh: boolean) =>
      apiSend<MatchBrief>(
        'POST',
        `/assistant/matches/${matchId}/brief${refresh ? '?refresh=true' : ''}`,
      ),
  });

export const usePurchaseDraft = () =>
  useMutation({
    mutationFn: (input: { image?: string; url?: string; text?: string }) =>
      apiSend<PurchaseDraft>('POST', '/assistant/purchase-draft', input),
  });

export const useSmartSearch = () =>
  useMutation({
    mutationFn: (query: string) => apiSend<SmartSearch>('POST', '/assistant/search', { query }),
  });

export const useBluePicks = () =>
  useMutation({
    mutationFn: (input: { weapon: string; wear?: string }) =>
      apiSend<BluePicks>('POST', '/assistant/blue-picks', input),
  });

export const useFloatPicks = () =>
  useMutation({
    mutationFn: (input: {
      name: string;
      floatFrom?: number;
      floatTo?: number;
      feeDmarket?: number;
    }) => apiSend<FloatPicks>('POST', '/assistant/float-picks', input),
  });
