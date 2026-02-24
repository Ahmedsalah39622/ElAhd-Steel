import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

import { withAuth } from '@/utils/auth'

export const config = {
  api: {
    bodyParser: false
  }
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const chunks = []

    for await (const chunk of req) {
      chunks.push(chunk)
    }

    const buffer = Buffer.concat(chunks)

    // Parse multipart form data manually
    const boundary = req.headers['content-type'].split('boundary=')[1]
    const parts = parseMultipart(buffer, boundary)

    if (!parts || parts.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' })
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'projects')

    // Create upload directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    const uploadedFiles = []

    for (const part of parts) {
      if (part.filename) {
        // Generate unique filename
        const timestamp = Date.now()
        const randomStr = Math.random().toString(36).substring(2, 8)
        const ext = path.extname(part.filename)
        const safeName = part.filename.replace(/[^a-zA-Z0-9.-]/g, '_')
        const uniqueName = `${timestamp}_${randomStr}_${safeName}`
        const filePath = path.join(uploadDir, uniqueName)

        await writeFile(filePath, part.data)

        uploadedFiles.push({
          originalName: part.filename,
          fileName: uniqueName,
          path: `/uploads/projects/${uniqueName}`,
          size: part.data.length,
          type: part.contentType || 'application/octet-stream',
          uploadedAt: new Date().toISOString()
        })
      }
    }

    res.status(200).json({
      success: true,
      files: uploadedFiles,
      message: `${uploadedFiles.length} file(s) uploaded successfully`
    })
  } catch (error) {
    console.error('File upload error:', error)
    res.status(500).json({ success: false, message: 'Failed to upload files', error: error.message })
  }
}

function parseMultipart(buffer, boundary) {
  const parts = []
  const boundaryBuffer = Buffer.from(`--${boundary}`)
  const endBoundary = Buffer.from(`--${boundary}--`)

  let start = buffer.indexOf(boundaryBuffer)

  if (start === -1) return parts

  while (true) {
    const nextBoundary = buffer.indexOf(boundaryBuffer, start + boundaryBuffer.length)

    if (nextBoundary === -1) break

    const partBuffer = buffer.slice(start + boundaryBuffer.length, nextBoundary)
    const part = parsePart(partBuffer)

    if (part) parts.push(part)

    start = nextBoundary
    if (buffer.indexOf(endBoundary, start) === start) break
  }

  return parts
}

function parsePart(buffer) {
  // Find the end of headers (double CRLF)
  const headerEnd = buffer.indexOf('\r\n\r\n')

  if (headerEnd === -1) return null

  const headerStr = buffer.slice(0, headerEnd).toString('utf8')
  const data = buffer.slice(headerEnd + 4, buffer.length - 2) // -2 to remove trailing CRLF

  const headers = {}

  headerStr.split('\r\n').forEach(line => {
    const colonIndex = line.indexOf(':')

    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim().toLowerCase()
      const value = line.slice(colonIndex + 1).trim()

      headers[key] = value
    }
  })

  const contentDisposition = headers['content-disposition'] || ''
  const filenameMatch = contentDisposition.match(/filename="([^"]+)"/)
  const nameMatch = contentDisposition.match(/name="([^"]+)"/)

  return {
    name: nameMatch ? nameMatch[1] : null,
    filename: filenameMatch ? filenameMatch[1] : null,
    contentType: headers['content-type'] || null,
    data
  }
}

export default withAuth(handler)
