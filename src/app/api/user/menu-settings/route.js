// API لتحديث القوائم المرئية للمستخدم
export const dynamic = 'force-dynamic'

const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret'

export async function POST(request) {
  try {
    // التحقق من المصادقة
    const cookies = request.headers.get('cookie') || ''
    const tokenMatch = cookies.match(/token=([^;]+)/)

    if (!tokenMatch) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' }
      })
    }

    const token = tokenMatch[1]
    let decoded

    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'content-type': 'application/json' }
      })
    }

    const userId = decoded.id
    const body = await request.json()
    const { visibleMenuItems } = body

    // التحقق من صحة البيانات
    if (visibleMenuItems !== null && !Array.isArray(visibleMenuItems)) {
      return new Response(JSON.stringify({ error: 'visibleMenuItems must be an array or null' }), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      })
    }

    // تحديث قاعدة البيانات
    const modelsModule = require('../../../../../models')
    const models = await modelsModule.getDb()
    const { User, UserRole, Role } = models

    const user = await User.findByPk(userId)

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'content-type': 'application/json' }
      })
    }

    // تحديث القوائم المرئية
    await user.update({ visibleMenuItems })

    // جلب البيانات المحدثة مع الأدوار
    const updatedUser = await User.findOne({
      where: { id: userId },
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

    const userJson = updatedUser.toJSON()
    const roles = userJson.userRoles?.map(ur => ur.role) || []
    const isAdmin = roles.some(role => role.name === 'admin')

    const userData = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      roles,
      isAdmin,
      visibleMenuItems: updatedUser.visibleMenuItems
    }

    return new Response(JSON.stringify(userData), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    })
  } catch (error) {
    console.error('[update-menu-settings] Error:', error)

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    })
  }
}
