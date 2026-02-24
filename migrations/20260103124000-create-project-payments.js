'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('project_payments', {
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
      invoiceId: {
        type: Sequelize.INTEGER
      },
      amount: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false
      },
      paymentMethod: {
        type: Sequelize.STRING(50)
      },
      paymentType: {
        type: Sequelize.STRING(50),
        defaultValue: 'incoming'
      },
      reference: {
        type: Sequelize.STRING(255)
      },
      bankName: {
        type: Sequelize.STRING(255)
      },
      transactionNumber: {
        type: Sequelize.STRING(255)
      },
      notes: {
        type: Sequelize.TEXT
      },
      paidAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    })

    await queryInterface.addIndex('project_payments', ['projectId'])
    await queryInterface.addIndex('project_payments', ['invoiceId'])
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('project_payments')
  }
}
