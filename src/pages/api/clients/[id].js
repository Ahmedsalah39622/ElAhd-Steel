import { initializeDatabase } from '@/utils/db'
import { withAuth } from '@/utils/auth'

async function handler(req, res) {
  const { id } = req.query

  try {
    const { Client, Project, Invoice, PriceList, SafeEntry, ClientAttachment } = await initializeDatabase()

    if (req.method === 'GET') {
      const client = await Client.findByPk(id)

      if (!client) return res.status(404).json({ success: false, message: 'Client not found' })

      const obj = client.get ? client.get({ plain: true }) : client
      try {
        obj.material = obj.material ? JSON.parse(obj.material) : []
      } catch (e) {}

      return res.status(200).json({ success: true, data: obj })
    }

    if (req.method === 'PUT') {
      const payload = req.body
      const client = await Client.findByPk(id)

      if (!client) return res.status(404).json({ success: false, message: 'Client not found' })

      if (payload.material && Array.isArray(payload.material)) {
        payload.material = JSON.stringify(payload.material)
      }

      await client.update(payload)

      const out = client.get ? client.get({ plain: true }) : client
      try {
        out.material = out.material ? JSON.parse(out.material) : []
      } catch (e) {}

      return res.status(200).json({ success: true, data: out, message: 'Client updated' })
    }

    if (req.method === 'DELETE') {
      const { force } = req.query
      const client = await Client.findByPk(id)

      if (!client) return res.status(404).json({ success: false, message: 'Client not found' })

      // Check for related records
      const relatedRecords = []

      if (Project) {
        const projectCount = await Project.count({ where: { clientId: id } })
        if (projectCount > 0) relatedRecords.push(`${projectCount} مشروع`)
      }

      if (Invoice) {
        const invoiceCount = await Invoice.count({ where: { clientId: id } })
        if (invoiceCount > 0) relatedRecords.push(`${invoiceCount} فاتورة`)
      }

      if (PriceList) {
        const priceListCount = await PriceList.count({ where: { clientId: id } })
        if (priceListCount > 0) relatedRecords.push(`${priceListCount} قائمة أسعار`)
      }

      if (SafeEntry) {
        const safeEntryCount = await SafeEntry.count({ where: { clientId: id } })
        if (safeEntryCount > 0) relatedRecords.push(`${safeEntryCount} حركة خزنة`)
      }

      // Delete client attachments (these can be deleted with the client)
      if (ClientAttachment) {
        await ClientAttachment.destroy({ where: { clientId: id } })
      }

      // If force delete, unlink related records instead of blocking
      if (force === 'true' && relatedRecords.length > 0) {
        if (Project) await Project.update({ clientId: null }, { where: { clientId: id } })
        if (Invoice) await Invoice.update({ clientId: null }, { where: { clientId: id } })
        if (PriceList) await PriceList.update({ clientId: null }, { where: { clientId: id } })
        if (SafeEntry) await SafeEntry.update({ clientId: null }, { where: { clientId: id } })
      } else if (relatedRecords.length > 0) {
        // If there are related records that shouldn't be deleted, return error
        return res.status(400).json({
          success: false,
          message: `لا يمكن حذف العميل لوجود سجلات مرتبطة: ${relatedRecords.join('، ')}. يرجى حذف السجلات المرتبطة أولاً.`
        })
      }

      await client.destroy()

      return res.status(200).json({ success: true, message: 'تم حذف العميل بنجاح' })
    }

    res.status(405).json({ message: 'Method not allowed' })
  } catch (error) {
    console.error('Client API error:', error)
    res.status(500).json({ success: false, message: 'Server error', error: error.message })
  }
}

export default withAuth(handler)
