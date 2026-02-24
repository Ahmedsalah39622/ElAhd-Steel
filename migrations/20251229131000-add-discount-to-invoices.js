'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('invoices')
    if (!table.discount)
      await queryInterface.addColumn('invoices', 'discount', {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: true,
        defaultValue: 0
      })
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('invoices')
    if (table.discount) await queryInterface.removeColumn('invoices', 'discount')
  }
}
