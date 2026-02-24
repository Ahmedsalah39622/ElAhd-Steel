'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('safe_entries')
    if (!table.supplierId) {
      await queryInterface.addColumn('safe_entries', 'supplierId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'suppliers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      })
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('safe_entries')
    if (table.supplierId) {
      await queryInterface.removeColumn('safe_entries', 'supplierId')
    }
  }
}
