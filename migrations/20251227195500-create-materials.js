'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('materials', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING },
      sku: { type: Sequelize.STRING },
      unit: { type: Sequelize.STRING },
      type: { type: Sequelize.STRING },
      stock: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      createdBy: { type: Sequelize.STRING },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    })
  },
  async down(queryInterface) {
    await queryInterface.dropTable('materials')
  }
}
