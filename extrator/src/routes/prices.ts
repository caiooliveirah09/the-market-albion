import { Router } from 'express';
import { z } from 'zod';
import pool from '../db/pool';
import { wss } from '../index';
import type { AlbionDataClientPayload } from '../types';

const router = Router();

// Validation schema for Albion Data Client payload
const priceUpdateSchema = z.object({
  Orders: z.array(z.object({
    Id: z.number(),
    ItemTypeId: z.string(),
    ItemGroupTypeId: z.string(),
    LocationId: z.string(),
    QualityLevel: z.number().int().min(1).max(5),
    EnchantmentLevel: z.number().int().min(0).max(4),
    UnitPriceSilver: z.number().int().nonnegative(),
    Amount: z.number().int().positive(),
    AuctionType: z.string(),
    Expires: z.string()
  }))
});

// POST endpoint to receive data from Albion Data Client
router.post('/update-prices/marketorders.ingest', async (req, res) => {
  try {
    console.log("📥 Recebi requisição marketorders.ingest")
    console.log("req.body", req.body)
    
    const payload = priceUpdateSchema.parse(req.body);
    console.log(`📦 Recebidos ${payload.Orders.length} orders`)
    
    const client = await pool.connect();
    let insertedCount = 0;
    let updatedCount = 0;
    
    try {
      await client.query('BEGIN');
      
      for (const order of payload.Orders) {
        // Convert copper to silver (divide by 10000)
        const priceInSilver = Math.floor(order.UnitPriceSilver / 10000);
        console.log(`💰 Order ${order.Id}: ${order.UnitPriceSilver} copper → ${priceInSilver} silver`);
        
        // Insert or update each order
        const result = await client.query(`
          INSERT INTO market_orders (
            id, item_type_id, item_group_type_id, location_id,
            quality_level, enchantment_level, unit_price_silver,
            amount, auction_type, expires, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
          ON CONFLICT (id) 
          DO UPDATE SET
            unit_price_silver = EXCLUDED.unit_price_silver,
            amount = EXCLUDED.amount,
            expires = EXCLUDED.expires,
            updated_at = NOW()
          WHERE market_orders.unit_price_silver != EXCLUDED.unit_price_silver 
             OR market_orders.amount != EXCLUDED.amount 
             OR market_orders.expires != EXCLUDED.expires
        `, [
          order.Id,
          order.ItemTypeId,
          order.ItemGroupTypeId,
          order.LocationId,
          order.QualityLevel,
          order.EnchantmentLevel,
          Math.floor(order.UnitPriceSilver / 10000), // Convert copper to silver
          order.Amount,
          order.AuctionType,
          new Date(order.Expires)
        ]);
        
        // Check if it was an insert or update
        if (result.rowCount && result.rowCount > 0) {
          // For PostgreSQL, we can check if the command affected rows
          // Since we're using ON CONFLICT DO UPDATE, we need to check if values actually changed
          insertedCount++; // For now, count all processed orders
        }
      }
      
      await client.query('COMMIT');
      
      // Broadcast update to connected WebSocket clients
      wss.clients.forEach((client) => {
        if (client.readyState === 1) { // OPEN
          client.send(JSON.stringify({
            type: 'market_orders_update',
            processed: insertedCount,
            timestamp: new Date().toISOString()
          }));
        }
      });
      
      console.log(`✅ Processed ${insertedCount} market orders`);
      
      res.json({
        success: true,
        processed: insertedCount,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Error updating market orders:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Invalid payload'
    });
  }
});

export default router;
