'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'visibleMenuItems', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: null,
      comment: 'قائمة بالصفحات المرئية للمستخدم في الـ sidebar (null = كل الصفحات المسموح بها بناء على الصلاحيات)'
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'visibleMenuItems')
  }
}
