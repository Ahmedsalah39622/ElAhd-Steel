const modelsModule = require('./models')

async function checkData() {
  try {
    // استخدام getDb لتهيئة الـ models
    const models = await modelsModule.getDb()

    console.log(
      'Models loaded:',
      Object.keys(models).filter(k => k !== 'sequelize' && k !== 'Sequelize')
    )

    const { User, Role, UserRole } = models

    const users = await User.findAll()
    console.log(`✅ Users count: ${users.length}`)

    const roles = await Role.findAll()
    console.log(`✅ Roles count: ${roles.length}`)

    const userRoles = await UserRole.findAll()
    console.log(`✅ UserRoles count: ${userRoles.length}`)

    if (users.length > 0) {
      console.log('\nUsers:')
      users.forEach(u => console.log(`  - ${u.name} (${u.email})`))
    }

    if (roles.length > 0) {
      console.log('\nRoles:')
      roles.forEach(r => console.log(`  - ${r.name}`))
    }

    process.exit(0)
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

checkData()
