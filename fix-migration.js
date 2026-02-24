const { Sequelize } = require('sequelize')
require('dotenv').config()

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'postgres',
  logging: false
})

async function fixMigration() {
  try {
    await sequelize.query(
      `INSERT INTO "SequelizeMeta" (name) VALUES ('20251228121000-add-unique-sku-to-materials.js') ON CONFLICT DO NOTHING`
    )
    console.log('✅ Migration marked as completed')
    await sequelize.close()
  } catch (error) {
    console.error('❌ Error:', error)
    await sequelize.close()
    process.exit(1)
  }
}

fixMigration()
