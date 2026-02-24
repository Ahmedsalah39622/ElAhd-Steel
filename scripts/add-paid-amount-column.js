const { Sequelize } = require('sequelize')

require('dotenv').config()

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'mysql',
  logging: console.log
})

async function addPaidAmountColumn() {
  try {
    console.log('Connecting to database...')
    await sequelize.authenticate()
    console.log('Connected successfully.')

    // Check if column exists
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'invoices'
      AND COLUMN_NAME = 'paidAmount'
    `)

    if (results.length > 0) {
      console.log('Column paidAmount already exists in invoices table.')
    } else {
      console.log('Adding paidAmount column to invoices table...')
      await sequelize.query(`
        ALTER TABLE invoices
        ADD COLUMN paidAmount DECIMAL(18, 2) DEFAULT 0
      `)
      console.log('Column paidAmount added successfully!')
    }

    await sequelize.close()
    console.log('Done!')
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

addPaidAmountColumn()
