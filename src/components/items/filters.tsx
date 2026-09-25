'use client';

import { Search, X } from 'lucide-react';
import type { ReactNode } from 'react';

import { Chip } from '@/components/ui/chip';
import { IconInput, MoneyInput } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useItemFacets } from '@/lib/api/queries';
import type { ItemCategory, ItemEdition, ItemWear, MarketId, MarketPhase } from '@/lib/api/types';
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
  exclude?: ItemCategory[];
}

export const CategoryChips = ({ value, onChange, exclude = [] }: CategoryChipsProps) => (
  <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
    <Chip selected={value === undefined} onClick={() => onChange(undefined)}>
      Всё
    </Chip>
    {CATEGORIES.filter((category) => !exclude.includes(category.value)).map((category) => (
      <Chip
        key={category.value}
        selected={value === category.value}
        onClick={() => onChange(value === category.value ? undefined : category.value)}
      >
        {category.label}
      </Chip>
    ))}
  </div>
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
