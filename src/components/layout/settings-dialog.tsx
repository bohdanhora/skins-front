'use client';

import { Check, KeyRound, Monitor, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Segmented } from '@/components/ui/segmented';
import { useSessionToken } from '@/lib/api/account';
import { useStatus } from '@/lib/api/queries';
import type { SellMarketId } from '@/lib/api/types';
import { timeAgo } from '@/lib/format/time';
import { MARKETS, MARKET_ORDER, SELL_MARKET_ORDER } from '@/lib/markets';
import {
  DEFAULT_FEES,
  DEFAULT_WITHDRAWALS,
  useFeesSetting,
  useThemeSetting,
  useWithdrawalsSetting,
  type Fees,
} from '@/lib/storage/settings';
import { cn } from '@/lib/utils/cn';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FEE_HINTS: Record<SellMarketId, string> = {
  whiteMarket: 'Обычно 5%',
  dmarket: 'От 2% до 10%, зависит от предмета',
  csfloat: 'Обычно 2%',
};

const WITHDRAWAL_HINTS: Record<SellMarketId, string> = {
  whiteMarket: 'Крипта через WhiteBIT 0%, карта 1-3%',
  dmarket: 'Своей нет, платёжка берёт около 1,5-2%',
  csfloat: 'От 2,5% до 0,5%, падает с объёмом продаж',
};

const MAX_FEE = 50;

interface FeeFieldsProps {
  title: string;
  description: string;
  hints: Record<SellMarketId, string>;
  value: Fees;
  defaults: Fees;
  open: boolean;
  onChange: (next: Fees) => void;
}

const FeeFields = ({
  title,
  description,
  hints,
  value,
  defaults,
  open,
  onChange,
}: FeeFieldsProps) => {
  const [draft, setDraft] = useState<Record<SellMarketId, string>>({
    whiteMarket: '',
    dmarket: '',
    csfloat: '',
  });

  useEffect(() => {
    if (open) {
      setDraft({
        whiteMarket: String(value.whiteMarket),
        dmarket: String(value.dmarket),
        csfloat: String(value.csfloat),
      });
    }
  }, [open, value]);

  const commit = (market: SellMarketId, raw: string) => {
    const parsed = Number(raw.replace(',', '.'));
    const next: Fees = {
      ...value,
      [market]: Number.isFinite(parsed) ? Math.min(Math.max(parsed, 0), MAX_FEE) : value[market],
    };

    onChange(next);
    setDraft((current) => ({ ...current, [market]: String(next[market]) }));
  };

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-foreground-muted mt-0.5 text-sm">{description}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {SELL_MARKET_ORDER.map((market) => (
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
            <span className="text-foreground-subtle mt-2 block text-xs">{hints[market]}</span>
          </label>
        ))}
      </div>
      {SELL_MARKET_ORDER.some((market) => value[market] !== defaults[market]) ? (
        <Button variant="ghost" size="sm" onClick={() => onChange(defaults)}>
          Вернуть как было
        </Button>
      ) : null}
    </section>
  );
};

export const SettingsDialog = ({ open, onOpenChange }: SettingsDialogProps) => {
  const [fees, setFees] = useFeesSetting();
  const [withdrawals, setWithdrawals] = useWithdrawalsSetting();
  const [theme, setTheme] = useThemeSetting();
  const signedIn = useSessionToken() !== null;
  const status = useStatus();

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Настройки"
      description={signedIn ? 'Сохраняются в аккаунте.' : 'Сохраняются в этом браузере.'}
    >
      <div className="space-y-7">
        <FeeFields
          title="Комиссия при продаже"
          description="Нужна, чтобы честно считать прибыль от перепродажи."
          hints={FEE_HINTS}
          value={fees}
          defaults={DEFAULT_FEES}
          open={open}
          onChange={setFees}
        />

        <FeeFields
          title="Комиссия на вывод"
          description="Сколько теряется, когда выводишь деньги с площадки. Учитывается в оценке инвентаря."
          hints={WITHDRAWAL_HINTS}
          value={withdrawals}
          defaults={DEFAULT_WITHDRAWALS}
          open={open}
          onChange={setWithdrawals}
        />

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Тема</h3>
          <Segmented
            label="Тема"
            value={theme}
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

                if (!state) {
                  return null;
                }

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
