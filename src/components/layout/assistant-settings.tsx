'use client';

import { Check, ExternalLink } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useSessionToken } from '@/lib/api/account';
import {
  useAssistantModels,
  useAssistantProviders,
  useAssistantSettings,
  useRemoveAssistant,
  useSaveAssistant,
} from '@/lib/api/assistant';

const CUSTOM = '__custom__';

export const AssistantSettings = ({ open }: { open: boolean }) => {
  const signedIn = useSessionToken() !== null;
  const providers = useAssistantProviders();
  const settings = useAssistantSettings();
  const save = useSaveAssistant();
  const remove = useRemoveAssistant();
  const [providerId, setProviderId] = useState('openai');
  const [model, setModel] = useState('');
  const [custom, setCustom] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const savedProvider = settings.data?.provider ?? null;
  const models = useAssistantModels(providerId, open && savedProvider === providerId);
  const provider = providers.data?.find((entry) => entry.id === providerId);
  const list = models.data ?? provider?.models ?? [];

  useEffect(() => {
    if (!open || !settings.data) return;

    setProviderId(settings.data.provider ?? 'openai');
    setModel(settings.data.model ?? '');
    setApiKey('');
    setSaved(false);
  }, [open, settings.data]);

  if (!signedIn) {
    return (
      <p className="text-foreground-muted text-sm">
        Войди через Steam, чтобы подключить ассистента.
      </p>
    );
  }

  if (settings.data && !settings.data.available) {
    return <p className="text-foreground-muted text-sm">На сервере не задан ключ шифрования.</p>;
  }

  const selected =
    model && list.includes(model) ? model : model ? CUSTOM : (provider?.defaultModel ?? '');
  const finalModel = selected === CUSTOM ? custom || model : selected;
  const needsKey = savedProvider !== providerId;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSaved(false);
    save.mutate(
      { provider: providerId, model: finalModel, apiKey: apiKey.trim() || undefined },
      {
        onSuccess: () => {
          setApiKey('');
          setSaved(true);
        },
      },
    );
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <Select
          aria-label="Провайдер"
          value={providerId}
          onChange={(next) => {
            setProviderId(next);
            setModel('');
            setCustom('');
          }}
          options={(providers.data ?? []).map((entry) => ({
            value: entry.id,
            label: entry.webSearch ? `${entry.label} · с поиском` : entry.label,
          }))}
        />
        <Select
          aria-label="Модель"
          value={selected}
          onChange={(next) => {
            setModel(next === CUSTOM ? '' : next);
            if (next === CUSTOM) setCustom(model);
          }}
          options={[
            ...list.map((id) => ({ value: id, label: id })),
            { value: CUSTOM, label: 'Другая модель…' },
          ]}
        />
      </div>
      {selected === CUSTOM ? (
        <Input
          value={custom}
          onChange={(event) => setCustom(event.target.value)}
          placeholder="id модели, например gpt-5"
          aria-label="id модели"
        />
      ) : null}
      <Input
        type="password"
        autoComplete="off"
        value={apiKey}
        onChange={(event) => setApiKey(event.target.value)}
        placeholder={
          !needsKey && settings.data?.keyHint
            ? `Ключ сохранён: ${settings.data.keyHint}`
            : (provider?.keyHint ?? 'Ключ API')
        }
        aria-label="Ключ API"
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={save.isPending || !finalModel || (needsKey && !apiKey.trim())}
        >
          Сохранить
        </Button>
        {savedProvider ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={remove.isPending}
            onClick={() => remove.mutate()}
          >
            Отключить
          </Button>
        ) : null}
        {provider ? (
          <a
            href={provider.apiKeysUrl}
            target="_blank"
            rel="noreferrer"
            className="text-foreground-muted hover:text-foreground ml-auto flex items-center gap-1 text-xs"
          >
            Получить ключ
            <ExternalLink className="size-3" aria-hidden />
          </a>
        ) : null}
      </div>
      {saved ? (
        <p className="text-gain flex items-center gap-1 text-xs">
          <Check className="size-3.5" aria-hidden />
          Сохранено, ключ хранится зашифрованным
        </p>
      ) : null}
      {save.isError ? <p className="text-loss text-xs">{save.error.message}</p> : null}
      {models.isError ? <p className="text-loss text-xs">{models.error.message}</p> : null}
      {provider && !provider.webSearch ? (
        <p className="text-foreground-subtle text-xs">
          Этот провайдер не ищет в интернете, разбор матчей будет только по нашим данным.
        </p>
      ) : null}
    </form>
  );
};
