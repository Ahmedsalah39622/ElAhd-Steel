'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('safes', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      type: {
        type: Sequelize.STRING,
        allowNull: true
      },
      isDefault: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    })

    // Seed a default Main Safe
    await queryInterface.bulkInsert('safes', [
      {
        name: 'Main Safe',
        type: 'main',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ])
  },

  async down(queryInterface) {
    await queryInterface.dropTable('safes')
  }
}
