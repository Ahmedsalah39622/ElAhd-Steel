// src/app/api/auth/login.js
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

// Read secret from env or fallback for dev
const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret'
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'token'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { email, password } = req.body

  try {
    // Dynamically require models at runtime only via getDb()
    // Dynamically require models at runtime only via getDb()
    const modelsModule = require('../../../../models')
    const models = await modelsModule.getDb()
    const { User, sequelize } = models

    // Check DB connection
    try {
      await sequelize.authenticate()
      console.log('[login] DB connection OK')
    } catch (dbErr) {
      console.error('[login] DB connection failed:', dbErr)
      return res.status(500).json({ error: 'Database connection failed', details: dbErr.message })
    }

    console.log('[login] Looking up user with email:', email)
    const { UserRole, Role } = models

    const user = await User.findOne({
      where: { email },
      include: [
        {
          model: UserRole,
          as: 'userRoles',
          include: [
            {
              model: Role,
              as: 'role',
              attributes: ['id', 'name', 'description', 'permissions']
            }
          ]
        }
      ]
    })

    if (!user) {
      console.log('[login] User not found for email:', email)
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    console.log('[login] User found, comparing password')
    const valid = await bcrypt.compare(password, user.password)

    if (!valid) {
      console.log('[login] Password mismatch for email:', email)
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    console.log('[login] Password OK, issuing JWT for user:', email)

    // تحضير بيانات الأدوار والصلاحيات
    const userJson = user.toJSON()
    const roles = userJson.userRoles?.map(ur => ur.role) || []
    const isAdmin = roles.some(role => role.name === 'admin')

    // Issue JWT and return Response with Set-Cookie header
    const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '7d' })
    const maxAge = 7 * 24 * 60 * 60 // 7 days in seconds
    const secureFlag = process.env.NODE_ENV === 'production' ? 'Secure; ' : ''
    const cookieString = `${COOKIE_NAME}=${token}; HttpOnly; ${secureFlag}SameSite=Lax; Path=/; Max-Age=${maxAge}`

    // إرجاع بيانات المستخدم مع الأدوار والصلاحيات
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      roles,
      isAdmin,
      visibleMenuItems: userJson.visibleMenuItems || null,
      allowedDashboardCards: userJson.allowedDashboardCards || null
    }

    return new Response(JSON.stringify(userData), {
      status: 200,
      headers: { 'content-type': 'application/json', 'Set-Cookie': cookieString }
    })
  } catch (err) {
    console.error('[login] Handler error:', err)
    res.status(400).json({ error: err.message })
  }
}
