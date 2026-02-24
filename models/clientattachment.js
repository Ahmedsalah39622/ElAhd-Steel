'use strict'
const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class ClientAttachment extends Model {
    static associate(models) {
      ClientAttachment.belongsTo(models.Client, { foreignKey: 'clientId', as: 'client' })
    }
  }

  ClientAttachment.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      clientId: { type: DataTypes.INTEGER, allowNull: false },
      title: { type: DataTypes.STRING(255), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      category: { type: DataTypes.STRING(50), allowNull: true, defaultValue: 'general' },
      fileName: { type: DataTypes.STRING(255), allowNull: false },
      filePath: { type: DataTypes.STRING(500), allowNull: false },
      fileSize: { type: DataTypes.INTEGER, allowNull: true },
      mimeType: { type: DataTypes.STRING(100), allowNull: true }
    },
    {
      sequelize,
      modelName: 'ClientAttachment',
      tableName: 'client_attachments',
      timestamps: true
    }
  )

  return ClientAttachment
}
