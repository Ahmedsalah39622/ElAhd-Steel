const modelsModule = require('./models')
async function run() {
  try {
    const db = await modelsModule.getDb()
    const queryInterface = db.sequelize.getQueryInterface()
    
    // Check again to be safe
    const tableInfo = await queryInterface.describeTable('users')
    if (!tableInfo.allowedDashboardCards) {
      console.log('Adding column allowedDashboardCards...')
      await queryInterface.addColumn('users', 'allowedDashboardCards', {
        type: db.Sequelize.JSON,
        allowNull: true,
        defaultValue: null
      })
      console.log('Column added successfully.')
    } else {
      console.log('Column already exists.')
    }
  } catch (e) {
    console.error('Error adding column:', e)
  }
  process.exit(0)
}
run()
