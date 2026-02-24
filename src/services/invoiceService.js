import { initializeDatabase } from '@/utils/db'

// itemData can be a string (description) or an object with metadata
export async function addItemToClientInvoice(clientId, itemData, qty, price, user) {
  const db = await initializeDatabase()
  const { Invoice, InvoiceItem, sequelize } = db

  if (!clientId) return null

  // Ensure numeric values
  const quantity = Number(qty) || 1
  const unitPrice = Number(price) || 0
  const totalItem = quantity * unitPrice

  // Allow adding items with price 0 - user can edit price later in the invoice
  // if (totalItem <= 0 && unitPrice <= 0) return null  // REMOVED to allow zero-price items

  // Prepare item object
  let newItem = {
    qty: quantity,
    price: unitPrice,
    total: totalItem
  }

  if (typeof itemData === 'object') {
    newItem = { ...newItem, ...itemData }
    if (!newItem.description && newItem.desc) newItem.description = newItem.desc
  } else {
    newItem.description = String(itemData)
  }

  // Find the latest DRAFT invoice for this client (DO NOT create automatically)
  let invoice = await Invoice.findOne({
    where: {
      clientId,
      status: 'draft' // or 'pending' depending on your schema, assuming 'draft' is used for open invoices
    },
    order: [['createdAt', 'DESC']]
  })

  // If no draft invoice exists, return null - user must create invoice manually
  if (!invoice) {
    console.log('No draft invoice found for client', clientId, '- skipping auto-creation')
    return null
  }

  // Parse existing items
  let items = []
  try {
    items = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items || []
    if (!Array.isArray(items)) items = []
  } catch (e) {
    items = []
  }

  // Add new item
  items.push(newItem)

  // Recalculate invoice total
  const newTotal = items.reduce((sum, i) => sum + (Number(i.total) || 0), 0)

  // Update invoice
  await invoice.update({
    items: JSON.stringify(items),
    total: newTotal
  })

  return invoice
}
