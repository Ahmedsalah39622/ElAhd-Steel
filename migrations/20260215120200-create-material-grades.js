'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('MaterialGrades', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      categoryValue: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Related category (e.g., stainless, galvanized, etc.)'
      },
      value: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Grade value (e.g., 304, 316, 275, cold, hot, custom)'
      },
      label: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Display label'
      },
      isCustom: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'Whether this is a user-added custom grade'
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

    // Add composite unique constraint
    await queryInterface.addConstraint('MaterialGrades', {
      fields: ['categoryValue', 'value'],
      type: 'unique',
      name: 'unique_category_grade'
    })

    // Insert default grades
    await queryInterface.bulkInsert('MaterialGrades', [
      // Stainless grades
      { categoryValue: 'stainless', value: '304', label: '304', isCustom: false, createdAt: new Date(), updatedAt: new Date() },
      { categoryValue: 'stainless', value: '316', label: '316', isCustom: false, createdAt: new Date(), updatedAt: new Date() },
      { categoryValue: 'stainless', value: '208', label: '208', isCustom: false, createdAt: new Date(), updatedAt: new Date() },
      // Galvanized grades
      { categoryValue: 'galvanized', value: '275', label: '275', isCustom: false, createdAt: new Date(), updatedAt: new Date() },
      { categoryValue: 'galvanized', value: '330', label: '330', isCustom: false, createdAt: new Date(), updatedAt: new Date() },
      // Black grades
      { categoryValue: 'black', value: 'cold', label: 'بارد', isCustom: false, createdAt: new Date(), updatedAt: new Date() },
      { categoryValue: 'black', value: 'hot', label: 'ساخن', isCustom: false, createdAt: new Date(), updatedAt: new Date() },
      // Aluminum grades
      { categoryValue: 'aluminum', value: '6063', label: '6063', isCustom: false, createdAt: new Date(), updatedAt: new Date() }
    ])
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('MaterialGrades')
  }
}
