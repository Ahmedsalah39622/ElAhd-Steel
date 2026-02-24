'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('materials')

    if (!table.materialName)
      await queryInterface.addColumn('materials', 'materialName', { type: Sequelize.STRING, allowNull: true })
    if (!table.grade) await queryInterface.addColumn('materials', 'grade', { type: Sequelize.STRING, allowNull: true })
    if (!table.image) await queryInterface.addColumn('materials', 'image', { type: Sequelize.STRING, allowNull: true })
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('materials')
    if (table.materialName) await queryInterface.removeColumn('materials', 'materialName')
    if (table.grade) await queryInterface.removeColumn('materials', 'grade')
    if (table.image) await queryInterface.removeColumn('materials', 'image')
  }
}
