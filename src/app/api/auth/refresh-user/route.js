import { NextResponse } from 'next/server'

import { checkAuth } from '@/utils/auth'

export const dynamic = 'force-dynamic'

/**
 * API لتحديث بيانات المستخدم الحالية (الأدوار والصلاحيات)
 * يستخدم بعد تغيير الأدوار للمستخدم
 */
export async function POST(request) {
  try {
    // التحقق من المصادقة
    const authResult = checkAuth(request)

    if (!authResult.authenticated) {
      return authResult.response
    }

    const user = authResult.user

    // جلب البيانات المحدثة للمستخدم من قاعدة البيانات
    const modelsModule = require('../../../../../models')
    const db = await modelsModule.getDb()
    const { User, UserRole, Role } = db

    const updatedUser = await User.findByPk(user.id, {
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

    if (!updatedUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // تحضير بيانات الأدوار والصلاحيات المحدثة
    const userJson = updatedUser.toJSON()
    const roles = userJson.userRoles?.map(ur => ur.role) || []
    const isAdmin = roles.some(role => role.name === 'Admin' || role.name === 'admin')

    // إرجاع بيانات المستخدم المحدثة
    const userData = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      roles,
      isAdmin,
      visibleMenuItems: userJson.visibleMenuItems || null,
      allowedDashboardCards: userJson.allowedDashboardCards || null
    }

    return NextResponse.json({
      success: true,
      message: 'User data refreshed successfully',
      user: userData
    })
  } catch (error) {
    console.error('Error refreshing user data:', error)

    return NextResponse.json({ success: false, error: 'Failed to refresh user data' }, { status: 500 })
  }
}
