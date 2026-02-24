const pg = require('pg');
console.log('PG Module Type:', typeof pg);
console.log('PG Keys:', Object.keys(pg));
console.log('Has Client:', !!pg.Client);

try {
  const client = new pg.Client();
  console.log('Client instantiated successfully');
} catch (e) {
  console.error('Client instantiation failed:', e);
}
