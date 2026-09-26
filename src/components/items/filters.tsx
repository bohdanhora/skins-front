'use client';

import * as Popover from '@radix-ui/react-popover';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { Chip } from '@/components/ui/chip';
import { IconInput, MoneyInput } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useItemFacets } from '@/lib/api/queries';
import type {
  ItemCategory,
  ItemEdition,
  ItemWear,
  MarketId,
  MarketPhase,
  SubcategoryOption,
} from '@/lib/api/types';
import {
  CATEGORIES,
  EDITION_FILTERS,
  MARKET_FILTERS,
  PHASE_FILTERS,
  WEAR_FILTERS,
} from '@/lib/markets';
import { cn } from '@/lib/utils/cn';

interface CategoryChipsProps {
  value: ItemCategory | undefined;
  onChange: (value: ItemCategory | undefined) => void;
  subcategory?: string;
  onSubcategoryChange?: (value: string | undefined) => void;
  exclude?: ItemCategory[];
}

const SEARCHABLE_FROM = 12;

export const CategoryChips = ({
  value,
  onChange,
  subcategory,
  onSubcategoryChange,
  exclude = [],
}: CategoryChipsProps) => {
  const facets = useItemFacets();
  const [open, setOpen] = useState<ItemCategory | null>(null);

  const select = (next: ItemCategory | undefined) => {
    onChange(next);
    onSubcategoryChange?.(undefined);
  };

  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
      <Chip selected={value === undefined} onClick={() => select(undefined)}>
        Всё
      </Chip>
      {CATEGORIES.filter((category) => !exclude.includes(category.value)).map((category) => {
        const options = onSubcategoryChange
          ? (facets.data?.subcategories?.[category.value] ?? [])
          : [];
        const selected = value === category.value;

        if (options.length === 0) {
          return (
            <Chip
              key={category.value}
              selected={selected}
              onClick={() => select(selected ? undefined : category.value)}
            >
              {category.label}
            </Chip>
          );
        }

        return (
          <Popover.Root
            key={category.value}
            open={open === category.value}
            onOpenChange={(next) => setOpen(next ? category.value : null)}
          >
            <Popover.Trigger asChild>
              <Chip
                selected={selected}
                onClick={() => {
                  if (!selected) select(category.value);
                }}
              >
                {category.label}
                {selected && subcategory ? (
                  <span className="max-w-32 truncate opacity-80">· {subcategory}</span>
                ) : null}
                <ChevronDown className="size-3.5 opacity-70" aria-hidden />
              </Chip>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                align="start"
                sideOffset={8}
                collisionPadding={16}
                className="bg-surface border-border z-50 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border p-2 shadow-[0_12px_40px_-12px_rgb(0_0_0/0.45)]"
              >
                <SubcategoryList
                  options={options}
                  allLabel={category.all ?? category.label}
                  value={selected ? subcategory : undefined}
                  onChange={(next) => {
                    onChange(category.value);
                    onSubcategoryChange?.(next);
                    setOpen(null);
                  }}
                />
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        );
      })}
    </div>
  );
};

interface SubcategoryListProps {
  options: SubcategoryOption[];
  allLabel: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}

const SubcategoryList = ({ options, allLabel, value, onChange }: SubcategoryListProps) => {
  const [filter, setFilter] = useState('');
  const words = filter.toLowerCase().split(/\s+/).filter(Boolean);
  const visible = options.filter((option) =>
    words.every((word) => option.value.toLowerCase().includes(word)),
  );

  return (
    <div className="space-y-1.5">
      {options.length > SEARCHABLE_FROM ? (
        <input
          autoFocus
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Найти"
          aria-label="Найти подкатегорию"
          className="border-border-strong bg-surface focus-visible:border-accent h-9 w-full rounded-xl border px-3 text-sm focus-visible:outline-none"
        />
      ) : null}
      <ul className="max-h-80 space-y-0.5 overflow-y-auto overscroll-contain">
        <li>
          <SubcategoryButton selected={value === undefined} onClick={() => onChange(undefined)}>
            <span className="flex-1 font-semibold">{allLabel}</span>
          </SubcategoryButton>
        </li>
        {visible.map((option) => (
          <li key={option.value}>
            <SubcategoryButton
              selected={value === option.value}
              onClick={() => onChange(option.value)}
            >
              <span className="bg-surface-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
                {option.image ? (
                  <img src={option.image} alt="" loading="lazy" className="size-8 object-contain" />
                ) : null}
              </span>
              <span className="min-w-0 flex-1 truncate">{option.value}</span>
              <span className="text-foreground-subtle numeric text-xs">{option.count}</span>
            </SubcategoryButton>
          </li>
        ))}
      </ul>
    </div>
  );
};

