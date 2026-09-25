import { ChevronDown } from 'lucide-react';
import type { SelectHTMLAttributes } from 'react';

import { cn } from '@/lib/utils/cn';

interface SelectProps<T extends string> extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'onChange' | 'value'
> {
  value: T;
  onChange: (value: T) => void;
  options: readonly { value: T; label: string }[];
}

export const Select = <T extends string>({
  value,
  onChange,
  options,
  className,
  ...props
}: SelectProps<T>) => (
  <div className={cn('relative', className)}>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as T)}
      className="border-border-strong bg-surface text-foreground focus-visible:border-accent focus-visible:ring-accent/15 h-11 w-full appearance-none rounded-xl border pr-9 pl-3.5 text-sm focus-visible:ring-4 focus-visible:outline-none"
      {...props}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    <ChevronDown
      className="text-foreground-subtle pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
      aria-hidden
    />
  </div>
);
