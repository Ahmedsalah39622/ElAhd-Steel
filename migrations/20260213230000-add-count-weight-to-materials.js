'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('materials')

    // Add count column if it doesn't exist
    if (!table.count) {
      await queryInterface.addColumn('materials', 'count', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      })
      console.log('✅ Added count column to materials table')
    }

    // Add weight column if it doesn't exist
    if (!table.weight) {
      await queryInterface.addColumn('materials', 'weight', {
        type: Sequelize.DECIMAL(18, 4),
        allowNull: true,
        defaultValue: 0
      })
      console.log('✅ Added weight column to materials table')
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('materials')

    if (table.count) {
      await queryInterface.removeColumn('materials', 'count')
    }

    if (table.weight) {
      await queryInterface.removeColumn('materials', 'weight')
    }
  }
}
