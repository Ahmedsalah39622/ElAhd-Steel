import { initializeDatabase } from '@/utils/db'
import { withAuth } from '@/utils/auth'

async function handler(req, res) {
  const { Material, InventoryTransaction, JobOrder, sequelize } = await initializeDatabase()

  console.log('== pages/api/inventory Request ==', req.method)

  if (req.method === 'GET') {
    const reportMaterialId = req.query?.reportMaterialId
    const action = req.query?.action
    const type = req.query?.type

    try {
      // 1. If action is provided, handle specific queries
      if (action === 'operating_history') {
        const { Op } = require('sequelize')
        const txs = await InventoryTransaction.findAll({
          where: {
            [Op.or]: [
              { source: 'delivery' },
              { action: 'transfer', source: 'operating_stock' },
              { action: 'withdraw_by_count', source: { [Op.in]: ['delivery', 'manufacturing'] } }
            ]
          },
          include: [{ model: Material, attributes: ['name', 'unit', 'sku', 'type'] }],
          order: [['createdAt', 'DESC']],
          limit: 100
        })
        return res.status(200).json(txs)
      }

      if (action === 'deliveries') {
        // Fetch deliveries (transactions where note contains "Deliusery"?)
        // Actually deliver_product uses withdrawByCount which creates a transaction with action='remove' and source='ui'? No wait.
        // `withdrawByCount` uses action='remove'.
        // To track deliveries specifically, the `deliver_product` logic should probably use a distinct source or reference.
        // Let's modify the `deliver_product` handler below first to use source='delivery'.
        // For now, let's fetch 'remove' actions with source 'delivery' or note containing 'Delivery'
        const txs = await InventoryTransaction.findAll({
          where: {
            [require('sequelize').Op.or]: [
              { source: 'delivery' },
              { note: { [require('sequelize').Op.like]: '%Delivery%' } }
            ]
          },
          include: [{ model: Material, attributes: ['name', 'unit', 'sku'] }],
          order: [['createdAt', 'DESC']],
          limit: 10
        })
        return res.status(200).json(txs)
      }

      if (action) {
        const whereClause = { action }
        // For issue_order, filter out completed ones
        if (action === 'issue_order') {
          // whereClause.status = { [require('sequelize').Op.ne]: 'completed' }
        }

        const includes = [
          {
            model: Material,
            attributes: [
              'name',
              'unit',
              'sku',
              'count',
              'weight',
              'type',
              'originalLength',
              'originalWidth',
              'thickness',
              'dimensionType'
            ]
          }
        ]

        // Add MaterialPiece to show which remnant was used
        const MaterialPiece = sequelize.models.MaterialPiece
        if (MaterialPiece) {
          includes.push({ model: MaterialPiece, required: false })
        }

        if (JobOrder) {
          includes.push({ model: JobOrder, as: 'jobOrder' })
        }

        const txs = await InventoryTransaction.findAll({
          where: whereClause,
          include: includes,
          order: [['createdAt', 'DESC']]
        })
        return res.status(200).json(txs)
      }

      // 2. If reportMaterialId provided, return transactions for that material
      if (reportMaterialId) {
        const txs = await InventoryTransaction.findAll({
          where: { materialId: reportMaterialId },
          order: [['createdAt', 'DESC']]
        })
        try {
          const plainTxs = txs.map(t => (t && typeof t.toJSON === 'function' ? t.toJSON() : t))
          return res.status(200).json(plainTxs)
        } catch (serErr) {
          console.error('Serialization error for txs:', serErr)
          return res.status(500).json({ error: serErr.message })
        }
      }

      // 3. Otherwise, return materials list (filtered by type if provided)
      // Order by creation time so newest materials (last inserted) appear first
      // Include any material pieces (leftovers / sheets) so frontend can show dimensions
      const MaterialPiece = sequelize.models.MaterialPiece

      const whereMaterial = {}
      if (type) whereMaterial.type = type

      // For operating_stock/product types, only show items with stock > 0
      // This ensures transferred items (stock=0) don't appear in the list
      if (type === 'product' || type === 'operating_stock') {
        whereMaterial.stock = { [require('sequelize').Op.gt]: 0 }
      }

      // Only request columns that actually exist in DB for MaterialPiece
      const qi = sequelize.getQueryInterface()
      const pieceTableDef = MaterialPiece ? await qi.describeTable('material_pieces') : null
      const pieceAttrs = pieceTableDef ? Object.keys(pieceTableDef) : undefined

      const materials = await Material.findAll({
        where: whereMaterial,
        order: [['createdAt', 'DESC']],
        include: MaterialPiece ? [{ model: MaterialPiece, as: 'pieces', attributes: pieceAttrs }] : []
      })
      console.log(
        'pages/api/inventory: fetched materials count=',
        Array.isArray(materials) ? materials.length : 'not-array'
      )
      try {
        if (Array.isArray(materials) && materials.length > 0) {
          try {
            const sample = materials[0]
            console.log('pages/api/inventory: sample material toJSON exists=', typeof sample.toJSON)
            // Attempt to stringify to catch serialization issues
            console.log(
              'pages/api/inventory: sample material json test=',
              JSON.stringify(sample && (typeof sample.toJSON === 'function' ? sample.toJSON() : sample))
            )
          } catch (sErr) {
            console.error('pages/api/inventory: sample stringify error', sErr)
          }
        }
        const plain = materials.map(m => {
          const obj = m && typeof m.toJSON === 'function' ? m.toJSON() : m
          // Normalize pieces array to a consistent name
          // Use originalLength/originalWidth if set (these are permanent and never change)
          // This is the REFERENCE for cutting operations
          if (obj.originalLength && obj.originalWidth) {
            obj.length = obj.originalLength
            obj.width = obj.originalWidth
          } else if (obj.pieces && Array.isArray(obj.pieces) && obj.pieces.length > 0) {
            // Fallback to first piece with parentPieceId = null for legacy data
            const basePiece = obj.pieces.find(p => p.parentPieceId == null) || obj.pieces[0]
            obj.length = basePiece.length || null
            obj.width = basePiece.width || null
          } else {
            obj.length = null
            obj.width = null
          }
          return obj
        })
        return res.status(200).json(plain)
      } catch (serErr) {
        console.error('Serialization error for materials:', serErr)
        return res.status(500).json({ error: serErr.message })
      }
    } catch (err) {
      console.error('pages/api/inventory GET error:', err)
      return res.status(500).json({ error: err?.message || String(err) })
    }
  }

  if (req.method === 'POST') {
    const body = req.body || {}
    const { type } = body
    try {
      if (type === 'material' || type === 'product') {
        let { name, sku, unit, materialType, createdBy, materialName, grade, initialQuantity, supplierId } = body
        const makeSku = base => {
          const s = String(base || 'SKU')
            .trim()
            .toUpperCase()
            .replace(/[^A-Z0-9\-]+/g, '-')
          return `${s}-${Date.now()}`
        }
        if (!sku) sku = makeSku(name)

        try {
          const result = await sequelize.transaction(async t => {
            // Extract original dimensions from body - these are PERMANENT and never change
            const originalLength = body.length != null ? Number(body.length) : null
            const originalWidth = body.width != null ? Number(body.width) : null
            // Extract count and weight for dual-unit tracking (e.g., 2000 screws = 80 kg)
            const countVal = body.count != null ? Number(body.count) : 0
            const weightVal = body.weight != null ? Number(body.weight) : 0
            // Extract dimension type and thickness
            const dimensionType = body.dimensionType || 'rectangular'
            const thickness = body.thickness != null ? Number(body.thickness) : null

            const [m, created] = await Material.findOrCreate({
              where: { sku },
              defaults: {
                name,
                sku,
                unit,
                type: materialType,
                createdBy,
                stock: 0,
                materialName,
                grade,
                originalLength,
                originalWidth, // Store original dimensions permanently
                dimensionType, // Type of dimension (rectangular or circular)
                thickness, // Thickness for pipes/tubes
                count: countVal, // Number of items (e.g., 2000 screws)
                weight: weightVal // Total weight (e.g., 80 kg)
              },
              transaction: t
            })

            // obtain a row lock for updates
            const material = await Material.findByPk(m.id, { transaction: t, lock: t.LOCK.UPDATE })

            // If the material already existed but category/grade changed, update it so it appears
            // in the correct listing (e.g., factory vs client)
            if (!created) {
              let changed = false
              if ((material.type || '') !== (materialType || '')) {
                material.type = materialType || null
                changed = true
              }
              if ((material.materialName || '') !== (materialName || '')) {
                material.materialName = materialName || null
                changed = true
              }
              if ((material.grade || '') !== (grade || '')) {
                material.grade = grade || null
                changed = true
              }
              if (changed) await material.save({ transaction: t })
            }

            // If "Amount" (initialQuantity) is not provided, use "Count" as the initial stock quantity
            const initQty =
              Number(initialQuantity || 0) > 0 ? Number(initialQuantity) : Number(countVal) > 0 ? Number(countVal) : 0
            if (initQty > 0) {
              const delta = Math.abs(initQty)
              await InventoryTransaction.create(
                {
                  materialId: material.id,
                  change: delta,
                  action: 'add',
                  source: 'supplier',
                  reference: String(supplierId || ''),
                  user: createdBy || '',
                  note: body.note || 'Initial stock'
                },
                { transaction: t }
              )
              material.stock = Number(material.stock || 0) + delta
              await material.save({ transaction: t })
            }

            // If optional dimensions provided, create an initial piece record
            const length = body.length != null ? Number(body.length) : null
            const width = body.width != null ? Number(body.width) : null
            const MaterialPiece = sequelize.models.MaterialPiece
            // Only create an initial piece if it's NOT a bulk item (count == 0)
            // If count > 0, it's a raw material stock, not individual dimensioned pieces
            if (MaterialPiece && length && width && countVal <= 0) {
              try {
                const piece = await MaterialPiece.create(
                  {
                    materialId: material.id,
                    length,
                    width,
                    quantity: 1,
                    isLeftover: false,
                    status: 'available'
                  },
                  { transaction: t }
                )

                await InventoryTransaction.create(
                  {
                    materialId: material.id,
                    materialPieceId: piece.id,
                    change: 1,
                    action: 'add',
                    source: 'initial_piece',
                    reference: '',
                    user: createdBy || ''
                  },
                  { transaction: t }
                )
              } catch (pieceErr) {
                console.error('Failed to create material piece:', pieceErr)
                // continue without failing full transaction — piece creation is optional
              }
            }

            return { material, created }
          })

          return res.status(result.created ? 201 : 200).json(result.material)
        } catch (err) {
          if (err && (err.name === 'SequelizeUniqueConstraintError' || err.parent?.message?.includes('unique'))) {
            const newSku = makeSku(sku)
            try {
              const m = await Material.create({
                name,
                sku: newSku,
                unit,
                type: materialType,
                createdBy,
                stock: 0,
                materialName,
                grade
              })
              return res.status(201).json(m)
            } catch (err2) {
              console.error('Material create retry failed:', err2)
              return res.status(400).json({ error: err2.message || 'Failed to create material' })
            }
          }
          console.error('Material create failed:', err)
          return res.status(400).json({ error: err.message || 'Failed to create material' })
        }
      }

      if (type === 'transaction') {
        const { materialId, amount, action, source, reference, user, note, length, width, clientId } = body

        // If this is a dimensioned removal request (length+width provided), delegate to the
        // dimensioned withdrawal service which handles piece selection, cutting and leftovers.
        if (action === 'remove' && length != null && width != null) {
          try {
            const { withdrawDimensionedPieces } = require('../../services/inventoryService')
            const { addItemToClientInvoice } = require('../../services/invoiceService') // Import invoice service

            const qty = Number(amount) || 1
            const allowNegative = !!body.allowNegative
            const specificPieceId = body.specificPieceId || null
            const price = body.price ? Number(body.price) : 0 // Extract price
            const forceNewSheet = !!body.forceNewSheet // Extract forceNewSheet

            // Use the "Smart" withdrawal function that optimizes cuts and prioritizes remnants
            const { results } = await withdrawDimensionedPieces({
              materialId,
              reqLength: Number(length),
              reqWidth: Number(width),
              qty,
              client: clientId || null, // Pass clientId to link the piece to the client
              user: user || null,
              allowNegative,
              allowRotation: false,
              specificPieceId,
              forceNewSheet
            })

            // If a client is selected, add to invoice (price can be 0, user can edit later)
            if (clientId) {
              try {
                // Fetch the material to get its details
                const material = await Material.findByPk(materialId)
                const matName = material.name || 'Material'
                const dims = `${length}x${width}`
                let desc = `Purchase ${matName} (${dims})`
                if (specificPieceId) {
                  desc += ` - Remnant #${specificPieceId}`
                }

                const itemData = {
                  description: desc,
                  materialId: material.id,
                  sku: material.sku,
                  isPiece: true,
                  length: Number(length),
                  width: Number(width)
                }

                await addItemToClientInvoice(clientId, itemData, qty, price, user)
                console.log(`Invoice item added for client ${clientId}: ${desc} @ ${price}`)

                // NEW: Also add generated leftovers to the invoice (Price 0, user to edit)
                const allLeftovers = results.flatMap(r => r.leftovers || [])
                if (allLeftovers.length > 0) {
                  // Group leftovers by dimensions for cleaner invoice
                  const groupedLeftovers = {}
                  allLeftovers.forEach(l => {
                    const key = `${l.length}x${l.width}`
                    if (!groupedLeftovers[key])
                      groupedLeftovers[key] = { count: 0, length: l.length, width: l.width, ids: [] }
                    groupedLeftovers[key].count++
                    groupedLeftovers[key].ids.push(l.id)
                  })

                  for (const key in groupedLeftovers) {
                    const g = groupedLeftovers[key]
                    let remDesc = `Remnant ${material.name || ''} (${g.length}x${g.width})`

                    // If single piece, add ID for traceability
                    if (g.count === 1) remDesc += ` - #${g.ids[0]}`

                    const remItemData = {
                      description: remDesc,
                      materialId: material.id,
                      sku: material.sku,
                      isPiece: true,
                      length: Number(g.length),
                      width: Number(g.width),
                      pieceId: g.count === 1 ? g.ids[0] : null // Link to specific piece if single
                    }

                    // Add to invoice with Price 0
                    await addItemToClientInvoice(clientId, remItemData, g.count, 0, user)
                  }
                }
              } catch (invErr) {
                console.error('Failed to add invoice item:', invErr)
                // Don't fail the transaction, just log error
              }
            }

            console.log(
              'pages/api/inventory: dimensioned withdrawal results:',
              results.map(r => ({
                consumed: r.consumedPiece && r.consumedPiece.id,
                leftovers: (r.leftovers || []).map(l => ({ id: l.id, length: l.length, width: l.width }))
              }))
            )

            return res.status(201).json({ results })
          } catch (err) {
            console.error('Dimensioned withdrawal error:', err)
            if (err.code === 'NO_PIECE') return res.status(400).json({ error: err.message })
            if (err.code === 'STOCK_EMPTY')
              return res.status(400).json({
                error: err.message,
                code: err.code,
                hint: 'المخزون نفد. قم بتعبئة المخزون أو اضبط allowNegative=true إذا رغبت في التجاوز'
              })
            if (err.code === 'NEGATIVE_STOCK')
              return res.status(400).json({
                error: err.message,
                code: err.code,
                hint: 'Set allowNegative=true to override or replenish stock'
              })
            return res.status(500).json({ error: err.message || String(err) })
          }
        }

        const delta = action === 'remove' ? -Math.abs(Number(amount)) : Math.abs(Number(amount))
        const result = await sequelize.transaction(async t => {
          const material = await Material.findByPk(materialId, { transaction: t, lock: t.LOCK.UPDATE })
          if (!material) throw new Error('Material not found')
          const newStock = Number(material.stock || 0) + delta
          if (newStock < 0) throw new Error('Insufficient stock')

          const tx = await InventoryTransaction.create(
            { materialId, change: delta, action, source, reference, user, note },
            { transaction: t }
          )

          // Sync count and weight with stock change (Since stock = count)
          const currentCount = Number(material.count || material.stock || 0)
          const currentWeight = Number(material.weight || 0)

          // Calculate weight per item to adjust weight proportionally
          let weightPerItem = 0
          if (currentCount > 0 && currentWeight > 0) {
            weightPerItem = currentWeight / currentCount
          }

          material.stock = newStock
          material.count = newStock // Sync count with stock

          // Adjust weight proportionally if we have a valid ratio
          if (weightPerItem > 0) {
            material.weight = newStock * weightPerItem
          } else if (newStock === 0) {
            material.weight = 0 // If stock is 0, weight should be 0
          }

          await material.save({ transaction: t })
          return { tx, material }
        })
        return res.status(201).json(result)
      }

      // Handle Operating Issue Order - إذن صادر التشغيل
      if (type === 'issue_order') {
        const {
          materialId,
          countToDeduct,
          weightToDeduct,
          description,
          user,
          jobCard,
          length,
          width,
          specificPieceId
        } = body

        // Debug logging to catch NaN values
        console.log('Issue Order Request:', {
          materialId,
          countToDeduct,
          weightToDeduct,
          length,
          width,
          specificPieceId,
          jobCard
        })

        try {
          const { withdrawByCount } = require('../../services/inventoryService')

          // Validate materialId first
          const validMaterialId = Number(materialId)
          if (!validMaterialId || isNaN(validMaterialId)) {
            throw new Error(`Invalid materialId: ${materialId}`)
          }

          // Validate and sanitize dimensions
          const lengthNum =
            length && length !== '' && length !== 'NaN' && !isNaN(Number(length)) ? Number(length) : null
          const widthNum = width && width !== '' && width !== 'NaN' && !isNaN(Number(width)) ? Number(width) : null

          // Validate and sanitize count/weight deductions
          const countNum =
            countToDeduct && countToDeduct !== '' && countToDeduct !== 'NaN' && !isNaN(Number(countToDeduct))
              ? Number(countToDeduct)
              : null
          const weightNum =
            weightToDeduct && weightToDeduct !== '' && weightToDeduct !== 'NaN' && !isNaN(Number(weightToDeduct))
              ? Number(weightToDeduct)
              : null

          // Validate specificPieceId
          const validSpecificPieceId =
            specificPieceId && specificPieceId !== 'NaN' && !isNaN(Number(specificPieceId))
              ? Number(specificPieceId)
              : null

          console.log('Sanitized values:', { lengthNum, widthNum, countNum, weightNum, validSpecificPieceId })

          // If dimensions provided, use withdrawDimensionedPieces (handles specificPieceId)
          let result
          if (lengthNum && widthNum) {
            console.log('Using withdrawDimensionedPieces with:', {
              materialId: validMaterialId,
              reqLength: lengthNum,
              reqWidth: widthNum,
              specificPieceId: validSpecificPieceId
            })
            const { withdrawDimensionedPieces } = require('../../services/inventoryService')
            result = await withdrawDimensionedPieces({
              materialId: validMaterialId,
              reqLength: lengthNum,
              reqWidth: widthNum,
              client: 'manufacturing',
              user: user || 'unknown',
              allowNegative: false,
              specificPieceId: validSpecificPieceId,
              forceNewSheet: false,
              allowRotation: true
            })
          } else {
            console.log('Using withdrawByCount with:', {
              materialId: validMaterialId,
              countToDeduct: countNum,
              weightToDeduct: weightNum
            })
            result = await withdrawByCount({
              materialId: validMaterialId,
              countToDeduct: countNum,
              weightToDeduct: weightNum,
              client: 'manufacturing',
              user: user || 'unknown',
              allowNegative: false
            })
          }

          console.log('Withdrawal result:', result)
          console.log('Result structure:', {
            hasConsumedPiece: !!result.consumedPiece,
            hasResults: !!result.results,
            resultsLength: result.results?.length,
            firstResult: result.results?.[0]
          })

          // Build note with Job Card Data if available
          let note = ''
          if (lengthNum && widthNum) {
            note = `Dimensions: ${lengthNum}x${widthNum}, Count: ${result.deductedCount || 1}, Weight: ${result.deductedWeight || 0}kg`
          } else {
            note = `Count: ${result.deductedCount || countNum || 1}, Weight: ${result.deductedWeight || weightNum || 0}kg`
          }
          if (jobCard && typeof jobCard === 'object') {
            // Clean jobCard from any NaN, undefined, null, or empty values before stringifying
            const cleanJobCard = {}
            for (const key in jobCard) {
              const value = jobCard[key]
              // Only include values that are valid
              if (value !== undefined && value !== null && value !== '' && value !== 'NaN') {
                // If it's a number, make sure it's not NaN
                if (typeof value === 'number' && !isNaN(value)) {
                  cleanJobCard[key] = value
                } else if (typeof value === 'string') {
                  cleanJobCard[key] = value
                }
              }
            }
            console.log('Original jobCard:', jobCard)
            console.log('Cleaned jobCard:', cleanJobCard)
            // Append generic Job Card JSON to note for future parsing
            if (Object.keys(cleanJobCard).length > 0) {
              note += ` | JobCard: ${JSON.stringify(cleanJobCard)}`
            }
          }

          // Log the issue order transaction for tracking
          const changeAmount = result.deductedCount || result.results?.[0]?.consumedPiece ? 1 : countNum || 1
          const deductedWeightAmount = result.deductedWeight || 0
          // Get materialPieceId from either direct consumedPiece or from results array
          const materialPieceIdValue = result.consumedPiece?.id || result.results?.[0]?.consumedPiece?.id || null

          // Extra validation to ensure no NaN values
          const validChangeAmount = Number(changeAmount)
          if (isNaN(validChangeAmount)) {
            throw new Error(`Invalid change amount: ${changeAmount}`)
          }

          const validMaterialPieceId =
            materialPieceIdValue !== null && materialPieceIdValue !== undefined ? Number(materialPieceIdValue) : null

          if (validMaterialPieceId !== null && isNaN(validMaterialPieceId)) {
            throw new Error(`Invalid materialPieceId: ${materialPieceIdValue}`)
          }

          const validDeductedWeight = Number(deductedWeightAmount)
          if (isNaN(validDeductedWeight)) {
            throw new Error(`Invalid deducted weight: ${deductedWeightAmount}`)
          }

          console.log('Creating InventoryTransaction with validated values:', {
            materialId: validMaterialId,
            materialPieceId: validMaterialPieceId,
            change: -validChangeAmount,
            deductedWeight: validDeductedWeight,
            action: 'issue_order',
            source: 'manufacturing',
            reference: description || 'إذن صادر تشغيل',
            user: user || 'unknown'
          })

          await InventoryTransaction.create({
            materialId: validMaterialId,
            materialPieceId: validMaterialPieceId,
            change: -validChangeAmount,
            action: 'issue_order',
            source: 'manufacturing',
            reference: description || 'إذن صادر تشغيل',
            user: user || 'unknown',
            note: note,
            deductedWeight: validDeductedWeight
          })

          return res.status(201).json({
            success: true,
            message: 'تم إنشاء إذن التشغيل بنجاح',
            result
          })
        } catch (err) {
          console.error('Issue order error:', err)

          // Clean error messages for user
          let errorMessage = err.message || 'فشل في إنشاء إذن التشغيل'

          // Handle specific PostgreSQL errors
          if (errorMessage.includes('invalid input syntax for type integer')) {
            errorMessage = 'خطأ في البيانات المدخلة - تأكد من صحة جميع الأرقام'
          } else if (errorMessage.includes('not found')) {
            errorMessage = 'القطعة المحددة غير متاحة - سيتم استخدام قطعة بديلة'
          }

          return res.status(400).json({
            error: errorMessage,
            code: err.code,
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
          })
        }
      }

      // Handle Delivery Note - إذن تسليم (Finished Product -> Invoice)
      if (type === 'deliver_product') {
        const { materialId, countToDeduct, weightToDeduct, client, user, price } = body

        try {
          const { withdrawByCount } = require('../../services/inventoryService')
          const { addItemToClientInvoice } = require('../../services/invoiceService')

          // 1. Deduct from Inventory (using count/weight logic)
          // Pass client as reference so it appears in client-inventory-balance
          const result = await withdrawByCount({
            materialId,
            countToDeduct: countToDeduct ? Number(countToDeduct) : null,
            weightToDeduct: weightToDeduct ? Number(weightToDeduct) : null,
            client,
            user: user || 'unknown',
            allowNegative: false,
            reference: String(client) // Pass clientId as reference for balance tracking
          })

          // 2. Add to Client Invoice
          if (client) {
            const m = await Material.findByPk(materialId)
            await addItemToClientInvoice(
              client,
              {
                description: `Delivery: ${m ? m.name : 'Product'}`,
                materialId: materialId, // Track source material
                unit: m ? m.unit : 'pcs'
              },
              countToDeduct || 1, // Quantity
              price || 0, // Price
              user || 'unknown'
            )
          }

          return res.status(201).json({ success: true, result })
        } catch (err) {
          console.error('deliver_product error:', err)
          return res.status(400).json({ error: err.message })
        }
      }

      return res.status(400).json({ error: 'Invalid POST type' })
    } catch (err) {
      console.error('pages inventory handler error:', err)
      return res.status(400).json({ error: err.message })
    }
  }

  if (req.method === 'DELETE') {
    const { id, type } = req.body
    if (!id) return res.status(400).json({ error: 'ID required' })

    try {
      if (type === 'transaction') {
        // Delete Transaction and revert its effect
        const result = await sequelize.transaction(async t => {
          const tx = await InventoryTransaction.findByPk(id, { transaction: t })
          if (!tx) throw new Error('Transaction not found')

          // Revert MaterialPiece status if one was used
          if (tx.materialPieceId) {
            const MaterialPiece = sequelize.models.MaterialPiece
            if (MaterialPiece) {
              const piece = await MaterialPiece.findByPk(tx.materialPieceId, { transaction: t })
              if (piece) {
                // Restore piece to available status
                await piece.update({ status: 'available' }, { transaction: t })
                console.log(`Restored MaterialPiece ${tx.materialPieceId} to available status`)
              }
            }
          }

          // Revert effect on material
          const material = await Material.findByPk(tx.materialId, { transaction: t, lock: t.LOCK.UPDATE })
          if (material) {
            // Reverse the change
            // If tx.change was -10 (deducted), we add 10 back.
            // If tx.change was +10 (added), we subtract 10.
            const reversion = -1 * Number(tx.change)

            const newStock = Number(material.stock || 0) + reversion
            if (newStock < 0) throw new Error('Cannot revert transaction: Insufficient stock to reverse')

            material.stock = newStock
            material.count = newStock

            // Adjust weight if needed
            const currentCount = Number(material.count || 0) // This is actually the new count
            const currentWeight = Number(material.weight || 0)
            let weightPerItem = 0

            if (Number(material.stock) - reversion > 0 && currentWeight > 0) {
              weightPerItem = currentWeight / (Number(material.stock) - reversion)
            }

            if (weightPerItem > 0) {
              material.weight = newStock * weightPerItem
            } else if (newStock === 0) {
              material.weight = 0
            }

            await material.save({ transaction: t })
          }

          await tx.destroy({ transaction: t })
          return {
            success: true,
            message: `تم إلغاء العملية بنجاح. تم استرجاع ${Math.abs(reversion)} وحدة للمخزن`,
            revertedCount: Math.abs(reversion)
          }
        })
        return res.status(200).json(result)
      }

      // Default: Delete Material
      const material = await Material.findByPk(id)
      if (!material) return res.status(404).json({ error: 'Material not found' })

      // Use transaction to ensure all related data is deleted atomically
      await sequelize.transaction(async t => {
        const MaterialPiece = sequelize.models.MaterialPiece
        const ProjectMaterial = sequelize.models.ProjectMaterial

        // Check and delete related transactions
        const relatedTransactions = await InventoryTransaction.count({
          where: { materialId: id },
          transaction: t
        })

        if (relatedTransactions > 0) {
          await InventoryTransaction.destroy({
            where: { materialId: id },
            transaction: t
          })
        }

        // Check and delete related material pieces
        if (MaterialPiece) {
          const relatedPieces = await MaterialPiece.count({
            where: { materialId: id },
            transaction: t
          })

          if (relatedPieces > 0) {
            await MaterialPiece.destroy({
              where: { materialId: id },
              transaction: t
            })
          }
        }

        // Check and delete related project materials
        if (ProjectMaterial) {
          const relatedProjectMaterials = await ProjectMaterial.count({
            where: { materialId: id },
            transaction: t
          })

          if (relatedProjectMaterials > 0) {
            await ProjectMaterial.destroy({
              where: { materialId: id },
              transaction: t
            })
          }
        }

        // Delete the material
        await material.destroy({ transaction: t })
      })

      return res.status(200).json({
        success: true,
        message: 'Material deleted successfully along with all related data'
      })
    } catch (e) {
      console.error('Delete error:', e)
      return res.status(500).json({ error: e.message })
    }
  }

  if (req.method === 'PUT') {
    const { id, type, materialType, status, transactionIds, transferCount, transferWeight, user } = req.body

    // Batch update transactions
    if (transactionIds && Array.isArray(transactionIds) && status) {
      try {
        // await InventoryTransaction.update(
        //     { status },
        //     { where: { id: transactionIds } }
        // )
        return res.status(200).json({ success: true })
      } catch (e) {
        console.error('Batch update transactions error:', e)
        return res.status(500).json({ error: e.message })
      }
    }

    if (!id) return res.status(400).json({ error: 'ID required' })

    try {
      const material = await Material.findByPk(id)
      if (!material) return res.status(404).json({ error: 'Material not found' })

      // Update fields if provided
      if (type && material.type !== type) {
        const oldType = material.type

        // If transferring from operating_stock, delete it (set stock to 0)
        if (oldType === 'operating_stock' || oldType === 'product') {
          const currentStock = Number(material.stock || 0)

          // Set stock to 0 (product is removed from operating stock)
          material.stock = 0

          // Log transfer transaction with actual deduction
          await InventoryTransaction.create({
            materialId: material.id,
            change: -currentStock, // Deduct the stock
            action: 'transfer',
            source: 'operating_stock',
            reference: `نقل للمصنع (إعادة تشغيل)`,
            user: user || 'system',
            note: `Transferred from ${oldType} to ${type} (stock: ${currentStock})`
          })
        } else {
          // For other types, just log the type change
          await InventoryTransaction.create({
            materialId: material.id,
            change: 0, // No stock change, just state change
            action: 'transfer',
            source: oldType || 'unknown',
            reference: `Changed type from ${oldType} to ${type}`,
            user: user || 'system',
            note: `Transferred/Returned to ${type}`
          })
        }

        material.type = type
      }
      if (materialType) material.type = materialType // Alias

      // Allow updating dimensionType (rectangular <-> circular)
      if (req.body.dimensionType && ['rectangular', 'circular'].includes(req.body.dimensionType)) {
        material.dimensionType = req.body.dimensionType
      }

      // Allow updating thickness
      if (req.body.thickness !== undefined) {
        material.thickness = req.body.thickness != null ? Number(req.body.thickness) : null
      }

      await material.save()
      return res.status(200).json({ success: true, material })
    } catch (e) {
      console.error('Update material error:', e)
      return res.status(500).json({ error: e.message })
    }
  }

  res.status(405).json({ error: 'Method not allowed' })
}

export default withAuth(handler)
