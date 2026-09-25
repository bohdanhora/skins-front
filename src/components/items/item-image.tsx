import { Package } from 'lucide-react';

import { cn } from '@/lib/utils/cn';

interface ItemImageProps {
  src: string | null;
  alt: string;
  rarityColor: string | null;
  className?: string;
  imageClassName?: string;
}

export const ItemImage = ({ src, alt, rarityColor, className, imageClassName }: ItemImageProps) => (
  <div
    className={cn(
      'bg-surface-muted relative flex items-center justify-center overflow-hidden rounded-2xl',
      className,
    )}
    style={
      rarityColor
        ? {
            backgroundImage: `radial-gradient(circle at 50% 60%, ${rarityColor}33 0%, transparent 70%)`,
          }
        : undefined
    }
  >
    {src ? (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={cn('h-full w-full object-contain drop-shadow-md', imageClassName)}
      />
    ) : (
      <Package className="text-foreground-subtle size-8" aria-hidden />
    )}
    {rarityColor ? (
      <span
        aria-hidden
        className="absolute inset-x-6 bottom-0 h-0.5 rounded-full"
        style={{ backgroundColor: rarityColor }}
      />
    ) : null}
  </div>
);
