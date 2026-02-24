'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('attendance', 'checkInDevice', {
      type: Sequelize.STRING,
      allowNull: true
    })

    await queryInterface.addColumn('attendance', 'checkOutDevice', {
      type: Sequelize.STRING,
      allowNull: true
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('attendance', 'checkInDevice')
    await queryInterface.removeColumn('attendance', 'checkOutDevice')
  }
}
