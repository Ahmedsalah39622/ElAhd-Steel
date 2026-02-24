'use strict'
const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class Safe extends Model {
    static associate(models) {
      Safe.hasMany(models.SafeEntry, { foreignKey: 'safeId', as: 'entries' })
      Safe.hasMany(models.SafeEntry, { foreignKey: 'targetSafeId', as: 'incomingTransfers' })
      Safe.belongsTo(models.User, { foreignKey: 'ownerId', as: 'owner' })
    }
  }

  Safe.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      name: DataTypes.STRING,
      type: DataTypes.STRING,
      isDefault: DataTypes.BOOLEAN,
      ownerId: DataTypes.INTEGER
    },
    {
      sequelize,
      modelName: 'Safe',
      tableName: 'safes',
      timestamps: true
    }
  )

  return Safe
}
