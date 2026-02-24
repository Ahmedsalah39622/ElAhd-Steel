import { initializeDatabase } from '@/utils/db'
import { withAuth } from '@/utils/auth'

async function handler(req, res) {
  if (req.method === 'GET') {
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

      const checkTableCols = async (table) => {
        try {
          const raw = await qi.describeTable(table)
          return Object.keys(raw)
        } catch (e) {
          return []
        }
      }

      const invCols = await checkTableCols('invoices')
      const actCols = await checkTableCols('project_activities')
      const matCols = await checkTableCols('project_materials')
      const phaCols = await checkTableCols('project_phases')
      const payCols = await checkTableCols('project_payments')
      const mfgCols = await checkTableCols('project_manufacturing')

      const { clientId } = req.query

      // Build where clause
      const whereClause = {}

      if (clientId) {
        whereClause.clientId = clientId
      }

      const projects = await Project.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        include: [{ model: Client, as: 'client', required: false }]
      })

      // Parse attachments field and add summary counts
      const parsed = await Promise.all(
        projects.map(async p => {
          const obj = p.get ? p.get({ plain: true }) : p

          try {
            obj.attachments = obj.attachments ? JSON.parse(obj.attachments) : []
          } catch (e) {
            obj.attachments = []
          }

          // Get counts for related items safely
          obj.invoiceCount = invCols.includes('projectId') ? await Invoice.count({ where: { projectId: obj.id } }) : 0
          obj.activityCount = actCols.includes('projectId') ? await ProjectActivity.count({ where: { projectId: obj.id } }) : 0
          obj.materialCount = matCols.includes('projectId') ? await ProjectMaterial.count({ where: { projectId: obj.id } }) : 0
          obj.phaseCount = phaCols.includes('projectId') ? await ProjectPhase.count({ where: { projectId: obj.id } }) : 0
          obj.paymentCount = payCols.includes('projectId') ? await ProjectPayment.count({ where: { projectId: obj.id } }) : 0
          obj.manufacturingCount = mfgCols.includes('projectId') ? await ProjectManufacturing.count({ where: { projectId: obj.id } }) : 0

          return obj
        })
      )

      res.status(200).json({ success: true, data: parsed, message: 'Projects retrieved successfully' })
    } catch (error) {
      console.error('Error fetching projects:', error)
      res.status(500).json({ success: false, message: 'Failed to fetch projects', error: error.message })
    }
  } else if (req.method === 'POST') {
    try {
      const { Project, ProjectActivity } = await initializeDatabase()

      const {
        name,
        projectNumber,
        clientId,
        clientName,
        description,
        location,
        startDate,
        endDate,
        expectedDeliveryDate,
        status,
        priority,
        totalCost,
        totalRevenue,
        notes,
        attachments
      } = req.body

      if (!name) {
        return res.status(400).json({ success: false, message: 'Project name is required' })
      }

      // Generate project number if not provided
      const generatedNumber = projectNumber || `PRJ-${Date.now().toString().slice(-8)}`

      const attachmentsToSave = Array.isArray(attachments) ? JSON.stringify(attachments) : attachments

      const project = await Project.create({
        name,
        projectNumber: generatedNumber,
        clientId: clientId || null,
        clientName,
        description,
        location,
        startDate: startDate || null,
        endDate: endDate || null,
        expectedDeliveryDate: expectedDeliveryDate || null,
        status: status || 'pending',
        priority: priority || 'normal',
        progressPercent: 0,
        totalCost: totalCost || null,
        totalRevenue: totalRevenue || null,
        notes,
        attachments: attachmentsToSave
      })

      // Log activity
      const phaTable = await sequelize.getQueryInterface().describeTable('project_activities').catch(() => ({}))
      if (Object.keys(phaTable).includes('projectId')) {
        await ProjectActivity.create({
          projectId: project.id,
          activityType: 'project_created',
          title: 'تم إنشاء المشروع',
          description: `تم إنشاء المشروع "${name}"`,
          createdBy: req.user?.username || 'System'
        })
      }

      // Return parsed attachments
      const out = project.get ? project.get({ plain: true }) : project

      try {
        out.attachments = out.attachments ? JSON.parse(out.attachments) : []
      } catch (e) {
        out.attachments = []
      }

      res.status(201).json({ success: true, data: out, message: 'Project created successfully' })
    } catch (error) {
      console.error('Error creating project:', error)
      res.status(500).json({ success: false, message: 'Failed to create project', error: error.message })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}

export default withAuth(handler)
