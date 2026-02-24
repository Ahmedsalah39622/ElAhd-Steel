import { Op } from 'sequelize'

import { initializeDatabase } from '@/utils/db'
import { withAuth } from '@/utils/auth'

async function handler(req, res) {
  const { Material, InventoryTransaction, Client, MaterialPiece, sequelize } = await initializeDatabase()

  console.log('== pages/api/client-inventory-balance Request ==', req.method, req.query)

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { clientId } = req.query

    if (!clientId) {
      return res.status(400).json({ error: 'clientId is required' })
    }
    
    // 0. Fetch items from Draft Invoices to show pending billable items
    const { Invoice } = await initializeDatabase()
    const draftInvoice = await Invoice.findOne({
      where: { clientId, status: 'draft' },
      order: [['createdAt', 'DESC']]
    })

    const draftItems = []
    if (draftInvoice && draftInvoice.items) {
      try {
        const rawItems = JSON.parse(draftInvoice.items)
        if (Array.isArray(rawItems)) {
           rawItems.forEach(it => {
             // Map to the format expected by frontend
             draftItems.push({
               id: `inv-item-${Date.now()}-${Math.random()}`, // temp id
               materialId: it.materialId || null,
               name: it.description || it.desc || 'Item',
               sku: it.sku || '',
               desc: it.description || it.desc || '',
               qty: Number(it.qty || 1),
               price: Number(it.price || 0),
               clientBalance: -Number(it.qty || 1), // treat as negative balance (owed)
               isPiece: !!it.isPiece,
               length: it.length,
               width: it.width,
                transactionId: it.transactionId || null,
                fromDraftInvoice: true 
              })
           })
        }
      } catch (e) {}
    }

    // Get all materials
    const materials = await Material.findAll({ order: [['name', 'ASC']] })

    if (!materials || materials.length === 0) {
      return res.status(200).json([])
    }

    // For each material, calculate the balance from this client
    const clientBalances = []

    // Find ALL transactions where this client is the reference, regardless of source
    // We only care about negative changes (withdrawals/cuts) that haven't been invoiced/paid yet.
    // Note: Ideally we should track which transactions are "billed", but for now we sum up the "owed" quantity.
    // A more robust system would link transactions to invoice items.
    
    for (const material of materials) {
        // Find withdrawals for this client
        const transactions = await InventoryTransaction.findAll({
            where: {
                materialId: material.id,
                reference: String(clientId)
                // change: { [Op.lt]: 0 } // Move filter to JS to avoid Op issues if any
            },
            order: [['createdAt', 'DESC']]
        })
        
        // Filter for negative changes in JS
        const negTransactions = transactions.filter(t => Number(t.change) < 0)

        // Filter out transactions that might be redundant if we rely on the draft invoice items
        // But the user asked for "ALL permissions", so we calculate the net total they owe.
        // If we strictly sum everything, we might double count what is already in the draft invoice 
        // if the draft invoice comes from these transactions.
        // However, since `draftItems` are purely what's in the json, and `clientBalances` are calculated from raw stock moves,
        // we should try to avoid overlap.
        
        // Strategy:
        // 1. Calculate total withdrawn quantity from transactions.
        // 2. Subtract quantity already present in `draftItems` for this material to avoid double billing.
        
        const totalWithdrawn = negTransactions.reduce((sum, tx) => sum + Math.abs(Number(tx.change || 0)), 0)
        
        if (totalWithdrawn > 0) {
             // Check how much is already in the draft invoice for this material
             const inDraft = draftItems
                .filter(di => String(di.materialId) === String(material.id))
                .reduce((s, di) => s + Number(di.qty || 0), 0)
             
             const remainingToBill = Math.max(0, totalWithdrawn - inDraft)
             
             if (remainingToBill > 0) {
                const plainMaterial = material && typeof material.toJSON === 'function' ? material.toJSON() : material
                clientBalances.push({
                    ...plainMaterial,
                    qty: remainingToBill,
                    price: 0,
                    clientBalance: -remainingToBill,
                    desc: plainMaterial.name
                })
             }
        }
    }

    // Additionally include pieces that are reserved for this client via a permit
    try {
      const reservedPieces = await MaterialPiece.findAll({
        where: { status: 'reserved' },
        order: [['createdAt', 'DESC']]
      })

      for (const piece of reservedPieces) {
        // find a permit transaction that references this client and this piece
        const permitTx = await InventoryTransaction.findOne({
          where: { materialPieceId: piece.id, action: 'permit', reference: String(clientId) }
        })

        if (!permitTx) continue

        // get material for display
        const mat = materials.find(m => String(m.id) === String(piece.materialId))
        const plainMat = mat && typeof mat.toJSON === 'function' ? mat.toJSON() : mat

        clientBalances.push({
          id: piece.id,
          materialId: piece.materialId,
          name: plainMat ? plainMat.name : `Material ${piece.materialId}`,
          sku: plainMat ? plainMat.sku : '',
          desc: plainMat ? plainMat.name : '',
          qty: Math.abs(Number(piece.quantity || 1)),
          price: 0,
          clientBalance: -Math.abs(Number(piece.quantity || 1)),
          isPiece: true,
          length: piece.length,
          width: piece.width
        })
      }
    } catch (e) {
      console.error('failed to include reserved pieces for client balance:', e)
    }

    // Prepend draft items to the list so they appear first and with price
    const finalExposedItems = [...draftItems, ...clientBalances]

    return res.status(200).json(finalExposedItems)
  } catch (err) {
    console.error('client-inventory-balance error:', err)

    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
}

export default withAuth(handler)
