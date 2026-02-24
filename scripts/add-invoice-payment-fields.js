const mysql = require('mysql2/promise')

async function run() {
  const conn = await mysql.createConnection({
    host: '192.185.166.159',
    port: 3306,
    user: 'orcastee_orcasteel',
    password: 'm;#ye,7]7&$D',
    database: 'orcastee_app-orca'
  })

  try {
    await conn.execute('ALTER TABLE invoices ADD COLUMN paymentMethod VARCHAR(255) NULL')
    console.log('Added paymentMethod')
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') console.log('paymentMethod already exists')
    else throw e
  }

  try {
    await conn.execute('ALTER TABLE invoices ADD COLUMN bankName VARCHAR(255) NULL')
    console.log('Added bankName')
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') console.log('bankName already exists')
    else throw e
  }

  try {
    await conn.execute('ALTER TABLE invoices ADD COLUMN transactionNumber VARCHAR(255) NULL')
    console.log('Added transactionNumber')
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') console.log('transactionNumber already exists')
    else throw e
  }

  await conn.end()
  console.log('Done!')
}

run().catch(console.error)
