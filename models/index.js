'use strict'

// Load environment variables from .env for standalone scripts and CLI tools
try {
  require('dotenv').config()
} catch (e) {
  // dotenv is optional at runtime; if it's not present, Node may still have env vars set.
}

const path = require('path')

const env = process.env.NODE_ENV || 'development'
const configFile = require('../config/config.js')

const dbConfig = configFile[env] || {}
const SequelizeLib = require('sequelize')

// Use global cache to prevent exhausting connections in dev/HMR
let _db = global.sequelizeDb || null
let _connectionPromise = global.sequelizeConnectionPromise || null

async function initDb(forceRefresh = false) {
  // Return cached instance immediately unless forced
  if (_db && !forceRefresh) return _db

  // If already connecting, wait for that promise, unless forced to refresh
  if (_connectionPromise && !forceRefresh) return _connectionPromise

  _connectionPromise = (async () => {
    const Sequelize = SequelizeLib
    const db = {}

    let sequelize

    // Ensure the dialect driver is loaded so bundlers (Turbopack) include it
    try {
      if (dbConfig.dialect === 'mssql') {
        require('tedious')
      } else if (dbConfig.dialect === 'postgres' || dbConfig.dialect === 'postgresql' || dbConfig.dialect === 'pg') {
        require('pg')
        require('pg-hstore')
      } else if (dbConfig.dialect === 'mysql') {
        require('mysql2')
      }
    } catch (driverErr) {
      // Provide a clearer error message during runtime init
      throw new Error(
        `Please install the DB driver for dialect "${dbConfig.dialect}" (e.g. 'mysql2' for mysql): ${driverErr.message}`
      )
    }

    // Ensure Sequelize uses the pre-required driver module directly to avoid runtime require issues
    const sequelizeOptions = {
      ...dbConfig,

      // Connection pool settings for better performance
      pool: {
        max: 2, // Maximum connections - Reduced to avoid max_user_connections error
        min: 0, // Minimum connections kept alive
        acquire: 30000, // Max time to acquire connection
        idle: 10000 // Time before idle connection is released
      },
      logging: false, // Disable SQL logging for performance
      benchmark: false // Disable query timing
    }

    try {
      if (dbConfig.dialect === 'mssql') {
        sequelizeOptions.dialectModule = require('tedious')
      } else if (dbConfig.dialect === 'postgres' || dbConfig.dialect === 'postgresql' || dbConfig.dialect === 'pg') {
        sequelizeOptions.dialectModule = require('pg')

        // pg-hstore is used for serializing hstore fields, not as a dialect module
      } else if (dbConfig.dialect === 'mysql') {
        sequelizeOptions.dialectModule = require('mysql2')
      }
    } catch (driverErr) {
      // If we can't require the driver, provide clear diagnostics
      throw new Error(`Unable to require DB driver for dialect "${dbConfig.dialect}": ${driverErr.message}`)
    }

    if (dbConfig.use_env_variable) {
      const envVal = process.env[dbConfig.use_env_variable]

      if (!envVal) {
        throw new Error(
          `Missing environment variable ${dbConfig.use_env_variable}. Set it to your DB URL (e.g. mysql://user:pass@host:port/db) or update config/config.json for the '${env}' environment.`
        )
      }

      sequelize = new Sequelize(envVal, sequelizeOptions)
    } else {
      sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, sequelizeOptions)
    }

    // Explicitly require model definition files to avoid dynamic requires
    // (Turbopack/Next.js does not support dynamic server-relative imports during build)
    const modelDefiners = [
      require('./attendance.js'),
      require('./auditlog.js'),
      require('./dailysalary.js'),
      require('./inventorytransaction.js'),
      require('./invoice.js'),
      require('./material.js'),
      require('./materialpiece.js'),
      require('./passwordreset.js'),
      require('./pricelist.js'),
      require('./purchaseorder.js'),
      require('./project.js'),
      require('./projectactivity.js'),
      require('./projectmaterial.js'),
      require('./projectphase.js'),
      require('./projectpayment.js'),
      require('./projectmanufacturing.js'),
      require('./joborder.js'),
      require('./role.js'),
      require('./safe.js'),
      require('./safeentry.js'),
      require('./wallet.js'),
      require('./wallettransaction.js'),
      require('./supplier.js'),
      require('./client.js'),
      require('./clientattachment.js'),
      require('./user.js'),
      require('./userrole.js'),
      require('./worker.js'),
      require('./materialunit.js'),
      require('./materialcategory.js'),
      require('./materialgrade.js')
    ]

    modelDefiners.forEach(definer => {
      const model = definer(sequelize, Sequelize.DataTypes)

      db[model.name] = model
    })

    Object.keys(db).forEach(modelName => {
      if (db[modelName].associate) {
        db[modelName].associate(db)
      }
    })

    db.sequelize = sequelize
    db.Sequelize = Sequelize

    _db = db

    // Cache in global for HMR
    if (process.env.NODE_ENV !== 'production') {
      global.sequelizeDb = _db
    }

    return _db
  })()

  // Cache promise too
  if (process.env.NODE_ENV !== 'production') {
    global.sequelizeConnectionPromise = _connectionPromise
  }

  return _connectionPromise
}

module.exports = { getDb: initDb }
