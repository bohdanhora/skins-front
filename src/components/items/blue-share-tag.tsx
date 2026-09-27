import type { BlueShare } from '@/lib/api/types';
import { blueSourceLabel, formatBlue } from '@/lib/format/blue';
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
  <span
    title={blueSourceLabel('calculator')}
    className={cn('text-accent numeric font-medium', className)}
  >
    {formatBlue(name, blue)}
  </span>
);
