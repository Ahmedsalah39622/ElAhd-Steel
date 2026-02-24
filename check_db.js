
const { initializeDatabase } = require('./src/utils/db');

async function checkData() {
  try {
    const { InventoryTransaction } = await initializeDatabase();
    
    console.log('Checking InventoryTransactions...');
    const txs = await InventoryTransaction.findAll({
        where: { action: 'issue_order' },
        limit: 10,
        order: [['createdAt', 'DESC']]
    });
    
    console.log(`Found ${txs.length} issue_order transactions.`);
    txs.forEach(t => console.log(`- ID: ${t.id}, Material: ${t.materialId}, Created: ${t.createdAt}`));

  } catch (err) {
    console.error('Error checking DB:', err);
  }
}

checkData();
