import { initializeDatabase } from '@/utils/db'
import { withAuth } from '@/utils/auth'

async function handler(req, res) {
  const { id } = req.query // project id

  try {
    const { ProjectManufacturing, ProjectActivity, Worker, sequelize } = await initializeDatabase()

    if (req.method === 'GET') {
      const rawCols = await sequelize.getQueryInterface().describeTable('project_manufacturing')
      const availableCols = Object.keys(rawCols)

      if (!availableCols.includes('projectId')) {
        return res.status(200).json({ success: true, data: [], message: 'Database missing projectId column' })
      }

      const processes = await ProjectManufacturing.findAll({
        where: { projectId: id },
        order: [['createdAt', 'DESC']]
      })

      return res.status(200).json({ success: true, data: processes })
    }

    if (req.method === 'POST') {
      const {
        processName,
        processType,
        description,
        status,
        workerId,
        workerName,
        machineUsed,
        startTime,
        endTime,
        quantity,
        unit,
        notes
      } = req.body

      if (!processName) {
        return res.status(400).json({ success: false, message: 'Process name is required' })
      }

      // Calculate duration in minutes if start and end times provided
      let duration = null

      if (startTime && endTime) {
        const start = new Date(startTime)
        const end = new Date(endTime)

        duration = Math.round((end - start) / (1000 * 60)) // minutes
      }

      const rawCols = await sequelize.getQueryInterface().describeTable('project_manufacturing')
      const availableCols = Object.keys(rawCols)

      const saveBody = {
        projectId: id,
        processName,
        processType,
        description,
        status: status || 'pending',
        workerId: workerId || null,
        workerName,
        machineUsed,
        startTime: startTime || null,
        endTime: endTime || null,
        duration,
        quantity,
        unit,
        notes
      }

      if (!availableCols.includes('projectId')) {
        delete saveBody.projectId
      }

      const process = await ProjectManufacturing.create(saveBody)

      // Log activity
      await ProjectActivity.create({
        projectId: id,
        activityType: 'manufacturing_logged',
        title: 'عملية تصنيع',
        description: `تم تسجيل عملية "${processName}"${workerName ? ` - العامل: ${workerName}` : ''}`,
        createdBy: req.user?.username || 'System'
      })

      return res.status(201).json({ success: true, data: process })
    }

    res.status(405).json({ message: 'Method not allowed' })
  } catch (error) {
    console.error('Project Manufacturing API error:', error)
    res.status(500).json({ success: false, message: 'Server error', error: error.message })
  }
}

export default withAuth(handler)
