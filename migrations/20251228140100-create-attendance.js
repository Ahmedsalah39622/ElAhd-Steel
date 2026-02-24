'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('attendance', {
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
      status: {
        type: Sequelize.ENUM('present', 'absent', 'half-day', 'leave'),
        defaultValue: 'present'
      },
      checkInTime: {
        type: Sequelize.TIME,
        allowNull: true
      },
      checkOutTime: {
        type: Sequelize.TIME,
        allowNull: true
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

    await queryInterface.addIndex('attendance', ['workerId', 'date'], {
      unique: true,
      name: 'unique_worker_date_attendance'
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('attendance')
  }
}
