const Sequelize = require('sequelize')

async function setupInMemoryDb(modelsToInit = []) {
  const sequelize = new Sequelize('sqlite::memory:', { logging: false })
  const models = {}

  // Load model definer functions dynamically
  for (const def of modelsToInit) {
    // def is module path relative to project root
    const definer = require(def)
    const model = definer(sequelize, Sequelize.DataTypes)
    models[model.name] = model
  }

  // Set up associations if any
  Object.values(models).forEach(m => {
    if (typeof m.associate === 'function') m.associate(models)
  })

  await sequelize.sync({ force: true })

  return { sequelize, models }
}

module.exports = { setupInMemoryDb }
