'use client';

import * as Popover from '@radix-ui/react-popover';
import { Check, Copy, Loader2, Wand2 } from 'lucide-react';
import { useDeferredValue, useState, type MouseEvent } from 'react';

import { useFloatSearch, useInspectGen } from '@/lib/api/queries';
import type { FloatListing, ItemCategory } from '@/lib/api/types';
import { formatFloat } from '@/lib/format/float';
import { formatUsd } from '@/lib/format/money';
import { MARKETS } from '@/lib/markets';
import { cn } from '@/lib/utils/cn';

interface GenerateButtonProps {
  name: string;
  float?: number | null;
  seed?: number | null;
  stickers?: string[];
  suggest?: boolean;
  compact?: boolean;
  className?: string;
}

type Lot = FloatListing & { float: number };

const SKIN_CATEGORIES = new Set<ItemCategory>([
  'knife',
  'gloves',
  'rifle',
  'sniper',
  'pistol',
  'smg',
  'heavy',
]);

export const canGenerate = (category: ItemCategory): boolean => SKIN_CATEGORIES.has(category);

const keepInside = (event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();
};

export const GenerateButton = ({
  name,
  float,
  seed,
  stickers,
  suggest = false,
  compact = false,
  className,
}: GenerateButtonProps) => {
  const [open, setOpen] = useState(false);

  return (
    <span onClick={keepInside} className={cn('inline-flex', className)}>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            aria-label="Сгенерировать"
            title="Сгенерировать"
            className={cn(
              'press text-foreground-subtle hover:text-foreground flex items-center justify-center',
              compact
                ? 'hover:bg-surface size-6 rounded-lg'
                : 'bg-surface/80 size-9 rounded-full backdrop-blur',
            )}
          >
            <Wand2 className={compact ? 'size-3.5' : 'size-[1.125rem]'} aria-hidden />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="end"
            sideOffset={8}
            collisionPadding={16}
            onClick={(event) => event.stopPropagation()}
            className="bg-surface border-border z-[60] w-[22rem] max-w-[calc(100vw-2rem)] space-y-3 rounded-2xl border p-3 shadow-[0_12px_40px_-12px_rgb(0_0_0/0.45)]"
          >
            {open && suggest ? <SuggestedPanel name={name} /> : null}
            {open && !suggest ? (
              <GeneratePanel name={name} float={float} seed={seed} stickers={stickers} />
            ) : null}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </span>
  );
};

const SuggestedPanel = ({ name }: { name: string }) => {
  const search = useFloatSearch({ name });
  const [selected, setSelected] = useState<string | null>(null);
  const [manual, setManual] = useState<{ float: string; seed: string } | null>(null);
  const lots = search.data
    ? [search.data.whiteMarket, search.data.dmarket, search.data.csfloat]
        .flatMap((source) => {
          const cheapest = source.listings
            .filter((listing): listing is Lot => listing.float !== null)
            .sort((left, right) => left.price - right.price)[0];

          return cheapest ? [cheapest] : [];
        })
        .sort((left, right) => left.price - right.price)
    : [];
  const chosen = lots.find((lot) => lot.market === selected) ?? lots[0] ?? null;
  const floatText = manual?.float ?? (chosen ? String(chosen.float) : '');
  const seedText =
    manual?.seed ?? (chosen && chosen.paintSeed !== null ? String(chosen.paintSeed) : '');

  return (
    <>
      <p className="truncate text-sm font-semibold">{name}</p>
      {search.isPending ? (
        <Loader2 className="text-foreground-subtle size-4 animate-spin" aria-hidden />
      ) : null}
      {lots.length > 0 ? (
        <div className="space-y-1">
          <p className="text-foreground-subtle text-[0.6875rem]">Самый дешёвый лот на площадке</p>
          {lots.map((lot) => {
            const active = manual === null && chosen === lot;

            return (
              <button
                key={lot.market}
                type="button"
                onClick={() => {
                  setSelected(lot.market);
                  setManual(null);
                }}
                className={cn(
                  'numeric flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-xs',
                  active ? 'bg-accent-soft text-accent' : 'hover:bg-surface-muted',
                )}
              >
                <span
                  className={cn('size-2 shrink-0 rounded-full', MARKETS[lot.market].dot)}
                  aria-hidden
                />
                <span className="w-16 shrink-0">{MARKETS[lot.market].short}</span>
                <span className="min-w-0 flex-1 truncate">
                  {formatFloat(lot.float, 4)}
                  {lot.paintSeed !== null ? ` · #${lot.paintSeed}` : ''}
                </span>
                <span className="font-semibold">{formatUsd(lot.price)}</span>
              </button>
            );
          })}
        </div>
      ) : null}
      {search.data && lots.length === 0 ? (
        <p className="text-foreground-muted text-xs">Лотов с флоатом сейчас нет.</p>
      ) : null}
      <GenerateOutput
        name={name}
        floatText={floatText}
        seedText={seedText}
        onFloat={(value) => setManual({ float: value, seed: seedText })}
        onSeed={(value) => setManual({ float: floatText, seed: value })}
      />
    </>
  );
};

