'use strict'
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('JobOrders', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      orderNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      clientName: {
        type: Sequelize.STRING
      },
      projectCode: {
        type: Sequelize.STRING
      },
      status: {
        type: Sequelize.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
        defaultValue: 'pending'
      },
      specifications: {
        type: Sequelize.JSON
      },
      calculations: {
        type: Sequelize.JSON
      },
      accessories: {
        type: Sequelize.JSON
      },
      engineeringDrawing: {
        type: Sequelize.TEXT
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

    // Add jobOrderId column to InventoryTransactions table
    await queryInterface.addColumn('inventory_transactions', 'jobOrderId', {
        type: Sequelize.INTEGER,
        references: {
            model: 'JobOrders',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        allowNull: true
    })
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('inventory_transactions', 'jobOrderId')
    await queryInterface.dropTable('JobOrders')
  }
}
