import pool from './pool';

export async function initDatabase() {
  const client = await pool.connect();

  try {
    // Create market_orders table for individual orders
    await client.query(`
      CREATE TABLE IF NOT EXISTS market_orders (
        id BIGINT PRIMARY KEY,
        item_type_id VARCHAR(100) NOT NULL,
        item_group_type_id VARCHAR(100) NOT NULL,
        location_id VARCHAR(10) NOT NULL,
        quality_level INTEGER NOT NULL,
        enchantment_level INTEGER NOT NULL,
        unit_price_silver INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        auction_type VARCHAR(20) NOT NULL,
        expires TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create indexes for market_orders
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_market_orders_item_type
      ON market_orders(item_type_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_market_orders_location
      ON market_orders(location_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_market_orders_expires
      ON market_orders(expires);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_market_orders_created_at
      ON market_orders(created_at DESC);
    `);

    // Keep the old prices table for compatibility (can be removed later)
    /* Lines 47-80 omitted */

    console.log('Database tables created successfully');
  } finally {
    client.release();
  }
}
