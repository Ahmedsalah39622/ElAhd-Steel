'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('inventory_transactions', 'status', {
      type: Sequelize.STRING,
      defaultValue: 'pending',
      allowNull: true
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('inventory_transactions', 'status')
  }
}
