import { initializeDatabase } from '@/utils/db'
import { withAuth } from '@/utils/auth'

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { id } = req.query

  if (!id) {
    return res.status(400).json({ success: false, message: 'Supplier ID is required' })
  }

  try {
    const { sequelize, Supplier, PurchaseOrder, SafeEntry } = await initializeDatabase()

    // Get supplier info
    const supplier = await Supplier.findByPk(id)
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' })
    }

    // Calculate total purchase orders (what we owe supplier)
    const totalPurchases = await PurchaseOrder.sum('totalAmount', {
      where: { supplierId: id }
    }) || 0

    // Calculate total paid from purchase orders
    const totalPaidFromOrders = await PurchaseOrder.sum('paidAmount', {
      where: { supplierId: id }
    }) || 0

    // Calculate total payments from SafeEntry (outgoing to supplier)
    const totalPayments = await SafeEntry.sum('outgoing', {
      where: { supplierId: id }
    }) || 0

    // Balance = Total purchases - (Paid on orders + Direct payments)
    // If positive, we owe supplier money.
    const balance = Number(totalPurchases) - Number(totalPaidFromOrders) - Number(totalPayments)

    res.status(200).json({
      success: true,
      data: {
        supplierId: id,
        supplierName: supplier.name,
        totalPurchases: Number(totalPurchases),
        totalPaid: Number(totalPaidFromOrders) + Number(totalPayments),
        balance: balance, // Positive = we owe money
        hasDebt: balance > 0
      }
    })
  } catch (error) {
    console.error('Error calculating supplier balance:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to calculate balance',
      error: error.message
    })
  }
}

export default withAuth(handler)
