const bcrypt = require('bcryptjs')

const { sequelize, User } = require('../models')

async function run() {
  try {
    await sequelize.authenticate()
    console.log('DB connected')
  } catch (err) {
    console.error('DB connection failed:', err.message || err)
    process.exit(1)
  }

  try {
    const hash = await bcrypt.hash('testpass123', 10)
    const user = await User.create({ name: 'Script Test', email: 'script-test@example.com', password: hash })

    console.log('User created:', user.id)
  } catch (err) {
    console.error('User creation failed:', err.message || err)
  } finally {
    await sequelize.close()
  }
}

run()
