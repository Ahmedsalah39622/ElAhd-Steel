/**
 * Database Backup System for Ahd Steel
 * Provides automated and manual backup/restore functionality
 * Uses Sequelize to export/import data as JSON (no external tools required)
 *
 * @package Ahd Steel
 * @author ITTSOFT
 * @version 2.0.0
 */

import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import zlib from 'zlib'

const gzip = promisify(zlib.gzip)
const gunzip = promisify(zlib.gunzip)

// Backup configuration
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups')
const MAX_BACKUPS = parseInt(process.env.MAX_BACKUPS || '10', 10)
const BACKUP_RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10)

/**
 * Ensure backup directory exists
 */
const ensureBackupDir = () => {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true })
  }
}

/**
 * Generate backup filename with timestamp
 * @returns {string} Backup filename
 */
const generateBackupFilename = (prefix = 'backup', ext = 'json') => {
  const now = new Date()
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19)

  return `${prefix}_${timestamp}.${ext}`
}

/**
 * Parse DATABASE_URL to get connection details
 * Supports both MySQL and PostgreSQL URL formats
 * @returns {object} Connection details
 */
const parseDbUrl = () => {
  const dbUrl = process.env.DATABASE_URL

  if (!dbUrl) {
    throw new Error('DATABASE_URL is not configured')
  }

  // Try to parse URL using URL class for better handling of special characters
  try {
    const url = new URL(dbUrl)

    const protocol = url.protocol.replace(':', '')
    const isPostgres = protocol === 'postgres' || protocol === 'postgresql'
    const isMysql = protocol === 'mysql'

    if (!isPostgres && !isMysql) {
      throw new Error(`Unsupported database: ${protocol}`)
    }

    // Extract database name (remove leading /)
    const database = url.pathname.slice(1).split('?')[0]

    return {
      type: isPostgres ? 'postgres' : 'mysql',
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      host: url.hostname,
      port: url.port || (isPostgres ? '5432' : '3306'),
      database: database,
      connectionString: dbUrl,
      ssl: url.searchParams.get('sslmode') === 'require'
    }
  } catch (urlError) {
    // Fallback regex for older URL formats
    const regex = /(postgres(?:ql)?|mysql):\/\/([^:]+):([^@]+)@([^:\/]+)(?::(\d+))?\/([^?\s]+)/
    const match = dbUrl.match(regex)

    if (!match) {
      throw new Error(
        'Invalid DATABASE_URL format. Expected: postgres://user:password@host:port/database or mysql://user:password@host:port/database'
      )
    }

    const protocol = match[1]
    const isPostgres = protocol.startsWith('postgres')

    return {
      type: isPostgres ? 'postgres' : 'mysql',
      user: match[2],
      password: match[3],
      host: match[4],
      port: match[5] || (isPostgres ? '5432' : '3306'),
      database: match[6],
      connectionString: dbUrl
    }
  }
}

/**
 * Create a database backup using Sequelize (JSON export)
 * No external tools required - works on any system
 * @param {object} options - Backup options
 * @returns {Promise<object>} Backup result
 */
export const createBackup = async (options = {}) => {
  const { compress = true, tables = [] } = options

  ensureBackupDir()

  const filename = generateBackupFilename('Ahd Steel', compress ? 'json.gz' : 'json')
  const filepath = path.join(BACKUP_DIR, filename)

  try {
    // Dynamically import models to avoid circular dependencies
    const db = await import('../../models')
    const sequelize = db.default.sequelize || db.sequelize

    // Get all model names
    const modelNames = Object.keys(db.default || db).filter(
      name => name !== 'sequelize' && name !== 'Sequelize' && name !== 'default'
    )

    // Filter tables if specified
    const targetModels = tables.length > 0 ? modelNames.filter(name => tables.includes(name)) : modelNames

    // Export data from each model
    const backupData = {
      metadata: {
        version: '2.0.0',
        createdAt: new Date().toISOString(),
        database: process.env.DATABASE_URL?.split('/').pop()?.split('?')[0] || 'unknown',
        tables: targetModels,
        totalRecords: 0
      },
      data: {}
    }

    for (const modelName of targetModels) {
      const model = db.default?.[modelName] || db[modelName]

      if (model && typeof model.findAll === 'function') {
        try {
          const records = await model.findAll({ raw: true })

          backupData.data[modelName] = records
          backupData.metadata.totalRecords += records.length
          console.log(`[Backup] Exported ${records.length} records from ${modelName}`)
        } catch (err) {
          console.warn(`[Backup] Could not export ${modelName}:`, err.message)
          backupData.data[modelName] = []
        }
      }
    }

    // Write to file
    const jsonData = JSON.stringify(backupData, null, 2)

    if (compress) {
      const compressed = await gzip(Buffer.from(jsonData))

      fs.writeFileSync(filepath, compressed)
    } else {
      fs.writeFileSync(filepath, jsonData)
    }

    const stats = fs.statSync(filepath)

    // Clean old backups
    await cleanOldBackups()

    return {
      success: true,
      filename: path.basename(filepath),
      filepath: filepath,
      size: stats.size,
      sizeFormatted: formatBytes(stats.size),
      timestamp: new Date().toISOString(),
      tablesExported: targetModels.length,
      recordsExported: backupData.metadata.totalRecords
    }
  } catch (error) {
    // Clean up failed backup file
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath)
    }

    console.error('[Backup] Error:', error)

    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Restore database from backup file (JSON format)
 * @param {string} backupFile - Backup filename
 * @returns {Promise<object>} Restore result
 */
