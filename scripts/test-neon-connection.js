// Test Neon PostgreSQL connection with Sequelize
require('dotenv').config()
const { Sequelize } = require('sequelize')

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: console.log
})

async function testConnection() {
  try {
    await sequelize.authenticate()
    console.log('✅ Sequelize connection to Neon PostgreSQL established successfully!')

    // List all tables
    const [results] = await sequelize.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        `)

    console.log('\n📋 Available tables:')
    results.forEach(row => {
      console.log('  - ' + row.table_name)
    })
  } catch (error) {
    console.error('❌ Unable to connect:', error.message)
  } finally {
    await sequelize.close()
  }
}

testConnection()
