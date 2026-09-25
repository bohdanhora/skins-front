export type MarketId = 'whiteMarket' | 'dmarket' | 'csfloat';
export type TradingMarketId = Exclude<MarketId, 'csfloat'>;
export type ListingMarketId = MarketId;
export type MarketPhase =
  'phase-1' | 'phase-2' | 'phase-3' | 'phase-4' | 'ruby' | 'sapphire' | 'emerald' | 'black-pearl';
export type ItemWear = 'FN' | 'MW' | 'FT' | 'WW' | 'BS';
export type ItemEdition = 'normal' | 'stattrak' | 'souvenir';

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
  | 'benefit'
  | 'benefitAmount'
  | 'bidCover'
  | 'popular'
  | 'priceAsc'
  | 'priceDesc'
  | 'name'
  | 'sales8w'
  | 'score';

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

export interface SalesStats {
  floor: number;
  lastDay: string;
  lastAverage: number;
  weekSales: number;
  eightWeekSales?: number;
  eightWeekAverage?: number;
  trendPercent?: number | null;
}

export interface TopOffer {
  price: number;
  reference: number;
  discount: number;
  percent: number;
  bidCover: number | null;
}

export interface Item {
  name: string;
  image: string | null;
  rarity: string | null;
  rarityColor: string | null;
  category: ItemCategory;
  phase?: MarketPhase | null;
  collections?: { name: string; image: string | null }[];
  dealScore?: { score: number; confidence: 'high' | 'medium' | 'low' } | null;
  whiteMarket: MarketQuote | null;
  dmarket: MarketQuote | null;
  csfloat: MarketQuote | null;
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

export interface ItemFacets {
  collections: { name: string; image: string | null }[];
}

export interface ItemsQuery {
  q?: string;
  category?: ItemCategory;
  wear?: ItemWear;
  edition?: ItemEdition;
  phase?: MarketPhase;
  collection?: string;
  cheapestOn?: MarketId;
  mode?: DealMode;
  sort?: ItemSort;
  minPrice?: number;
  maxPrice?: number;
  minListings?: number;
  onlyProfitable?: boolean;
  minWeekSales?: number;
  minEightWeekSales?: number;
  minBenefitPercent?: number;
  minBidCover?: number;
  feeWhiteMarket?: number;
  feeDmarket?: number;
  feeCsfloat?: number;
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
  basePrice: number | null;
  overpay: number | null;
  wantedValue: number;
  overpayShare: number | null;
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
  csfloat: MarketStatus;
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
  market: ListingMarketId;
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
  csfloat: FloatSource;
  steam: {
    status: SourceStatus;
    listings: SteamFloatListing[];
    total: number;
  };
  whiteMarketCheapest: FloatListing | null;
  orders: FloatBuyOrder[];
  cheapestAnyFloat: number | null;
}

export interface SteamFloatListing {
  id: string;
  priceLabel: string;
  float: number | null;
  paintSeed: number | null;
  phase: MarketPhase | null;
  url: string;
}

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
  minFloat?: number;
  maxFloat?: number;
  phase?: MarketPhase;
  minProfit?: number;
  specialOnly?: boolean;
  sort?: SnipeSort;
}
