'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import { useEffect, useRef } from 'react';

import { useSessionToken } from '@/lib/api/account';
import {
  fetchSettings,
  importFavorites,
  saveSettings,
  type SettingsPatch,
  type Theme,
} from '@/lib/api/account-data';
import { readLocal, writeLocal } from '@/lib/storage/local-store';
import {
  DEFAULT_FEES,
  DEFAULT_WITHDRAWALS,
  FAVORITES_KEY,
  FEES_KEY,
  STEAM_PROFILE_KEY,
  WITHDRAWALS_KEY,
  type Fees,
} from '@/lib/storage/settings';

const THEMES: Theme[] = ['light', 'dark', 'system'];

export const AccountSync = () => {
  const token = useSessionToken();
  const client = useQueryClient();
  const { theme, setTheme } = useTheme();
  const themeRef = useRef(theme);
  const synced = useRef<string | null>(null);

  themeRef.current = theme;

  useEffect(() => {
    if (!token || synced.current === token) return;

    synced.current = token;

    const sync = async () => {
      const favorites = readLocal<string[]>(FAVORITES_KEY) ?? [];

      if (favorites.length > 0) {
        await importFavorites(client, token, favorites);
        writeLocal(FAVORITES_KEY, []);
      }

      const remote = await fetchSettings(client, token);
      const patch: SettingsPatch = {};
      const fees = readLocal<Partial<Fees>>(FEES_KEY);
      const withdrawals = readLocal<Partial<Fees>>(WITHDRAWALS_KEY);
      const profile = readLocal<string>(STEAM_PROFILE_KEY);
      const current = themeRef.current as Theme | undefined;

      if (!remote.fees && fees) patch.fees = { ...DEFAULT_FEES, ...fees };
      if (!remote.withdrawals && withdrawals) {
        patch.withdrawals = { ...DEFAULT_WITHDRAWALS, ...withdrawals };
      }
      if (!remote.steamProfile && profile) patch.steamProfile = profile;
      if (!remote.theme && current && THEMES.includes(current)) patch.theme = current;
      if (remote.theme && remote.theme !== current) setTheme(remote.theme);

      if (Object.keys(patch).length > 0) {
        await saveSettings(client, token, patch);
      }
    };

    sync().catch(() => {
      synced.current = null;
    });
  }, [token, client, setTheme]);

  return null;
};
