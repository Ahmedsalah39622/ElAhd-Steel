'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('inventory_transactions')
    if (!table.materialPieceId) {
      await queryInterface.addColumn('inventory_transactions', 'materialPieceId', {
        type: Sequelize.INTEGER,
        allowNull: true
      })
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('inventory_transactions')
    if (table.materialPieceId) {
      await queryInterface.removeColumn('inventory_transactions', 'materialPieceId')
    }
  }
}
