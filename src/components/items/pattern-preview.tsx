'use client';

import { ChevronDown, ExternalLink } from 'lucide-react';
import { useState } from 'react';

import { useRememberedState } from '@/hooks/use-remembered-state';

import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { usePatternImages } from '@/lib/api/queries';
import type { PatternImages } from '@/lib/api/types';
import { blueSidesLabel, formatBlue } from '@/lib/format/blue';
import { cn } from '@/lib/utils/cn';

const MAX_SEED = 1000;

const POSE_LABELS: Record<PatternImages['poses'][number]['pose'], string> = {
  playside: 'Лицевая сторона',
  backside: 'Обратная сторона',
  frontview: 'Сверху',
};

const parseSeed = (value: string): number | null => {
  const seed = Number(value);

  return value.trim() !== '' && Number.isInteger(seed) && seed >= 0 && seed <= MAX_SEED
    ? seed
    : null;
};

const imagesFor = (data: PatternImages, seed: number): { label: string; src: string }[] => {
  const image = data.images[seed];

  return [
    ...(image ? [{ label: 'Целиком', src: `${data.imageBase}${image}` }] : []),
    ...data.poses.map((pose) => ({
      label: POSE_LABELS[pose.pose],
      src: `${pose.base}${seed}.avif`,
    })),
  ];
};

export const PatternPreview = ({
  name,
  seed: controlledSeed,
  onSeedChange,
}: {
  name: string;
  seed?: string;
  onSeedChange?: (seed: string) => void;
}) => {
  const [ownSeed, setOwnSeed] = useState('');
  const [open, setOpen] = useRememberedState('patternPreview.open', true);
  const value = controlledSeed ?? ownSeed;
  const setValue = (next: string) => {
    (onSeedChange ?? setOwnSeed)(next);
    setOpen(true);
  };
  const patterns = usePatternImages(name);
  const seed = parseSeed(value);
  const blue = seed !== null ? patterns.data?.blue[seed] : null;
  const images = seed !== null && patterns.data ? imagesFor(patterns.data, seed) : [];

  if (patterns.isError) return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-foreground-muted text-sm">Паттерн</span>
        <Input
          inputMode="numeric"
          value={value}
          onChange={(event) => setValue(event.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder={`0-${MAX_SEED}`}
          aria-label="Номер паттерна"
          className="numeric w-24"
        />
        {blue ? (
          <span title={blueSidesLabel(name)} className="text-accent numeric text-sm font-semibold">
            {formatBlue(blue)}
          </span>
        ) : null}
        <div className="ml-auto flex items-center gap-3">
          {patterns.data ? (
            <a
              href={seed !== null ? `${patterns.data.pageUrl}${seed}` : patterns.data.pageUrl}
              target="_blank"
              rel="noreferrer"
              className="text-foreground-muted hover:text-foreground flex items-center gap-1 text-xs"
            >
              pattern.wiki
              <ExternalLink className="size-3" aria-hidden />
            </a>
          ) : null}
          {seed !== null ? (
            <button
              type="button"
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              className="text-foreground-muted hover:text-foreground flex items-center gap-1 text-xs"
            >
              {open ? 'Свернуть' : 'Показать'}
              <ChevronDown
                className={cn('size-3.5 transition-transform', open ? 'rotate-180' : '')}
                aria-hidden
              />
            </button>
          ) : null}
        </div>
      </div>
      {seed === null || !open ? null : patterns.isPending ? (
        <Skeleton className="aspect-[4/3] w-full max-w-xl rounded-2xl" />
      ) : images.length > 0 ? (
        <div
          className={cn(
            'grid gap-3',
            images.length > 2
              ? 'sm:grid-cols-3'
              : images.length > 1
                ? 'sm:grid-cols-2'
                : 'max-w-xl',
          )}
        >
          {images.map((image) => (
            <figure key={image.src} className="space-y-1.5">
              <img
                src={image.src}
                alt={`${name}, паттерн ${seed}, ${image.label}`}
                className="bg-surface-muted aspect-[4/3] w-full rounded-2xl object-contain"
              />
              <figcaption className="text-foreground-muted text-xs">{image.label}</figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <p className="text-foreground-muted text-sm">Для этого паттерна нет картинки.</p>
      )}
    </div>
  );
};
