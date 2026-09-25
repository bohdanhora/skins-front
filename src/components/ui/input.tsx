import type { InputHTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/utils/cn';

const fieldStyles =
  'h-11 w-full rounded-xl border border-border-strong bg-surface px-3.5 text-sm text-foreground transition-colors duration-150 placeholder:text-foreground-subtle focus-visible:border-accent focus-visible:ring-4 focus-visible:ring-accent/15 focus-visible:outline-none';

export const Input = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => (
  <input className={cn(fieldStyles, className)} {...props} />
);

interface IconInputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon: ReactNode;
  trailing?: ReactNode;
}

export const IconInput = ({ icon, trailing, className, ...props }: IconInputProps) => (
  <div className="relative">
    <span className="text-foreground-subtle pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2">
      {icon}
    </span>
    <input className={cn(fieldStyles, 'pl-10', trailing ? 'pr-10' : '', className)} {...props} />
    {trailing ? (
      <span className="absolute top-1/2 right-1.5 -translate-y-1/2">{trailing}</span>
    ) : null}
  </div>
);

interface MoneyInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'value'
> {
  value: string;
  onChange: (value: string) => void;
}

export const MoneyInput = ({ value, onChange, className, ...props }: MoneyInputProps) => (
  <div className="relative">
    <span className="text-foreground-subtle pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm">
      $
    </span>
    <input
      inputMode="decimal"
      value={value}
      onChange={(event) => onChange(event.target.value.replace(/[^\d.,]/g, ''))}
      className={cn(fieldStyles, 'numeric pl-7', className)}
      {...props}
    />
  </div>
);

export const parseMoney = (value: string): number | undefined => {
  const parsed = Number(value.replace(',', '.'));

  return value.trim() !== '' && Number.isFinite(parsed) ? parsed : undefined;
};
