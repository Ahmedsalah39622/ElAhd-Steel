import { initializeDatabase } from '@/utils/db'
import { withAuth } from '@/utils/auth'

async function handler(req, res) {
  const { id } = req.query

  if (!id) {
    return res.status(400).json({ success: false, message: 'Client ID is required' })
  }

  if (req.method === 'GET') {
    try {
      const { Client, SafeEntry, Invoice, InventoryTransaction, Material, ClientAttachment } =
        await initializeDatabase()

      // Get client info
      const client = await Client.findByPk(id)

      if (!client) {
        return res.status(404).json({ success: false, message: 'Client not found' })
      }

      // Get all safe entries for this client (by customer name match)
      const safeEntries = await SafeEntry.findAll({
        where: { customer: client.name },
        order: [['date', 'DESC']],
        limit: 50
      })

      // Get all invoices for this client
      const invoices = await Invoice.findAll({
        where: { clientId: id },
        order: [['date', 'DESC']],
        include: [{ model: Client, as: 'client', required: false }]
      })

      // Parse invoice items
      const parsedInvoices = invoices.map(inv => {
        const obj = inv.get ? inv.get({ plain: true }) : inv

        try {
          obj.items = obj.items ? JSON.parse(obj.items) : []
        } catch (e) {
          obj.items = []
        }

        try {
          obj.manufacturing = obj.manufacturing ? JSON.parse(obj.manufacturing) : []
        } catch (e) {
          obj.manufacturing = []
        }

        return obj
      })

      // Get inventory transactions that mention this client (in reference or note)
      const inventoryTransactions = await InventoryTransaction.findAll({
        where: {
          source: 'client'
        },
        order: [['createdAt', 'DESC']],
        include: [{ model: Material, required: false }],
        limit: 100
      })

      // Filter by client name in reference or note
      const clientInventory = inventoryTransactions.filter(tx => {
        const ref = (tx.reference || '').toLowerCase()
        const note = (tx.note || '').toLowerCase()
        const clientName = client.name.toLowerCase()

        return ref.includes(clientName) || note.includes(clientName)
      })

      // Get client attachments
      let attachments = []

      if (ClientAttachment) {
        try {
          attachments = await ClientAttachment.findAll({
            where: { clientId: id },
            order: [['createdAt', 'DESC']]
          })
        } catch (attErr) {
          console.error('Error fetching attachments:', attErr)
        }
      }

      // Calculate totals
      const totalIncoming = safeEntries.reduce((sum, e) => sum + parseFloat(e.incoming || 0), 0)
      const totalOutgoing = safeEntries.reduce((sum, e) => sum + parseFloat(e.outgoing || 0), 0)
      const totalInvoiced = parsedInvoices.reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0)
      const totalPaid = parsedInvoices.reduce((sum, inv) => sum + parseFloat(inv.paidAmount || 0), 0)

      return res.status(200).json({
        success: true,
        data: {
          client: client.get ? client.get({ plain: true }) : client,
          safeEntries: safeEntries.map(e => (e.get ? e.get({ plain: true }) : e)),
          invoices: parsedInvoices,
          inventoryTransactions: clientInventory.map(t => (t.get ? t.get({ plain: true }) : t)),
          attachments: attachments.map(a => (a.get ? a.get({ plain: true }) : a)),
          summary: {
            totalIncoming,
            totalOutgoing,
            netSafe: totalIncoming - totalOutgoing,
            totalInvoiced,
            totalPaid,
            totalDue: totalInvoiced - totalPaid,
            invoiceCount: parsedInvoices.length,
            transactionCount: clientInventory.length,
            attachmentCount: attachments.length
          }
        }
      })
    } catch (error) {
      console.error('Error fetching client history:', error)

      return res.status(500).json({ success: false, message: error.message })
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' })
}

export default withAuth(handler)
