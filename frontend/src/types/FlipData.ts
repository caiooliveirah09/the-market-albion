export interface FlipData {
  item_id: string;
  item_name: string;
  buy_quality: number;
  sell_quality: number;
  buy_price: number;
  sell_price: number;
  buy_date: string;
  sell_date: string;
  profit: number;
  city_buy: string;
  city_sell: string;
}

export enum Quality {
  Normal = 1,
  Good = 2,
  Outstanding = 3,
  Excellent = 4,
  Masterpiece = 5
}

export const QualityLabels: Record<Quality, string> = {
  [Quality.Normal]: 'Normal',
  [Quality.Good]: 'Bom',
  [Quality.Outstanding]: 'Excepcional',
  [Quality.Excellent]: 'Excelente',
  [Quality.Masterpiece]: 'Obra-prima'
};

export const QualityColors: Record<Quality, string> = {
  [Quality.Normal]: 'text-quality-1',
  [Quality.Good]: 'text-quality-2',
  [Quality.Outstanding]: 'text-quality-3',
  [Quality.Excellent]: 'text-quality-4',
  [Quality.Masterpiece]: 'text-quality-5'
};

export interface Filters {
  minProfit: number;
  maxProfit: number;
  quality: number[];
  tier: string[];
  enchantment: string[];
  searchName: string;
  minPrice: number;
  maxPrice: number;
}
