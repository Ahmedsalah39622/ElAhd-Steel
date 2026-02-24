const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkTables() {
  try {
    await client.connect();
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('Tables in Database:');
    res.rows.forEach(r => console.log(r.table_name));
    console.log(`Total: ${res.rows.length}`);
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

checkTables();
