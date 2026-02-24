const { ROLE_PERMISSIONS } = require('../src/utils/permissions')

async function updateRolePermissions() {
  try {
    const modelsModule = require('../models')
    const db = await modelsModule.getDb()
    const { Role } = db

    console.log('🔄 تحديث صلاحيات الأدوار...')

    // جلب جميع الأدوار
    const roles = await Role.findAll()

    for (const role of roles) {
      const roleName = role.name.toLowerCase()
      let permissions = []

      // تحديد الصلاحيات حسب اسم الدور
      if (roleName.includes('admin') || roleName.includes('مدير عام')) {
        permissions = ROLE_PERMISSIONS.admin
      } else if (roleName.includes('محاسب') || roleName.includes('accountant')) {
        permissions = ROLE_PERMISSIONS.accountant
      } else if (roleName.includes('مخزون') || roleName.includes('inventory')) {
        permissions = ROLE_PERMISSIONS.inventory_manager
      } else if (roleName.includes('مبيعات') || roleName.includes('sales')) {
        permissions = ROLE_PERMISSIONS.sales_manager
      } else if (roleName.includes('موارد بشرية') || roleName.includes('hr')) {
        permissions = ROLE_PERMISSIONS.hr_manager
      } else if (roleName.includes('مشاريع') || roleName.includes('project')) {
        permissions = ROLE_PERMISSIONS.project_manager
      } else {
        // دور عادي - صلاحيات محدودة
        permissions = ROLE_PERMISSIONS.user
      }

      await role.update({ permissions })
      console.log(`✅ تم تحديث صلاحيات الدور: ${role.name} (${permissions.length} صلاحية)`)
    }

    console.log('✅ تم تحديث جميع الأدوار بنجاح!')
    process.exit(0)
  } catch (error) {
    console.error('❌ خطأ في تحديث الصلاحيات:', error)
    process.exit(1)
  }
}

updateRolePermissions()
