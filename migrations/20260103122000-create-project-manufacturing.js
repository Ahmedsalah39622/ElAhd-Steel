'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('project_manufacturing', {
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
      processName: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      processType: {
        type: Sequelize.STRING(100)
      },
      description: {
        type: Sequelize.TEXT
      },
      status: {
        type: Sequelize.STRING(50),
        defaultValue: 'pending'
      },
      workerId: {
        type: Sequelize.INTEGER
      },
      workerName: {
        type: Sequelize.STRING(255)
      },
      machineUsed: {
        type: Sequelize.STRING(255)
      },
      startTime: {
        type: Sequelize.DATE
      },
      endTime: {
        type: Sequelize.DATE
      },
      duration: {
        type: Sequelize.INTEGER
      },
      quantity: {
        type: Sequelize.DECIMAL(18, 3)
      },
      unit: {
        type: Sequelize.STRING(50)
      },
      notes: {
        type: Sequelize.TEXT
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

    await queryInterface.addIndex('project_manufacturing', ['projectId'])
    await queryInterface.addIndex('project_manufacturing', ['status'])
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('project_manufacturing')
  }
}
