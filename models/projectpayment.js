'use strict'
const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class ProjectPayment extends Model {
    static associate(models) {
      ProjectPayment.belongsTo(models.Project, { foreignKey: 'projectId', as: 'project' })
      ProjectPayment.belongsTo(models.Invoice, { foreignKey: 'invoiceId', as: 'invoice' })
    }
  }

  ProjectPayment.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      projectId: { type: DataTypes.INTEGER, allowNull: false },
      invoiceId: { type: DataTypes.INTEGER, allowNull: true },
      amount: { type: DataTypes.DECIMAL(18, 2), allowNull: false },
      paymentMethod: { type: DataTypes.STRING(50), allowNull: true },
      paymentType: { type: DataTypes.STRING(50), allowNull: true, defaultValue: 'incoming' },
      reference: { type: DataTypes.STRING(255), allowNull: true },
      bankName: { type: DataTypes.STRING(255), allowNull: true },
      transactionNumber: { type: DataTypes.STRING(255), allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
      paidAt: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW }
    },
    {
      sequelize,
      modelName: 'ProjectPayment',
      tableName: 'project_payments',
      timestamps: true,
      updatedAt: false
    }
  )

  return ProjectPayment
}
