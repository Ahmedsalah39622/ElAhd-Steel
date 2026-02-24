// src/models/user.js
'use strict'
const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // define association here (roles, etc.)
      User.hasMany(models.UserRole, { foreignKey: 'userId', as: 'userRoles' })
      User.hasMany(models.AuditLog, { foreignKey: 'userId', as: 'auditLogs' })
    }
  }
  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      name: DataTypes.STRING,
      email: {
        type: DataTypes.STRING,
        unique: true
      },
      password: DataTypes.STRING,
      emailVerified: DataTypes.DATE,
      visibleMenuItems: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null
      },
      allowedDashboardCards: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: true
    }
  )
  return User
}
