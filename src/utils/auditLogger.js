/**
 * Audit Log Helper
 *
 * مساعد لتسجيل الأنشطة في قاعدة البيانات
 * يمكن استخدامه في أي مكان في التطبيق لتسجيل العمليات
 */

// استخدام dynamic import للـ models
const getModels = async () => {
  const modelsModule = require('../../../models')
  return await modelsModule.getDb()
}

/**
 * أنواع الإجراءات المتاحة للتسجيل
 */
export const ACTION_TYPES = {
  // User Management
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',

  // Role Management
  ROLE_CREATED: 'ROLE_CREATED',
  ROLE_UPDATED: 'ROLE_UPDATED',
  ROLE_DELETED: 'ROLE_DELETED',
  ROLE_ASSIGNED: 'ROLE_ASSIGNED',
  ROLE_REMOVED: 'ROLE_REMOVED',

  // Client Management
  CLIENT_CREATED: 'CLIENT_CREATED',
  CLIENT_UPDATED: 'CLIENT_UPDATED',
  CLIENT_DELETED: 'CLIENT_DELETED',

  // Invoice Management
  INVOICE_CREATED: 'INVOICE_CREATED',
  INVOICE_UPDATED: 'INVOICE_UPDATED',
  INVOICE_DELETED: 'INVOICE_DELETED',
  INVOICE_PAID: 'INVOICE_PAID',

  // Payment Operations
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  PAYMENT_SENT: 'PAYMENT_SENT',
  PAYMENT_CANCELLED: 'PAYMENT_CANCELLED',

  // Safe/Treasury Operations
  SAFE_ENTRY_CREATED: 'SAFE_ENTRY_CREATED',
  SAFE_ENTRY_UPDATED: 'SAFE_ENTRY_UPDATED',
  SAFE_ENTRY_DELETED: 'SAFE_ENTRY_DELETED',
  SAFE_WITHDRAWAL: 'SAFE_WITHDRAWAL',
  SAFE_DEPOSIT: 'SAFE_DEPOSIT',

  // Inventory Operations
  MATERIAL_CREATED: 'MATERIAL_CREATED',
  MATERIAL_UPDATED: 'MATERIAL_UPDATED',
  MATERIAL_DELETED: 'MATERIAL_DELETED',
  INVENTORY_ADJUSTED: 'INVENTORY_ADJUSTED',

  // Project Operations
  PROJECT_CREATED: 'PROJECT_CREATED',
  PROJECT_UPDATED: 'PROJECT_UPDATED',
  PROJECT_DELETED: 'PROJECT_DELETED',
  PROJECT_COMPLETED: 'PROJECT_COMPLETED',

  // HR Operations
  EMPLOYEE_CREATED: 'EMPLOYEE_CREATED',
  EMPLOYEE_UPDATED: 'EMPLOYEE_UPDATED',
  EMPLOYEE_DELETED: 'EMPLOYEE_DELETED',
  ATTENDANCE_RECORDED: 'ATTENDANCE_RECORDED',
  SALARY_PAID: 'SALARY_PAID',

  // System Operations
  SETTINGS_UPDATED: 'SETTINGS_UPDATED',
  BACKUP_CREATED: 'BACKUP_CREATED',
  DATA_EXPORTED: 'DATA_EXPORTED',
  DATA_IMPORTED: 'DATA_IMPORTED'
}

/**
 * تسجيل نشاط في قاعدة البيانات
 *
 * @param {Object} params - معلمات السجل
 * @param {number} params.userId - معرف المستخدم الذي قام بالعملية
 * @param {string} params.action - نوع الإجراء (استخدم ACTION_TYPES)
 * @param {string} params.details - تفاصيل العملية
 * @param {Object} params.request - كائن request من Next.js (اختياري)
 * @param {string} params.ipAddress - عنوان IP (اختياري)
 * @param {string} params.userAgent - User Agent (اختياري)
 * @returns {Promise<Object>} السجل المُنشأ
 */
