'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('material_pieces', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      materialId: { type: Sequelize.INTEGER, allowNull: false },
      length: { type: Sequelize.DECIMAL(18, 2), allowNull: true },
      width: { type: Sequelize.DECIMAL(18, 2), allowNull: true },
      quantity: { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 1 },
      isLeftover: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      parentPieceId: { type: Sequelize.INTEGER, allowNull: true },
      status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'available' },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    })

    await queryInterface.addIndex('material_pieces', ['materialId'])
    await queryInterface.addIndex('material_pieces', ['status'])
  },

  async down(queryInterface) {
    await queryInterface.dropTable('material_pieces')
  }
}
