'use strict'
const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class MaterialUnit extends Model {
    static associate(models) {
      // associations if needed
    }
  }
  
  MaterialUnit.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      value: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      label: {
        type: DataTypes.STRING,
        allowNull: false
      },
      isCustom: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    },
    {
      sequelize,
      modelName: 'MaterialUnit',
      tableName: 'MaterialUnits',
      timestamps: true
    }
  )
  
  return MaterialUnit
}
