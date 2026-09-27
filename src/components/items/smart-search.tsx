'use client';

import { Loader2, Sparkles, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { IconInput } from '@/components/ui/input';
import { useAssistantReady, useSmartSearch } from '@/lib/api/assistant';
import type { SmartSearch } from '@/lib/api/types';
import { formatUsd } from '@/lib/format/money';

import { useOpenItem } from './item-dialog-provider';

export const SmartSearchBar = ({ onApply }: { onApply: (filters: SmartSearch) => void }) => {
  const ready = useAssistantReady();
  const search = useSmartSearch();
  const openItem = useOpenItem();
  const [text, setText] = useState('');

  if (!ready) return null;

  const submit = (event: FormEvent) => {
    event.preventDefault();

    if (!text.trim()) return;

    search.mutate(text.trim(), {
      onSuccess: (result) => {
        if (!result.picks || result.picks.length === 0) onApply(result);
      },
    });
  };

  const picks = search.data?.picks ?? [];

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex gap-2">
        <IconInput
          icon={<Sparkles className="size-[1.125rem]" aria-hidden />}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Опиши словами: лучший Gamma Doppler на нож до $900"
          aria-label="Описание того, что ищешь"
          className="flex-1"
        />
        <Button type="submit" variant="secondary" disabled={search.isPending || !text.trim()}>
          {search.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Подобрать
        </Button>
      </div>

      {picks.length > 0 ? (
        <div className="bg-surface-muted/60 rounded-2xl p-2">
          <div className="flex items-center justify-between px-2 pb-1">
            <p className="text-foreground-subtle text-[0.6875rem]">
              Подборка из того, что сейчас продаётся
            </p>
            <button
              type="button"
              onClick={() => search.reset()}
              aria-label="Скрыть подборку"
              className="text-foreground-subtle hover:text-foreground rounded-lg p-1"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </div>
          <ol className="space-y-0.5">
            {picks.map((pick, index) => (
              <li key={pick.name}>
                <button
                  type="button"
                  onClick={() => openItem(pick.name)}
                  className="hover:bg-surface flex w-full items-baseline gap-3 rounded-xl px-2 py-1.5 text-left"
                >
                  <span className="text-foreground-subtle numeric w-4 shrink-0 text-xs">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.8125rem] font-medium">{pick.name}</span>
                    {pick.reason ? (
                      <span className="text-foreground-muted block text-xs">{pick.reason}</span>
                    ) : null}
                  </span>
                  <span className="numeric shrink-0 text-[0.8125rem] font-semibold">
                    {formatUsd(pick.price)}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {search.data?.note ? (
        <p className="text-foreground-muted text-xs">{search.data.note}</p>
      ) : null}
      {search.data && picks.length === 0 && !search.data.note ? (
        <p className="text-foreground-muted text-xs">
          Подходящих предметов не нашлось, применили фильтры.
        </p>
      ) : null}
      {search.isError ? <p className="text-loss text-xs">{search.error.message}</p> : null}
    </form>
  );
};
