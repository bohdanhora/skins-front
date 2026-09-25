export type MarketId = 'whiteMarket' | 'dmarket';

export type ItemCategory =
  | 'knife'
  | 'gloves'
  | 'rifle'
  | 'sniper'
  | 'pistol'
  | 'smg'
  | 'heavy'
  | 'sticker'
  | 'container'
  | 'agent'
  | 'charm'
  | 'other';

export type DealMode = 'all' | 'gap' | 'flip' | 'instant' | 'top';

export type ItemSort =
  'benefit' | 'benefitAmount' | 'bidCover' | 'popular' | 'priceAsc' | 'priceDesc' | 'name';

/** Money is always in US cents. */
export interface MarketQuote {
  price: number | null;
  listings: number;
  bid: number | null;
  bids: number;
  url: string;
}

export interface PriceGap {
  cheaper: MarketId;
  amount: number;
  percent: number;
}

export interface Flip {
  buyOn: MarketId;
  sellOn: MarketId;
  buyPrice: number;
  sellPrice: number;
  profit: number;
  percent: number;
}

/** Recent DMarket sales, summarized. */
export interface SalesStats {
  /** Low end of recent sale prices, the "normal" price. */
  floor: number;
  lastDay: string;
  lastAverage: number;
  weekSales: number;
}

export interface TopOffer {
  price: number;
  /** Sales floor or the other market price, whichever is lower. */
  reference: number;
  discount: number;
  percent: number;
  /** Best buy order as % of the price. */
  bidCover: number | null;
}

export interface Item {
  name: string;
  image: string | null;
  rarity: string | null;
  rarityColor: string | null;
  category: ItemCategory;
  whiteMarket: MarketQuote | null;
  dmarket: MarketQuote | null;
  gap: PriceGap | null;
  flip: Flip | null;
  instant: Flip | null;
  sales: SalesStats | null;
  top: TopOffer | null;
}

export interface ItemsPage {
  items: Item[];
  total: number;
  updatedAt: string | null;
}

export interface ItemsQuery {
  q?: string;
  category?: ItemCategory;
  mode?: DealMode;
  sort?: ItemSort;
  minPrice?: number;
  maxPrice?: number;
  minListings?: number;
  onlyProfitable?: boolean;
  minWeekSales?: number;
  minBidCover?: number;
  feeWhiteMarket?: number;
  feeDmarket?: number;
  names?: string[];
  limit?: number;
  offset?: number;
}

export type SourceStatus = 'ok' | 'noKeys' | 'error';

export interface SourceState {
  status: SourceStatus;
  message: string | null;
}

export interface ListingSticker {
  name: string;
  image: string | null;
  price: number | null;
}

export interface Listing {
  market: MarketId;
  id: string;
  name: string;
  image: string | null;
  price: number;
  float: string | null;
  stickers: ListingSticker[];
  stickersValue: number;
  url: string;
}

export interface Listings {
  sources: Record<MarketId, SourceState>;
  listings: Listing[];
}

export interface MarketStatus {
  updatedAt: string | null;
  items: number;
  error: string | null;
  keysConfigured: boolean;
}

export interface Status {
  whiteMarket: MarketStatus;
  dmarket: MarketStatus;
  refreshing: boolean;
  comparedItems: number;
  catalogItems: number;
  salesChecked: number;
  salesTotal: number;
}

export interface SalesDay {
  day: string;
  average: number;
  count: number;
}

export interface SalesChart {
  days: SalesDay[];
  stats: SalesStats | null;
}

export interface FloatListing {
  market: MarketId;
  price: number;
  float: number | null;
  paintSeed: number | null;
  url: string;
}

export interface FloatBuyOrder {
  price: number;
  amount: number;
  floatPart: string | null;
  range: [number, number] | null;
}

export interface FloatSource {
  status: SourceStatus;
  listings: FloatListing[];
  total: number;
}

export interface FloatSearch {
  dmarket: FloatSource;
  whiteMarket: FloatSource;
  whiteMarketCheapest: FloatListing | null;
  orders: FloatBuyOrder[];
  cheapestAnyFloat: number | null;
}

/** A listing that already fits a DMarket buy order paying more than it costs. */
export interface Snipe {
  name: string;
  image: string | null;
  rarityColor: string | null;
  category: ItemCategory;
  source: MarketId;
  listingPrice: number;
  float: number | null;
  paintSeed: number | null;
  phase: string | null;
  orderPrice: number;
  orderAmount: number;
  orderFloatPart: string | null;
  orderFloatRange: [number, number] | null;
  orderPaintSeed: number | null;
  orderPhase: string | null;
  /** After the DMarket seller fee. */
  profit: number;
  percent: number;
  checkedAt: string;
  listingUrl: string;
}

export interface SnipesPage {
  items: Snipe[];
  total: number;
  checked: number;
  candidates: number;
}

export type SnipeSort = 'profit' | 'percent' | 'priceAsc' | 'fresh';

export interface SnipesQuery {
  q?: string;
  category?: ItemCategory;
  source?: 'all' | MarketId;
  minPrice?: number;
  maxPrice?: number;
  minProfit?: number;
  specialOnly?: boolean;
  sort?: SnipeSort;
}
