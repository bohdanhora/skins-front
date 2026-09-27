'use client';

import { useEffect, useState } from 'react';

import { Toggle } from '@/components/items/filters';
import { Button } from '@/components/ui/button';
import { MoneyInput, parseMoney } from '@/components/ui/input';
import { ALERT_RULES } from '@/lib/alerts/deal-alerts';

import { useDealAlertsMinPrice, useDealAlertsSetting } from './deal-watcher';

type Permission = NotificationPermission | 'unsupported';

export const AlertSettings = () => {
  const [enabled, setEnabled] = useDealAlertsSetting();
  const [minPrice, setMinPrice] = useDealAlertsMinPrice();
  const [draft, setDraft] = useState<string | null>(null);
  const [permission, setPermission] = useState<Permission>('default');

  useEffect(() => {
    setPermission(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission);
  }, []);

  return (
    <div className="space-y-3">
      <Toggle checked={enabled} onChange={setEnabled} label="Сообщать о сильных сделках" />
      <p className="text-foreground-muted text-[0.8125rem]">
        Пока вкладка открыта, раз в 3 минуты смотрим топ и избранное. Сообщаем, когда сигнал от{' '}
        {ALERT_RULES.score} или цена на {ALERT_RULES.percent}% ниже рынка и выгода от $
        {ALERT_RULES.minDiscount / 100}, для избранного от {ALERT_RULES.favoriteScore} и{' '}
        {ALERT_RULES.favoritePercent}%. Предмет должен продаваться от{' '}
        {ALERT_RULES.minEightWeekSales} раз за 8 недель. Перед сообщением цена перепроверяется.
      </p>
      <label className="flex items-center gap-2 text-sm">
        <span className="text-foreground-muted">Не дешевле</span>
        <MoneyInput
          value={draft ?? (minPrice / 100).toString()}
          onChange={setDraft}
          onBlur={() => {
            const parsed = parseMoney(draft ?? '');

            if (parsed !== undefined) setMinPrice(Math.round(parsed * 100));
            setDraft(null);
          }}
          aria-label="Минимальная цена для уведомлений"
          className="w-28"
        />
        <span className="text-foreground-subtle text-xs">избранное без ограничения</span>
      </label>
      {enabled && permission === 'default' ? (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void Notification.requestPermission().then(setPermission)}
        >
          Показывать и когда вкладка свёрнута
        </Button>
      ) : null}
      {enabled && permission !== 'granted' ? (
        <p className="text-foreground-subtle text-xs">
          {permission === 'denied' ? 'Системные уведомления запрещены в браузере. ' : ''}
          Без них на свёрнутой вкладке сделка отметится в её названии, а карточка будет ждать на
          странице.
        </p>
      ) : null}
      {enabled && permission === 'granted' ? (
        <p className="text-foreground-subtle text-xs">
          Системные уведомления включены, приходят и когда вкладка свёрнута.
        </p>
      ) : null}
    </div>
  );
};
