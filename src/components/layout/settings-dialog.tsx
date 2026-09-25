'use client';

import { Check, KeyRound, Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Segmented } from '@/components/ui/segmented';
import { useStatus } from '@/lib/api/queries';
import type { MarketId } from '@/lib/api/types';
import { timeAgo } from '@/lib/format/time';
import { MARKETS, MARKET_ORDER } from '@/lib/markets';
import { DEFAULT_FEES, useFeesSetting, type Fees } from '@/lib/storage/settings';
import { cn } from '@/lib/utils/cn';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FEE_HINTS: Record<MarketId, string> = {
  whiteMarket: 'Обычно 5%',
  dmarket: 'От 2% до 10%, зависит от предмета',
};

const MAX_FEE = 50;

export const SettingsDialog = ({ open, onOpenChange }: SettingsDialogProps) => {
  const [fees, setFees] = useFeesSetting();
  const [draft, setDraft] = useState<Record<MarketId, string>>({ whiteMarket: '', dmarket: '' });
  const { theme = 'system', setTheme } = useTheme();
  const status = useStatus();

  useEffect(() => {
    if (open) {
      setDraft({ whiteMarket: String(fees.whiteMarket), dmarket: String(fees.dmarket) });
    }
  }, [open, fees]);

  const commit = (market: MarketId, raw: string) => {
    const value = Number(raw.replace(',', '.'));
    const next: Fees = {
      ...fees,
      [market]: Number.isFinite(value) ? Math.min(Math.max(value, 0), MAX_FEE) : fees[market],
    };

    setFees(next);
    setDraft((current) => ({ ...current, [market]: String(next[market]) }));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Настройки"
      description="Сохраняются в этом браузере."
    >
      <div className="space-y-7">
        <section className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold">Комиссия при продаже</h3>
            <p className="text-foreground-muted mt-0.5 text-sm">
              Нужна, чтобы честно считать прибыль от перепродажи.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {MARKET_ORDER.map((market) => (
              <label key={market} className="border-border block rounded-2xl border p-3.5">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <span className={cn('size-2 rounded-full', MARKETS[market].dot)} aria-hidden />
                  {MARKETS[market].name}
                </span>
                <span className="mt-2 flex items-center gap-2">
                  <input
                    inputMode="decimal"
                    value={draft[market]}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        [market]: event.target.value.replace(/[^\d.,]/g, ''),
                      }))
                    }
                    onBlur={(event) => commit(market, event.target.value)}
                    className="border-border-strong bg-surface focus-visible:border-accent numeric h-10 w-20 rounded-xl border px-3 text-sm focus-visible:outline-none"
                  />
                  <span className="text-foreground-muted text-sm">%</span>
                </span>
                <span className="text-foreground-subtle mt-2 block text-xs">
                  {FEE_HINTS[market]}
                </span>
              </label>
            ))}
          </div>
          {fees.whiteMarket !== DEFAULT_FEES.whiteMarket ||
          fees.dmarket !== DEFAULT_FEES.dmarket ? (
            <Button variant="ghost" size="sm" onClick={() => setFees(DEFAULT_FEES)}>
              Вернуть как было
            </Button>
          ) : null}
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Тема</h3>
          <Segmented
            label="Тема"
            value={theme as 'light' | 'dark' | 'system'}
            onChange={setTheme}
            options={[
              { value: 'light', label: 'Светлая', icon: <Sun className="size-4" aria-hidden /> },
              { value: 'dark', label: 'Тёмная', icon: <Moon className="size-4" aria-hidden /> },
              {
                value: 'system',
                label: 'Авто',
                icon: <Monitor className="size-4" aria-hidden />,
              },
            ]}
          />
        </section>

        {status.data ? (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Площадки</h3>
            <ul className="divide-border border-border divide-y rounded-2xl border">
              {MARKET_ORDER.map((market) => {
                const state = status.data[market];

                return (
                  <li key={market} className="flex items-center gap-3 px-4 py-3">
                    <span className={cn('size-2 rounded-full', MARKETS[market].dot)} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{MARKETS[market].name}</p>
                      <p className="text-foreground-muted text-xs">
                        {state.items.toLocaleString('ru-RU')} предметов в продаже, обновлено{' '}
                        {timeAgo(state.updatedAt)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'flex items-center gap-1 text-xs font-medium',
                        state.keysConfigured ? 'text-gain' : 'text-foreground-subtle',
                      )}
                      title={
                        state.keysConfigured
                          ? 'Ключ подключён: видны лоты и поиск по наклейкам'
                          : 'Без ключа сравниваются только цены'
                      }
                    >
                      {state.keysConfigured ? (
                        <Check className="size-3.5" aria-hidden />
                      ) : (
                        <KeyRound className="size-3.5" aria-hidden />
                      )}
                      {state.keysConfigured ? 'ключ есть' : 'без ключа'}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </div>
    </Dialog>
  );
};
