import type { BlueShare } from '@/lib/api/types';
import { blueSidesLabel, formatBlue } from '@/lib/format/blue';
import { cn } from '@/lib/utils/cn';

export const BlueShareTag = ({
  blue,
  name,
  className,
}: {
  blue: BlueShare;
  name: string;
  className?: string;
}) => (
  <span title={blueSidesLabel(name)} className={cn('text-accent numeric font-medium', className)}>
    {formatBlue(blue)}
  </span>
);
