import type { Item, MarketId, SalesStats, SellMarketId } from '@/lib/api/types';
import { WEAR_RANGES } from '@/lib/format/float';
import { parseItemName } from '@/lib/format/item-name';
import { SELL_MARKET_ORDER } from '@/lib/markets';

export type PurchaseMarket = MarketId | 'steam' | 'other';
export type FeeTable = Record<SellMarketId, number>;

export interface PurchaseSale {
  market: PurchaseMarket;
  received: number;
  soldAt: string;
}

export interface Purchase {
  id: string;
  name: string;
  image: string | null;
  rarityColor: string | null;
  price: number;
  amount: number;
  market: PurchaseMarket;
  boughtAt: string;
  unlockAt: string;
  float: number | null;
  paintSeed: number | null;
  note: string;
  stickers: string[];
  assetId: string | null;
  sale: PurchaseSale | null;
}

export type PurchaseInput = Omit<Purchase, 'id'>;

export interface SellOption {
  market: SellMarketId;
  kind: 'listing' | 'instant';
  price: number;
  payout: number;
  profit: number;
  percent: number;
}

export interface Advice {
  tone: 'gain' | 'loss' | 'warning' | 'muted';
  text: string;
}

export const TRADE_LOCK_DAYS = 7;

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;
const ONE_CENT = 1;
const NOTABLE_PERCENT = 3;

const share = (amount: number, percent: number): number => Math.floor(amount * (1 - percent / 100));

export const payoutFor = (
  price: number,
  market: SellMarketId,
  fees: FeeTable,
  withdrawals: FeeTable,
): number => share(share(price, fees[market]), withdrawals[market]);

export const breakEvenPrice = (
  cost: number,
  market: SellMarketId,
  fees: FeeTable,
  withdrawals: FeeTable,
): number => {
  const keep = (1 - fees[market] / 100) * (1 - withdrawals[market] / 100);
  let price = Math.max(ONE_CENT, Math.ceil(cost / keep));

  while (payoutFor(price, market, fees, withdrawals) < cost) {
    price += ONE_CENT;
  }

  return price;
};

const makeOption = (
  market: SellMarketId,
  kind: SellOption['kind'],
  price: number,
  cost: number,
  fees: FeeTable,
  withdrawals: FeeTable,
): SellOption => {
  const payout = payoutFor(price, market, fees, withdrawals);

  return {
    market,
    kind,
    price,
    payout,
    profit: payout - cost,
    percent: cost > 0 ? ((payout - cost) / cost) * 100 : 0,
  };
};

export const sellOptions = (
  item: Item,
  cost: number,
  fees: FeeTable,
  withdrawals: FeeTable,
): SellOption[] => {
  const options: SellOption[] = [];

  for (const market of SELL_MARKET_ORDER) {
    const quote = item[market];

    if (quote && quote.listings > 0 && quote.price !== null && quote.price > ONE_CENT) {
      options.push(makeOption(market, 'listing', quote.price - ONE_CENT, cost, fees, withdrawals));
    }
  }

  const bid = item.dmarket?.bid;

  if (bid && bid > 0) {
    options.push(makeOption('dmarket', 'instant', bid, cost, fees, withdrawals));
  }

  return options;
};

export const bestOption = (options: SellOption[]): SellOption | null =>
  options.reduce<SellOption | null>(
    (top, entry) => (!top || entry.payout > top.payout ? entry : top),
    null,
  );

export const marketPrice = (item: Item): number | null => {
  const prices = SELL_MARKET_ORDER.map((market) => item[market])
    .filter((quote) => quote && quote.listings > 0 && quote.price !== null)
    .map((quote) => quote!.price!);

  return prices.length > 0 ? Math.min(...prices) : null;
};

export const lockLeft = (purchase: Pick<Purchase, 'unlockAt'>, now = Date.now()): number =>
  Math.max(0, Date.parse(purchase.unlockAt) - now);

export const formatLockLeft = (ms: number): string => {
  const days = Math.floor(ms / DAY_MS);
  const hours = Math.floor((ms % DAY_MS) / HOUR_MS);

  if (days > 0) {
    return hours > 0 ? `${days} дн. ${hours} ч` : `${days} дн.`;
  }

  if (hours > 0) {
    return `${hours} ч`;
  }

  return `${Math.max(1, Math.ceil(ms / 60_000))} мин`;
};

export const unlockFrom = (boughtAt: string, days: number): string =>
  new Date(Date.parse(boughtAt) + days * DAY_MS).toISOString();

