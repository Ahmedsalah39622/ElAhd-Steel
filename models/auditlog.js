'use strict'
const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class AuditLog extends Model {
    static associate(models) {
      AuditLog.belongsTo(models.User, { foreignKey: 'userId', as: 'user' })
    }
  }
  AuditLog.init(
    {
      userId: DataTypes.INTEGER,
      action: DataTypes.STRING,
      details: DataTypes.TEXT,
      ipAddress: DataTypes.STRING,
      userAgent: DataTypes.STRING
    },
    {
      sequelize,
      modelName: 'AuditLog',
      tableName: 'audit_logs',
      timestamps: true
    }
  )
  return AuditLog
}
