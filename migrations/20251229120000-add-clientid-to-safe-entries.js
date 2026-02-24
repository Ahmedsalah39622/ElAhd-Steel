'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('safe_entries')
    if (!table.clientId)
      await queryInterface.addColumn('safe_entries', 'clientId', { type: Sequelize.INTEGER, allowNull: true })
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('safe_entries')
    if (table.clientId) await queryInterface.removeColumn('safe_entries', 'clientId')
  }
}
