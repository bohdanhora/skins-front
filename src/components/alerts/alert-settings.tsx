'use client';

import { useEffect, useState } from 'react';

import { Toggle } from '@/components/items/filters';
import { Button } from '@/components/ui/button';
import { ALERT_RULES } from '@/lib/alerts/deal-alerts';

import { useDealAlertsSetting } from './deal-watcher';

type Permission = NotificationPermission | 'unsupported';

export const AlertSettings = () => {
  const [enabled, setEnabled] = useDealAlertsSetting();
  const [permission, setPermission] = useState<Permission>('default');

  useEffect(() => {
    setPermission(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission);
  }, []);

  return (
    <div className="space-y-3">
      <Toggle checked={enabled} onChange={setEnabled} label="Сообщать о сильных сделках" />
      <p className="text-foreground-muted text-[0.8125rem]">
        Пока вкладка открыта, раз в 3 минуты смотрим топ и избранное. Сообщаем, когда сигнал от{' '}
        {ALERT_RULES.score} или цена на {ALERT_RULES.percent}% ниже рынка, для избранного от{' '}
        {ALERT_RULES.favoriteScore} и {ALERT_RULES.favoritePercent}%. Перед сообщением цена
        перепроверяется.
      </p>
      {enabled && permission === 'default' ? (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void Notification.requestPermission().then(setPermission)}
        >
          Показывать и когда вкладка свёрнута
        </Button>
      ) : null}
      {enabled && permission === 'denied' ? (
        <p className="text-foreground-subtle text-xs">
          Системные уведомления запрещены в браузере, сообщения видны только на открытой вкладке.
        </p>
      ) : null}
    </div>
  );
};
