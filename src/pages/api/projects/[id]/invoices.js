import { initializeDatabase } from '@/utils/db'
import { withAuth } from '@/utils/auth'

async function handler(req, res) {
  const { id } = req.query // project id

  try {
    const { Invoice, ProjectActivity, Client, sequelize } = await initializeDatabase()

    if (req.method === 'GET') {
      // Check if projectId column exists
      const rawCols = await sequelize.getQueryInterface().describeTable('invoices')
      if (!Object.keys(rawCols).includes('projectId')) {
        return res.status(200).json({ success: true, data: [], message: 'Database missing projectId column' })
      }

      const invoices = await Invoice.findAll({
        where: { projectId: id },
        include: [{ model: Client, as: 'client', required: false }],
        order: [['createdAt', 'DESC']]
      })

      return res.status(200).json({ success: true, data: invoices })
    }

    if (req.method === 'POST') {
      const { invoiceId } = req.body

      if (!invoiceId) {
        return res.status(400).json({ success: false, message: 'Invoice ID is required' })
      }

      // Link existing invoice to project
      const invoice = await Invoice.findByPk(invoiceId)

      if (!invoice) {
        return res.status(404).json({ success: false, message: 'Invoice not found' })
      }

      await invoice.update({ projectId: id })

      // Log activity
      await ProjectActivity.create({
        projectId: id,
        activityType: 'invoice_linked',
        title: 'ربط فاتورة',
        description: `تم ربط الفاتورة رقم ${invoice.number} بالمشروع`,
        createdBy: req.user?.username || 'System'
      })

      return res.status(200).json({ success: true, data: invoice, message: 'Invoice linked to project' })
    }

    if (req.method === 'DELETE') {
      const { invoiceId } = req.body

      if (!invoiceId) {
        return res.status(400).json({ success: false, message: 'Invoice ID is required' })
      }

      // Unlink invoice from project
      const invoice = await Invoice.findByPk(invoiceId)

      if (!invoice) {
        return res.status(404).json({ success: false, message: 'Invoice not found' })
      }

      await invoice.update({ projectId: null })

      // Log activity
      await ProjectActivity.create({
        projectId: id,
        activityType: 'invoice_unlinked',
        title: 'إلغاء ربط فاتورة',
        description: `تم إلغاء ربط الفاتورة رقم ${invoice.number} من المشروع`,
        createdBy: req.user?.username || 'System'
      })

      return res.status(200).json({ success: true, message: 'Invoice unlinked from project' })
    }

    res.status(405).json({ message: 'Method not allowed' })
  } catch (error) {
    console.error('Project Invoices API error:', error)
    res.status(500).json({ success: false, message: 'Server error', error: error.message })
  }
}

export default withAuth(handler)
