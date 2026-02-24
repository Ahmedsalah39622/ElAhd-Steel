'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Make recipient field nullable
    await queryInterface.changeColumn('purchase_orders', 'recipient', {
      type: Sequelize.STRING,
      allowNull: true
    })
  },

  async down(queryInterface, Sequelize) {
    // Revert back to non-nullable
    await queryInterface.changeColumn('purchase_orders', 'recipient', {
      type: Sequelize.STRING,
      allowNull: false
    })
  }
}