const SubcategoryButton = ({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={selected}
    className={cn(
      'flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-left text-sm',
      selected ? 'bg-accent-soft text-accent' : 'hover:bg-surface-muted text-foreground',
    )}
  >
    {children}
    {selected ? <Check className="size-4 shrink-0" aria-hidden /> : null}
  </button>
);

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoFocus?: boolean;
  className?: string;
}

export const SearchField = ({
  value,
  onChange,
  placeholder,
  autoFocus,
  className,
}: SearchFieldProps) => (
  <IconInput
    type="search"
    icon={<Search className="size-[1.125rem]" aria-hidden />}
    value={value}
    onChange={(event) => onChange(event.target.value)}
    placeholder={placeholder}
    autoFocus={autoFocus}
    aria-label={placeholder}
    className={cn('[&::-webkit-search-cancel-button]:hidden', className)}
    trailing={
      value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Очистить"
          className="text-foreground-subtle hover:bg-surface-muted hover:text-foreground rounded-lg p-1.5"
        >
          <X className="size-4" aria-hidden />
        </button>
      ) : null
    }
  />
);

interface PriceRangeProps {
  min: string;
  max: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
}

export const PriceRange = ({ min, max, onMinChange, onMaxChange }: PriceRangeProps) => (
  <div className="flex items-center gap-2">
    <MoneyInput
      value={min}
      onChange={onMinChange}
      placeholder="от"
      aria-label="Цена от"
      className="w-full sm:w-28"
    />
    <span className="text-foreground-subtle" aria-hidden>
      ...
    </span>
    <MoneyInput
      value={max}
      onChange={onMaxChange}
      placeholder="до"
      aria-label="Цена до"
      className="w-full sm:w-28"
    />
  </div>
);

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
}

export const Toggle = ({ checked, onChange, label, hint }: ToggleProps) => (
  <label className="flex cursor-pointer items-center gap-2.5 select-none" title={hint}>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-10 shrink-0 rounded-full transition-colors duration-200',
        checked ? 'bg-accent' : 'bg-border-strong',
      )}
    >
      <span
        className={cn(
          'bg-surface absolute top-1 left-1 size-4 rounded-full shadow transition-transform duration-200',
          checked ? 'translate-x-4' : '',
        )}
      />
    </button>
    <span className="text-foreground text-sm">{label}</span>
  </label>
);

export const FilterBar = ({ children }: { children: ReactNode }) => (
  <div className="bg-surface flex flex-col gap-4 rounded-3xl p-4 shadow-[var(--shadow-card)] sm:p-5">
    {children}
  </div>
);

interface ItemFilterSelectsProps {
  wear: 'all' | ItemWear;
  onWearChange: (value: 'all' | ItemWear) => void;
  edition: 'all' | ItemEdition;
  onEditionChange: (value: 'all' | ItemEdition) => void;
  phase: 'all' | MarketPhase;
  onPhaseChange: (value: 'all' | MarketPhase) => void;
  cheapestOn: 'all' | MarketId;
  onCheapestOnChange: (value: 'all' | MarketId) => void;
  collection: string;
  onCollectionChange: (value: string) => void;
}

export const ItemFilterSelects = ({
  wear,
  onWearChange,
  edition,
  onEditionChange,
  phase,
  onPhaseChange,
  cheapestOn,
  onCheapestOnChange,
  collection,
  onCollectionChange,
}: ItemFilterSelectsProps) => {
  const facets = useItemFacets();
  const collectionOptions = [
    { value: '', label: 'Любая коллекция' },
    ...(facets.data?.collections.map((entry) => ({ value: entry.name, label: entry.name })) ?? []),
  ];

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
      <Select
        value={cheapestOn}
        onChange={onCheapestOnChange}
        options={MARKET_FILTERS}
        aria-label="Где сейчас дешевле"
      />
      <Select value={wear} onChange={onWearChange} options={WEAR_FILTERS} aria-label="Износ" />
      <Select
        value={edition}
        onChange={onEditionChange}
        options={EDITION_FILTERS}
        aria-label="Версия предмета"
      />
      <Select
        value={phase}
        onChange={onPhaseChange}
        options={PHASE_FILTERS}
        aria-label="Фаза Doppler"
      />
      <Select
        value={collection}
        onChange={onCollectionChange}
        options={collectionOptions}
        aria-label="Коллекция"
      />
    </div>
  );
};
