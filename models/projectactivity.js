'use strict'
const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class ProjectActivity extends Model {
    static associate(models) {
      ProjectActivity.belongsTo(models.Project, { foreignKey: 'projectId', as: 'project' })
    }
  }

  ProjectActivity.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      projectId: { type: DataTypes.INTEGER, allowNull: false },
      activityType: { type: DataTypes.STRING(50), allowNull: false },
      title: { type: DataTypes.STRING(255), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      metadata: { type: DataTypes.TEXT, allowNull: true },
      createdBy: { type: DataTypes.STRING(255), allowNull: true }
    },
    {
      sequelize,
      modelName: 'ProjectActivity',
      tableName: 'project_activities',
      timestamps: true,
      updatedAt: false
    }
  )

  return ProjectActivity
}