const GeneratePanel = ({ name, float, seed, stickers }: Omit<GenerateButtonProps, 'className'>) => {
  const [floatText, setFloatText] = useState(
    float !== null && float !== undefined ? String(float) : '',
  );
  const [seedText, setSeedText] = useState(seed !== null && seed !== undefined ? String(seed) : '');

  return (
    <>
      <p className="truncate text-sm font-semibold">{name}</p>
      <GenerateOutput
        name={name}
        floatText={floatText}
        seedText={seedText}
        onFloat={setFloatText}
        onSeed={setSeedText}
        stickers={stickers}
      />
    </>
  );
};

const GenerateOutput = ({
  name,
  floatText,
  seedText,
  onFloat,
  onSeed,
  stickers,
}: {
  name: string;
  floatText: string;
  seedText: string;
  onFloat: (value: string) => void;
  onSeed: (value: string) => void;
  stickers?: string[];
}) => {
  const floatValue = floatText.trim() ? Number(floatText.replace(',', '.')) : undefined;
  const seedValue = seedText.trim() ? Number(seedText) : undefined;
  const valid =
    (floatValue === undefined || Number.isFinite(floatValue)) &&
    (seedValue === undefined || Number.isInteger(seedValue));
  const params = useDeferredValue({ name, float: floatValue, seed: seedValue, stickers });
  const gen = useInspectGen(params, valid);

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Флоат" value={floatText} onChange={onFloat} placeholder="лучший" />
        <Field label="Паттерн" value={seedText} onChange={onSeed} placeholder="1" />
      </div>
      {stickers && stickers.length > 0 ? (
        <p className="text-foreground-muted text-xs">Наклейки: {stickers.join(', ')}</p>
      ) : null}
      {gen.isFetching && !gen.data ? (
        <Loader2 className="text-foreground-subtle size-4 animate-spin" aria-hidden />
      ) : null}
      {gen.isError ? <p className="text-loss text-xs">{gen.error.message}</p> : null}
      {gen.data && !gen.isError ? (
        <div className="space-y-2">
          <CopyRow label="Сервер cs2inspects" value={gen.data.server} />
          <CopyRow label="Консоль CS2" value={gen.data.console} />
          <CopyRow label="!gen" value={gen.data.gen} />
          {gen.data.missingStickers.length > 0 ? (
            <p className="text-warning text-xs">
              Нет в каталоге: {gen.data.missingStickers.join(', ')}
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );
};

const Field = ({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) => (
  <label className="space-y-1">
    <span className="text-foreground-subtle text-[0.6875rem]">{label}</span>
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      inputMode="decimal"
      className="border-border-strong bg-surface focus-visible:border-accent numeric h-9 w-full rounded-lg border px-2.5 text-sm focus-visible:outline-none"
    />
  </label>
);

const CopyRow = ({ label, value }: { label: string; value: string }) => {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    void navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="bg-surface-muted hover:bg-surface-muted/70 flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left"
    >
      <span className="min-w-0 flex-1">
        <span className="text-foreground-subtle block text-[0.6875rem]">{label}</span>
        <span className="numeric block truncate text-xs">{value}</span>
      </span>
      {copied ? (
        <Check className="text-gain size-4 shrink-0" aria-hidden />
      ) : (
        <Copy className="text-foreground-subtle size-4 shrink-0" aria-hidden />
      )}
    </button>
  );
};
