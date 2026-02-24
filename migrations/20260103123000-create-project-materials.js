'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('project_materials', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      projectId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'projects', key: 'id' },
        onDelete: 'CASCADE'
      },
      materialId: {
        type: Sequelize.INTEGER
      },
      materialName: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      materialType: {
        type: Sequelize.STRING(100)
      },
      quantity: {
        type: Sequelize.DECIMAL(18, 3),
        allowNull: false,
        defaultValue: 0.000
      },
      unit: {
        type: Sequelize.STRING(50)
      },
      unitCost: {
        type: Sequelize.DECIMAL(18, 2)
      },
      totalCost: {
        type: Sequelize.DECIMAL(18, 2)
      },
      status: {
        type: Sequelize.STRING(50),
        defaultValue: 'pending'
      },
      notes: {
        type: Sequelize.TEXT
      },
      addedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      usedAt: {
        type: Sequelize.DATE
      }
    })

    await queryInterface.addIndex('project_materials', ['projectId'])
    await queryInterface.addIndex('project_materials', ['materialId'])
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('project_materials')
  }
}
