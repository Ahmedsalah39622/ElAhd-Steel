'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('daily_salaries', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      workerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'workers',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      dailyAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      bonus: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0
      },
      deduction: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0
      },
      totalAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    })

    await queryInterface.addIndex('daily_salaries', ['workerId', 'date'], {
      unique: true,
      name: 'unique_worker_date_salary'
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('daily_salaries')
  }
}
