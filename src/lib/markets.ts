import type { DealMode, ItemCategory, MarketId } from '@/lib/api/types';

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
};

export const MARKET_ORDER: MarketId[] = ['whiteMarket', 'dmarket'];

export const CATEGORIES: { value: ItemCategory; label: string }[] = [
  { value: 'knife', label: 'Ножи' },
  { value: 'gloves', label: 'Перчатки' },
  { value: 'rifle', label: 'Винтовки' },
  { value: 'sniper', label: 'Снайперские' },
  { value: 'pistol', label: 'Пистолеты' },
  { value: 'smg', label: 'ПП' },
  { value: 'heavy', label: 'Тяжёлое' },
  { value: 'sticker', label: 'Наклейки' },
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
