'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('invoices')
    if (!table.taxPercent)
      await queryInterface.addColumn('invoices', 'taxPercent', { type: Sequelize.DECIMAL(18, 2), allowNull: true })
    if (!table.taxAmount)
      await queryInterface.addColumn('invoices', 'taxAmount', { type: Sequelize.DECIMAL(18, 2), allowNull: true })
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('invoices')
    if (table.taxPercent) await queryInterface.removeColumn('invoices', 'taxPercent')
    if (table.taxAmount) await queryInterface.removeColumn('invoices', 'taxAmount')
  }
}
