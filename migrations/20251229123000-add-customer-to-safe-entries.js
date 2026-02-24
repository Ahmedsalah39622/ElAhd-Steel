'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('safe_entries')
    if (!table.customer) {
      await queryInterface.addColumn('safe_entries', 'customer', {
        type: Sequelize.STRING,
        allowNull: true
      })
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('safe_entries')
    if (table.customer) await queryInterface.removeColumn('safe_entries', 'customer')
  }
}
