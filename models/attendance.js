'use strict'

module.exports = (sequelize, DataTypes) => {
  const Attendance = sequelize.define(
    'Attendance',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      workerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'workers',
          key: 'id'
        }
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('present', 'absent', 'half-day', 'leave'),
        defaultValue: 'present'
      },
      checkInTime: {
        type: DataTypes.TIME,
        allowNull: true
      },
      checkOutTime: {
        type: DataTypes.TIME,
        allowNull: true
      },
      checkInDevice: {
        type: DataTypes.STRING,
        allowNull: true
      },
      checkOutDevice: {
        type: DataTypes.STRING,
        allowNull: true
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    },
    {
      tableName: 'attendance',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['workerId', 'date']
        }
      ]
    }
  )

  Attendance.associate = models => {
    Attendance.belongsTo(models.Worker, { foreignKey: 'workerId' })
  }

  return Attendance
}
