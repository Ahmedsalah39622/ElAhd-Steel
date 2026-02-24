'use strict'
const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class Project extends Model {
    static associate(models) {
      Project.belongsTo(models.Client, { foreignKey: 'clientId', as: 'client' })
      Project.hasMany(models.ProjectActivity, { foreignKey: 'projectId', as: 'activities' })
      Project.hasMany(models.ProjectMaterial, { foreignKey: 'projectId', as: 'materials' })
      Project.hasMany(models.ProjectPhase, { foreignKey: 'projectId', as: 'phases' })
      Project.hasMany(models.ProjectPayment, { foreignKey: 'projectId', as: 'payments' })
      Project.hasMany(models.ProjectManufacturing, { foreignKey: 'projectId', as: 'manufacturing' })
      Project.hasMany(models.Invoice, { foreignKey: 'projectId', as: 'invoices' })
    }
  }

  Project.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      projectNumber: { type: DataTypes.STRING(50), allowNull: true },
      name: { type: DataTypes.STRING(255), allowNull: false },
      clientId: { type: DataTypes.INTEGER, allowNull: true },
      clientName: { type: DataTypes.STRING(255), allowNull: true },
      description: { type: DataTypes.TEXT, allowNull: true },
      location: { type: DataTypes.STRING(255), allowNull: true },
      startDate: { type: DataTypes.DATE, allowNull: true },
      endDate: { type: DataTypes.DATE, allowNull: true },
      expectedDeliveryDate: { type: DataTypes.DATE, allowNull: true },
      actualDeliveryDate: { type: DataTypes.DATE, allowNull: true },
      status: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'pending' },
      priority: { type: DataTypes.STRING(20), allowNull: true, defaultValue: 'normal' },
      progressPercent: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
      totalCost: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
      totalRevenue: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
      attachments: { type: DataTypes.TEXT, allowNull: true }
    },
    {
      sequelize,
      modelName: 'Project',
      tableName: 'projects',
      timestamps: true
    }
  )

  return Project
}
