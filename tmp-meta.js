const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');
lines.forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    process.env[key] = value;
  }
});

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkMeta() {
  try {
    await client.connect();
    const res = await client.query('SELECT name FROM "SequelizeMeta" ORDER BY name DESC LIMIT 20;');
    console.log('Last 20 Migrations in SequelizeMeta:');
    res.rows.forEach(r => console.log(r.name));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await client.end();
  }
}

checkMeta();
