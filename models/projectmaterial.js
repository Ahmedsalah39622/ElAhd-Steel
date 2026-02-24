'use strict'
const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class ProjectMaterial extends Model {
    static associate(models) {
      ProjectMaterial.belongsTo(models.Project, { foreignKey: 'projectId', as: 'project' })
      ProjectMaterial.belongsTo(models.Material, { foreignKey: 'materialId', as: 'material' })
    }
  }

  ProjectMaterial.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      projectId: { type: DataTypes.INTEGER, allowNull: false },
      materialId: { type: DataTypes.INTEGER, allowNull: true },
      materialName: { type: DataTypes.STRING(255), allowNull: false },
      materialType: { type: DataTypes.STRING(100), allowNull: true },
      quantity: { type: DataTypes.DECIMAL(18, 3), allowNull: false, defaultValue: 0 },
      unit: { type: DataTypes.STRING(50), allowNull: true },
      unitCost: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
      totalCost: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
      status: { type: DataTypes.STRING(50), allowNull: true, defaultValue: 'pending' },
      notes: { type: DataTypes.TEXT, allowNull: true },
      addedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW },
      usedAt: { type: DataTypes.DATE, allowNull: true }
    },
    {
      sequelize,
      modelName: 'ProjectMaterial',
      tableName: 'project_materials',
      timestamps: false
    }
  )

  return ProjectMaterial
}
