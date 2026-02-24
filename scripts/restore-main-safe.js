#!/usr/bin/env node
/*
  Idempotent script to recreate the seeded "Main Safe" row if it was deleted.
  Run from project root: `node scripts/restore-main-safe.js`
  This uses the project's `models` initializer and respects the configured DB.
*/
'use strict'

const path = require('path')
const fs = require('fs')

// Ensure NODE_ENV matches how the app loads config
const env = process.env.NODE_ENV || 'development'
// Attempt to read project DB config to help construct a URL if the env var is missing
let dbConfig = null
try {
  const cfgPath = path.join(__dirname, '..', 'config', 'config.json')
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
  dbConfig = cfg[env] || null
} catch (e) {
  // ignore; we will still try to call getDb() and surface errors
}

// Allow overriding DB URL via CLI: --dbUrl="mysql://user:pass@host:port/db"
const argv = process.argv.slice(2)
const dbUrlArg = argv.find(a => a.startsWith('--dbUrl='))
if (dbUrlArg) {
  const v = dbUrlArg.split('=')[1]
  process.env.DATABASE_URL = v
  console.log('Using DB URL from --dbUrl argument')
} else if (process.env.DATABASE_URL) {
  // already set
} else if (dbConfig && dbConfig.use_env_variable && !process.env[dbConfig.use_env_variable]) {
  // Try to build a conservative fallback only if more details are present
  if (dbConfig.database || dbConfig.username || dbConfig.host || dbConfig.password) {
    const dialect = (dbConfig.dialect || 'mysql').toLowerCase()
    const user = encodeURIComponent(dbConfig.username || '')
    const pass = encodeURIComponent(dbConfig.password || '')
    const host = dbConfig.host || 'localhost'
    const port = dbConfig.port ? `:${dbConfig.port}` : ''
    const database = dbConfig.database || ''

    const url = `${dialect}://${user}:${pass}@${host}${port}/${database}`
    process.env[dbConfig.use_env_variable] = url
    console.warn(
      `Warning: set environment var ${dbConfig.use_env_variable} from config to allow DB connection (${env}).`
    )
  } else {
    console.warn(`Config references ${dbConfig.use_env_variable} but no DB details in config/config.json.`)
  }
}

const { getDb } = require('../models')

async function main() {
  try {
    console.log('DB config (development):', dbConfig)
    console.log('ENV DATABASE_URL:', !!process.env.DATABASE_URL ? '[REDACTED]' : 'undefined')

    const db = await getDb()
    // verify connection
    try {
      await db.sequelize.authenticate()
      console.log('DB connection: OK')
    } catch (authErr) {
      console.error('DB connection failed:', authErr.message || authErr)
      throw authErr
    }
    const { Safe, Sequelize } = db

    const Op = Sequelize.Op

    const existing = await Safe.findOne({
      where: {
        [Op.or]: [{ isDefault: true }, { name: 'Main Safe' }]
      }
    })

    if (existing) {
      console.log('Main Safe already exists:')
      console.log(existing.toJSON())
      return
    }

    const created = await Safe.create({
      name: 'Main Safe',
      type: 'main',
      isDefault: true
    })

    console.log('Recreated Main Safe:')
    console.log(created.toJSON())
  } catch (err) {
    console.error('Error recreating Main Safe:', err.message || err)
    process.exitCode = 1
  }
}

main()
