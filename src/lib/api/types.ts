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
  market: MarketId;
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
  checkedAt?: { whiteMarket: string | null; dmarket: string | null; csfloat: string | null };
  csfloatPausedUntil?: string | null;
}

export interface BuyOrders {
  csfloat: { price: number; amount: number; floatRange: [number, number] | null } | null;
  float: number | null;
  unavailable: boolean;
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
  slot: number | null;
  wear: number | null;
  offsetX: number | null;
  offsetY: number | null;
  rotation: number | null;
  scale: number | null;
  price: number | null;
  value: number;
}

export interface Listing {
  market: MarketId;
  id: string;
  name: string;
  image: string | null;
  price: number;
  float: string | null;
  paintSeed: number | null;
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
  floors?: Record<'dmarket' | 'csfloat' | 'whiteMarket', { checked: number; total: number }>;
  csfloatQuota?: {
    limit: number | null;
    remaining: number | null;
    resetAt: string | null;
    pausedUntil: string | null;
  };
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

export interface BlueShare {
  playside: number;
  backside: number;
}

export interface FloatListing {
  market: ListingMarketId;
  price: number;
  float: number | null;
  paintSeed: number | null;
  blue: BlueShare | null;
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
  price: number | null;
  float: number | null;
  paintSeed: number | null;
  blue: BlueShare | null;
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
  blue: BlueShare | null;
  phase: string | null;
  orderMarket: 'dmarket' | 'csfloat';
  orderPrice: number;
  orderAmount: number;
  orderFloatPart: string | null;
  orderFloatRanges: [number, number][];
  orderPaintSeed: number | null;
  orderPhase: string | null;
  profit: number;
  percent: number;
  checkedAt: string;
  listingUrl: string;
}

export interface LiveCheck {
  changed: string[];
  checkedAt: string;
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
  blue: BlueShare | null;
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

export type BlueGemWear = 'FN' | 'MW' | 'FT' | 'WW' | 'BS';

export interface BlueGemListing {
  market: MarketId | 'steam';
  id: string;
  name: string;
  price: number | null;
  priceLabel: string | null;
  float: number | null;
  paintSeed: number;
  blue: BlueShare;
  csfloatBlue: BlueShare | null;
  floorPrice: number | null;
  url: string;
}

export interface BlueSale {
  name: string;
  price: number;
  ratio: number;
  paintSeed: number;
  float: number;
  blue: BlueShare;
  soldAt: string;
}

export interface BlueValue {
  blue: BlueShare;
  source: 'csfloat' | 'calculator';
  market: number | null;
  multiplier: number | null;
  estimate: number | null;
  premium: number | null;
  band: [number, number];
  comparableCount: number;
  checked: number;
  spanDays: number | null;
  sales: BlueSale[];
}

export interface CheapestPattern {
  market: MarketId;
  price: number;
  float: number | null;
  paintSeed: number;
  blue: BlueShare;
}

export interface PatternImages {
  name: string;
  pageUrl: string;
  imageBase: string;
  images: string[];
  blue: (BlueShare | null)[];
  poses: { pose: 'playside' | 'backside' | 'frontview'; base: string }[];
}

export interface BlueGemSearch {
  weapon: string;
  listings: BlueGemListing[];
  sources: {
    dmarket: SourceStatus;
    whiteMarket: SourceStatus;
    csfloat: SourceStatus;
    steam: SourceStatus | null;
  };
  csfloatSeeds: { seed: number; blue: BlueShare }[];
  checkedAt: string;
}

export type TradeUpTier =
  'consumer' | 'industrial' | 'milspec' | 'restricted' | 'classified' | 'covert' | 'rare';

export interface TradeUpSkin {
  name: string;
  weapon: string;
  tier: TradeUpTier;
  collections: string[];
  cases: string[];
  minFloat: number;
  maxFloat: number;
  wearless: boolean;
  stattrak: boolean;
  image: string | null;
  prices: Record<string, [number, number]>;
}

export interface TradeUpCatalog {
  skins: TradeUpSkin[];
  updatedAt: string | null;
}

export interface BetTeam {
  name: string;
  acronym: string | null;
  image: string | null;
  rank: number | null;
  points: number | null;
  roster: string[];
  mapGames: number;
  habits: { map: string; share: number; permaban: boolean }[];
}

export interface BetMapRecord {
  offset: number;
  games: number;
  wins: number;
}

export interface BetPlannedMap {
  map: string;
  pickedBy: 1 | 2 | null;
  chance: number;
  team1: BetMapRecord | null;
  team2: BetMapRecord | null;
}

export interface BetVeto {
  team: 1 | 2;
  step: 'ban' | 'pick';
  map: string;
}

export interface BetOffer {
  kind: 'winner' | 'map' | 'handicap' | 'total';
  line: number;
  mapIndex: number | null;
  side: 1 | 2;
  model: number;
  market: number | null;
  chance: number;
  odds: number;
  bookmaker: string;
  bookmakers: number;
  expectedValue: number;
  stake: number;
}

export interface BetMatch {
  id: number;
  startsAt: string;
  live: boolean;
  bestOf: number;
  event: string;
  stage: string;
  team1: BetTeam;
  team2: BetTeam;
  win: number;
  scores: { first: number; second: number; chance: number }[];
  maps: BetPlannedMap[];
  vetoes: BetVeto[];
  markets: BetOffer[];
  bestBet: BetOffer | null;
  oddsFound: boolean;
  confidence: 'high' | 'medium' | 'low';
}

export interface BetEvent {
  id: number;
  name: string;
  image: string | null;
  tier: string | null;
  beginsAt: string | null;
  endsAt: string | null;
}

export interface BettingOverview {
  matches: BetMatch[];
  events: BetEvent[];
  mapsKnown: number;
  mapPool: string[];
  standingsDate: string | null;
  sync: { running: boolean; pagesDone: number; pagesQueued: number; lastError: string | null };
  sources: { schedule: boolean; odds: boolean };
}

export interface AssistantProvider {
  id: string;
  label: string;
  apiKeysUrl: string;
  keyHint: string;
  defaultModel: string;
  models: string[];
  webSearch: boolean;
}

export interface AssistantSettings {
  provider: string | null;
  model: string | null;
  keyHint: string | null;
  available: boolean;
}

export interface MatchBrief {
  verdict: 'confirm' | 'caution' | 'avoid' | 'no_bet';
  summary: string;
  warnings: string[];
  betCheck: { status: 'ok' | 'check'; reason: string };
  lineups: { team1: string[]; team2: string[] };
  sources: { url: string; title: string }[];
  searched: boolean;
  model: string;
  createdAt: string;
}

export interface PurchaseDraft {
  name: string | null;
  known: boolean;
  image: string | null;
  rarityColor: string | null;
  price: number | null;
  float: number | null;
  paintSeed: number | null;
  stickers: string[];
  market: string | null;
}

export interface SmartSearch {
  q?: string;
  category?: ItemCategory;
  wear?: ItemWear;
  edition?: ItemEdition;
  phase?: MarketPhase;
  minPrice?: number;
  maxPrice?: number;
  sort?: ItemSort;
  note?: string;
  picks?: { name: string; reason: string; price: number | null }[];
}

export interface BluePick {
  market: string;
  id: string;
  name: string;
  price: number;
  float: number | null;
  paintSeed: number;
  blue: BlueShare;
  url: string;
  estimate: number;
  margin: number;
  multiplier: number;
  comparableCount: number;
  source: 'csfloat' | 'calculator';
  reason: string;
}

export interface BluePicks {
  picks: BluePick[];
  summary: string | null;
  checked: number;
  csfloatPausedUntil: string | null;
}

export interface FloatPick {
  market: string;
  price: number;
  float: number;
  paintSeed: number | null;
  url: string;
  worseCheapest: number | null;
  saving: number;
  orderPrice: number | null;
  orderProfit: number | null;
  reason: string;
}

export interface FloatPicks {
  picks: FloatPick[];
  summary: string | null;
  checked: number;
  csfloatPausedUntil: string | null;
}

export interface FavoriteSet {
  id: string;
  name: string;
  items: string[];
  updatedAt: string;
}

export interface InspectGen {
  name: string;
  float: number;
  seed: number;
  console: string;
  link: string;
  server: string;
  gen: string;
  genExact: boolean;
  missingStickers: string[];
}
