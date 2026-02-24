'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create index only if it doesn't already exist (idempotent)
    const existing = await queryInterface.showIndex('materials')
    const found = existing.some(idx => idx.name === 'materials_sku_unique')
    if (!found) {
      await queryInterface.addIndex('materials', ['sku'], {
        name: 'materials_sku_unique',
        unique: true,
        where: {
          sku: { [Sequelize.Op.ne]: null }
        }
      })
    }
  },

  async down(queryInterface) {
    try {
      await queryInterface.removeIndex('materials', 'materials_sku_unique')
    } catch (e) {
      // index may already have been removed — ignore
    }
  }
}
