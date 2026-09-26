import type {
  DealMode,
  ItemCategory,
  ItemEdition,
  ItemWear,
  MarketId,
  MarketPhase,
  SellMarketId,
  TradingMarketId,
} from '@/lib/api/types';

export const MARKETS: Record<
  MarketId,
  { name: string; short: string; dot: string; text: string; soft: string }
> = {
  whiteMarket: {
    name: 'white.market',
    short: 'White',
    dot: 'bg-market-wm',
    text: 'text-market-wm',
    soft: 'bg-market-wm-soft',
  },
  dmarket: {
    name: 'DMarket',
    short: 'DMarket',
    dot: 'bg-market-dm',
    text: 'text-market-dm',
    soft: 'bg-market-dm-soft',
  },
  csfloat: {
    name: 'CSFloat',
    short: 'CSFloat',
    dot: 'bg-market-cf',
    text: 'text-market-cf',
    soft: 'bg-market-cf-soft',
  },
  lisSkins: {
    name: 'lis-skins',
    short: 'lis-skins',
    dot: 'bg-market-lis',
    text: 'text-market-lis',
    soft: 'bg-market-lis-soft',
  },
};

export const MARKET_ORDER: MarketId[] = ['whiteMarket', 'dmarket', 'csfloat', 'lisSkins'];
export const SELL_MARKET_ORDER: SellMarketId[] = ['whiteMarket', 'dmarket', 'csfloat'];
export const TRADING_MARKET_ORDER: TradingMarketId[] = ['whiteMarket', 'dmarket'];

export const MARKET_FILTERS: { value: 'all' | MarketId; label: string }[] = [
  { value: 'all', label: 'Любая площадка' },
  { value: 'whiteMarket', label: 'Дешевле на White' },
  { value: 'dmarket', label: 'Дешевле на DMarket' },
  { value: 'csfloat', label: 'Дешевле на CSFloat' },
  { value: 'lisSkins', label: 'Дешевле на lis-skins' },
];

export const WEAR_FILTERS: { value: 'all' | ItemWear; label: string }[] = [
  { value: 'all', label: 'Любой износ' },
  { value: 'FN', label: 'FN' },
  { value: 'MW', label: 'MW' },
  { value: 'FT', label: 'FT' },
  { value: 'WW', label: 'WW' },
  { value: 'BS', label: 'BS' },
];

export const EDITION_FILTERS: { value: 'all' | ItemEdition; label: string }[] = [
  { value: 'all', label: 'Обычный / любой' },
  { value: 'normal', label: 'Только обычные' },
  { value: 'stattrak', label: 'StatTrak™' },
  { value: 'souvenir', label: 'Souvenir' },
];

export const PHASE_FILTERS: { value: 'all' | MarketPhase; label: string }[] = [
  { value: 'all', label: 'Любая фаза' },
  { value: 'phase-1', label: 'Phase 1' },
  { value: 'phase-2', label: 'Phase 2' },
  { value: 'phase-3', label: 'Phase 3' },
  { value: 'phase-4', label: 'Phase 4' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'sapphire', label: 'Sapphire' },
  { value: 'emerald', label: 'Emerald' },
  { value: 'black-pearl', label: 'Black Pearl' },
];

export const CATEGORIES: { value: ItemCategory; label: string; all?: string }[] = [
  { value: 'knife', label: 'Ножи', all: 'Все ножи' },
  { value: 'gloves', label: 'Перчатки', all: 'Все перчатки' },
  { value: 'rifle', label: 'Винтовки', all: 'Все винтовки' },
  { value: 'sniper', label: 'Снайперские', all: 'Все снайперские' },
  { value: 'pistol', label: 'Пистолеты', all: 'Все пистолеты' },
  { value: 'smg', label: 'ПП', all: 'Все пистолеты-пулемёты' },
  { value: 'heavy', label: 'Тяжёлое', all: 'Всё тяжёлое' },
  { value: 'sticker', label: 'Наклейки', all: 'Все наклейки' },
  { value: 'container', label: 'Кейсы' },
  { value: 'agent', label: 'Агенты' },
  { value: 'charm', label: 'Брелоки' },
  { value: 'other', label: 'Другое' },
];

export const DEAL_MODES: {
  value: Exclude<DealMode, 'all'>;
  label: string;
  hint: string;
}[] = [
  {
    value: 'gap',
    label: 'Где дешевле',
    hint: 'Один и тот же предмет, разные цены. Покупай там, где дешевле.',
  },
  {
    value: 'flip',
    label: 'Перепродать',
    hint: 'Купи дешевле на одной площадке и выставь на другой. Прибыль уже с учётом комиссии.',
  },
  {
    value: 'instant',
    label: 'Продать сразу',
    hint: 'Купи на white.market и сразу продай по заявке на DMarket. Без ожидания покупателя.',
  },
];
