// Script to add count and weight columns to materials table
const { Sequelize } = require('sequelize')

const config = require('./config/config.js')

const env = process.env.NODE_ENV || 'development'
const dbConfig = config[env]
const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, dbConfig)

async function addColumns() {
  try {
    console.log('Checking materials table structure...')

    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'materials'
    `)

    const columns = results.map(r => r.column_name)

    console.log('Existing columns:', columns)

    // Add count column if missing
    if (!columns.includes('count')) {
      console.log('Adding count column...')
      await sequelize.query(`
        ALTER TABLE materials 
        ADD COLUMN count INTEGER DEFAULT 0
      `)
      console.log('✅ Added count column')
    } else {
      console.log('⚠️  count column already exists')
    }

    // Add weight column if missing
    if (!columns.includes('weight')) {
      console.log('Adding weight column...')
      await sequelize.query(`
        ALTER TABLE materials 
        ADD COLUMN weight DECIMAL(18, 4) DEFAULT 0
      `)
      console.log('✅ Added weight column')
    } else {
      console.log('⚠️  weight column already exists')
    }

    console.log('✅ Migration completed successfully')
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

addColumns()
