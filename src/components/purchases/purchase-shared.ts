import type { PurchaseMarket } from '@/lib/purchases/purchases';
import { MARKETS, MARKET_ORDER } from '@/lib/markets';

export const PURCHASE_MARKET_OPTIONS: { value: PurchaseMarket; label: string }[] = [
  ...MARKET_ORDER.map((market) => ({ value: market, label: MARKETS[market].name })),
  { value: 'steam', label: 'Steam' },
  { value: 'other', label: 'Другое' },
];

export const purchaseMarketName = (market: PurchaseMarket): string =>
  PURCHASE_MARKET_OPTIONS.find((option) => option.value === market)?.label ?? market;

export const purchaseMarketDot = (market: PurchaseMarket): string =>
  market in MARKETS ? MARKETS[market as keyof typeof MARKETS].dot : 'bg-foreground-subtle';
