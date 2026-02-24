import { initializeDatabase } from '@/utils/db'
import { withAuth } from '@/utils/auth'

async function handler(req, res) {
  const { id } = req.query // project id

  try {
    const { ProjectPhase, ProjectActivity, Project, sequelize } = await initializeDatabase()

    if (req.method === 'GET') {
      const rawCols = await sequelize.getQueryInterface().describeTable('project_phases')
      const availableCols = Object.keys(rawCols)

      if (!availableCols.includes('projectId')) {
        return res.status(200).json({ success: true, data: [], message: 'Database missing projectId column' })
      }

      const phases = await ProjectPhase.findAll({
        where: { projectId: id },
        order: [['phaseOrder', 'ASC']]
      })

      return res.status(200).json({ success: true, data: phases })
    }

    if (req.method === 'POST') {
      const { phaseName, phaseOrder, description, status, startDate, endDate, notes } = req.body

      if (!phaseName) {
        return res.status(400).json({ success: false, message: 'Phase name is required' })
      }

      // Auto-calculate phase order if not provided
      let order = phaseOrder

      const rawCols = await sequelize.getQueryInterface().describeTable('project_phases')
      const availableCols = Object.keys(rawCols)

      if (!availableCols.includes('projectId')) {
        order = (phaseOrder || 0) + 1
      } else {
        const maxOrder = await ProjectPhase.max('phaseOrder', { where: { projectId: id } })
        order = (maxOrder || 0) + 1
      }

      const saveBody = {
        projectId: id,
        phaseName,
        phaseOrder: order,
        description,
        status: status || 'pending',
        startDate: startDate || null,
        endDate: endDate || null,
        notes
      }

      const rawColsSave = await sequelize.getQueryInterface().describeTable('project_phases')
      const availableColsSave = Object.keys(rawColsSave)

      if (!availableColsSave.includes('projectId')) {
        delete saveBody.projectId
      }

      const phase = await ProjectPhase.create(saveBody)

      // Log activity
      await ProjectActivity.create({
        projectId: id,
        activityType: 'phase_added',
        title: 'إضافة مرحلة',
        description: `تم إضافة المرحلة "${phaseName}"`,
        createdBy: req.user?.username || 'System'
      })

      // Update project progress based on completed phases
      await updateProjectProgress(id, Project, ProjectPhase)

      return res.status(201).json({ success: true, data: phase })
    }

    res.status(405).json({ message: 'Method not allowed' })
  } catch (error) {
    console.error('Project Phases API error:', error)
    res.status(500).json({ success: false, message: 'Server error', error: error.message })
  }
}

async function updateProjectProgress(projectId, Project, ProjectPhase) {
  const sequelize = ProjectPhase.sequelize
  const rawColsProgress = await sequelize.getQueryInterface().describeTable('project_phases')
  const availableColsProgress = Object.keys(rawColsProgress)

  if (!availableColsProgress.includes('projectId')) return

  const totalPhases = await ProjectPhase.count({ where: { projectId } })
  const completedPhases = await ProjectPhase.count({ where: { projectId, status: 'completed' } })

  if (totalPhases > 0) {
    const progress = Math.round((completedPhases / totalPhases) * 100)

    await Project.update({ progressPercent: progress }, { where: { id: projectId } })
  }
}

export default withAuth(handler)
