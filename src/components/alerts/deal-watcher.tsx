'use client';

import { BellRing, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useOpenItem } from '@/components/items/item-dialog-provider';
import { ItemImage } from '@/components/items/item-image';
import { apiGet } from '@/lib/api/client';
import type { Item, ItemsPage } from '@/lib/api/types';
import { alertFor, pruneSeen, stillWorth, type DealAlert } from '@/lib/alerts/deal-alerts';
import { formatUsd } from '@/lib/format/money';
import { readLocal, useLocalStore, writeLocal } from '@/lib/storage/local-store';
import { useFavorites, useFees, type Fees } from '@/lib/storage/settings';

export const DEAL_ALERTS_KEY = 'skins.dealAlerts';

const SEEN_KEY = 'skins.dealAlertsSeen';
const CHECK_EVERY_MS = 3 * 60_000;
const FIRST_CHECK_MS = 20_000;
const TOP_LIMIT = 40;
const VERIFY_PER_ROUND = 3;
const SHOWN = 3;

const feeQuery = (fees: Fees) => ({
  feeWhiteMarket: fees.whiteMarket,
  feeDmarket: fees.dmarket,
  feeCsfloat: fees.csfloat,
});

export const useDealAlertsSetting = () => useLocalStore<boolean>(DEAL_ALERTS_KEY, true);

const notifySystem = (alert: DealAlert) => {
  if (
    typeof Notification === 'undefined' ||
    Notification.permission !== 'granted' ||
    !document.hidden
  ) {
    return;
  }

  new Notification(alert.name, {
    body: `${formatUsd(alert.price)} · ${alert.reason}`,
    icon: alert.image ?? undefined,
    tag: alert.key,
  });
};

export const DealWatcher = () => {
  const [enabled] = useDealAlertsSetting();
  const { favorites } = useFavorites();
  const fees = useFees();
  const openItem = useOpenItem();
  const [alerts, setAlerts] = useState<DealAlert[]>([]);
  const state = useRef({ favorites, fees });

  state.current = { favorites, fees };

  const check = useCallback(async () => {
    if (
      document.hidden &&
      typeof Notification !== 'undefined' &&
      Notification.permission !== 'granted'
    ) {
      return;
    }

    const { favorites: names, fees: current } = state.current;
    const [top, followed] = await Promise.all([
      apiGet<ItemsPage>('/items', {
        mode: 'top',
        sort: 'score',
        limit: TOP_LIMIT,
        ...feeQuery(current),
      }),
      names.length > 0
        ? apiGet<ItemsPage>('/items', { names, limit: 100, ...feeQuery(current) })
        : Promise.resolve({ items: [] as Item[], total: 0, updatedAt: null }),
    ]);
    const favoriteSet = new Set(names);
    const seen = pruneSeen(readLocal<Record<string, number>>(SEEN_KEY) ?? {}, Date.now());
    const candidates = [
      ...followed.items.map((item) => alertFor(item, true)),
      ...top.items.map((item) => alertFor(item, favoriteSet.has(item.name))),
    ].filter((alert): alert is DealAlert => alert !== null && !(alert.key in seen));
    const unique = [...new Map(candidates.map((alert) => [alert.name, alert])).values()];

    for (const candidate of unique.slice(0, VERIFY_PER_ROUND)) {
      seen[candidate.key] = Date.now();

      const fresh = await apiGet<Item>('/items/one', {
        name: candidate.name,
        ...feeQuery(current),
      }).catch(() => null);
      const confirmed = fresh ? stillWorth(candidate, fresh) : null;

      if (confirmed) {
        seen[confirmed.key] = Date.now();
        setAlerts((list) =>
          [confirmed, ...list.filter((entry) => entry.name !== confirmed.name)].slice(0, SHOWN),
        );
        notifySystem(confirmed);
      }
    }

    writeLocal(SEEN_KEY, seen);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const first = window.setTimeout(() => void check().catch(() => undefined), FIRST_CHECK_MS);
    const timer = window.setInterval(() => void check().catch(() => undefined), CHECK_EVERY_MS);

    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [enabled, check]);

  if (!enabled || alerts.length === 0) return null;

  const dismiss = (key: string) => setAlerts((list) => list.filter((entry) => entry.key !== key));

  return (
    <div className="fixed right-4 bottom-24 z-40 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2 lg:bottom-4">
      {alerts.map((alert) => (
        <div
          key={alert.key}
          className="bg-surface-raised border-border flex items-center gap-3 rounded-2xl border p-2.5 pr-2 shadow-[0_12px_40px_-12px_rgb(0_0_0/0.45)]"
        >
          <button
            type="button"
            onClick={() => {
              openItem(alert.name);
              dismiss(alert.key);
            }}
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
          >
            <ItemImage
              src={alert.image}
              alt={alert.name}
              rarityColor={alert.rarityColor}
              className="size-12 shrink-0"
              imageClassName="p-1"
            />
            <span className="min-w-0">
              <span className="text-gain flex items-center gap-1 text-[0.6875rem] font-medium">
                <BellRing className="size-3" aria-hidden />
                {alert.reason}
              </span>
              <span className="block truncate text-[0.8125rem] font-semibold">{alert.name}</span>
              <span className="numeric text-foreground-muted text-xs">
                {formatUsd(alert.price)}, цена только что проверена
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => dismiss(alert.key)}
            aria-label="Скрыть"
            className="text-foreground-subtle hover:text-foreground hover:bg-surface-muted self-start rounded-lg p-1"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      ))}
    </div>
  );
};
