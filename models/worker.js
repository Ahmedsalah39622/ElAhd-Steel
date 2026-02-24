'use strict'

module.exports = (sequelize, DataTypes) => {
  const Worker = sequelize.define(
    'Worker',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true
      },
      position: {
        type: DataTypes.STRING,
        allowNull: true
      },
      department: {
        type: DataTypes.STRING,
        allowNull: true
      },
      baseSalary: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0
      },
      hireDate: {
        type: DataTypes.DATE,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive', 'on-leave'),
        defaultValue: 'active'
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
      tableName: 'workers',
      timestamps: true
    }
  )

  Worker.associate = models => {
    Worker.hasMany(models.Attendance, { foreignKey: 'workerId', as: 'attendances' })
    Worker.hasMany(models.DailySalary, { foreignKey: 'workerId', as: 'dailySalaries' })
  }

  return Worker
}
