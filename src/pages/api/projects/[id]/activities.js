import { initializeDatabase } from '@/utils/db'
import { withAuth } from '@/utils/auth'

async function handler(req, res) {
  const { id } = req.query // project id

  try {
    const { ProjectActivity, sequelize } = await initializeDatabase()

    if (req.method === 'GET') {
      const rawCols = await sequelize.getQueryInterface().describeTable('project_activities')
      const availableCols = Object.keys(rawCols)

      if (!availableCols.includes('projectId')) {
        return res.status(200).json({ success: true, data: [], message: 'Database missing projectId column' })
      }

      const activities = await ProjectActivity.findAll({
        where: { projectId: id },
        order: [['createdAt', 'DESC']]
      })

      return res.status(200).json({ success: true, data: activities })
    }

    if (req.method === 'POST') {
      const { activityType, title, description, metadata } = req.body

      if (!title) {
        return res.status(400).json({ success: false, message: 'Activity title is required' })
      }

      const rawCols = await sequelize.getQueryInterface().describeTable('project_activities')
      const availableCols = Object.keys(rawCols)

      const saveBody = {
        projectId: id,
        activityType: activityType || 'note',
        title,
        description,
        metadata: metadata ? JSON.stringify(metadata) : null,
        createdBy: req.user?.username || 'System'
      }

      if (!availableCols.includes('projectId')) {
        delete saveBody.projectId
      }

      const activity = await ProjectActivity.create(saveBody)

      return res.status(201).json({ success: true, data: activity })
    }

    res.status(405).json({ message: 'Method not allowed' })
  } catch (error) {
    console.error('Project Activities API error:', error)
    res.status(500).json({ success: false, message: 'Server error', error: error.message })
  }
}

export default withAuth(handler)
