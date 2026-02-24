// src/app/api/auth/reset-password.js
const bcrypt = require('bcryptjs')

// Dynamically require models at runtime only
let User

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { email, newPassword } = req.body

  try {
    // Lazy load at runtime using getDb()
    if (!User) {
      const modelsModule = require('../../../../models')
      const models = await modelsModule.getDb()

      User = models.User
    }

    const user = await User.findOne({ where: { email } })

    if (!user) return res.status(404).json({ error: 'User not found' })
    const hash = await bcrypt.hash(newPassword, 10)

    user.password = hash
    await user.save()
    res.status(200).json({ message: 'Password reset successful' })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}
