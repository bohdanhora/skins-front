'use client';

import { Loader2, Sparkles } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { IconInput } from '@/components/ui/input';
import { useAssistantReady, useSmartSearch } from '@/lib/api/assistant';
import type { SmartSearch } from '@/lib/api/types';

export const SmartSearchBar = ({ onApply }: { onApply: (filters: SmartSearch) => void }) => {
  const ready = useAssistantReady();
  const search = useSmartSearch();
  const [text, setText] = useState('');

  if (!ready) return null;

  const submit = (event: FormEvent) => {
    event.preventDefault();

    if (!text.trim()) return;

    search.mutate(text.trim(), { onSuccess: onApply });
  };

  return (
    <form onSubmit={submit} className="space-y-1.5">
      <div className="flex gap-2">
        <IconInput
          icon={<Sparkles className="size-[1.125rem]" aria-hidden />}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Опиши словами: нож до $200, AK в FT с наклейками дешевле рынка"
          aria-label="Описание того, что ищешь"
          className="flex-1"
        />
        <Button type="submit" variant="secondary" disabled={search.isPending || !text.trim()}>
          {search.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Подобрать
        </Button>
      </div>
      {search.data?.note ? (
        <p className="text-foreground-muted text-xs">{search.data.note}</p>
      ) : null}
      {search.isError ? <p className="text-loss text-xs">{search.error.message}</p> : null}
    </form>
  );
};