export const lockDays = (purchase: Pick<Purchase, 'boughtAt' | 'unlockAt'>): number =>
  Math.max(0, Math.round((Date.parse(purchase.unlockAt) - Date.parse(purchase.boughtAt)) / DAY_MS));

const signedPercent = (value: number): string => {
  const rounded = Math.round(Math.abs(value));

  return `${value >= 0 ? '+' : '−'}${rounded}%`;
};

export const sellAdvice = (
  best: SellOption | null,
  current: number | null,
  sales: SalesStats | null,
): Advice => {
  if (!best) {
    return { tone: 'muted', text: 'Нет цен на площадках' };
  }

  const average = sales?.eightWeekAverage ?? null;
  const vsAverage = current !== null && average ? ((current - average) / average) * 100 : null;
  const trend = sales?.trendPercent ?? null;

  if (best.profit > 0) {
    if (vsAverage !== null && vsAverage >= NOTABLE_PERCENT) {
      return {
        tone: 'gain',
        text: `В плюсе, цена ${signedPercent(vsAverage)} к средней за 8 нед. Хороший момент`,
      };
    }

    if (trend !== null && trend <= -NOTABLE_PERCENT) {
      return {
        tone: 'warning',
        text: `В плюсе, но цена падает: ${signedPercent(trend)} за неделю. Лучше не тянуть`,
      };
    }

    return { tone: 'gain', text: 'Можно продавать в плюс' };
  }

  if (trend !== null && trend >= NOTABLE_PERCENT) {
    return {
      tone: 'muted',
      text: `Пока в минусе, но цена растёт: ${signedPercent(trend)} за неделю. Можно подождать`,
    };
  }

  if (vsAverage !== null && vsAverage <= -NOTABLE_PERCENT) {
    return {
      tone: 'muted',
      text: `Пока в минусе, цена ${signedPercent(vsAverage)} к средней за 8 нед. Можно подождать`,
    };
  }

  return { tone: 'loss', text: 'Пока в минусе' };
};

export const toLocalInput = (iso: string): string => {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const fromLocalInput = (value: string): string | null => {
  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

const sameFloat = (left: number | null, right: number | null): boolean =>
  left !== null && right !== null && Math.abs(left - right) < 1e-9;

export const findPurchase = (
  purchases: Purchase[],
  item: { name: string; assetIds: string[]; float: number | null },
): Purchase | null =>
  purchases.find(
    (purchase) =>
      purchase.sale === null &&
      ((purchase.assetId !== null && item.assetIds.includes(purchase.assetId)) ||
        (purchase.name === item.name && sameFloat(purchase.float, item.float))),
  ) ?? null;

type BackupEntry = Partial<PurchaseInput> &
  Pick<PurchaseInput, 'name' | 'price' | 'boughtAt' | 'unlockAt'>;

const isPurchase = (value: unknown): value is BackupEntry => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const entry = value as Partial<PurchaseInput>;

  return (
    typeof entry.name === 'string' &&
    typeof entry.price === 'number' &&
    typeof entry.boughtAt === 'string' &&
    typeof entry.unlockAt === 'string'
  );
};

export const toInput = (purchase: PurchaseInput & { id?: string }): PurchaseInput => {
  const input = { ...purchase };

  delete input.id;
  return input;
};

export const parseBackup = (raw: string): PurchaseInput[] | null => {
  try {
    const parsed: unknown = JSON.parse(raw);
    const list = Array.isArray(parsed)
      ? parsed
      : (parsed as { purchases?: unknown } | null)?.purchases;

    if (!Array.isArray(list) || !list.every(isPurchase)) {
      return null;
    }

    return list.map((entry) =>
      toInput({
        image: null,
        rarityColor: null,
        amount: 1,
        market: 'other',
        float: null,
        paintSeed: null,
        note: '',
        stickers: [],
        assetId: null,
        sale: null,
        ...entry,
      }),
    );
  } catch {
    return null;
  }
};

const LOW_FLOAT_SHARE = 0.3;

export const lowFloatRange = (name: string, float: number | null): [number, number] | null => {
  const wear = parseItemName(name).wear;

  if (!wear || float === null) return null;

  const [from, to] = WEAR_RANGES[wear];

  return float >= from && float < from + (to - from) * LOW_FLOAT_SHARE ? [from, float] : null;
};

export const STICKER_PREMIUM: [number, number] = [0.03, 0.1];

export const stickerPremium = (value: number): [number, number] => [
  Math.round(value * STICKER_PREMIUM[0]),
  Math.round(value * STICKER_PREMIUM[1]),
];
