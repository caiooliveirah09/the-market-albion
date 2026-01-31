export interface PriceData {
  item_id: string;
  city: string;
  quality: number;
  sell_price_min: number | null;
  sell_price_max: number | null;
  buy_price_min: number | null;
  buy_price_max: number | null;
  timestamp: Date;
  source: 'local' | 'aodp';
}

export interface FlipOpportunity {
  item_id: string;
  item_name: string;
  tier: string;
  buy_city: string;
  sell_city: string;
  buy_price: number;
  sell_price: number;
  profit_common: number;
  profit_premium: number;
  roi_common: number;
  roi_premium: number;
  buy_timestamp: Date;
  sell_timestamp: Date;
  staleness: 'green' | 'yellow' | 'red';
}

export interface AlbionDataClientPayload {
  itemId: string;
  city: string;
  quality: number;
  sellPriceMin: number;
  sellPriceMax: number;
  buyPriceMin: number;
  buyPriceMax: number;
  timestamp: string;
}

export const CITIES = [
  'Caerleon',
  'Bridgewatch',
  'Lymhurst',
  'Fort Sterling',
  'Thetford',
  'Martlock',
  'Black Market'
] as const;

export type City = typeof CITIES[number];

export const TAX_RATES = {
  premium: 0.065, // 2.5% setup + 4% sales
  common: 0.105   // 2.5% setup + 8% sales
} as const;
