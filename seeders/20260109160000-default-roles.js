'use strict'

/**
 * Seeder لإنشاء الأدوار الافتراضية
 *
 * تشغيل:
 * npx sequelize-cli db:seed --seed 20260109160000-default-roles.js
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const roles = [
      {
        name: 'Admin',
        description: 'مدير النظام - جميع الصلاحيات الكاملة للتحكم في النظام',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Manager',
        description: 'مدير - صلاحيات الإدارة والمراقبة والتقارير',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Accountant',
        description: 'محاسب - إدارة الفواتير والمدفوعات والخزينة',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Sales',
        description: 'مبيعات - إدارة العملاء والفواتير',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Inventory Manager',
        description: 'مدير المخزون - إدارة المواد والمخزن',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'HR Manager',
        description: 'مدير الموارد البشرية - إدارة الموظفين والحضور والرواتب',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Employee',
        description: 'موظف - صلاحيات محدودة للقراءة والمهام الأساسية',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Viewer',
        description: 'مشاهد - صلاحيات القراءة فقط',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    await queryInterface.bulkInsert('Roles', roles, {})
    console.log('✅ تم إنشاء الأدوار الافتراضية بنجاح')
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Roles', null, {})
    console.log('✅ تم حذف الأدوار')
  }
}
