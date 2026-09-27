'use client';

import { ExternalLink, KeyRound, TriangleAlert } from 'lucide-react';

import type { Listing, ListingSticker, Listings, MarketId } from '@/lib/api/types';
import { formatPercent, formatUsd } from '@/lib/format/money';
import { MARKETS, SELL_MARKET_ORDER } from '@/lib/markets';
import { cn } from '@/lib/utils/cn';

import { GenerateButton } from './generate-button';
import { ItemImage } from './item-image';

interface ListingListProps {
  data: Listings;
  compact?: boolean;
  deal?: boolean;
}

export const ListingList = ({ data, compact = false, deal = false }: ListingListProps) => (
  <div className="space-y-3">
    <SourceNotes sources={data.sources} />
    {data.listings.length === 0 ? (
      <p className="text-foreground-muted py-6 text-center text-sm">Подходящих лотов сейчас нет.</p>
    ) : (
      <ul className="divide-border border-border bg-surface divide-y overflow-hidden rounded-2xl border">
        {data.listings.map((listing) => (
          <ListingRow
            key={`${listing.market}-${listing.id}`}
            listing={listing}
            compact={compact}
            deal={deal}
          />
        ))}
      </ul>
    )}
  </div>
);

const SourceNotes = ({ sources }: { sources: Listings['sources'] }) => {
  const notes = SELL_MARKET_ORDER.filter((market) => sources[market].status !== 'ok');

  if (notes.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {notes.map((market) => (
        <SourceNote key={market} market={market} status={sources[market].status} />
      ))}
    </div>
  );
};

const SourceNote = ({ market, status }: { market: MarketId; status: string }) => (
  <span className="bg-surface-muted text-foreground-muted inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs">
    {status === 'noKeys' ? (
      <KeyRound className="size-3.5" aria-hidden />
    ) : (
      <TriangleAlert className="text-warning size-3.5" aria-hidden />
    )}
    {MARKETS[market].name}:{' '}
    {status === 'noKeys' ? 'ключ не подключён, лоты не показываем' : 'не отвечает, попробуй позже'}
  </span>
);

const ListingRow = ({
  listing,
  compact,
  deal,
}: {
  listing: Listing;
  compact: boolean;
  deal: boolean;
}) => (
  <li>
    <a
      href={listing.url}
      target="_blank"
      rel="noreferrer"
      className="hover:bg-surface-muted flex items-center gap-3 px-3 py-3 transition-colors"
    >
      {compact ? null : (
        <ItemImage
          src={listing.image}
          alt={listing.name}
          rarityColor={null}
          className="size-16 shrink-0 rounded-xl"
          imageClassName="p-1"
        />
      )}
      <div className="min-w-0 flex-1 space-y-1.5">
        {compact ? null : <p className="truncate text-sm font-medium">{listing.name}</p>}
        <div className="text-foreground-muted flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="flex items-center gap-1.5">
            <span className={cn('size-2 rounded-full', MARKETS[listing.market].dot)} aria-hidden />
            {MARKETS[listing.market].short}
          </span>
          {listing.float ? (
            <span className="numeric">флоат {Number(listing.float).toFixed(4)}</span>
          ) : null}
        </div>
        {listing.stickers.length > 0 ? (
          <div className="flex items-center gap-1.5">
            {stickerSlots(listing.stickers).map((sticker, index) =>
              sticker ? (
                <StickerIcon key={`${sticker.name}-${index}`} sticker={sticker} />
              ) : (
                <span
                  key={`empty-${index}`}
                  className="border-border size-8 rounded-lg border border-dashed"
                  aria-hidden
                />
              ),
            )}
            {listing.stickersValue > 0 ? (
              <span className="text-foreground-muted numeric ml-1 text-xs">
                наклейки ≈ {formatUsd(listing.stickersValue)}
              </span>
            ) : null}
          </div>
        ) : null}
        {deal && listing.basePrice !== null ? (
          <p className="text-foreground-muted numeric text-xs">
            Без наклеек от {formatUsd(listing.basePrice)},{' '}
            {listing.overpay !== null && listing.overpay > 0
              ? `доплата ${formatUsd(listing.overpay)}`
              : 'доплаты нет'}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <span className="flex items-center gap-2">
          <GenerateButton
            name={listing.name}
            float={listing.float ? Number(listing.float) : null}
            stickers={listing.stickers.map((sticker) => sticker.name)}
            layout={listing.stickers.map(({ slot, wear, offsetX, offsetY, rotation }) => ({
              slot,
              wear,
              offsetX,
              offsetY,
              rotation,
            }))}
          />
          <span className="numeric text-[0.9375rem] font-semibold">{formatUsd(listing.price)}</span>
          <ExternalLink className="text-foreground-subtle size-3.5" aria-hidden />
        </span>
        {deal ? <DealBadge listing={listing} /> : null}
      </div>
    </a>
  </li>
);

const GOOD_SHARE = 0.15;

const DealBadge = ({ listing }: { listing: Listing }) => {
  if (listing.overpayShare === null) {
    return null;
  }

  const free = (listing.overpay ?? 0) <= 0;
  const good = listing.overpayShare <= GOOD_SHARE;

  return (
    <span
      title="Сколько ты доплачиваешь за наклейки по сравнению с их ценой по отдельности"
      className={cn(
        'numeric rounded-lg px-2 py-0.5 text-xs font-semibold',
        good ? 'bg-gain-soft text-gain' : 'bg-surface-muted text-foreground-muted',
      )}
    >
      {free ? 'наклейки бесплатно' : `за ${formatPercent(listing.overpayShare * 100)} их цены`}
    </span>
  );
};

const stickerSlots = (stickers: ListingSticker[]): (ListingSticker | null)[] => {
  if (stickers.some((sticker) => sticker.slot === null)) return stickers;

  const last = Math.max(...stickers.map((sticker) => sticker.slot ?? 0));

  return Array.from(
    { length: last + 1 },
    (_, slot) => stickers.find((sticker) => sticker.slot === slot) ?? null,
  );
};

const StickerIcon = ({ sticker }: { sticker: ListingSticker }) => {
  const scraped = sticker.wear !== null;
  const details = [
    sticker.price ? formatUsd(sticker.price) : null,
    scraped ? `потёрта на ${Math.round(sticker.wear! * 100)}%, в цену не входит` : null,
  ].filter(Boolean);

  return (
    <span
      title={details.length ? `${sticker.name}: ${details.join(', ')}` : sticker.name}
      className="bg-surface-muted relative flex size-8 items-center justify-center rounded-lg"
    >
      {sticker.image ? (
        <img
          src={sticker.image}
          alt={sticker.name}
          className={cn('size-7 object-contain', scraped && 'opacity-40 grayscale')}
        />
      ) : (
        <span className="text-[0.625rem]">?</span>
      )}
      {scraped ? (
        <span className="bg-surface text-warning numeric absolute -right-1 -bottom-1 rounded px-0.5 text-[0.5625rem] leading-tight font-semibold">
          {Math.round(sticker.wear! * 100)}%
        </span>
      ) : null}
    </span>
  );
};
