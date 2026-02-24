// src/app/api/auth/register.js

const bcrypt = require('bcryptjs')

// Dynamically require models at runtime only
let User, sequelize

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { name, email, password } = req.body

  // Debug: Test DB connection
  try {
    // Lazy load at runtime using getDb()
    if (!User) {
      const modelsModule = require('../../../../models')
      const models = await modelsModule.getDb()
      User = models.User
      sequelize = models.sequelize
    }
    await sequelize.authenticate()
    console.log('Database connection OK')
  } catch (dbErr) {
    console.error('Database connection failed:', dbErr)

    return res.status(500).json({ error: 'Database connection failed', details: dbErr.message })
  }

  try {
    const hash = await bcrypt.hash(password, 10)
    const user = await User.create({ name, email, password: hash })

    // Create a default personal wallet for the user so it always exists
    try {
      const Wallet = sequelize.models.Wallet
      const qi = sequelize.getQueryInterface()
      const tableDef = await qi.describeTable('wallets')
      const payload = { ownerId: user.id, name: 'Personal Wallet', balance: 0 }
      if (tableDef && tableDef.allowMainSafeWithdraw !== undefined) payload.allowMainSafeWithdraw = false
      await Wallet.create(payload, { fields: Object.keys(payload) })
    } catch (e) {
      console.error('Failed to create default wallet for new user:', e)
      // Do not block registration on wallet creation failure
    }

    res.status(201).json({ id: user.id, name: user.name, email: user.email })
  } catch (err) {
    console.error('User creation failed:', err)
    res.status(400).json({ error: err.message })
  }
}
