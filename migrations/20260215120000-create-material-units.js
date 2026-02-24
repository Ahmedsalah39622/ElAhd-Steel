'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('MaterialUnits', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      value: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'Unit value (e.g., pcs, kg, custom name)'
      },
      label: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Display label in Arabic'
      },
      isCustom: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'Whether this is a user-added custom unit'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    })

    // Insert default units
    await queryInterface.bulkInsert('MaterialUnits', [
      { value: 'pcs', label: 'قطعة', isCustom: false, createdAt: new Date(), updatedAt: new Date() },
      { value: 'kg', label: 'كجم', isCustom: false, createdAt: new Date(), updatedAt: new Date() },
      { value: 'ton', label: 'طن', isCustom: false, createdAt: new Date(), updatedAt: new Date() },
      { value: 'meter', label: 'متر', isCustom: false, createdAt: new Date(), updatedAt: new Date() },
      { value: 'liter', label: 'لتر', isCustom: false, createdAt: new Date(), updatedAt: new Date() },
      { value: 'box', label: 'صندوق', isCustom: false, createdAt: new Date(), updatedAt: new Date() },
      { value: 'other', label: 'أخرى', isCustom: false, createdAt: new Date(), updatedAt: new Date() }
    ])
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('MaterialUnits')
  }
}
