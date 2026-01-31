import { Router } from 'express';
import pool from '../db/pool';
import { loadItems } from '../utils/item-loader';

const router = Router();

// New route for market order arbitrage opportunities
router.get('/market-orders', async (req, res) => {
  try {
    const client = await pool.connect();

    // Get all market orders grouped by item, location, quality, and type
    const query = `
      SELECT
        item_type_id,
        location_id,
        quality_level,
        auction_type,
        ARRAY_AGG(unit_price_silver ORDER BY unit_price_silver) as prices,
        ARRAY_AGG(amount ORDER BY unit_price_silver) as amounts,
        ARRAY_AGG(id ORDER BY unit_price_silver) as order_ids,
        MIN(expires) as earliest_expiry
      FROM market_orders
      WHERE expires > NOW()
      GROUP BY item_type_id, location_id, quality_level, auction_type
    `;

    const result = await client.query(query);
    const marketData = result.rows;

    client.release();

    // Group by item, then by location
    const itemsByType = new Map();

    for (const row of marketData) {
      if (!itemsByType.has(row.item_type_id)) {
        itemsByType.set(row.item_type_id, new Map());
      }

      const locations = itemsByType.get(row.item_type_id);

      if (!locations.has(row.location_id)) {
        locations.set(row.location_id, {
          buy_orders: [],
          sell_orders: []
        });
      }

      const location = locations.get(row.location_id);

      if (row.auction_type === 'request') {
        // Buy orders (requests)
        location.buy_orders.push({
          quality: row.quality_level,
          prices: row.prices,
          amounts: row.amounts,
          order_ids: row.order_ids,
          expiry: row.earliest_expiry
        });
      } else if (row.auction_type === 'offer') {
        // Sell orders (offers)
        location.sell_orders.push({
          quality: row.quality_level,
          prices: row.prices,
          amounts: row.amounts,
          order_ids: row.order_ids,
          expiry: row.earliest_expiry
        });
      }
    }

    // Calculate arbitrage opportunities between ALL location combinations
    const opportunities = [];

    for (const [itemTypeId, locations] of itemsByType.entries()) {
      const locationArray = Array.from(locations.entries());

      // Compare every buy location with every sell location
      for (let i = 0; i < locationArray.length; i++) {
        const [buyLocationId, buyLocation] = locationArray[i];

        for (let j = 0; j < locationArray.length; j++) {
          const [sellLocationId, sellLocation] = locationArray[j];

          // For each buy order quality in buy location, find sell orders in sell location
          for (const buyOrder of buyLocation.buy_orders) {
            const buyQuality = buyOrder.quality;
            const maxBuyPrice = Math.max(...buyOrder.prices); // Highest price buyer is willing to pay

            // Find all sell orders with quality >= buyQuality in the sell location
            const eligibleSellOrders = sellLocation.sell_orders.filter(sell => sell.quality >= buyQuality);

            for (const sellOrder of eligibleSellOrders) {
              const minSellPrice = Math.min(...sellOrder.prices); // Lowest price seller is asking

              if (minSellPrice >= maxBuyPrice) continue; // No profit possible

              // Calculate potential profit
              const profit = maxBuyPrice - minSellPrice;
              const roi = (profit / minSellPrice) * 100;

              opportunities.push({
                item_type_id: itemTypeId,
                buy_location: buyLocationId,
                sell_location: sellLocationId,
                buy_quality: buyQuality,
                sell_quality: sellOrder.quality,
                buy_price: maxBuyPrice,
                sell_price: minSellPrice,
                profit: profit,
                roi: Math.round(roi * 100) / 100, // Round to 2 decimal places
                buy_order_ids: buyOrder.order_ids,
                sell_order_ids: sellOrder.order_ids,
                expires: Math.min(new Date(buyOrder.expiry), new Date(sellOrder.expiry))
              });
            }
          }
        }
      }
    }

    // Sort by profit descending
    opportunities.sort((a, b) => b.profit - a.profit);

    console.log(`📊 Found ${opportunities.length} arbitrage opportunities`);

    // Load item names in PT-BR
    const itemNames = loadItems();

    // Add item names to opportunities
    const opportunitiesWithNames = opportunities.map(opp => ({
      ...opp,
      item_name: itemNames[opp.item_type_id] || opp.item_type_id
    }));

    res.json({
      opportunities: opportunitiesWithNames.slice(0, 100), // Top 100 opportunities
      total: opportunities.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error calculating market opportunities:', error);
    res.status(500).json({
      error: 'Failed to calculate opportunities',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
