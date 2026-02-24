/**
 * Middleware للتحقق من صلاحيات المستخدم
 *
 * يستخدم للحماية من الوصول غير المصرح به للصفحات والـ API
 */

import { NextResponse } from 'next/server'

// استخدام dynamic import للـ models
const getModels = async () => {
  const modelsModule = require('../../models')
  return await modelsModule.getDb()
}

/**
 * التحقق من أن المستخدم لديه دور معين
 *
 * @param {number} userId - معرف المستخدم
 * @param {string|string[]} allowedRoles - الدور أو الأدوار المسموح بها
 * @returns {Promise<boolean>} true إذا كان المستخدم لديه الصلاحية
 */
export async function hasRole(userId, allowedRoles) {
  try {
    const { User, UserRole, Role } = await getModels()

    if (!userId) return false

    // تحويل allowedRoles إلى array إذا كان string
    const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]

    // جلب أدوار المستخدم
    const userRoles = await UserRole.findAll({
      where: { userId },
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['name']
        }
      ]
    })

    // التحقق من وجود أي من الأدوار المسموح بها
    const hasPermission = userRoles.some(ur => rolesArray.includes(ur.role.name))

    return hasPermission
  } catch (error) {
    console.error('خطأ في التحقق من الصلاحية:', error)
    return false
  }
}

/**
 * التحقق من أن المستخدم Admin
 */
export async function isAdmin(userId) {
  return hasRole(userId, 'Admin')
}

/**
 * التحقق من أن المستخدم Manager أو Admin
 */
export async function isManagerOrAdmin(userId) {
  return hasRole(userId, ['Admin', 'Manager'])
}

/**
 * Middleware للتحقق من الصلاحيات في API Routes
 *
 * استخدام:
 * export async function GET(request) {
 *   const authorized = await requireRole(request, ['Admin'])
 *   if (!authorized.ok) return authorized.response
 *
 *   // باقي الكود...
 * }
 */
export async function requireRole(request, allowedRoles) {
  try {
    // الحصول على userId من الجلسة أو التوكن
    // هذا يعتمد على نظام المصادقة المستخدم في المشروع
    // مثال بسيط:

    // TODO: استبدل هذا بطريقة الحصول على userId الفعلية من الجلسة
    const userId = request.headers.get('x-user-id') || null

    if (!userId) {
      return {
        ok: false,
        response: NextResponse.json({ success: false, error: 'يجب تسجيل الدخول أولاً' }, { status: 401 })
      }
    }

    const hasPermission = await hasRole(userId, allowedRoles)

    if (!hasPermission) {
      return {
        ok: false,
        response: NextResponse.json({ success: false, error: 'ليس لديك صلاحية للوصول إلى هذا المورد' }, { status: 403 })
      }
    }

    return {
      ok: true,
      userId
    }
  } catch (error) {
    console.error('خطأ في middleware الصلاحيات:', error)
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: 'خطأ في التحقق من الصلاحيات' }, { status: 500 })
    }
  }
}

/**
 * Middleware للتحقق من صلاحية Admin فقط
 */
export async function requireAdmin(request) {
  return requireRole(request, ['Admin'])
}

/**
 * Middleware للتحقق من صلاحية Manager أو Admin
 */
export async function requireManagerOrAdmin(request) {
  return requireRole(request, ['Admin', 'Manager'])
}

/**
 * دالة مساعدة للحصول على معلومات المستخدم الحالي من الجلسة
 *
 * @param {Request} request - كائن الطلب
 * @returns {Promise<Object|null>} معلومات المستخدم أو null
 */
export async function getCurrentUser(request) {
  try {
    const { User, UserRole, Role } = await getModels()

    // TODO: استبدل هذا بطريقة الحصول على userId الفعلية من الجلسة
    const userId = request.headers.get('x-user-id') || null

    if (!userId) return null

    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email'],
      include: [
        {
          model: UserRole,
          as: 'userRoles',
          include: [
            {
              model: Role,
              as: 'role',
              attributes: ['id', 'name', 'description']
            }
          ]
        }
      ]
    })

    if (!user) return null

    // تحويل البيانات لتكون أسهل في الاستخدام
    const userJson = user.toJSON()
    return {
      ...userJson,
      roles: userJson.userRoles?.map(ur => ur.role) || []
    }
  } catch (error) {
    console.error('خطأ في جلب معلومات المستخدم:', error)
    return null
  }
}

/**
 * دالة مساعدة للحصول على أسماء أدوار المستخدم
 */
export async function getUserRoles(userId) {
  try {
    const { User, UserRole, Role } = await getModels()

    const userRoles = await UserRole.findAll({
      where: { userId },
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['name']
        }
      ]
    })

    return userRoles.map(ur => ur.role.name)
  } catch (error) {
    console.error('خطأ في جلب أدوار المستخدم:', error)
    return []
  }
}

export default {
  hasRole,
  isAdmin,
  isManagerOrAdmin,
  requireRole,
  requireAdmin,
  requireManagerOrAdmin,
  getCurrentUser,
  getUserRoles
}
