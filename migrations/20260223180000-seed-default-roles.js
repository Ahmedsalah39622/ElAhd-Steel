'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Delete existing roles first (fresh seed)
    await queryInterface.bulkDelete('Roles', null, {})

    const now = new Date()

    await queryInterface.bulkInsert('Roles', [
      {
        id: 1,
        name: 'Admin',
        description: 'جميع الصلاحيات الكاملة للتحكم في النظام',
        permissions: JSON.stringify([
          'home', 'about', 'projects', 'projects.explorer',
          'safe', 'safe.personal', 'wallet',
          'inventory', 'inventory.factory', 'inventory.client', 'inventory.operating',
          'manufacturing', 'suppliers', 'clients',
          'invoices', 'price_list', 'price_review',
          'hr', 'hr.workers', 'hr.attendance', 'hr.salaries',
          'reports', 'settings', 'settings.menu',
          'admin', 'admin.users', 'admin.roles', 'admin.permissions', 'admin.audit_logs'
        ]),
        createdAt: now,
        updatedAt: now
      },
      {
        id: 2,
        name: 'Manager',
        description: 'صلاحيات الإدارة والمراقبة والتقارير',
        permissions: JSON.stringify([
          'home', 'about', 'projects', 'projects.explorer',
          'safe', 'safe.personal', 'wallet',
          'inventory', 'inventory.factory', 'inventory.client', 'inventory.operating',
          'manufacturing', 'suppliers', 'clients',
          'invoices', 'price_list', 'price_review',
          'hr', 'hr.workers', 'hr.attendance', 'hr.salaries',
          'reports', 'settings', 'settings.menu'
        ]),
        createdAt: now,
        updatedAt: now
      },
      {
        id: 3,
        name: 'Accountant',
        description: 'إدارة الفواتير والمدفوعات والخزينة',
        permissions: JSON.stringify([
          'home', 'about',
          'safe', 'safe.personal', 'wallet',
          'clients', 'invoices',
          'reports', 'settings', 'settings.menu'
        ]),
        createdAt: now,
        updatedAt: now
      },
      {
        id: 4,
        name: 'Sales',
        description: 'مبيعات – إدارة العملاء والفواتير',
        permissions: JSON.stringify([
          'home', 'about',
          'clients', 'invoices',
          'price_list', 'price_review',
          'projects', 'projects.explorer',
          'reports', 'settings', 'settings.menu'
        ]),
        createdAt: now,
        updatedAt: now
      },
      {
        id: 5,
        name: 'Inventory Manager',
        description: 'مدير المخزون – إدارة المواد والمخزن',
        permissions: JSON.stringify([
          'home', 'about',
          'inventory', 'inventory.factory', 'inventory.client', 'inventory.operating',
          'manufacturing', 'suppliers',
          'reports', 'settings', 'settings.menu'
        ]),
        createdAt: now,
        updatedAt: now
      },
      {
        id: 6,
        name: 'HR Manager',
        description: 'إدارة الموظفين والحضور والرواتب',
        permissions: JSON.stringify([
          'home', 'about',
          'hr', 'hr.workers', 'hr.attendance', 'hr.salaries',
          'reports', 'settings', 'settings.menu'
        ]),
        createdAt: now,
        updatedAt: now
      },
      {
        id: 7,
        name: 'Employee',
        description: 'صلاحيات محدودة للقراءة والمهام الأساسية',
        permissions: JSON.stringify([
          'home', 'about', 'settings', 'settings.menu'
        ]),
        createdAt: now,
        updatedAt: now
      },
      {
        id: 8,
        name: 'Viewer',
        description: 'مشاهد – صلاحيات القراءة فقط',
        permissions: JSON.stringify([
          'home', 'about', 'settings', 'settings.menu'
        ]),
        createdAt: now,
        updatedAt: now
      }
    ])

    // Reset sequence for PostgreSQL
    await queryInterface.sequelize.query(
      `SELECT setval('"Roles_id_seq"', (SELECT MAX(id) FROM "Roles"))`
    )
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Roles', {
      id: [1, 2, 3, 4, 5, 6, 7, 8]
    })
  }
}
