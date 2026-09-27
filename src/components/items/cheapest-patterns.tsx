'use client';

import { useCheapestPatterns } from '@/lib/api/queries';
import { blueSourceLabel, formatBlue } from '@/lib/format/blue';
import { MARKETS } from '@/lib/markets';
import { cn } from '@/lib/utils/cn';

export const CheapestPatterns = ({ name }: { name: string }) => {
  const patterns = useCheapestPatterns(name, true);
  const listings = patterns.data?.listings ?? [];

  if (listings.length === 0) return null;

  return (
    <div
      className="mt-2 space-y-0.5 px-2.5"
      title={`Самый дешёвый лот, ${blueSourceLabel('calculator')}`}
    >
      {listings.map((listing) => (
        <p
          key={listing.market}
          className="text-foreground-muted numeric flex items-center gap-1.5 text-[0.6875rem]"
        >
          <span
            className={cn('size-1.5 shrink-0 rounded-full', MARKETS[listing.market].dot)}
            aria-hidden
          />
          <span>#{listing.paintSeed}</span>
          <span className="text-accent font-medium">{formatBlue(name, listing.blue)}</span>
        </p>
      ))}
    </div>
  );
};
