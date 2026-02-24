const modelsModule = require('./models')
async function check() {
  try {
    const db = await modelsModule.getDb()
    const tableInfo = await db.sequelize.getQueryInterface().describeTable('users')
    if (tableInfo.allowedDashboardCards) {
      console.log('Column allowedDashboardCards EXISTS')
    } else {
      console.log('Column allowedDashboardCards MISSING')
    }
  } catch (e) {
    console.error('Error:', e)
  }
  process.exit(0)
}
check()
