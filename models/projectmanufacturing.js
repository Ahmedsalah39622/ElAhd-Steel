'use strict'
const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class ProjectManufacturing extends Model {
    static associate(models) {
      ProjectManufacturing.belongsTo(models.Project, { foreignKey: 'projectId', as: 'project' })
      ProjectManufacturing.belongsTo(models.Worker, { foreignKey: 'workerId', as: 'worker' })
    }
  }

  ProjectManufacturing.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      projectId: { type: DataTypes.INTEGER, allowNull: false },
      processName: { type: DataTypes.STRING(255), allowNull: false },
      processType: { type: DataTypes.STRING(100), allowNull: true },
      description: { type: DataTypes.TEXT, allowNull: true },
      status: { type: DataTypes.STRING(50), allowNull: true, defaultValue: 'pending' },
      workerId: { type: DataTypes.INTEGER, allowNull: true },
      workerName: { type: DataTypes.STRING(255), allowNull: true },
      machineUsed: { type: DataTypes.STRING(255), allowNull: true },
      startTime: { type: DataTypes.DATE, allowNull: true },
      endTime: { type: DataTypes.DATE, allowNull: true },
      duration: { type: DataTypes.INTEGER, allowNull: true },
      quantity: { type: DataTypes.DECIMAL(18, 3), allowNull: true },
      unit: { type: DataTypes.STRING(50), allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true }
    },
    {
      sequelize,
      modelName: 'ProjectManufacturing',
      tableName: 'project_manufacturing',
      timestamps: true
    }
  )

  return ProjectManufacturing
}
