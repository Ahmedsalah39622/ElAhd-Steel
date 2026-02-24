'use strict'

const bcrypt = require('bcryptjs')

/**
 * Seeder لإنشاء مستخدم Admin افتراضي
 *
 * تشغيل:
 * npx sequelize-cli db:seed --seed 20260109170000-admin-user.js
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    // إنشاء مستخدم admin
    const hashedPassword = await bcrypt.hash('admin123', 10)

    await queryInterface.bulkInsert(
      'users',
      [
        {
          name: 'Admin',
          email: 'admin@Ahd Steel.com',
          password: hashedPassword,
          emailVerified: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      {}
    )

    // الحصول على ID المستخدم الذي تم إنشاؤه
    const [users] = await queryInterface.sequelize.query(`SELECT id FROM users WHERE email = 'admin@Ahd Steel.com';`)

    // الحصول على ID دور Admin
    const [roles] = await queryInterface.sequelize.query(`SELECT id FROM "Roles" WHERE name = 'Admin';`)

    if (users.length > 0 && roles.length > 0) {
      // تعيين دور Admin للمستخدم
      await queryInterface.bulkInsert(
        'UserRoles',
        [
          {
            userId: users[0].id,
            roleId: roles[0].id,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        {}
      )

      console.log('✅ تم إنشاء مستخدم Admin: admin@Ahd Steel.com / admin123')
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      'UserRoles',
      {
        userId: (await queryInterface.sequelize.query(`SELECT id FROM users WHERE email = 'admin@Ahd Steel.com';`))[0][0]
          ?.id
      },
      {}
    )

    await queryInterface.bulkDelete(
      'users',
      {
        email: 'admin@Ahd Steel.com'
      },
      {}
    )

    console.log('✅ تم حذف مستخدم Admin')
  }
}
