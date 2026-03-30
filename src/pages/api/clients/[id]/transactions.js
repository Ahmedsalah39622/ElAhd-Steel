import { initializeDatabase } from '@/utils/db'
import { withAuth } from '@/utils/auth'

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { id } = req.query

  if (!id) {
    return res.status(400).json({ success: false, message: 'Client ID is required' })
  }

  try {
    const { sequelize, Client, Invoice, SafeEntry } = await initializeDatabase()

    // Get client info
    const client = await Client.findByPk(id)
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' })
    }

    // Get all invoices for this client
    const invoices = await Invoice.findAll({
      where: { clientId: id },
      order: [['createdAt', 'DESC']],
      raw: true
    })

    // Get all payments (SafeEntry with this clientId)
    const payments = await SafeEntry.findAll({
      where: { clientId: id },
      order: [['date', 'DESC']],
      raw: true
    })

    // Calculate totals
    const totalInvoices = invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0)
    const totalPaidOnInvoices = invoices.reduce((sum, inv) => sum + Number(inv.paidAmount || 0), 0)
    const totalPayments = payments
      .filter(p => p.entryType === 'client-payment')
      .reduce((sum, p) => sum + Number(p.incoming || 0), 0)
    const balance = totalInvoices - totalPaidOnInvoices - totalPayments

    // Format transactions timeline
    const transactions = [
      ...invoices.map(inv => ({
        id: `inv-${inv.id}`,
        type: 'invoice',
        typeLabel: 'فاتورة',
        date: inv.date || inv.createdAt,
        description: `فاتورة رقم ${inv.number || inv.id}`,
        amount: Number(inv.total || 0),
        paidAmount: Number(inv.paidAmount || 0),
        status: inv.status,
        reference: inv.number
      })),
      ...payments.map(p => ({
        id: `pay-${p.id}`,
        type: 'payment',
        typeLabel: 'دفعة',
        date: p.date || p.createdAt,
        description: p.description || 'دفعة نقدية',
        amount: Number(p.incoming || 0),
        method: p.incomingMethod,
        reference: p.incomingTxn
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date))

    res.status(200).json({
      success: true,
      data: {
        client: {
          id: client.id,
          name: client.name,
          phone: client.phone
        },
        summary: {
          totalInvoices,
          totalPaid: totalPaidOnInvoices + totalPayments,
          balance,
          hasDebt: balance > 0
        },
        transactions,
        invoices,
        payments
      }
    })
  } catch (error) {
    console.error('Error fetching client transactions:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    })
  }
}

export default withAuth(handler)
