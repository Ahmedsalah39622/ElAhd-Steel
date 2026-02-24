'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('projects', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING(255), allowNull: false },
      clientId: { type: Sequelize.INTEGER, allowNull: true },
      clientName: { type: Sequelize.STRING(255), allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      location: { type: Sequelize.STRING(255), allowNull: true },
      startDate: { type: Sequelize.DATE, allowNull: true },
      endDate: { type: Sequelize.DATE, allowNull: true },
      status: { type: Sequelize.STRING(50), allowNull: false, defaultValue: 'completed' },
      totalCost: { type: Sequelize.DECIMAL(18, 2), allowNull: true },
      totalRevenue: { type: Sequelize.DECIMAL(18, 2), allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      attachments: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    })

    // Add index on clientId for faster lookups
    await queryInterface.addIndex('projects', ['clientId'])
    await queryInterface.addIndex('projects', ['status'])
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('projects')
  }
}
