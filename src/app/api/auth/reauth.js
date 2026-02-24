let User, sequelize

export default async function handler(req, res) {
  try {
    if (!User) {
      const modelsModule = require('../../../../models')
      const models = await modelsModule.getDb()

      User = models.User
      sequelize = models.sequelize
    }

    await sequelize.authenticate()
  } catch (dbErr) {
    return res.status(500).json({ error: 'Database error', details: dbErr.message })
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { password } = req.body

  if (!password) return res.status(400).json({ error: 'Password required' })

  // Identify user from session/headers
  try {
    // session logic - use existing auth cookie (JWT/session). For now, expect Authorization: Bearer <token> or cookie based
    // Use pages/api auth flow helpers if available; fallback: accept email in body (less secure) — we'll check for current user
    const authHeader = req.headers.authorization || ''
    let email = req.body.email || null

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      const jwt = require('jsonwebtoken')
      const cfg = require('../../../../../config/config.json')
      const secret = process.env.JWT_SECRET || 'secret'

      try {
        const payload = jwt.verify(token, secret)

        email = payload.email || email
      } catch (e) {
        // ignore
      }
    }

    if (!email) {
      // try cookie-based session user from server helper if present
      // many routes use a cookie-auth middleware; for now, we expect frontend to send email (or use JWT)
      return res.status(401).json({ error: 'Unable to determine user' })
    }

    const user = await User.findOne({ where: { email } })

    if (!user) return res.status(404).json({ error: 'User not found' })

    const bcrypt = require('bcryptjs')
    const valid = await bcrypt.compare(password, user.password)

    if (!valid) return res.status(401).json({ error: 'Invalid password' })

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Reauth error:', err)

    return res.status(500).json({ error: err.message })
  }
}
