import type { DealMode, Item } from '@/lib/api/types';
import { formatUsd } from '@/lib/format/money';
import { MARKETS } from '@/lib/markets';

const THIN_MARKET = 3;
/** Listings this far above what buyers actually pay rarely sell at that price. */
const OVERPRICED_RATIO = 1.5;
const RARE_SALES = 5;
const SUSPICIOUS_DISCOUNT = 35;

export interface DealWarning {
  short: string;
  long: string;
}

/** Explains why a deal that looks great on paper may not work out. */
export const dealWarning = (item: Item, mode: DealMode): DealWarning | null => {
  if (mode === 'top') {
    if ((item.sales?.weekSales ?? 0) < RARE_SALES) {
      return {
        short: 'редко продаётся',
        long: 'За неделю на DMarket продали всего несколько штук, средняя цена может быть случайной.',
      };
    }

    return (item.top?.percent ?? 0) >= SUSPICIOUS_DISCOUNT
      ? {
          short: 'проверь лот',
          long: 'Скидка слишком большая. Так бывает у лотов с трейдлоком, неудачным флоатом или когда цена только что упала. Посмотри лот перед покупкой.',
        }
      : null;
  }

  if (mode === 'instant') {
    return (item.dmarket?.bids ?? 0) < THIN_MARKET
      ? {
          short: 'мало заявок',
          long: 'На DMarket почти нет заявок на покупку, их могут забрать раньше тебя.',
        }
      : null;
  }

  if (!item.gap) {
    return null;
  }

  const pricier = item.gap.cheaper === 'whiteMarket' ? 'dmarket' : 'whiteMarket';
  const quote = item[pricier];

  if (quote?.bid && quote.price !== null && quote.price > quote.bid * OVERPRICED_RATIO) {
    return {
      short: 'цена под вопросом',
      long: `На ${MARKETS[pricier].name} лоты стоят ${formatUsd(quote.price)}, но скупают всего за ${formatUsd(quote.bid)}. По такой цене предмет может долго не продаваться.`,
    };
  }

  if (Math.min(item.whiteMarket?.listings ?? 0, item.dmarket?.listings ?? 0) < THIN_MARKET) {
    return {
      short: 'мало лотов',
      long: 'Предложений совсем мало, цена может быстро уйти.',
    };
  }

  return null;
};
