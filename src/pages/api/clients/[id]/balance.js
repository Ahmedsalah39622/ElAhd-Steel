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

    // Calculate total invoices (what client owes)
    const totalInvoices = await Invoice.sum('total', {
      where: { clientId: id }
    }) || 0

    // Calculate total paid from invoices
    const totalPaidFromInvoices = await Invoice.sum('paidAmount', {
      where: { clientId: id }
    }) || 0

    // Calculate total payments from SafeEntry (incoming from client)
    const totalPayments = await SafeEntry.sum('incoming', {
      where: { clientId: id }
    }) || 0

    // Balance = Total invoices - (Paid on invoices + Direct payments)
    // If positive, client owes money. If negative, client has credit.
    const balance = Number(totalInvoices) - Number(totalPaidFromInvoices) - Number(totalPayments)

    res.status(200).json({
      success: true,
      data: {
        clientId: id,
        clientName: client.name,
        totalInvoices: Number(totalInvoices),
        totalPaid: Number(totalPaidFromInvoices) + Number(totalPayments),
        balance: balance, // Positive = owes money, Negative = has credit
        hasDebt: balance > 0
      }
    })
  } catch (error) {
    console.error('Error calculating client balance:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to calculate balance',
      error: error.message
    })
  }
}

export default withAuth(handler)
