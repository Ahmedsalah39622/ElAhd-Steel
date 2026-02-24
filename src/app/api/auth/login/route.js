export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { email, password } = body

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password are required' }), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      })
    }

    // Dynamic imports to avoid module-level require issues
    const bcrypt = (await import('bcryptjs')).default
    const jwt = (await import('jsonwebtoken')).default

    const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret'
    const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'token'

    // Load models
    const modelsModule = await import('../../../../../models/index.js')
    const models = await modelsModule.getDb()
    const { User, UserRole, Role, sequelize } = models

    // Check DB connection
    try {
      await sequelize.authenticate()
    } catch (dbErr) {
      console.error('[login] DB connection failed:', dbErr)
      return new Response(JSON.stringify({ error: 'Database connection failed', details: dbErr.message }), {
        status: 500,
        headers: { 'content-type': 'application/json' }
      })
    }

    console.log('[login] Looking up user with email:', email)

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
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'content-type': 'application/json' }
      })
    }

    const valid = await bcrypt.compare(password, user.password)

    if (!valid) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'content-type': 'application/json' }
      })
    }

    console.log('[login] Password OK, issuing JWT for user:', email)

    const userJson = user.toJSON()
    const roles = userJson.userRoles?.map(ur => ur.role) || []
    const isAdmin = roles.some(role => role.name === 'admin')

    const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '7d' })
    const maxAge = 7 * 24 * 60 * 60
    const secureFlag = process.env.NODE_ENV === 'production' ? 'Secure; ' : ''
    const cookieString = `${COOKIE_NAME}=${token}; HttpOnly; ${secureFlag}SameSite=Lax; Path=/; Max-Age=${maxAge}`

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
    console.error('[login] Route error:', err)
    return new Response(JSON.stringify({ error: err.message, stack: err.stack }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    })
  }
}
