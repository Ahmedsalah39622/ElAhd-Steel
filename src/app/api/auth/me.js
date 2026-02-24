import { verifyToken } from '@/utils/auth'

export default async function handler(req, res) {
  try {
    const user = verifyToken(req)

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Get models dynamically to avoid circular dependencies
    const modelsModule = require('../../../../models')
    const models = await modelsModule.getDb()
    const { User, UserRole, Role } = models

    const dbUser = await User.findByPk(user.id, {
      attributes: ['id', 'name', 'email', 'visibleMenuItems', 'allowedDashboardCards'],
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

    if (!dbUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    const userJson = dbUser.toJSON()
    const roles = userJson.userRoles?.map(ur => ur.role) || []
    const isAdmin = roles.some(role => role.name === 'Admin' || role.name === 'admin')

    const userData = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      roles,
      isAdmin,
      visibleMenuItems: userJson.visibleMenuItems || null,
      allowedDashboardCards: userJson.allowedDashboardCards || null
    }

    return res.status(200).json(userData)
  } catch (error) {
    console.error('[auth/me] Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
