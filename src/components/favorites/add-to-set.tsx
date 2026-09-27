'use client';

import * as Popover from '@radix-ui/react-popover';
import { Check, Layers, Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { useSessionToken } from '@/lib/api/account';
import { useFavoriteSets, useSaveFavoriteSet } from '@/lib/api/favorite-sets';
import { cn } from '@/lib/utils/cn';

const MAX_ITEMS = 12;

export const AddToSetButton = ({ name }: { name: string }) => {
  const signedIn = useSessionToken() !== null;
  const sets = useFavoriteSets();
  const save = useSaveFavoriteSet();
  const [title, setTitle] = useState('');

  if (!signedIn) return null;

  const inSome = (sets.data ?? []).some((set) => set.items.includes(name));

  const create = (event: FormEvent) => {
    event.preventDefault();

    if (!title.trim()) return;

    save.mutate({ id: null, name: title.trim(), items: [name] }, { onSuccess: () => setTitle('') });
  };

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label="В набор"
          title="В набор"
          className={cn(
            'press bg-surface-muted flex size-9 items-center justify-center rounded-full',
            inSome ? 'text-accent' : 'text-foreground-subtle hover:text-foreground',
          )}
        >
          <Layers className="size-[1.125rem]" aria-hidden />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          collisionPadding={16}
          className="bg-surface border-border z-[60] w-72 space-y-1 rounded-2xl border p-2 shadow-[0_12px_40px_-12px_rgb(0_0_0/0.45)]"
        >
          <p className="text-foreground-subtle px-2 py-1 text-[0.6875rem]">Наборы</p>
          {(sets.data ?? []).map((set) => {
            const included = set.items.includes(name);
            const full = !included && set.items.length >= MAX_ITEMS;

            return (
              <button
                key={set.id}
                type="button"
                disabled={full}
                onClick={() =>
                  save.mutate({
                    id: set.id,
                    name: set.name,
                    items: included
                      ? set.items.filter((entry) => entry !== name)
                      : [...set.items, name],
                  })
                }
                className={cn(
                  'flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm disabled:opacity-50',
                  included ? 'bg-accent-soft text-accent' : 'hover:bg-surface-muted',
                )}
              >
                <span className="min-w-0 flex-1 truncate">{set.name}</span>
                <span className="text-foreground-subtle text-xs">{set.items.length}</span>
                {included ? <Check className="size-4" aria-hidden /> : null}
              </button>
            );
          })}
          <form onSubmit={create} className="flex gap-1.5 pt-1">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={80}
              placeholder="Новый набор"
              aria-label="Название нового набора"
              className="border-border-strong bg-surface focus-visible:border-accent h-9 min-w-0 flex-1 rounded-xl border px-3 text-sm focus-visible:outline-none"
            />
            <button
              type="submit"
              disabled={!title.trim() || save.isPending}
              aria-label="Создать набор"
              className="bg-accent text-accent-foreground flex size-9 items-center justify-center rounded-xl disabled:opacity-50"
            >
              <Plus className="size-4" aria-hidden />
            </button>
          </form>
          {save.isError ? <p className="text-loss px-2 text-xs">{save.error.message}</p> : null}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};
