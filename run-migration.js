const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function migrate() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not found in .env.local');
    process.exit(1);
  }

  console.log('Connecting to database...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected successfully.');

    const tables = [
      'invoices',
      'project_activities',
      'project_materials',
      'project_phases',
      'project_payments',
      'project_manufacturing'
    ];

    for (const table of tables) {
      console.log(`Checking table: ${table}...`);
      try {
        await client.query(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "projectId" INTEGER`);
        console.log(`Success: Added projectId to ${table} (if it was missing)`);
      } catch (err) {
        console.warn(`Warning: Could not add column to ${table}: ${err.message}`);
      }
    }

    console.log('Ensuring purchase_orders table exists...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "purchase_orders" (
        "id" SERIAL PRIMARY KEY,
        "supplierId" INTEGER DEFAULT NULL,
        "projectId" INTEGER DEFAULT NULL,
        "total" DECIMAL(10,2) DEFAULT 0,
        "status" VARCHAR(50) DEFAULT 'pending',
        "date" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Migration complete ✅');

  } catch (err) {
    console.error('Migration failed ❌', err);
  } finally {
    await client.end();
  }
}

migrate();
