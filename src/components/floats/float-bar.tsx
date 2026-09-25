import { cn } from '@/lib/utils/cn';

const TRACK =
  'linear-gradient(90deg, var(--gain) 0%, var(--gain) 7%, #84cc16 7%, #84cc16 15%, var(--warning) 15%, var(--warning) 38%, var(--loss) 38%, var(--loss) 45%, #b91c1c 45%, #b91c1c 100%)';

interface FloatBarProps {
  value: number;
  zoom?: [number, number];
  className?: string;
}

export const FloatBar = ({ value, zoom, className }: FloatBarProps) => {
  const [from, to] = zoom ?? [0, 1];
  const position = Math.min(100, Math.max(0, ((value - from) / (to - from)) * 100));

  return (
    <span
      className={cn('relative block h-1.5 w-full rounded-full opacity-80', className)}
      style={{
        background: zoom ? 'var(--border-strong)' : TRACK,
      }}
      aria-hidden
    >
      <span
        className="bg-foreground border-surface absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
        style={{ left: `${position}%` }}
      />
    </span>
  );
};
