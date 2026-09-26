import { WEAR_LABELS, parseItemName } from '@/lib/format/item-name';
import { cn } from '@/lib/utils/cn';

interface ItemTitleProps {
  name: string;
  size?: 'md' | 'lg';
}

const KIND_LABELS: Record<string, string> = {
  Sticker: 'Наклейка',
  Charm: 'Брелок',
  'Souvenir Charm': 'Сувенирный брелок',
  Patch: 'Нашивка',
  'Sealed Graffiti': 'Граффити',
  'Music Kit': 'Набор музыки',
};

export const ItemTitle = ({ name, size = 'md' }: ItemTitleProps) => {
  const parsed = parseItemName(name);
  const primary = parsed.detail || parsed.base;
  const secondary = parsed.detail ? (KIND_LABELS[parsed.base] ?? parsed.base) : null;

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-1.5">
        {parsed.statTrak ? <Tag className="bg-loss-soft text-loss">StatTrak</Tag> : null}
        {parsed.souvenir ? <Tag className="bg-warning-soft text-warning">Сувенир</Tag> : null}
        {parsed.wear ? (
          <Tag className="bg-surface-muted text-foreground-muted" title={WEAR_LABELS[parsed.wear]}>
            {parsed.wear}
          </Tag>
        ) : null}
        {secondary ? (
          <span className="text-foreground-muted truncate text-xs">{secondary}</span>
        ) : null}
      </div>
      <p
        title={name}
        className={cn(
          'text-foreground mt-1 font-semibold',
          size === 'lg' ? 'text-xl leading-tight' : 'line-clamp-2 text-[0.9375rem] leading-snug',
        )}
      >
        {primary}
        {parsed.phase || parsed.commonPhases ? (
          <span
            className="bg-accent-soft text-accent ml-1.5 inline-block rounded-md px-1.5 py-0.5 align-[0.1em] text-[0.75rem] font-semibold whitespace-nowrap"
            title={
              parsed.phase
                ? undefined
                : 'Самая дешёвая из Phase 1-4. Ruby, Sapphire, Emerald и Black Pearl идут отдельными карточками'
            }
          >
            {parsed.phase ?? 'Phase 1-4'}
          </span>
        ) : null}
      </p>
    </div>
  );
};

const Tag = ({
  children,
  className,
  title,
}: {
  children: string;
  className: string;
  title?: string;
}) => (
  <span
    title={title}
    className={cn('rounded-md px-1.5 py-0.5 text-[0.6875rem] font-semibold', className)}
  >
    {children}
  </span>
);
