'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('invoices', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      number: { type: Sequelize.STRING },
      clientId: { type: Sequelize.INTEGER },
      date: { type: Sequelize.DATE },
      dueDate: { type: Sequelize.DATE },
      items: { type: Sequelize.TEXT }, // Changed from JSON to TEXT for MSSQL compatibility
      total: { type: Sequelize.DECIMAL(18, 2) },
      status: { type: Sequelize.STRING },
      notes: { type: Sequelize.TEXT },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('invoices')
  }
}
