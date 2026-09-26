export type MarketId = 'whiteMarket' | 'dmarket' | 'csfloat' | 'lisSkins';
export type SellMarketId = Exclude<MarketId, 'lisSkins'>;
export type TradingMarketId = Exclude<SellMarketId, 'csfloat'>;
export type ListingMarketId = SellMarketId;
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
  | 'score'
  | 'belowSales'
  | 'fresh';

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
  lisSkins?: MarketQuote | null;
  gap: PriceGap | null;
  flip: Flip | null;
  instant: Flip | null;
  sales: SalesStats | null;
  top: TopOffer | null;
  priceChangedAt?: string | null;
}

export interface ItemsPage {
  items: Item[];
  total: number;
  updatedAt: string | null;
}

export interface SubcategoryOption {
  value: string;
  image: string | null;
  count: number;
}

export interface ItemFacets {
  collections: { name: string; image: string | null }[];
  subcategories?: Partial<Record<ItemCategory, SubcategoryOption[]>>;
}

export interface ItemLibraryOption {
  value: string;
  image: string | null;
  count: number;
  price: number | null;
}

export interface ItemLibraryVariant {
  name: string;
  image: string | null;
  price: number | null;
  phase: MarketPhase | null;
}

export interface ItemLibrary {
  categories: { value: ItemCategory; count: number }[];
  weapons: ItemLibraryOption[];
  skins: ItemLibraryOption[];
  variants: ItemLibraryVariant[];
}

export interface ItemsQuery {
  q?: string;
  category?: ItemCategory;
  subcategory?: string;
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
  sources: Record<ListingMarketId, SourceState>;
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
  lisSkins?: MarketStatus;
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
  markets?: { dmarket: SalesDay[]; csfloat: SalesDay[] | null; whiteMarket?: SalesDay[] | null };
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

export interface SaleOption {
  market: SellMarketId;
  kind: 'listing' | 'instant';
  price: number;
  afterFee: number;
  payout: number;
}

export interface InventoryItem {
  assetIds: string[];
  name: string;
  marketHashName: string;
  type: string;
  image: string | null;
  rarityColor: string | null;
  float: number | null;
  paintSeed: number | null;
  phase: MarketPhase | null;
  amount: number;
  tradable: boolean;
  marketable: boolean;
  whiteMarket: MarketQuote | null;
  dmarket: MarketQuote | null;
  csfloat: MarketQuote | null;
  options: SaleOption[];
  best: SaleOption | null;
  marketPrice: number | null;
  sales: SalesStats | null;
}

export interface InventoryTotals {
  marketPrice: number;
  best: number;
  listing: Record<SellMarketId, number>;
  listingItems: Record<SellMarketId, number>;
  instant: number;
  instantItems: number;
  items: number;
  pricedItems: number;
  unsellableItems: number;
}

export interface Inventory {
  steamId: string;
  name: string | null;
  avatar: string | null;
  fetchedAt: string;
  totals: InventoryTotals;
  items: InventoryItem[];
}

export interface SteamPrice {
  lowest: number | null;
  median: number | null;
  volume: number;
  url: string;
}
