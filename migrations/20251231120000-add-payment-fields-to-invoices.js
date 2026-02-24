'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('invoices')
    if (!table.paymentMethod)
      await queryInterface.addColumn('invoices', 'paymentMethod', { type: Sequelize.STRING, allowNull: true })
    if (!table.bankName)
      await queryInterface.addColumn('invoices', 'bankName', { type: Sequelize.STRING, allowNull: true })
    if (!table.transactionNumber)
      await queryInterface.addColumn('invoices', 'transactionNumber', { type: Sequelize.STRING, allowNull: true })
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('invoices')
    if (table.paymentMethod) await queryInterface.removeColumn('invoices', 'paymentMethod')
    if (table.bankName) await queryInterface.removeColumn('invoices', 'bankName')
    if (table.transactionNumber) await queryInterface.removeColumn('invoices', 'transactionNumber')
  }
}
