import { fadeShare } from '@/lib/format/fade';
import { cn } from '@/lib/utils/cn';

export const FadeTag = ({
  name,
  seed,
  className,
}: {
  name: string;
  seed: number | null;
  className?: string;
}) => {
  const fade = fadeShare(name, seed);

  return fade ? (
    <span
      title={`Место ${fade.ranking} среди паттернов по фейду`}
      className={cn('numeric font-medium text-amber-500', className)}
    >
      фейд {fade.percentage}%
    </span>
  ) : null;
};
