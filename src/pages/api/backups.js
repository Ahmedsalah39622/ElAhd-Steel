/**
 * Backup Management API
 * Provides endpoints for database backup operations
 *
 * @package Ahd Steel
 * @author ITTSOFT
 */

import { withAuth } from '@/utils/auth'
import { isAdmin } from '@/middleware/authMiddleware'
import {
  createBackup,
  restoreBackup,
  listBackups,
  deleteBackup,
  getBackupStats,
  downloadBackup,
  exportToJSON
} from '@/utils/backup'

async function handler(req, res) {
  // Only allow admin users
  if (!req.user) {
    return res.status(401).json({ error: 'غير مسجل الدخول' })
  }

  const adminCheck = await isAdmin(req.user.id)

  if (!adminCheck) {
    return res.status(403).json({ error: 'غير مصرح لك بهذه العملية' })
  }

  const { action } = req.query

  // GET: List backups or get stats
  if (req.method === 'GET') {
    if (action === 'stats') {
      const stats = getBackupStats()

      return res.status(200).json(stats)
    }

    if (action === 'download') {
      const { filename } = req.query
      const result = downloadBackup(filename)

      if (!result.success) {
        return res.status(404).json({ error: result.error })
      }

      res.setHeader('Content-Type', 'application/octet-stream')
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`)
      res.setHeader('Content-Length', result.size)

      return result.stream.pipe(res)
    }

    // Default: list backups
    const backups = listBackups()

    return res.status(200).json({ backups })
  }

  // POST: Create backup
  if (req.method === 'POST') {
    const { compress = true, tables = [] } = req.body || {}

    try {
      const result = await createBackup({ compress, tables })

      if (result.success) {
        return res.status(201).json(result)
      }

      return res.status(500).json({ error: result.error })
    } catch (error) {
      console.error('Backup creation error:', error)

      return res.status(500).json({ error: 'فشل في إنشاء النسخة الاحتياطية' })
    }
  }

  // PUT: Restore backup
  if (req.method === 'PUT') {
    const { filename } = req.body

    if (!filename) {
      return res.status(400).json({ error: 'اسم الملف مطلوب' })
    }

    try {
      const result = await restoreBackup(filename)

      if (result.success) {
        return res.status(200).json(result)
      }

      return res.status(500).json({ error: result.error })
    } catch (error) {
      console.error('Backup restore error:', error)

      return res.status(500).json({ error: 'فشل في استعادة النسخة الاحتياطية' })
    }
  }

  // DELETE: Delete backup
  if (req.method === 'DELETE') {
    const { filename } = req.query

    if (!filename) {
      return res.status(400).json({ error: 'اسم الملف مطلوب' })
    }

    const result = deleteBackup(filename)

    if (result.success) {
      return res.status(200).json(result)
    }

    return res.status(404).json({ error: result.error })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default withAuth(handler)
