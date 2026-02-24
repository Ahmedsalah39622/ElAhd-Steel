import fs from 'fs'

import path from 'path'

import formidable from 'formidable'

import { initializeDatabase } from '@/utils/db'
import { withAuth } from '@/utils/auth'

export const config = {
  api: {
    bodyParser: false
  }
}

async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Ensure upload directory exists
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'attachments')

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }

      const form = formidable({
        uploadDir: uploadDir,
        keepExtensions: true,
        maxFileSize: 10 * 1024 * 1024 // 10MB
      })

      const [fields, files] = await new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err)
          else resolve([fields, files])
        })
      })

      const file = files.file?.[0] || files.file

      if (!file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' })
      }

      const clientId = Array.isArray(fields.clientId) ? fields.clientId[0] : fields.clientId
      const title = Array.isArray(fields.title) ? fields.title[0] : fields.title
      const description = Array.isArray(fields.description) ? fields.description[0] : fields.description
      const category = Array.isArray(fields.category) ? fields.category[0] : fields.category

      if (!clientId) {
        return res.status(400).json({ success: false, message: 'Client ID is required' })
      }

      const { ClientAttachment } = await initializeDatabase()

      // Generate unique filename
      const ext = path.extname(file.originalFilename || file.newFilename)
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`
      const newPath = path.join(uploadDir, uniqueName)

      // Rename file to unique name
      fs.renameSync(file.filepath, newPath)

      const attachment = await ClientAttachment.create({
        clientId: parseInt(clientId),
        title: title || file.originalFilename,
        description: description || null,
        category: category || 'general',
        fileName: file.originalFilename || uniqueName,
        filePath: `/uploads/attachments/${uniqueName}`,
        fileSize: file.size,
        mimeType: file.mimetype
      })

      return res.status(201).json({ success: true, data: attachment })
    } catch (error) {
      console.error('Error uploading attachment:', error)

      return res.status(500).json({ success: false, message: error.message })
    }
  }

  if (req.method === 'GET') {
    try {
      const { clientId } = req.query
      const { ClientAttachment } = await initializeDatabase()

      const where = {}

      if (clientId) {
        where.clientId = clientId
      }

      const attachments = await ClientAttachment.findAll({
        where,
        order: [['createdAt', 'DESC']]
      })

      return res.status(200).json({ success: true, data: attachments })
    } catch (error) {
      console.error('Error fetching attachments:', error)

      return res.status(500).json({ success: false, message: error.message })
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.query
      const { ClientAttachment } = await initializeDatabase()

      const attachment = await ClientAttachment.findByPk(id)

      if (!attachment) {
        return res.status(404).json({ success: false, message: 'Attachment not found' })
      }

      // Delete file from disk
      const filePath = path.join(process.cwd(), 'public', attachment.filePath)

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }

      await attachment.destroy()

      return res.status(200).json({ success: true, message: 'Attachment deleted' })
    } catch (error) {
      console.error('Error deleting attachment:', error)

      return res.status(500).json({ success: false, message: error.message })
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' })
}

export default withAuth(handler)
