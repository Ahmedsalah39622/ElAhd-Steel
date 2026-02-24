'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('inventory_transactions', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      materialId: { type: Sequelize.INTEGER, references: { model: 'materials', key: 'id' }, onDelete: 'CASCADE' },
      change: { type: Sequelize.DECIMAL(18, 2) },
      action: { type: Sequelize.STRING },
      source: { type: Sequelize.STRING },
      reference: { type: Sequelize.STRING },
      user: { type: Sequelize.STRING },
      note: { type: Sequelize.TEXT },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    })
  },
  async down(queryInterface) {
    await queryInterface.dropTable('inventory_transactions')
  }
}
