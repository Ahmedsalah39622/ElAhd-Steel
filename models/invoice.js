'use strict'
const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class Invoice extends Model {
    static associate(models) {
      Invoice.belongsTo(models.Client, { foreignKey: 'clientId', as: 'client' })
      Invoice.belongsTo(models.Project, { foreignKey: 'projectId', as: 'project' })
    }
  }

  Invoice.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      number: DataTypes.STRING,
      clientId: DataTypes.INTEGER,
      projectId: DataTypes.INTEGER,
      date: DataTypes.DATE,
      dueDate: DataTypes.DATE,
      items: DataTypes.TEXT,
      manufacturing: DataTypes.TEXT,
      taxPercent: DataTypes.DECIMAL(5, 2),
      taxAmount: DataTypes.DECIMAL(18, 2),
      discount: DataTypes.DECIMAL(18, 2),
      total: DataTypes.DECIMAL(18, 2),
      status: DataTypes.STRING,
      paidAmount: DataTypes.DECIMAL(18, 2),
      notes: DataTypes.TEXT,
      paymentMethod: DataTypes.STRING,
      bankName: DataTypes.STRING,
      transactionNumber: DataTypes.STRING
    },
    {
      sequelize,
      modelName: 'Invoice',
      tableName: 'invoices',
      timestamps: true
    }
  )

  return Invoice
}
