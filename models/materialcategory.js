'use strict'
const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class MaterialCategory extends Model {
    static associate(models) {
      // associations if needed
    }
  }
  
  MaterialCategory.init(
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
      modelName: 'MaterialCategory',
      tableName: 'MaterialCategories',
      timestamps: true
    }
  )
  
  return MaterialCategory
}
