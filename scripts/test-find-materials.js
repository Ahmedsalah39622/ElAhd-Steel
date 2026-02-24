const modelsModule = require('../models')

async function run() {
  try {
    const db = await modelsModule.getDb()
    console.log(
      'db initialized, models:',
      Object.keys(db).filter(k => k !== 'sequelize' && k !== 'Sequelize')
    )
    const materials = await db.Material.findAll({ limit: 5 })
    console.log('fetched count', materials.length)
    console.log('first:', materials[0] && materials[0].toJSON())
    process.exit(0)
  } catch (err) {
    console.error('test-find-materials error:', err)
    if (err && err.parent) console.error('parent:', err.parent)
    process.exit(1)
  }
}

run()
