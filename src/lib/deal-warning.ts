import type { DealMode, Item } from '@/lib/api/types';
import { formatUsd } from '@/lib/format/money';
import { MARKETS } from '@/lib/markets';

const THIN_MARKET = 3;
const OVERPRICED_RATIO = 1.5;
const RARE_SALES = 5;
const SUSPICIOUS_DISCOUNT = 35;

export interface DealWarning {
  short: string;
  long: string;
}

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

  const markets = (['whiteMarket', 'dmarket', 'csfloat'] as const)
    .map((market) => ({ market, quote: item[market] }))
    .filter((entry) => entry.quote?.price !== null && (entry.quote?.listings ?? 0) > 0)
    .sort((left, right) => right.quote!.price! - left.quote!.price!);
  const pricier = markets[0]?.market;
  const quote = pricier ? item[pricier] : null;

  if (pricier && quote?.bid && quote.price !== null && quote.price > quote.bid * OVERPRICED_RATIO) {
    return {
      short: 'цена под вопросом',
      long: `На ${MARKETS[pricier].name} лоты стоят ${formatUsd(quote.price)}, но скупают всего за ${formatUsd(quote.bid)}. По такой цене предмет может долго не продаваться.`,
    };
  }

  const comparedDepth = markets
    .filter((entry) => entry.market === item.gap?.cheaper || entry.market === pricier)
    .map((entry) => entry.quote?.listings ?? 0);

  if (comparedDepth.length < 2 || Math.min(...comparedDepth) < THIN_MARKET) {
    return {
      short: 'мало лотов',
      long: 'Предложений совсем мало, цена может быстро уйти.',
    };
  }

  return null;
};
