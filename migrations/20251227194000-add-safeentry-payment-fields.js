'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('safe_entries')

    if (!table.incomingMethod) {
      await queryInterface.addColumn('safe_entries', 'incomingMethod', {
        type: Sequelize.STRING,
        allowNull: true
      })
    }

    if (!table.outgoingMethod) {
      await queryInterface.addColumn('safe_entries', 'outgoingMethod', {
        type: Sequelize.STRING,
        allowNull: true
      })
    }

    if (!table.incomingTxn) {
      await queryInterface.addColumn('safe_entries', 'incomingTxn', {
        type: Sequelize.STRING,
        allowNull: true
      })
    }

    if (!table.outgoingTxn) {
      await queryInterface.addColumn('safe_entries', 'outgoingTxn', {
        type: Sequelize.STRING,
        allowNull: true
      })
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('safe_entries')

    if (table.incomingMethod) await queryInterface.removeColumn('safe_entries', 'incomingMethod')
    if (table.outgoingMethod) await queryInterface.removeColumn('safe_entries', 'outgoingMethod')
    if (table.incomingTxn) await queryInterface.removeColumn('safe_entries', 'incomingTxn')
    if (table.outgoingTxn) await queryInterface.removeColumn('safe_entries', 'outgoingTxn')
  }
}
