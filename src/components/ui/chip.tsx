import type { ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/utils/cn';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

export const Chip = ({ selected = false, className, type = 'button', ...props }: ChipProps) => (
  <button
    type={type}
    aria-pressed={selected}
    className={cn(
      'press inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[0.8125rem] font-medium whitespace-nowrap',
      selected
        ? 'border-foreground bg-foreground text-foreground-inverted'
        : 'border-border-strong bg-surface text-foreground-muted hover:text-foreground',
      className,
    )}
    {...props}
  />
);
