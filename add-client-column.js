// Add clientId column to material_pieces table
const modelsModule = require('./models')

async function main() {
  console.log('Adding clientId column to material_pieces...')
  const db = await modelsModule.getDb()
  
  try {
    await db.sequelize.query('ALTER TABLE material_pieces ADD COLUMN clientId INT NULL')
    console.log('Added clientId column')
  } catch (e) {
    if (e.message.includes('Duplicate column')) {
      console.log('clientId column already exists')
    } else {
      console.log('Note:', e.message)
    }
  }
  
  console.log('✅ Done!')
  process.exit(0)
}

main().catch(e => {
  console.error('Failed:', e)
  process.exit(1)
})
