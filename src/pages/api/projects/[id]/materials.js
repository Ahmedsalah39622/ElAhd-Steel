import { initializeDatabase } from '@/utils/db'
import { withAuth } from '@/utils/auth'

async function handler(req, res) {
  const { id } = req.query // project id

  try {
    const { ProjectMaterial, ProjectActivity, Material, sequelize } = await initializeDatabase()

    if (req.method === 'GET') {
      const rawCols = await sequelize.getQueryInterface().describeTable('project_materials')
      const availableCols = Object.keys(rawCols)

      if (!availableCols.includes('projectId')) {
        return res.status(200).json({ success: true, data: [], message: 'Database missing projectId column' })
      }

      const materials = await ProjectMaterial.findAll({
        where: { projectId: id },
        order: [['addedAt', 'DESC']]
      })

      return res.status(200).json({ success: true, data: materials })
    }

    if (req.method === 'POST') {
      const { materialId, materialName, materialType, quantity, unit, unitCost, notes, status } = req.body

      if (!materialName) {
        return res.status(400).json({ success: false, message: 'Material name is required' })
      }

      const totalCost = quantity && unitCost ? parseFloat(quantity) * parseFloat(unitCost) : null

      const rawCols = await sequelize.getQueryInterface().describeTable('project_materials')
      const availableCols = Object.keys(rawCols)

      const saveBody = {
        projectId: id,
        materialId: materialId || null,
        materialName,
        materialType,
        quantity: quantity || 0,
        unit,
        unitCost,
        totalCost,
        status: status || 'pending',
        notes
      }

      if (!availableCols.includes('projectId')) {
        delete saveBody.projectId
      }

      const material = await ProjectMaterial.create(saveBody)

      // Log activity
      await ProjectActivity.create({
        projectId: id,
        activityType: 'material_added',
        title: 'إضافة مادة',
        description: `تم إضافة "${materialName}" - الكمية: ${quantity} ${unit || ''}`,
        createdBy: req.user?.username || 'System'
      })

      return res.status(201).json({ success: true, data: material })
    }

    res.status(405).json({ message: 'Method not allowed' })
  } catch (error) {
    console.error('Project Materials API error:', error)
    res.status(500).json({ success: false, message: 'Server error', error: error.message })
  }
}

export default withAuth(handler)
