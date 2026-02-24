'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('wallets')
    if (!table.allowMainSafeWithdraw) {
      await queryInterface.addColumn('wallets', 'allowMainSafeWithdraw', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      })
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('wallets')
    if (table.allowMainSafeWithdraw) {
      await queryInterface.removeColumn('wallets', 'allowMainSafeWithdraw')
    }
  }
}
