'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('price_lists', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      clientId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'clients',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      clientName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      projectName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      projectDescription: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      items: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: '[]'
      },
      manufacturingItems: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: '[]'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      validUntil: {
        type: Sequelize.DATE,
        allowNull: true
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'draft'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    })

    // Add index on clientId and status for faster lookups (idempotent)
    const existingIndexes = await queryInterface.showIndex('price_lists')
    const hasClientIdx = existingIndexes.some(i => i.fields && i.fields.some(f => f.attribute === 'clientId'))
    const hasStatusIdx = existingIndexes.some(i => i.fields && i.fields.some(f => f.attribute === 'status'))

    if (!hasClientIdx) await queryInterface.addIndex('price_lists', ['clientId'])
    if (!hasStatusIdx) await queryInterface.addIndex('price_lists', ['status'])
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('price_lists')
  }
}
