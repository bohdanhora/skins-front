'use client';

import type { ReactNode } from 'react';

import { cn } from '@/lib/utils/cn';

interface SegmentedProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly { value: T; label: string; icon?: ReactNode }[];
  label: string;
  className?: string;
}

export const Segmented = <T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: SegmentedProps<T>) => (
  <div
    role="radiogroup"
    aria-label={label}
    className={cn('bg-surface-muted inline-flex w-full gap-1 rounded-2xl p-1', className)}
  >
    {options.map((option) => {
      const selected = option.value === value;

      return (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={selected}
          onClick={() => onChange(option.value)}
          className={cn(
            'press flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium whitespace-nowrap',
            selected
              ? 'bg-surface text-foreground shadow-[var(--shadow-card)]'
              : 'text-foreground-muted hover:text-foreground',
          )}
        >
          {option.icon}
          {option.label}
        </button>
      );
    })}
  </div>
);
