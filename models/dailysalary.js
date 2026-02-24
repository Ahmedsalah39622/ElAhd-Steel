'use strict'

module.exports = (sequelize, DataTypes) => {
  const DailySalary = sequelize.define(
    'DailySalary',
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
      dailyAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      bonus: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0
      },
      deduction: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0
      },
      totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
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
      tableName: 'daily_salaries',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['workerId', 'date']
        }
      ]
    }
  )

  DailySalary.associate = models => {
    DailySalary.belongsTo(models.Worker, { foreignKey: 'workerId' })
  }

  return DailySalary
}