export async function logActivity({
  userId,
  action,
  details = '',
  request = null,
  ipAddress = null,
  userAgent = null
}) {
  try {
    const { AuditLog } = await getModels()

    // استخراج IP و User Agent من request إذا كان متاحاً
    let finalIpAddress = ipAddress
    let finalUserAgent = userAgent

    if (request) {
      if (!finalIpAddress) {
        finalIpAddress =
          request.headers?.get?.('x-forwarded-for') || request.headers?.['x-forwarded-for'] || request.ip || 'unknown'
      }

      if (!finalUserAgent) {
        finalUserAgent = request.headers?.get?.('user-agent') || request.headers?.['user-agent'] || 'unknown'
      }
    }

    const log = await AuditLog.create({
      userId: userId || null,
      action,
      details,
      ipAddress: finalIpAddress || 'unknown',
      userAgent: finalUserAgent || 'unknown'
    })

    return log
  } catch (error) {
    console.error('خطأ في تسجيل النشاط:', error)
    // لا نريد أن يفشل التطبيق بسبب خطأ في التسجيل
    return null
  }
}

/**
 * تسجيل نشاط تسجيل دخول
 */
export async function logLogin(userId, request) {
  return logActivity({
    userId,
    action: ACTION_TYPES.USER_LOGIN,
    details: 'تسجيل دخول ناجح',
    request
  })
}

/**
 * تسجيل نشاط تسجيل خروج
 */
export async function logLogout(userId, request) {
  return logActivity({
    userId,
    action: ACTION_TYPES.USER_LOGOUT,
    details: 'تسجيل خروج',
    request
  })
}

/**
 * تسجيل نشاط إنشاء مستخدم
 */
export async function logUserCreated(createdByUserId, newUserEmail, request) {
  return logActivity({
    userId: createdByUserId,
    action: ACTION_TYPES.USER_CREATED,
    details: `تم إنشاء مستخدم جديد: ${newUserEmail}`,
    request
  })
}

/**
 * تسجيل نشاط تحديث مستخدم
 */
export async function logUserUpdated(updatedByUserId, targetUserEmail, request) {
  return logActivity({
    userId: updatedByUserId,
    action: ACTION_TYPES.USER_UPDATED,
    details: `تم تحديث بيانات المستخدم: ${targetUserEmail}`,
    request
  })
}

/**
 * تسجيل نشاط حذف مستخدم
 */
export async function logUserDeleted(deletedByUserId, targetUserEmail, request) {
  return logActivity({
    userId: deletedByUserId,
    action: ACTION_TYPES.USER_DELETED,
    details: `تم حذف المستخدم: ${targetUserEmail}`,
    request
  })
}

/**
 * تسجيل نشاط إنشاء فاتورة
 */
export async function logInvoiceCreated(userId, invoiceNumber, amount, request) {
  return logActivity({
    userId,
    action: ACTION_TYPES.INVOICE_CREATED,
    details: `تم إنشاء فاتورة رقم ${invoiceNumber} بقيمة ${amount}`,
    request
  })
}

/**
 * تسجيل نشاط دفعة
 */
export async function logPaymentReceived(userId, amount, from, request) {
  return logActivity({
    userId,
    action: ACTION_TYPES.PAYMENT_RECEIVED,
    details: `تم استلام دفعة بقيمة ${amount} من ${from}`,
    request
  })
}

/**
 * الحصول على آخر الأنشطة لمستخدم معين
 */
export async function getUserRecentActivity(userId, limit = 10) {
  try {
    const { AuditLog } = await getModels()

    const logs = await AuditLog.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit
    })
    return logs
  } catch (error) {
    console.error('خطأ في جلب آخر الأنشطة:', error)
    return []
  }
}

/**
 * الحصول على إحصائيات الأنشطة
 */
export async function getActivityStats(startDate = null, endDate = null) {
  try {
    const db = await getModels()
    const { AuditLog } = db
    const { Op } = require('sequelize')
    const where = {}

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt[Op.gte] = new Date(startDate)
      if (endDate) where.createdAt[Op.lte] = new Date(endDate)
    }

    const totalLogs = await AuditLog.count({ where })

    const logsByAction = await AuditLog.findAll({
      where,
      attributes: ['action', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']],
      group: ['action'],
      raw: true
    })

    return {
      totalLogs,
      byAction: logsByAction
    }
  } catch (error) {
    console.error('خطأ في جلب إحصائيات الأنشطة:', error)
    return { totalLogs: 0, byAction: [] }
  }
}

export default {
  ACTION_TYPES,
  logActivity,
  logLogin,
  logLogout,
  logUserCreated,
  logUserUpdated,
  logUserDeleted,
  logInvoiceCreated,
  logPaymentReceived,
  getUserRecentActivity,
  getActivityStats
}
