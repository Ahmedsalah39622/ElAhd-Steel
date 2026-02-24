'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('invoices')
    if (!table.manufacturing) {
      await queryInterface.addColumn('invoices', 'manufacturing', {
        type: Sequelize.TEXT,
        allowNull: true
      })
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('invoices')
    if (table.manufacturing) await queryInterface.removeColumn('invoices', 'manufacturing')
  }
}
