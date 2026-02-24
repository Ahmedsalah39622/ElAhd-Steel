import { initializeDatabase } from '@/utils/db'
import { withAuth } from '@/utils/auth'

async function handler(req, res) {
  const { id } = req.query

  try {
    const { Supplier, PurchaseOrder } = await initializeDatabase()

    if (req.method === 'GET') {
      const supplier = await Supplier.findByPk(id)

      if (!supplier) {
        return res.status(404).json({ success: false, message: 'Supplier not found' })
      }

      return res.status(200).json({ success: true, data: supplier })
    }

    if (req.method === 'PUT') {
      const supplier = await Supplier.findByPk(id)

      if (!supplier) {
        return res.status(404).json({ success: false, message: 'Supplier not found' })
      }

      const { name, email, phone, address, city, country, bankName, accountNumber, iban } = req.body

      await supplier.update({
        name,
        email,
        phone,
        address,
        city,
        country,
        bankName,
        accountNumber,
        iban
      })

      return res.status(200).json({ success: true, data: supplier, message: 'Supplier updated successfully' })
    }

    if (req.method === 'DELETE') {
      const { force } = req.query
      const supplier = await Supplier.findByPk(id)

      if (!supplier) {
        return res.status(404).json({ success: false, message: 'Supplier not found' })
      }

      // Check for related records
      const relatedRecords = []

      // Try to check purchase orders, but handle if table doesn't exist
      try {
        if (PurchaseOrder) {
          const purchaseOrderCount = await PurchaseOrder.count({ where: { supplierId: id } })

          if (purchaseOrderCount > 0) relatedRecords.push(`${purchaseOrderCount} أمر شراء`)
        }
      } catch (err) {
        // Table might not exist, ignore and continue
        console.log('PurchaseOrder table check skipped:', err.message)
      }

      // If force delete, delete related purchase orders instead of blocking
      if (force === 'true' && relatedRecords.length > 0) {
        try {
          if (PurchaseOrder) await PurchaseOrder.destroy({ where: { supplierId: id } })
        } catch (err) {
          console.log('PurchaseOrder delete skipped:', err.message)
        }
      } else if (relatedRecords.length > 0) {
        // If there are related records, return error
        return res.status(400).json({
          success: false,
          message: `لا يمكن حذف المورد لوجود سجلات مرتبطة: ${relatedRecords.join('، ')}. يرجى حذف السجلات المرتبطة أولاً.`
        })
      }

      await supplier.destroy()

      return res.status(200).json({ success: true, message: 'تم حذف المورد بنجاح' })
    }

    res.status(405).json({ message: 'Method not allowed' })
  } catch (error) {
    console.error('Supplier API error:', error)
    res.status(500).json({ success: false, message: 'Server error', error: error.message })
  }
}

export default withAuth(handler)
