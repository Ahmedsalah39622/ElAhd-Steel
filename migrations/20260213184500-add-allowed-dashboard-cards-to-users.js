'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'allowedDashboardCards', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: null,
      comment: 'List of dashboard card IDs that the user is allowed to see. Null means all cards.'
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'allowedDashboardCards')
  }
}
