import { Router } from 'express';
import pool from '../db/pool';
import { loadItems, loadLocations } from '../utils/item-loader';

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
                expires: new Date(Math.min(new Date(buyOrder.expiry).getTime(), new Date(sellOrder.expiry).getTime()))
              });
            }
          }
        }
      }
    }

    // Sort by profit descending
    opportunities.sort((a, b) => b.profit - a.profit);

    console.log(`📊 Found ${opportunities.length} arbitrage opportunities`);

    // Load item names in PT-BR and locations
    const itemNames = loadItems();
    const locations = loadLocations();

    // Add item names and location names to opportunities
    const opportunitiesWithNames = opportunities.map(opp => ({
      ...opp,
      item_name: itemNames[opp.item_type_id] || opp.item_type_id,
      buy_location_name: locations[opp.buy_location] || opp.buy_location,
      sell_location_name: locations[opp.sell_location] || opp.sell_location
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

// Helper function to parse item type and tier from UniqueName
function parseItemInfo(uniqueName: string) {
  const parts = uniqueName.split('_');
  const tier = parseInt(parts[0].substring(1)); // T4 -> 4

  let itemType = 'unknown';
  let materialQuantity = 0;

  if (uniqueName.includes('MAIN') || uniqueName.includes('2H')) {
    itemType = '2h_weapon';
    materialQuantity = 384;
  } else if (uniqueName.includes('1H')) {
    itemType = '1h_weapon';
    materialQuantity = 288;
  } else if (uniqueName.includes('OFF')) {
    itemType = 'off_hand';
    materialQuantity = 96;
  } else if (uniqueName.includes('HEAD')) {
    itemType = 'head';
    materialQuantity = 96;
  } else if (uniqueName.includes('ARMOR')) {
    itemType = 'armor';
    materialQuantity = 192;
  } else if (uniqueName.includes('SHOES')) {
    itemType = 'shoes';
    materialQuantity = 96;
  } else if (uniqueName.includes('CAPE')) {
    itemType = 'cape';
    materialQuantity = 92;
  } else if (uniqueName.includes('BAG')) {
    itemType = 'bag';
    materialQuantity = 192;
  } else {
    itemType = 'bag';
    materialQuantity = 1;
  }

  return { tier, itemType, materialQuantity };
}

// New route for enchantment arbitrage opportunities
router.get('/enchantment-opportunities', async (req, res) => {
  try {
    const client = await pool.connect();

    // Get all market orders for items and materials
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
    const materialsByType = new Map(); // For RUNE, SOUL, RELIC

    for (const row of marketData) {
      if (row.item_type_id.includes('_RUNE') || row.item_type_id.includes('_SOUL') || row.item_type_id.includes('_RELIC')) {
        // Materials
        if (!materialsByType.has(row.item_type_id)) {
          materialsByType.set(row.item_type_id, new Map());
        }
        const locations = materialsByType.get(row.item_type_id);
        if (!locations.has(row.location_id)) {
          locations.set(row.location_id, { sell_orders: [], buy_orders: [] });
        }
        const location = locations.get(row.location_id);
        if (row.auction_type === 'offer') {
          location.sell_orders.push({
            prices: row.prices,
            amounts: row.amounts,
            order_ids: row.order_ids,
            expiry: row.earliest_expiry
          });
        } else if (row.auction_type === 'request') {
          location.buy_orders.push({
            prices: row.prices,
            amounts: row.amounts,
            order_ids: row.order_ids,
            expiry: row.earliest_expiry
          });
        }
      } else {
        // Regular items
        if (!itemsByType.has(row.item_type_id)) {
          itemsByType.set(row.item_type_id, new Map());
        }
        const locations = itemsByType.get(row.item_type_id);
        if (!locations.has(row.location_id)) {
          locations.set(row.location_id, { buy_orders: [], sell_orders: [] });
        }
        const location = locations.get(row.location_id);
        if (row.auction_type === 'request') {
          location.buy_orders.push({
            quality: row.quality_level,
            prices: row.prices,
            amounts: row.amounts,
            order_ids: row.order_ids,
            expiry: row.earliest_expiry
          });
        } else if (row.auction_type === 'offer') {
          location.sell_orders.push({
            quality: row.quality_level,
            prices: row.prices,
            amounts: row.amounts,
            order_ids: row.order_ids,
            expiry: row.earliest_expiry
          });
        }
      }
    }

    // Calculate enchantment opportunities
    const opportunities = [];
    const debugItems = [];

    for (const [itemTypeId, locations] of itemsByType.entries()) {
      // Only consider base items (no @ in name)
      if (itemTypeId.includes('@')) continue;

      const { tier, itemType, materialQuantity } = parseItemInfo(itemTypeId);
      if (itemType === 'unknown' || materialQuantity === 0) continue;

      // Materials needed
      const runeId = `T${tier}_RUNE`;
      const soulId = `T${tier}_SOUL`;
      const relicId = `T${tier}_RELIC`;

      // Check for each enchantment level
      for (let level = 1; level <= 3; level++) {
        const enchantedItemId = `${itemTypeId}@${level}`;

        // Check if enchanted item exists in data
        if (!itemsByType.has(enchantedItemId)) continue;

        const enchantedLocations = itemsByType.get(enchantedItemId);

        // For each location with sell orders of base item
        for (const [sellLocationId, sellLocation] of locations.entries()) {
          const baseSellOrders = sellLocation.sell_orders.filter(order => order.quality === 1);
          if (baseSellOrders.length === 0) continue;

          const minBasePrice = Math.min(...baseSellOrders[0].prices);

          // For each location with buy orders of enchanted item
          for (const [buyLocationId, buyLocation] of enchantedLocations.entries()) {
            const enchantedBuyOrders = buyLocation.buy_orders.filter(order => order.quality === 1);
            if (enchantedBuyOrders.length === 0) continue;

            const maxEnchantedPrice = Math.max(...enchantedBuyOrders[0].prices);

            // Get material prices - find minimum price across all locations
            let unitPriceRune = 0;
            let unitPriceSoul = 0;
            let unitPriceRelic = 0;
            let materialCost = 0;
            let hasAllMaterials = true;

            // Always need rune for any level
            const runeLocations = materialsByType.get(runeId);
            if (runeLocations) {
              for (const loc of runeLocations.values()) {
                if (loc.sell_orders.length > 0) {
                  const price = Math.min(...loc.sell_orders[0].prices);
                  if (unitPriceRune === 0 || price < unitPriceRune) {
                    unitPriceRune = price;
                  }
                }
              }
            }
            if (unitPriceRune > 0) {
              materialCost += unitPriceRune * materialQuantity;
            } else {
              hasAllMaterials = false;
            }

            // For level 2 and 3, need soul
            if (level >= 2) {
              const soulLocations = materialsByType.get(soulId);
              if (soulLocations) {
                for (const loc of soulLocations.values()) {
                  if (loc.sell_orders.length > 0) {
                    const price = Math.min(...loc.sell_orders[0].prices);
                    if (unitPriceSoul === 0 || price < unitPriceSoul) {
                      unitPriceSoul = price;
                    }
                  }
                }
              }
              if (unitPriceSoul > 0) {
                materialCost += unitPriceSoul * materialQuantity;
              } else {
                hasAllMaterials = false;
              }
            }

            // For level 3, need relic
            if (level >= 3) {
              const relicLocations = materialsByType.get(relicId);
              if (relicLocations) {
                for (const loc of relicLocations.values()) {
                  if (loc.sell_orders.length > 0) {
                    const price = Math.min(...loc.sell_orders[0].prices);
                    if (unitPriceRelic === 0 || price < unitPriceRelic) {
                      unitPriceRelic = price;
                    }
                  }
                }
              }
              if (unitPriceRelic > 0) {
                materialCost += unitPriceRelic * materialQuantity;
              } else {
                hasAllMaterials = false;
              }
            }

            let reason = 'OK';
            if (!hasAllMaterials) {
              const missing = [];
              if (unitPriceRune === 0) missing.push('rune');
              if (level >= 2 && unitPriceSoul === 0) missing.push('soul');
              if (level >= 3 && unitPriceRelic === 0) missing.push('relic');
              reason = `Missing materials: ${missing.join(', ')}`;
            }

            if (!hasAllMaterials) {
              debugItems.push({
                item_type_id: itemTypeId,
                enchanted_item_id: enchantedItemId,
                enchantment_level: level,
                buy_location: buyLocationId,
                sell_location: sellLocationId,
                unit_price_base: minBasePrice,
                unit_price_rune: unitPriceRune,
                unit_price_soul: unitPriceSoul,
                unit_price_relic: unitPriceRelic,
                enchanted_price: maxEnchantedPrice,
                material_cost: materialCost,
                total_cost: minBasePrice + materialCost,
                profit: maxEnchantedPrice - (minBasePrice + materialCost),
                roi: 0,
                material_quantity: materialQuantity,
                tier: tier,
                item_type: itemType,
                reason: reason
              });
              continue;
            }

            const totalCost = minBasePrice + materialCost;
            const profit = maxEnchantedPrice - totalCost;
            const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;

            debugItems.push({
              item_type_id: itemTypeId,
              enchanted_item_id: enchantedItemId,
              enchantment_level: level,
              buy_location: buyLocationId,
              sell_location: sellLocationId,
              unit_price_base: minBasePrice,
              unit_price_rune: unitPriceRune,
              unit_price_soul: unitPriceSoul,
              unit_price_relic: unitPriceRelic,
              enchanted_price: maxEnchantedPrice,
              material_cost: materialCost,
              total_cost: totalCost,
              profit: profit,
              roi: Math.round(roi * 100) / 100,
              material_quantity: materialQuantity,
              tier: tier,
              item_type: itemType,
              reason: profit > 0 ? 'Profitable' : 'Not profitable'
            });

            if (profit > 0) {
              opportunities.push({
                item_type_id: itemTypeId,
                enchanted_item_id: enchantedItemId,
                enchantment_level: level,
                buy_location: buyLocationId,
                sell_location: sellLocationId,
                unit_price_base: minBasePrice,
                unit_price_rune: unitPriceRune,
                unit_price_soul: unitPriceSoul,
                unit_price_relic: unitPriceRelic,
                enchanted_price: maxEnchantedPrice,
                material_cost: materialCost,
                total_cost: totalCost,
                profit: profit,
                roi: Math.round(roi * 100) / 100,
                material_quantity: materialQuantity,
                tier: tier,
                item_type: itemType,
                expires: new Date(Math.min(
                  new Date(baseSellOrders[0].expiry).getTime(),
                  new Date(enchantedBuyOrders[0].expiry).getTime()
                ))
              });
            }
          }
        }
      }
    }

    // Sort by profit descending
    opportunities.sort((a, b) => b.profit - a.profit);

    console.log(`🔮 Found ${opportunities.length} enchantment opportunities`);

    // Load item names and locations
    const itemNames = loadItems();
    const locationNames = loadLocations();

    // Add names to opportunities
    const opportunitiesWithNames = opportunities.map(opp => ({
      ...opp,
      item_name: itemNames[opp.item_type_id] || opp.item_type_id,
      enchanted_item_name: itemNames[opp.enchanted_item_id] || opp.enchanted_item_id,
      buy_location_name: locationNames[opp.buy_location] || opp.buy_location,
      sell_location_name: locationNames[opp.sell_location] || opp.sell_location
    }));

    // Add names to debug items
    const debugItemsWithNames = debugItems.map(item => ({
      ...item,
      item_name: itemNames[item.item_type_id] || item.item_type_id,
      enchanted_item_name: itemNames[item.enchanted_item_id] || item.enchanted_item_id,
      buy_location_name: locationNames[item.buy_location] || item.buy_location,
      sell_location_name: locationNames[item.sell_location] || item.sell_location
    }));

    // List of materials found
    const materialsFound = Array.from(materialsByType.keys());

    res.json({
      opportunities: opportunitiesWithNames.slice(0, 100),
      total: opportunities.length,
      debug_items: debugItemsWithNames.slice(0, 500), // First 500 debug items
      debug_total: debugItems.length,
      materials_found: materialsFound,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error calculating enchantment opportunities:', error);
    res.status(500).json({
      error: 'Failed to calculate enchantment opportunities',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
