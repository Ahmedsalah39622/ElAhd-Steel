'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('MaterialCategories', {
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
        comment: 'Category value (e.g., stainless, galvanized, custom name)'
      },
      label: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Display label in Arabic'
      },
      isCustom: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'Whether this is a user-added custom category'
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

    // Insert default categories
    await queryInterface.bulkInsert('MaterialCategories', [
      { value: 'stainless', label: 'ستانلس', isCustom: false, createdAt: new Date(), updatedAt: new Date() },
      { value: 'galvanized', label: 'مجلفن', isCustom: false, createdAt: new Date(), updatedAt: new Date() },
      { value: 'black', label: 'أسود', isCustom: false, createdAt: new Date(), updatedAt: new Date() },
      { value: 'aluminum', label: 'ألومنيوم', isCustom: false, createdAt: new Date(), updatedAt: new Date() },
      { value: 'copper', label: 'نحاس', isCustom: false, createdAt: new Date(), updatedAt: new Date() },
      { value: 'accessory', label: 'اكسسوار', isCustom: false, createdAt: new Date(), updatedAt: new Date() },
      { value: 'other', label: 'أخرى', isCustom: false, createdAt: new Date(), updatedAt: new Date() }
    ])
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('MaterialCategories')
  }
}
