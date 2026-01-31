import pool from '../db/pool';
import { TAX_RATES } from '../types';
import type { FlipOpportunity } from '../types';

const LOCAL_DATA_EXPIRY = parseInt(process.env.LOCAL_DATA_EXPIRY || '10', 10); // minutes
const STALE_YELLOW = parseInt(process.env.STALE_YELLOW_THRESHOLD || '15', 10);
const STALE_RED = parseInt(process.env.STALE_RED_THRESHOLD || '60', 10);

interface FilterOptions {
  minTier?: number;
  maxTier?: number;
  cities?: string[];
  minROI?: number;
}

function calculateStaleness(timestamp: Date): 'green' | 'yellow' | 'red' {
  const ageMinutes = (Date.now() - timestamp.getTime()) / (1000 * 60);
  
  if (ageMinutes < STALE_YELLOW) return 'green';
  if (ageMinutes < STALE_RED) return 'yellow';
  return 'red';
}

function calculateProfit(buyPrice: number, sellPrice: number, isPremium: boolean): number {
  const taxRate = isPremium ? TAX_RATES.premium : TAX_RATES.common;
  return (sellPrice * (1 - taxRate)) - buyPrice;
}

function calculateROI(profit: number, buyPrice: number): number {
  if (buyPrice === 0) return 0;
  return (profit / buyPrice) * 100;
}

function extractTier(itemId: string): string {
  const match = itemId.match(/^T(\d)/);
  return match ? `T${match[1]}` : 'T0';
}

export async function findFlipOpportunities(filters: FilterOptions = {}): Promise<FlipOpportunity[]> {
  const client = await pool.connect();
  
  try {
    // Get all recent prices, prioritizing local data
    const query = `
      WITH ranked_prices AS (
        SELECT DISTINCT ON (item_id, city, quality)
          item_id, city, quality,
          sell_price_min, buy_price_max,
          timestamp, source,
          CASE 
            WHEN source = 'local' AND timestamp > NOW() - INTERVAL '${LOCAL_DATA_EXPIRY} minutes' THEN 1
            ELSE 2
          END as priority
        FROM prices
        WHERE timestamp > NOW() - INTERVAL '2 hours'
        ORDER BY item_id, city, quality, priority, timestamp DESC
      )
      SELECT * FROM ranked_prices
      WHERE sell_price_min > 0 AND buy_price_max > 0
    `;
    
    const result = await client.query(query);
    const prices = result.rows;
    
    // Group prices by item
    const pricesByItem = new Map<string, typeof prices>();
    for (const price of prices) {
      if (!pricesByItem.has(price.item_id)) {
        pricesByItem.set(price.item_id, []);
      }
      pricesByItem.get(price.item_id)!.push(price);
    }
    
    const opportunities: FlipOpportunity[] = [];
    
    // Find arbitrage opportunities
    for (const [itemId, itemPrices] of pricesByItem.entries()) {
      const tier = extractTier(itemId);
      const tierNum = parseInt(tier.substring(1));
      
      // Apply tier filter
      if (filters.minTier && tierNum < filters.minTier) continue;
      if (filters.maxTier && tierNum > filters.maxTier) continue;
      
      // Compare all city pairs
      for (let i = 0; i < itemPrices.length; i++) {
        for (let j = 0; j < itemPrices.length; j++) {
          if (i === j) continue;
          
          const buyCity = itemPrices[i];
          const sellCity = itemPrices[j];
          
          // Apply city filter
          if (filters.cities && filters.cities.length > 0) {
            if (!filters.cities.includes(buyCity.city) && !filters.cities.includes(sellCity.city)) {
              continue;
            }
          }
          
          const buyPrice = buyCity.sell_price_min; // Buy from sell orders
          const sellPrice = sellCity.buy_price_max; // Sell to buy orders
          
          const profitPremium = calculateProfit(buyPrice, sellPrice, true);
          const profitCommon = calculateProfit(buyPrice, sellPrice, false);
          const roiPremium = calculateROI(profitPremium, buyPrice);
          const roiCommon = calculateROI(profitCommon, buyPrice);
          
          // Apply ROI filter (using common as baseline)
          if (filters.minROI && roiCommon < filters.minROI) continue;
          
          // Only include profitable opportunities
          if (profitCommon > 0) {
            const oldestTimestamp = buyCity.timestamp < sellCity.timestamp ? 
              buyCity.timestamp : sellCity.timestamp;
            
            opportunities.push({
              item_id: itemId,
              item_name: itemId, // Will be replaced by item mapping
              tier,
              buy_city: buyCity.city,
              sell_city: sellCity.city,
              buy_price: buyPrice,
              sell_price: sellPrice,
              profit_common: Math.round(profitCommon),
              profit_premium: Math.round(profitPremium),
              roi_common: Math.round(roiCommon * 100) / 100,
              roi_premium: Math.round(roiPremium * 100) / 100,
              buy_timestamp: buyCity.timestamp,
              sell_timestamp: sellCity.timestamp,
              staleness: calculateStaleness(new Date(oldestTimestamp))
            });
          }
        }
      }
    }
    
    // Sort by ROI (premium) descending
    opportunities.sort((a, b) => b.roi_premium - a.roi_premium);
    
    return opportunities;
    
  } finally {
    client.release();
  }
}
