import { initializeDatabase } from '@/utils/db'
import { withAuth } from '@/utils/auth'

async function handler(req, res) {
  const { id } = req.query

  try {
    const {
      Project,
      Client,
      Invoice,
      ProjectActivity,
      ProjectMaterial,
      ProjectPhase,
      ProjectPayment,
      ProjectManufacturing
    } = await initializeDatabase()
    const sequelize = Project.sequelize
    const qi = sequelize.getQueryInterface()

    // Map table names to models
    const tableMap = {
      invoices: 'Invoice',
      project_activities: 'ProjectActivity',
      project_materials: 'ProjectMaterial',
      project_phases: 'ProjectPhase',
      project_payments: 'ProjectPayment',
      project_manufacturing: 'ProjectManufacturing'
    }

    const tableCols = {}
    for (const [table, modelName] of Object.entries(tableMap)) {
      try {
        const raw = await qi.describeTable(table)
        tableCols[modelName] = Object.keys(raw)
      } catch (e) {
        tableCols[modelName] = []
      }
    }

    if (req.method === 'GET') {
        const includes = [{ model: Client, as: 'client', required: false }]

        if (tableCols.Invoice.includes('projectId')) {
          includes.push({
            model: Invoice,
            as: 'invoices',
            required: false,
            include: [{ model: Client, as: 'client', required: false }]
          })
        }
        if (tableCols.ProjectActivity.includes('projectId')) {
          includes.push({ model: ProjectActivity, as: 'activities', required: false, order: [['createdAt', 'DESC']], limit: 50 })
        }
        if (tableCols.ProjectMaterial.includes('projectId')) {
          includes.push({ model: ProjectMaterial, as: 'materials', required: false })
        }
        if (tableCols.ProjectPhase.includes('projectId')) {
          includes.push({ model: ProjectPhase, as: 'phases', required: false, order: [['phaseOrder', 'ASC']] })
        }
        if (tableCols.ProjectPayment.includes('projectId')) {
          includes.push({ model: ProjectPayment, as: 'payments', required: false, order: [['paidAt', 'DESC']] })
        }
        if (tableCols.ProjectManufacturing.includes('projectId')) {
          includes.push({ model: ProjectManufacturing, as: 'manufacturing', required: false, order: [['createdAt', 'DESC']] })
        }

        const project = await Project.findByPk(id, { include: includes })

      if (!project) return res.status(404).json({ success: false, message: 'Project not found' })

      const obj = project.get ? project.get({ plain: true }) : project

      try {
        obj.attachments = obj.attachments ? JSON.parse(obj.attachments) : []
      } catch (e) {
        obj.attachments = []
      }

      // Calculate totals
      obj.totalPaid = obj.payments?.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0
      obj.totalInvoiced = obj.invoices?.reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0) || 0
      obj.totalMaterialsCost = obj.materials?.reduce((sum, m) => sum + parseFloat(m.totalCost || 0), 0) || 0

      return res.status(200).json({ success: true, data: obj })
    }

    if (req.method === 'PUT') {
      const payload = req.body
      const project = await Project.findByPk(id)

      if (!project) return res.status(404).json({ success: false, message: 'Project not found' })

      const oldStatus = project.status
      const oldProgress = project.progressPercent

      if (payload.attachments && Array.isArray(payload.attachments)) {
        payload.attachments = JSON.stringify(payload.attachments)
      }

      await project.update(payload)

      // Log activity for status change
      if (payload.status && payload.status !== oldStatus && tableCols.ProjectActivity.includes('projectId')) {
        await ProjectActivity.create({
          projectId: id,
          activityType: 'status_changed',
          title: 'تغيير حالة المشروع',
          description: `تم تغيير الحالة من "${oldStatus}" إلى "${payload.status}"`,
          createdBy: req.user?.username || 'System'
        })
      }

      // Log activity for progress change
      if (payload.progressPercent !== undefined && payload.progressPercent !== oldProgress && tableCols.ProjectActivity.includes('projectId')) {
        await ProjectActivity.create({
          projectId: id,
          activityType: 'progress_updated',
          title: 'تحديث نسبة الإنجاز',
          description: `تم تحديث نسبة الإنجاز من ${oldProgress}% إلى ${payload.progressPercent}%`,
          createdBy: req.user?.username || 'System'
        })
      }

      const out = project.get ? project.get({ plain: true }) : project

      try {
        out.attachments = out.attachments ? JSON.parse(out.attachments) : []
      } catch (e) {
        out.attachments = []
      }

      return res.status(200).json({ success: true, data: out, message: 'Project updated' })
    }

    if (req.method === 'DELETE') {
      const project = await Project.findByPk(id)

      if (!project) return res.status(404).json({ success: false, message: 'Project not found' })

      // Delete related records safely
      if (tableCols.ProjectActivity.includes('projectId')) await ProjectActivity.destroy({ where: { projectId: id } })
      if (tableCols.ProjectMaterial.includes('projectId')) await ProjectMaterial.destroy({ where: { projectId: id } })
      if (tableCols.ProjectPhase.includes('projectId')) await ProjectPhase.destroy({ where: { projectId: id } })
      if (tableCols.ProjectPayment.includes('projectId')) await ProjectPayment.destroy({ where: { projectId: id } })
      if (tableCols.ProjectManufacturing.includes('projectId')) await ProjectManufacturing.destroy({ where: { projectId: id } })

      // Unlink invoices safely
      if (tableCols.Invoice.includes('projectId')) {
        await Invoice.update({ projectId: null }, { where: { projectId: id } })
      }

      await project.destroy()

      return res.status(200).json({ success: true, message: 'Project deleted' })
    }

    res.status(405).json({ message: 'Method not allowed' })
  } catch (error) {
    console.error('Project API error:', error)
    res.status(500).json({ success: false, message: 'Server error', error: error.message })
  }
}

export default withAuth(handler)
