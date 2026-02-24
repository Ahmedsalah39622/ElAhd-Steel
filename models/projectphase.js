'use strict'
const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class ProjectPhase extends Model {
    static associate(models) {
      ProjectPhase.belongsTo(models.Project, { foreignKey: 'projectId', as: 'project' })
    }
  }

  ProjectPhase.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      projectId: { type: DataTypes.INTEGER, allowNull: false },
      phaseName: { type: DataTypes.STRING(255), allowNull: false },
      phaseOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      description: { type: DataTypes.TEXT, allowNull: true },
      status: { type: DataTypes.STRING(50), allowNull: true, defaultValue: 'pending' },
      startDate: { type: DataTypes.DATE, allowNull: true },
      endDate: { type: DataTypes.DATE, allowNull: true },
      completedAt: { type: DataTypes.DATE, allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true }
    },
    {
      sequelize,
      modelName: 'ProjectPhase',
      tableName: 'project_phases',
      timestamps: true
    }
  )

  return ProjectPhase
}