export const restoreBackup = async backupFile => {
  const filepath = path.join(BACKUP_DIR, backupFile)

  if (!fs.existsSync(filepath)) {
    return {
      success: false,
      error: 'Backup file not found'
    }
  }

  try {
    // Read backup file
    let jsonData
    const fileContent = fs.readFileSync(filepath)

    if (backupFile.endsWith('.gz')) {
      const decompressed = await gunzip(fileContent)

      jsonData = JSON.parse(decompressed.toString())
    } else {
      jsonData = JSON.parse(fileContent.toString())
    }

    // Validate backup format
    if (!jsonData.metadata || !jsonData.data) {
      return {
        success: false,
        error: 'Invalid backup file format'
      }
    }

    // Import models
    const db = await import('../../models')
    const sequelize = db.default.sequelize || db.sequelize

    let restoredRecords = 0
    const errors = []

    // Restore data for each table
    // Note: This overwrites existing data - use with caution!
    for (const [modelName, records] of Object.entries(jsonData.data)) {
      const model = db.default?.[modelName] || db[modelName]

      if (model && typeof model.bulkCreate === 'function' && records.length > 0) {
        try {
          // Clear existing data (optional - be careful!)
          // await model.destroy({ where: {}, truncate: true, cascade: true })

          // Use upsert to update existing or insert new
          for (const record of records) {
            try {
              await model.upsert(record)
              restoredRecords++
            } catch (upsertErr) {
              // Try insert if upsert fails
              try {
                await model.create(record, { ignoreDuplicates: true })
                restoredRecords++
              } catch (createErr) {
                // Record already exists, skip
              }
            }
          }

          console.log(`[Restore] Restored ${records.length} records to ${modelName}`)
        } catch (err) {
          console.warn(`[Restore] Error restoring ${modelName}:`, err.message)
          errors.push({ table: modelName, error: err.message })
        }
      }
    }

    return {
      success: true,
      message: `تم استعادة ${restoredRecords} سجل بنجاح`,
      restoredFrom: backupFile,
      restoredRecords,
      timestamp: new Date().toISOString(),
      errors: errors.length > 0 ? errors : undefined
    }
  } catch (error) {
    console.error('[Restore] Error:', error)

    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * List all available backups
 * @returns {Array} List of backup files
 */
export const listBackups = () => {
  ensureBackupDir()

  const files = fs.readdirSync(BACKUP_DIR)

  const backups = files
    .filter(f => f.endsWith('.json') || f.endsWith('.json.gz') || f.endsWith('.sql') || f.endsWith('.sql.gz'))
    .map(filename => {
      const filepath = path.join(BACKUP_DIR, filename)
      const stats = fs.statSync(filepath)

      return {
        filename,
        size: stats.size,
        sizeFormatted: formatBytes(stats.size),
        created: stats.birthtime,
        createdFormatted: stats.birthtime.toLocaleString('ar-EG'),
        isCompressed: filename.endsWith('.gz'),
        format: filename.includes('.json') ? 'JSON' : 'SQL'
      }
    })
    .sort((a, b) => b.created - a.created)

  return backups
}

/**
 * Delete a specific backup
 * @param {string} filename - Backup filename to delete
 * @returns {object} Delete result
 */
export const deleteBackup = filename => {
  const filepath = path.join(BACKUP_DIR, filename)

  if (!fs.existsSync(filepath)) {
    return { success: false, error: 'Backup file not found' }
  }

  try {
    fs.unlinkSync(filepath)

    return { success: true, message: 'Backup deleted successfully' }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * Clean old backups based on retention policy
 */
const cleanOldBackups = async () => {
  const backups = listBackups()
  const now = new Date()
  const retentionMs = BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000

  // Remove backups older than retention period
  for (const backup of backups) {
    const age = now - new Date(backup.created)

    if (age > retentionMs) {
      deleteBackup(backup.filename)
    }
  }

  // Also remove if we have more than MAX_BACKUPS
  const remainingBackups = listBackups()

  if (remainingBackups.length > MAX_BACKUPS) {
    const toDelete = remainingBackups.slice(MAX_BACKUPS)

    for (const backup of toDelete) {
      deleteBackup(backup.filename)
    }
  }
}

/**
 * Export specific tables to JSON
 * @param {Array} tables - Table names to export
 * @returns {Promise<object>} Export data
 */
export const exportToJSON = async tables => {
  try {
    const { initializeDatabase } = await import('./db')
    const db = await initializeDatabase()
    const exportData = {}

    for (const tableName of tables) {
      const model = db.sequelize.models[tableName]

      if (model) {
        const records = await model.findAll({ raw: true })

        exportData[tableName] = records
      }
    }

    // Save to file
    const filename = `export_${Date.now()}.json`
    const filepath = path.join(BACKUP_DIR, filename)

    fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2))

    return {
      success: true,
      filename,
      filepath,
      tables: Object.keys(exportData),
      recordCounts: Object.fromEntries(Object.entries(exportData).map(([k, v]) => [k, v.length]))
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * Import data from JSON backup
 * @param {string} filename - JSON backup filename
 * @returns {Promise<object>} Import result
 */
export const importFromJSON = async filename => {
  const filepath = path.join(BACKUP_DIR, filename)

  if (!fs.existsSync(filepath)) {
    return { success: false, error: 'Import file not found' }
  }

  try {
    const { initializeDatabase } = await import('./db')
    const db = await initializeDatabase()
    const importData = JSON.parse(fs.readFileSync(filepath, 'utf-8'))
    const results = {}

    for (const [tableName, records] of Object.entries(importData)) {
      const model = db.sequelize.models[tableName]

      if (model && Array.isArray(records)) {
        try {
          await model.bulkCreate(records, {
            updateOnDuplicate: Object.keys(records[0] || {})
          })
          results[tableName] = { success: true, count: records.length }
        } catch (err) {
          results[tableName] = { success: false, error: err.message }
        }
      }
    }

    return { success: true, results }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * Download backup file
 * @param {string} filename - Backup filename
 * @returns {object} File stream or error
 */
export const downloadBackup = filename => {
  const filepath = path.join(BACKUP_DIR, filename)

  if (!fs.existsSync(filepath)) {
    return { success: false, error: 'File not found' }
  }

  return {
    success: true,
    stream: fs.createReadStream(filepath),
    filename,
    size: fs.statSync(filepath).size
  }
}

/**
 * Get backup statistics
 * @returns {object} Backup stats
 */
export const getBackupStats = () => {
  const backups = listBackups()
  const totalSize = backups.reduce((sum, b) => sum + b.size, 0)

  return {
    totalBackups: backups.length,
    totalSize,
    totalSizeFormatted: formatBytes(totalSize),
    oldestBackup: backups.length > 0 ? backups[backups.length - 1] : null,
    newestBackup: backups.length > 0 ? backups[0] : null,
    backupDir: BACKUP_DIR,
    maxBackups: MAX_BACKUPS,
    retentionDays: BACKUP_RETENTION_DAYS
  }
}

/**
 * Schedule automatic backups
 * @param {string} schedule - Cron-like schedule (e.g., 'daily', 'hourly', 'weekly')
 */
export const scheduleBackup = schedule => {
  const intervals = {
    hourly: 60 * 60 * 1000,
    daily: 24 * 60 * 60 * 1000,
    weekly: 7 * 24 * 60 * 60 * 1000
  }

  const interval = intervals[schedule] || intervals.daily

  console.log(`[Backup] Scheduled ${schedule} backups (every ${interval / 1000 / 60} minutes)`)

  // Run first backup
  createBackup({ compress: true }).then(result => {
    if (result.success) {
      console.log(`[Backup] Initial backup created: ${result.filename}`)
    } else {
      console.error(`[Backup] Initial backup failed: ${result.error}`)
    }
  })

  // Schedule recurring backups
  setInterval(async () => {
    console.log('[Backup] Running scheduled backup...')
    const result = await createBackup({ compress: true })

    if (result.success) {
      console.log(`[Backup] Backup created: ${result.filename} (${result.sizeFormatted})`)
    } else {
      console.error(`[Backup] Backup failed: ${result.error}`)
    }
  }, interval)
}

/**
 * Format bytes to human readable string
 * @param {number} bytes - Bytes to format
 * @returns {string} Formatted string
 */
const formatBytes = bytes => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const backupModule = {
  createBackup,
  restoreBackup,
  listBackups,
  deleteBackup,
  exportToJSON,
  importFromJSON,
  downloadBackup,
  getBackupStats,
  scheduleBackup
}

export default backupModule
