import { initializeDatabase } from '@/utils/db'
import { withAuth } from '@/utils/auth'

async function handler(req, res) {
  const { MaterialPiece, InventoryTransaction, sequelize } = await initializeDatabase()

  try {
    if (req.method === 'GET') {
      // Support listing pieces with optional filters. materialId is optional now.
      const { Op } = require('sequelize')
      const q = req.query.q && req.query.q.toString().trim()
      const materialId = req.query.materialId
      const minLength = req.query.minLength ? Number(req.query.minLength) : null
      const maxLength = req.query.maxLength ? Number(req.query.maxLength) : null
      const minWidth = req.query.minWidth ? Number(req.query.minWidth) : null
      const maxWidth = req.query.maxWidth ? Number(req.query.maxWidth) : null
      const isLeftover = req.query.isLeftover
      const status = req.query.status
      const parentPieceId = req.query.parentPieceId

      const where = {}

      if (parentPieceId) where.parentPieceId = parentPieceId

      if (materialId) where.materialId = materialId

      if (q) {
        // if numeric, match id or materialId; otherwise ignore
        const n = Number(q)

        if (!Number.isNaN(n)) {
          where[Op.or] = [{ id: n }, { materialId: n }]
        }
      }

      if (minLength != null || maxLength != null) {
        where.length = {}
        if (minLength != null) where.length[Op.gte] = minLength
        if (maxLength != null) where.length[Op.lte] = maxLength
      }

      if (minWidth != null || maxWidth != null) {
        where.width = {}
        if (minWidth != null) where.width[Op.gte] = minWidth
        if (maxWidth != null) where.width[Op.lte] = maxWidth
      }

      if (isLeftover === 'true') where.isLeftover = true
      if (isLeftover === 'false') where.isLeftover = false

      if (status) where.status = status
      
      // Only request columns that actually exist in DB
      const qi = sequelize.getQueryInterface()
      const tableDef = await qi.describeTable('material_pieces')
      const attrs = tableDef ? Object.keys(tableDef) : undefined

      const pieces = await MaterialPiece.findAll({ 
        where,
        attributes: attrs,
        order: [['createdAt', 'DESC']]
      })

      // Get client names for reserved pieces
      const { Client } = await initializeDatabase()
      const clientIds = [...new Set(pieces.filter(p => p.clientId).map(p => p.clientId))]
      let clientsMap = {}
      if (clientIds.length > 0 && Client) {
        const clients = await Client.findAll({ where: { id: clientIds } })
        clients.forEach(c => {
          clientsMap[c.id] = c.name
        })
      }

      return res.status(200).json(pieces.map(p => {
        const data = p && typeof p.toJSON === 'function' ? p.toJSON() : p
        // Add clientName for easy access in frontend
        if (data.clientId && clientsMap[data.clientId]) {
          data.clientName = clientsMap[data.clientId]
        }
        return data
      }))
    }

    if (req.method === 'POST') {
      const body = req.body || {}

      // Cut operation: delegate to withdrawDimensionedPiece
      if (body.type === 'cut') {
        const { withdrawDimensionedPiece } = require('../../../src/services/inventoryService')
        const materialId = body.materialId
        const qty = Number(body.qty || 1)
        const reqLength = Number(body.length)
        const reqWidth = Number(body.width)
        const client = body.client || null
        const user = body.user || null

        if (!materialId || !reqLength || !reqWidth)
          return res.status(400).json({ error: 'materialId, length and width required' })

        const allowNegative = !!body.allowNegative
        const results = []

        try {
          for (let i = 0; i < qty; i++) {
            const r = await withdrawDimensionedPiece({ materialId, reqLength, reqWidth, client, user, allowNegative })
            results.push(r)
          }
        } catch (err) {
          console.error('material-pieces cut error:', err)

          if (err.code === 'STOCK_EMPTY') {
            return res.status(400).json({ error: err.message, code: err.code, hint: 'المخزون نفد. قم بتعبئة المخزون أو اضبط allowNegative=true إذا رغبت في التجاوز' })
          }

          if (err.code === 'NEGATIVE_STOCK') {
            return res.status(400).json({ error: err.message, code: err.code, hint: 'Set allowNegative=true to override or replenish stock' })
          }

          if (err.code === 'NO_PIECE') return res.status(400).json({ error: err.message })

          return res.status(500).json({ error: err.message || String(err) })
        }

        return res.status(201).json({ results })
      }

      // Create a withdrawal permit for a specific piece (reserve it)
      if (body.type === 'permit') {
        const pieceId = body.pieceId || body.id

        // If client requested a dimensioned permit (length/width provided) and no pieceId,
        // perform server-side cutting (withdrawDimensionedPiece) and issue a permit token
        const reqLength = body.length ? Number(body.length) : null
        const reqWidth = body.width ? Number(body.width) : null
        const qty = Number(body.qty || 1)
        const userNote = body.note ? String(body.note).trim() : ''
        const client = body.client || ''

        if (!pieceId && reqLength && reqWidth) {
          const { withdrawDimensionedPiece } = require('../../../src/services/inventoryService')
          const token = `permit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
          const results = []

          for (let i = 0; i < qty; i++) {
            const r = await withdrawDimensionedPiece({
              materialId: body.materialId,
              reqLength,
              reqWidth,
              client,
              user: (req.user && (req.user.email || req.user.id)) || '',
              allowNegative: !!body.allowNegative
            })

            // create a permit transaction referencing the consumed piece
            const consumed = r && r.consumedPiece

            if (consumed && consumed.id) {
              await InventoryTransaction.create(
                {
                  materialId: consumed.materialId,
                  materialPieceId: consumed.id,
                  change: 0,
                  action: 'permit',
                  source: client ? 'client' : 'manual',
                  reference: token,
                  user: (req.user && (req.user.email || req.user.id)) || '',
                  note: userNote
                },
                { transaction: null }
              )
            }

            results.push(r)
          }

          return res.status(201).json({ ok: true, permit: token, results })
        }

        if (!pieceId) return res.status(400).json({ error: 'pieceId required' })
        const p = await sequelize.models.MaterialPiece.findByPk(pieceId)

        if (!p) return res.status(404).json({ error: 'piece not found' })
        if (p.status !== 'available') return res.status(400).json({ error: 'piece not available for permit' })

        // create a simple permit token and mark piece as reserved
        const token = `permit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

        await sequelize.transaction(async t => {
          await p.update({ status: 'reserved' }, { transaction: t })
          const source = client ? 'client' : 'manual'

          // if client provided, store client id in reference and include token in note
          const reference = client ? String(client) : token
          const noteParts = []

          if (!client) noteParts.push(`token:${token}`)
          if (client) noteParts.push(`token:${token}`)
          noteParts.push(`qty:${qty}`)
          if (userNote) noteParts.push(userNote)
          const note = noteParts.join(' • ')

          await InventoryTransaction.create(
            {
              materialId: p.materialId,
              materialPieceId: p.id,
              change: 0,
              action: 'permit',
              source,
              reference,
              user: (req.user && (req.user.email || req.user.id)) || '',
              note
            },
            { transaction: t }
          )
        })

        return res.status(201).json({ ok: true, permit: token })
      }

      // Create piece
      const { materialId, length, width, quantity = 1, isLeftover = false } = body

      if (!materialId || length == null || width == null)
        return res.status(400).json({ error: 'materialId,length,width required' })

      // Normal create: adjusts material stock
      const piece = await sequelize.transaction(async t => {
        const p = await sequelize.models.MaterialPiece.create(
          {
            materialId,
            length: Number(length),
            width: Number(width),
            quantity: Number(quantity),
            isLeftover: !!isLeftover,
            status: 'available'
          },
          { transaction: t }
        )

        await InventoryTransaction.create(
          {
            materialId,
            materialPieceId: p.id,
            change: Math.abs(Number(quantity)),
            action: 'add',
            source: 'manual',
            reference: '',
            user: ''
          },
          { transaction: t }
        )

        return p
      })

      return res.status(201).json(piece)

      return res.status(201).json(piece)

    // End of standard create piece logic, but staying inside POST block for other types

    // Create a leftover piece without touching material stock
    if (body.type === 'create-leftover') {
      const { materialId, length, width, quantity = 1, client = null, userNote = '', parentPieceId = null } = body

      if (!materialId || length == null || width == null)
        return res.status(400).json({ error: 'materialId,length,width required' })

      const pieces = await sequelize.transaction(async t => {
        const created = []
        for (let i = 0; i < Number(quantity || 1); i++) {
          const p = await sequelize.models.MaterialPiece.create(
            {
              materialId,
              length: Number(length),
              width: Number(width),
              quantity: 1,
              isLeftover: true,
              parentPieceId: parentPieceId || null,
              status: client ? 'reserved' : 'available'
            },
            { transaction: t }
          )

          await InventoryTransaction.create(
            {
              materialId,
              materialPieceId: p.id,
              change: 0,
              action: 'add_leftover',
              source: client ? 'client' : 'manual',
              reference: client ? String(client) : (parentPieceId ? `parent:${parentPieceId}` : ''),
              user: (req.user && (req.user.email || req.user.id)) || '',
              note: userNote
            },
            { transaction: t }
          )

          // If client provided, also attach a permit transaction
          if (client) {
            const token = `permit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
            await InventoryTransaction.create(
              {
                materialId,
                materialPieceId: p.id,
                change: 0,
                action: 'permit',
                source: 'client',
                reference: token,
                user: (req.user && (req.user.email || req.user.id)) || '',
                note: userNote
              },
              { transaction: t }
            )
          }

          created.push(p)
        }

        return created
      })

      return res.status(201).json({ created: pieces })
    }

    // Maintenance: fix existing records that look like leftovers but are not flagged
    if (body.type === 'fix-leftovers') {
      const result = await sequelize.transaction(async t => {
        const [updated] = await sequelize.models.MaterialPiece.update(
          { isLeftover: true, status: 'available' },
          {
            where: {
              parentPieceId: { [require('sequelize').Op.ne]: null },
              isLeftover: false,
              quantity: { [require('sequelize').Op.gt]: 0 }
            },
            transaction: t
          }
        )

        // also flip status to 'used' where quantity is zero
        const [usedUpdated] = await sequelize.models.MaterialPiece.update(
          { status: 'used' },
          {
            where: {
              parentPieceId: { [require('sequelize').Op.ne]: null },
              quantity: { [require('sequelize').Op.lte]: 0 }
            },
            transaction: t
          }
        )

        return { updated, usedUpdated }
      })

      return res.status(200).json({ ok: true, result })
    }
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('material-pieces API error:', err)
    res.status(500).json({ error: err.message || String(err) })
  }
}

export default withAuth(handler)
