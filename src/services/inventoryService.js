'use strict'

const { Op } = require('sequelize')

const { getDb } = require('../../models')

// Helper function to calculate area based on dimension type
function calculateArea(length, width, dimensionType = 'rectangular') {
  const L = parseFloat(length || 0)
  const W = parseFloat(width || 0)

  if (dimensionType === 'circular') {
    // For circular shapes: Area = π × (diameter/2)² = π × diameter² / 4
    // width field stores diameter for circular materials
    const diameter = W

    return (Math.PI * (diameter * diameter)) / 4
  } else {
    // For rectangular shapes: Area = length × width
    return L * W
  }
}

async function withdrawDimensionedPiece({
  materialId,
  reqLength,
  reqWidth,
  client = null,
  user = null,
  allowNegative = false
}) {
  const db = await getDb()
  const { MaterialPiece, InventoryTransaction, Material, sequelize } = db

  return await sequelize.transaction(async tx => {
    // lock material row for update
    const material = await Material.findByPk(materialId, { transaction: tx, lock: tx.LOCK.UPDATE })

    if (!material) throw new Error('Material not found')

    // Determine ordering based on dimension type
    const dimensionType = material.dimensionType || 'rectangular'
    let orderClause

    if (dimensionType === 'circular') {
      // For circular: Area = π × (diameter/2)² = π × r²
      // PostgreSQL: PI() * POW(width/2, 2)
      orderClause = sequelize.literal('3.14159 * POW(width/2, 2) * length')
    } else {
      // For rectangular: Area = length × width
      orderClause = sequelize.literal('length * width')
    }

    // Find smallest-area piece that fits
    const piece = await MaterialPiece.findOne({
      where: {
        materialId,
        status: { [Op.in]: ['available', 'leftover'] },
        length: { [Op.gte]: reqLength },
        width: { [Op.gte]: reqWidth }
      },
      order: [orderClause],
      transaction: tx
    })

    if (!piece) {
      // No fitting piece found. Try to use the original raw sheet (parentPieceId IS NULL)
      // to perform the cut and create the remainder as leftover(s). If no raw sheet
      // exists, fall back to creating a virtual consumed piece (keeps old behavior).
      const raw = await MaterialPiece.findOne({
        where: { materialId, parentPieceId: null, status: { [Op.in]: ['available', 'leftover'] } },
        order: [['createdAt', 'ASC']],
        transaction: tx
      })

      if (raw && raw.length && raw.width) {
        const L = parseFloat(raw.length || 0)
        const W = parseFloat(raw.width || 0)
        const A = parseFloat(reqLength)
        const B = parseFloat(reqWidth)

        // Verify stock permission
        const newStockAfterConsume = Number(material.stock || 0) - 1

        // If stock is exactly zero, treat as 'stock empty' and block consumption (unless allowNegative)
        if (Number(material.stock || 0) === 0 && !allowNegative) {
          // record an informational transaction and fail early
          await InventoryTransaction.create(
            {
              materialId,
              materialPieceId: raw.id,
              change: 0,
              action: 'stock_empty',
              source: client || 'order',
              reference: 'نفذ المخزون',
              user
            },
            { transaction: tx }
          )
          const err = new Error('نفذ المخزون')

          err.code = 'STOCK_EMPTY'
          throw err
        }

        if (newStockAfterConsume < 0 && !allowNegative) {
          const err = new Error('Consuming this piece would produce negative stock; set allowNegative=true to override')

          err.code = 'NEGATIVE_STOCK'
          throw err
        }

        // The parent raw may have quantity >1; decrement its quantity instead of marking used immediately
        const cutCount = 1

        const qi = sequelize.getQueryInterface()
        const tableDef = await qi.describeTable('material_pieces')
        
        const createPayload = {
          materialId,
          length: A,
          width: B,
          quantity: 1,
          isLeftover: false,
          parentPieceId: raw.id,
          status: client ? 'reserved' : 'used'
        }
        if (tableDef && tableDef.clientId) createPayload.clientId = client ? Number(client) : null

        // create consumed child piece
        const consumed = await MaterialPiece.create(createPayload, { transaction: tx })

        // Decrement parent raw quantity and mark used only if it reaches zero
        const parentQty = Number(raw.quantity || 1)
        const newParentQty = parentQty - cutCount

        if (newParentQty <= 0) {
          await raw.update({ quantity: 0, status: 'used' }, { transaction: tx })
        } else {
          await raw.update({ quantity: newParentQty }, { transaction: tx })
        }

        // Record the consumption transaction for the consumed piece and material
        await InventoryTransaction.create(
          {
            materialId,
            materialPieceId: consumed.id,
            change: -1,
            action: 'cut',
            source: client || 'order',
            reference: `cut ${A}x${B} from raw ${raw.id}`,
            user
          },
          { transaction: tx }
        )

        // compute remainder leftovers using raw dimensions
        const leftovers = []

        // إذا كان كلا البعدين أكبر من المطلوب، أنشئ قطعتين: واحدة طولها ناقص، والثانية عرضها ناقص
        if (L > A && W > B) {
          const rl = L - A
          const rw = W - B

          // قطعة 1: (الطول المتبقي × العرض الأصلي)
          if (rl > 0) leftovers.push({ length: rl, width: W })

          // قطعة 2: (الطول المطلوب × العرض المتبقي)
          if (rw > 0) leftovers.push({ length: A, width: rw })
        } else if (L > A) {
          const rl = L - A

          if (rl > 0) leftovers.push({ length: rl, width: W })
        } else if (W > B) {
          const rw = W - B

          if (rw > 0) leftovers.push({ length: L, width: rw })
        }

        const createdLeftovers = []

        for (const lf of leftovers) {
          const lfLength = Number(lf.length)
          const lfWidth = Number(lf.width)

          if (lfLength <= 0 || lfWidth <= 0) continue

          const newPiece = await MaterialPiece.create(
            {
              materialId,
              length: lfLength,
              width: lfWidth,
              quantity: 1,
              isLeftover: true,
              parentPieceId: raw.id,
              status: 'available'
            },
            { transaction: tx }
          )

          // defensive enforcement in case of DB/adapter quirks
          await newPiece.update({ isLeftover: true, status: 'available' }, { transaction: tx })

          await InventoryTransaction.create(
            {
              materialId,
              materialPieceId: newPiece.id,
              change: 0,
              action: 'cut_leftover',
              source: 'cut_grid',
              reference: `leftover from raw ${raw.id}`,
              user
            },
            { transaction: tx }
          )

          createdLeftovers.push(newPiece)
          console.log(
            `withdrawDimensionedPiece (raw ${raw.id}): created leftover ${newPiece.id} isLeftover=${newPiece.isLeftover} status=${newPiece.status}`
          )
        }

        // If we expected leftovers but none were created (edge cases), create a fallback leftover
        if (leftovers.length > 0 && createdLeftovers.length === 0) {
          const lf = leftovers[0]
          const fallbackLength = Number(L - A > 0 ? L - A : lf.length || 0)
          const fallbackWidth = Number(W - B > 0 ? W : lf.width || 0)

          if (fallbackLength > 0 && fallbackWidth > 0) {
            const fb = await MaterialPiece.create(
              {
                materialId,
                length: fallbackLength,
                width: fallbackWidth,
                quantity: 1,
                isLeftover: true,
                parentPieceId: raw.id,
                status: 'available'
              },
              { transaction: tx }
            )

            await InventoryTransaction.create(
              {
                materialId,
                materialPieceId: fb.id,
                change: 0,
                action: 'cut_leftover',
                source: 'cut_grid',
                reference: `fallback leftover from raw ${raw.id}`,
                user
              },
              { transaction: tx }
            )
            createdLeftovers.push(fb)
            console.warn(`withdrawDimensionedPiece (raw ${raw.id}): created fallback leftover ${fb.id}`)
          }
        }

        // Log created leftovers for debugging (raw sheet path)
        if (createdLeftovers.length > 0) {
          console.log(
            `withdrawDimensionedPiece (raw ${raw.id}): created ${createdLeftovers.length} leftover(s):`,
            createdLeftovers.map(x => ({ id: x.id, length: x.length, width: x.width }))
          )
        } else {
          console.log(`withdrawDimensionedPiece (raw ${raw.id}): no leftovers created`)
        }

        // decrement material stock for consumed raw
        material.stock = newStockAfterConsume

        // Sync count and weight
        const currentCount = Number(material.count || material.stock || 0)
        const currentWeight = Number(material.weight || 0)
        let weightPerItem = 0

        if (currentCount > 0 && currentWeight > 0) weightPerItem = currentWeight / currentCount

        material.count = newStockAfterConsume

        if (weightPerItem > 0) {
          material.weight = newStockAfterConsume * weightPerItem
        } else if (newStockAfterConsume === 0) {
          material.weight = 0
        }

        await material.save({ transaction: tx })

        return {
          consumedPiece: consumed.toJSON ? consumed.toJSON() : consumed,
          leftovers: createdLeftovers.map(p => (p.toJSON ? p.toJSON() : p))
        }
      }

      // Fallback: when no raw sheet exists, create a virtual consumed piece so permit succeeds
      const qi = sequelize.getQueryInterface()
      const tableDef = await qi.describeTable('material_pieces')
      
      const virtualPayload = {
        materialId,
        length: reqLength,
        width: reqWidth,
        quantity: 1,
        isLeftover: false,
        parentPieceId: null,
        status: client ? 'reserved' : 'used'
      }
      if (tableDef && tableDef.clientId) virtualPayload.clientId = client ? Number(client) : null

      const virtual = await MaterialPiece.create(virtualPayload, { transaction: tx })

      // verify material stock permission
      const newStockAfterConsumeVirtual = Number(material.stock || 0) - 1

      // If stock is exactly zero, record 'stock_empty' and block
      if (Number(material.stock || 0) === 0 && !allowNegative) {
        await InventoryTransaction.create(
          {
            materialId,
            materialPieceId: virtual.id,
            change: 0,
            action: 'stock_empty',
            source: client || 'order',
            reference: 'نفذ المخزون',
            user
          },
          { transaction: tx }
        )
        const err = new Error('نفذ المخزون')

        err.code = 'STOCK_EMPTY'
        throw err
      }

      if (newStockAfterConsumeVirtual < 0 && !allowNegative) {
        const err = new Error('Consuming this piece would produce negative stock; set allowNegative=true to override')

        err.code = 'NEGATIVE_STOCK'
        throw err
      }

      // record inventory transaction (consumption)
      await InventoryTransaction.create(
        {
          materialId,
          materialPieceId: virtual.id,
          change: -1,
          action: 'permit',
          source: client || 'order',
          reference: `virtual consume ${reqLength}x${reqWidth}`,
          user
        },
        { transaction: tx }
      )

      // decrement material stock
      material.stock = newStockAfterConsumeVirtual

      // Sync count and weight
      const currentCountVirtual = Number(material.count || material.stock || 0)
      const currentWeightVirtual = Number(material.weight || 0)
      let weightPerItemVirtual = 0

      if (currentCountVirtual > 0 && currentWeightVirtual > 0)
        weightPerItemVirtual = currentWeightVirtual / currentCountVirtual

      material.count = newStockAfterConsumeVirtual

      if (weightPerItemVirtual > 0) {
        material.weight = newStockAfterConsumeVirtual * weightPerItemVirtual
      } else if (newStockAfterConsumeVirtual === 0) {
        material.weight = 0
      }

      await material.save({ transaction: tx })

      return { consumedPiece: virtual.toJSON ? virtual.toJSON() : virtual, leftovers: [] }
    }

    const L = parseFloat(piece.length || 0)
    const W = parseFloat(piece.width || 0)
    const A = parseFloat(reqLength)
    const B = parseFloat(reqWidth)

    // If this piece is already a leftover (or has a parent piece), consume it without affecting global stock
    const consumedFromLeftover = !!piece.isLeftover || piece.parentPieceId != null

    if (consumedFromLeftover) {
      // Record consumption without changing stock
      await InventoryTransaction.create(
        {
          materialId,
          materialPieceId: piece.id,
          change: 0,
          action: 'consume_piece',
          source: client || 'order',
          reference: `consume ${A}x${B} from piece ${piece.id}`,
          user
        },
        { transaction: tx }
      )

      // Mark original as used
      await piece.update({ status: 'used' }, { transaction: tx })

      const leftovers = []

      // Compute leftovers as the remainder rectangle(s) (they do not change global stock in this path)
      if (L > A && W > B) {
        const rl = L - A
        const rw = W - B

        if (rl > 0) leftovers.push({ length: rl, width: W })
        if (rw > 0) leftovers.push({ length: A, width: rw })
      } else if (L > A) {
        const rl = L - A

        if (rl > 0) leftovers.push({ length: rl, width: W })
      } else if (W > B) {
        const rw = W - B

        if (rw > 0) leftovers.push({ length: L, width: rw })
      }

      const createdLeftovers = []

      for (const lf of leftovers) {
        const lfLength = Number(lf.length)
        const lfWidth = Number(lf.width)

        if (lfLength <= 0 || lfWidth <= 0) continue

        const newPiece = await MaterialPiece.create(
          {
            materialId,
            length: lfLength,
            width: lfWidth,
            quantity: 1,
            isLeftover: true,
            parentPieceId: piece.id,
            status: 'available'
          },
          { transaction: tx }
        )

        // Defensive enforcement
        await newPiece.update({ isLeftover: true, status: 'available' }, { transaction: tx })

        // record add transaction for leftover but with zero stock change
        await InventoryTransaction.create(
          {
            materialId,
            materialPieceId: newPiece.id,
            change: 0,
            action: 'cut_leftover',
            source: 'cut_from_leftover',
            reference: `leftover from ${piece.id}`,
            user
          },
          { transaction: tx }
        )

        createdLeftovers.push(newPiece)
        console.log(
          `withdrawDimensionedPiece: created leftover ${newPiece.id} isLeftover=${newPiece.isLeftover} status=${newPiece.status} from piece ${piece.id}`
        )
      }

      // If we expected leftovers but none were created for this piece, create a fallback leftover
      if (leftovers.length > 0 && createdLeftovers.length === 0) {
        const lf = leftovers[0]
        const fallbackLength = Number(L - A > 0 ? L - A : lf.length || 0)
        const fallbackWidth = Number(W - B > 0 ? W : lf.width || 0)

        if (fallbackLength > 0 && fallbackWidth > 0) {
          const fb = await MaterialPiece.create(
            {
              materialId,
              length: fallbackLength,
              width: fallbackWidth,
              quantity: 1,
              isLeftover: true,
              parentPieceId: piece.id,
              status: 'available'
            },
            { transaction: tx }
          )

          await InventoryTransaction.create(
            {
              materialId,
              materialPieceId: fb.id,
              change: 0,
              action: 'cut_leftover',
              source: 'cut_from_leftover',
              reference: `fallback leftover from ${piece.id}`,
              user
            },
            { transaction: tx }
          )
          createdLeftovers.push(fb)
          console.warn(`withdrawDimensionedPiece: created fallback leftover ${fb.id} for piece ${piece.id}`)
        }
      }

      // No material.stock changes for consumption from leftovers
      await material.save({ transaction: tx })

      return { consumedPiece: piece, leftovers: createdLeftovers }
    }

    // Verify stock permission: consuming one piece reduces material.stock by 1
    const newStockAfterConsume = Number(material.stock || 0) - 1

    // If stock is exactly zero, mark empty and prevent consumption
    if (Number(material.stock || 0) === 0 && !allowNegative) {
      await InventoryTransaction.create(
        {
          materialId,
          materialPieceId: piece.id,
          change: 0,
          action: 'stock_empty',
          source: client || 'order',
          reference: 'نفذ المخزون',
          user
        },
        { transaction: tx }
      )
      const err = new Error('نفذ المخزون')

      err.code = 'STOCK_EMPTY'
      throw err
    }

    if (newStockAfterConsume < 0 && !allowNegative) {
      const err = new Error('Consuming this piece would produce negative stock; set allowNegative=true to override')

      err.code = 'NEGATIVE_STOCK'
      throw err
    }

    // Record the cutting transaction on the original piece
    await InventoryTransaction.create(
      {
        materialId,
        materialPieceId: piece.id,
        change: -1,
        action: 'cut',
        source: client || 'order',
        reference: `cut ${A}x${B}`,
        user
      },
      { transaction: tx }
    )

    // Mark original as used
    await piece.update({ status: 'used' }, { transaction: tx })

    // decrement material stock for consumed piece
    material.stock = newStockAfterConsume

    const leftovers = []

    // Compute leftovers as the remainder rectangle(s).
    // إذا كان كلا البعدين أكبر من المطلوب، أنشئ قطعتين: واحدة طولها ناقص، والثانية عرضها ناقص
    if (L > A && W > B) {
      const rl = L - A
      const rw = W - B

      // قطعة 1: (الطول المتبقي × العرض الأصلي)
      if (rl > 0) leftovers.push({ length: rl, width: W })

      // قطعة 2: (الطول المطلوب × العرض المتبقي)
      if (rw > 0) leftovers.push({ length: A, width: rw })
    } else if (L > A) {
      const rl = L - A

      if (rl > 0) leftovers.push({ length: rl, width: W })
    } else if (W > B) {
      const rw = W - B

      if (rw > 0) leftovers.push({ length: L, width: rw })
    }

    const createdLeftovers = []

    for (const lf of leftovers) {
      // Avoid creating degenerate pieces
      if (lf.length <= 0 || lf.width <= 0) continue

      const newPiece = await MaterialPiece.create(
        {
          materialId,
          length: lf.length,
          width: lf.width,
          quantity: 1,
          isLeftover: true,
          parentPieceId: piece.id,
          status: 'available'
        },
        { transaction: tx }
      )

      // record leftover creation (no stock change)
      await InventoryTransaction.create(
        {
          materialId,
          materialPieceId: newPiece.id,
          change: 0,
          action: 'cut_leftover',
          source: 'cut_from_leftover',
          reference: `leftover from ${piece.id}`,
          user
        },
        { transaction: tx }
      )

      createdLeftovers.push(newPiece)
    }

    // Log created leftovers for debugging
    if (createdLeftovers.length > 0) {
      console.log(
        `withdrawDimensionedPiece: created ${createdLeftovers.length} leftover(s) for piece ${piece.id}:`,
        createdLeftovers.map(x => ({ id: x.id, length: x.length, width: x.width }))
      )
    } else {
      console.log(`withdrawDimensionedPiece: no leftovers created for piece ${piece.id}`)
    }

    // persist material stock change
    await material.save({ transaction: tx })

    return { consumedPiece: piece, leftovers: createdLeftovers }
  })
}

// Provide withdrawPieces alias and a simple withdrawRaw helper
async function withdrawRaw({ materialId, quantity = 1, client = null, user = null, allowNegative = false }) {
  const db = await getDb()
  const { InventoryTransaction, Material, sequelize } = db

  return await sequelize.transaction(async tx => {
    const material = await Material.findByPk(materialId, { transaction: tx, lock: tx.LOCK.UPDATE })

    if (!material) throw new Error('Material not found')

    const q = Number(quantity || 0)
    const newStock = Number(material.stock || 0) - q

    if (newStock < 0 && !allowNegative) {
      const err = new Error('Consuming this raw would produce negative stock')

      err.code = 'NEGATIVE_STOCK'
      throw err
    }

    await InventoryTransaction.create(
      {
        materialId,
        materialPieceId: null,
        change: -q,
        action: 'withdraw_raw',
        source: client || 'order',
        reference: `raw withdraw qty=${q}`,
        user
      },
      { transaction: tx }
    )

    material.stock = newStock
    await material.save({ transaction: tx })

    return { materialId, quantity: q, newStock }
  })
}

/**
 * Withdraw by count with proportional weight deduction.
 * Example: 70 items = 500g, deduct 50 items → weight reduces to ~142.86g
 * @param {number} materialId - Material ID
 * @param {number} countToDeduct - Number of items to deduct
 * @param {string} client - Client reference
 * @param {string} user - User performing the action
 * @param {boolean} allowNegative - Allow negative counts
 * @returns {{ materialId, deductedCount, newCount, deductedWeight, newWeight }}
 */
async function withdrawByCount({
  materialId,
  countToDeduct,
  weightToDeduct,
  client = null,
  user = null,
  allowNegative = false,
  reference = null
}) {
  const db = await getDb()
  const { InventoryTransaction, Material, sequelize } = db

  // Validate materialId to prevent NaN issues
  if (!materialId || isNaN(Number(materialId))) {
    throw new Error('Invalid materialId')
  }

  return await sequelize.transaction(async tx => {
    const material = await Material.findByPk(materialId, { transaction: tx, lock: tx.LOCK.UPDATE })

    if (!material) throw new Error('Material not found')

    const currentCount = Number(material.count || 0)
    const currentWeight = Number(material.weight || 0)

    let toDeductCount = 0
    let toDeductWeight = 0

    if (countToDeduct && Number(countToDeduct) > 0) {
      // Mode: Deduct by Count
      toDeductCount = Number(countToDeduct)

      if (currentCount <= 0) {
        const err = new Error('لا يوجد عدد كافي في المخزون')

        err.code = 'INSUFFICIENT_COUNT'
        throw err
      }

      // Calculate proportional weight
      const weightPerItem = currentWeight / currentCount

      toDeductWeight = toDeductCount * weightPerItem
    } else if (weightToDeduct && Number(weightToDeduct) > 0) {
      // Mode: Deduct by Weight
      toDeductWeight = Number(weightToDeduct)

      if (currentWeight <= 0) {
        const err = new Error('لا يوجد وزن كافي في المخزون')

        err.code = 'INSUFFICIENT_WEIGHT'
        throw err
      }

      // Calculate proportional count
      // Rounding to nearest integer
      const countPerWeight = currentCount / currentWeight

      toDeductCount = Math.round(toDeductWeight * countPerWeight)
    } else {
      throw new Error('يجب تحديد العدد أو الوزن للخصم')
    }

    const newCount = Math.max(0, currentCount - toDeductCount)

    if (newCount < 0 && !allowNegative) {
      const err = new Error(`العدد المطلوب أكبر من المتاح`)

      err.code = 'NEGATIVE_COUNT'
      throw err
    }

    const newWeight = Math.max(0, currentWeight - toDeductWeight)

    // Extra validation before creating transaction
    if (isNaN(toDeductCount) || isNaN(toDeductWeight)) {
      throw new Error(`Invalid deduction values: count=${toDeductCount}, weight=${toDeductWeight}`)
    }

    await InventoryTransaction.create(
      {
        materialId: Number(materialId),
        change: -Number(toDeductCount),
        action: 'withdraw_by_count', // or create new action 'issue_order'
        source: client || 'manufacturing',
        reference: reference || `count=${toDeductCount}, weight=${toDeductWeight.toFixed(4)}`,
        user,
        note: `Deducted: ${toDeductCount} count / ${toDeductWeight.toFixed(4)} kg`
      },
      { transaction: tx }
    )

    // Update material with new count and weight
    material.count = newCount
    material.weight = newWeight

    // ALso sync stock with count as requested by user
    material.stock = newCount
    await material.save({ transaction: tx })

    return {
      materialId,
      deductedCount: toDeductCount,
      newCount,
      deductedWeight: Number(toDeductWeight.toFixed(4)),
      newWeight: Number(newWeight.toFixed(4))
    }
  })
}

// Helper: compute how many identical pieces (a x b) fit in sheet (L x W) allowing rotation
function piecesFitInSheet(L, W, a, b, allowRotation = true) {
  const fit = Math.floor(L / a) * Math.floor(W / b)

  if (!allowRotation) return fit
  const fitRot = Math.floor(L / b) * Math.floor(W / a)

  return Math.max(fit, fitRot)
}

// Multi-piece withdraw that attempts to pack multiple requested pieces into raw sheets (consume leftovers first)
async function withdrawDimensionedPieces({
  materialId,
  reqLength,
  reqWidth,
  qty = 1,
  client = null,
  user = null,
  allowNegative = false,
  allowRotation = true,
  specificPieceId = null,
  forceNewSheet = false
}) {
  const db = await getDb()
  const { MaterialPiece, InventoryTransaction, Material, sequelize } = db

  // Validate input dimensions to prevent NaN
  if (!reqLength || !reqWidth || isNaN(Number(reqLength)) || isNaN(Number(reqWidth))) {
    throw new Error('Invalid dimensions: reqLength and reqWidth must be valid numbers')
  }

  // Validate materialId
  if (!materialId || isNaN(Number(materialId))) {
    throw new Error('Invalid materialId')
  }

  // Validate specificPieceId if provided
  if (specificPieceId !== null && specificPieceId !== undefined) {
    const validSpecificPieceId = Number(specificPieceId)

    if (isNaN(validSpecificPieceId)) {
      console.log(`Invalid specificPieceId: ${specificPieceId}, ignoring...`)
      specificPieceId = null
    } else {
      specificPieceId = validSpecificPieceId
    }
  }

  return await sequelize.transaction(async tx => {
    const material = await Material.findByPk(materialId, { transaction: tx, lock: tx.LOCK.UPDATE })

    if (!material) throw new Error('Material not found')

    let remaining = Number(qty || 1)
    const results = []

    // Use original dimensions for validation and virtual cutting if available
    const matL = Number(material.originalLength || 0)
    const matW = Number(material.originalWidth || 0)

    // Determine ordering based on dimension type
    const dimensionType = material.dimensionType || 'rectangular'
    let orderClause

    if (dimensionType === 'circular') {
      // For circular: Area = π × (diameter/2)² = π × r² × length
      orderClause = sequelize.literal('3.14159 * POW(width/2, 2) * length')
    } else {
      // For rectangular: Area = length × width
      orderClause = sequelize.literal('length * width')
    }

    console.log(
      `[withdrawDimensionedPieces] Material: ${material.id}, Stock: ${material.stock}, RefSize: ${matL}x${matW}, forceNewSheet: ${forceNewSheet}, dimensionType: ${dimensionType}`
    )

    // Validation: Ensure requested dimensions fit within the material's default sheet size
    if (matL > 0 && matW > 0) {
      const fitsNormal = reqLength <= matL && reqWidth <= matW
      const fitsRotated = allowRotation && reqLength <= matW && reqWidth <= matL

      if (!fitsNormal && !fitsRotated) {
        const err = new Error(`المقاس المطلوب (${reqLength}x${reqWidth}) أكبر من مقاس اللوح الأساسي (${matL}x${matW})`)

        err.code = 'INVALID_DIMENSIONS'
        throw err
      }
    }

    // 1) Consume from existing available leftovers (smallest area first) OR specific piece
    while (remaining > 0) {
      if (forceNewSheet && !specificPieceId) break

      let piece

      if (specificPieceId) {
        // If a specific piece is requested, we only try to use that one.
        // We verify it matches dimensions and is available.
        console.log(`Searching for specific piece #${specificPieceId}...`)
        piece = await MaterialPiece.findOne({
          where: {
            id: specificPieceId,
            materialId,
            status: 'available',
            [Op.or]: [
              { length: { [Op.gte]: reqLength }, width: { [Op.gte]: reqWidth } },
              ...(allowRotation ? [{ length: { [Op.gte]: reqWidth }, width: { [Op.gte]: reqLength } }] : [])
            ]
          },
          transaction: tx
        })

        if (!piece) {
          console.log(`Specific piece #${specificPieceId} not found or unavailable. Checking why...`)

          // Check if piece exists at all
          const pieceExists = await MaterialPiece.findByPk(specificPieceId, { transaction: tx })

          if (!pieceExists) {
            console.log(`Piece #${specificPieceId} does not exist in database`)
          } else if (pieceExists.status !== 'available') {
            console.log(`Piece #${specificPieceId} exists but status is '${pieceExists.status}', not 'available'`)
          } else if (pieceExists.materialId !== materialId) {
            console.log(
              `Piece #${specificPieceId} belongs to different material (${pieceExists.materialId} vs ${materialId})`
            )
          } else {
            console.log(
              `Piece #${specificPieceId} dimensions (${pieceExists.length}x${pieceExists.width}) don't fit request (${reqLength}x${reqWidth})`
            )
          }

          console.log(`Falling back to auto-search for available pieces...`)

          // Fall back to auto-search instead of throwing error
          piece = await MaterialPiece.findOne({
            where: {
              materialId,
              status: 'available',
              [Op.or]: [
                { length: { [Op.gte]: reqLength }, width: { [Op.gte]: reqWidth } },
                ...(allowRotation ? [{ length: { [Op.gte]: reqWidth }, width: { [Op.gte]: reqLength } }] : [])
              ]
            },
            order: [orderClause],
            transaction: tx
          })

          if (piece) {
            console.log(`Found alternative piece #${piece.id} (${piece.length}x${piece.width})`)
          }
        } else {
          console.log(`Found specific piece #${specificPieceId} (${piece.length}x${piece.width})`)
        }
      } else {
        // Auto-search for best fit
        piece = await MaterialPiece.findOne({
          where: {
            materialId,
            status: 'available',
            [Op.or]: [
              { length: { [Op.gte]: reqLength }, width: { [Op.gte]: reqWidth } },
              ...(allowRotation ? [{ length: { [Op.gte]: reqWidth }, width: { [Op.gte]: reqLength } }] : [])
            ]
          },
          order: [orderClause],
          transaction: tx
        })
      }

      if (!piece) {
        // If specific piece was requested but not found/valid (and logic didn't throw above), or auto-search found nothing
        if (specificPieceId) break // Should have thrown above, but purely for flow control
        break
      }

      const L = parseFloat(piece.length || 0)
      const W = parseFloat(piece.width || 0)
      const A = parseFloat(reqLength)
      const B = parseFloat(reqWidth)

      let usedLen,
        usedWid,
        isRotated = false

      if (L >= A && W >= B) {
        usedLen = A
        usedWid = B
      } else if (allowRotation && L >= B && W >= A) {
        usedLen = B
        usedWid = A
        isRotated = true
      } else {
        // Should not happen due to query, but safe break
        break
      }

      // Mark original remnant as used
      await piece.update({ status: 'used' }, { transaction: tx })

      // If this was a primary sheet (no parent), decrement material.stock
      if (!piece.parentPieceId && !piece.isLeftover) {
        const oldStock = Number(material.stock || 0)

        material.stock = oldStock - 1
        await material.save({ transaction: tx })
        console.log(
          `[withdrawDimensionedPieces] Piece #${piece.id} was a primary sheet. Stock: ${oldStock} -> ${material.stock}`
        )

        // Also record a 'cut' transaction for the raw sheet for traceability
        await InventoryTransaction.create(
          {
            materialId: Number(materialId),
            materialPieceId: Number(piece.id),
            change: -1,
            action: 'cut',
            source: client || 'order',
            reference: `cut from primary piece #${piece.id}`,
            user
          },
          { transaction: tx }
        )
      }

      // Create the piece for the client (consumed piece)
      const validReqLength = Number(reqLength)
      const validReqWidth = Number(reqWidth)
      const validMaterialId = Number(materialId)
      const validParentPieceId = Number(piece.id)

      if (isNaN(validReqLength) || isNaN(validReqWidth) || isNaN(validMaterialId) || isNaN(validParentPieceId)) {
        throw new Error(
          `Invalid dimensions for MaterialPiece: reqLength=${reqLength}, reqWidth=${reqWidth}, materialId=${materialId}, parentPieceId=${piece.id}`
        )
      }

      const clientPiece = await MaterialPiece.create(
        {
          materialId: validMaterialId,
          length: validReqLength,
          width: validReqWidth,
          quantity: 1,
          isLeftover: false,
          parentPieceId: validParentPieceId,
          status: client ? 'reserved' : 'available',
          clientId: client && typeof client === 'number' ? Number(client) : null // Link piece to client only if numeric
        },
        { transaction: tx }
      )

      // Record transaction
      await InventoryTransaction.create(
        {
          materialId: Number(materialId),
          materialPieceId: Number(clientPiece.id),
          change: 0,
          action: 'consume_leftover',
          source: client || 'order',
          reference: `cut ${reqLength}x${reqWidth} from piece ${piece.id}`,
          user
        },
        { transaction: tx }
      )

      // Calculate leftovers
      const leftovers = []

      // right strip
      if (L - usedLen > 0) leftovers.push({ length: L - usedLen, width: W })

      // bottom strip (under the used part)
      if (W - usedWid > 0) leftovers.push({ length: usedLen, width: W - usedWid })

      console.log('=== LEFTOVER DEBUG ===')
      console.log('Original piece:', piece.id, 'dimensions:', L, '×', W)
      console.log('Requested:', usedLen, '×', usedWid)
      console.log('L - usedLen =', L - usedLen, ', W - usedWid =', W - usedWid)
      console.log('Calculated leftovers:', leftovers)

      const createdLeftovers = []

      for (const lf of leftovers) {
        if (lf.length > 0 && lf.width > 0) {
          const validLfLength = Number(lf.length)
          const validLfWidth = Number(lf.width)
          const validMaterialId = Number(materialId)
          const validParentPieceId = Number(piece.id)

          if (isNaN(validLfLength) || isNaN(validLfWidth) || isNaN(validMaterialId) || isNaN(validParentPieceId)) {
            console.error(
              `Skipping leftover with invalid dimensions: length=${lf.length}, width=${lf.width}, materialId=${materialId}, parentPieceId=${piece.id}`
            )
            continue
          }

          const np = await MaterialPiece.create(
            {
              materialId: validMaterialId,
              length: validLfLength,
              width: validLfWidth,
              quantity: 1,
              isLeftover: true,
              parentPieceId: validParentPieceId,
              status: 'available'
            },
            { transaction: tx }
          )

          createdLeftovers.push(np)

          await InventoryTransaction.create(
            {
              materialId: Number(materialId),
              materialPieceId: Number(np.id),
              change: 0,
              action: 'cut_leftover',
              source: 'cut_remnant',
              reference: `leftover from ${piece.id}`,
              user
            },
            { transaction: tx }
          )
        }
      }

      results.push({
        consumedPiece: clientPiece.toJSON ? clientPiece.toJSON() : clientPiece,
        leftovers: createdLeftovers.map(l => (l.toJSON ? l.toJSON() : l))
      })
      remaining -= 1
    }

    if (remaining <= 0) return { results }

    // 2) Use raw sheets and cut multiple pieces per sheet when possible
    const rawSheets = await MaterialPiece.findAll({
      where: { materialId, parentPieceId: null, status: { [Op.in]: ['available', 'leftover'] } },
      order: [['createdAt', 'ASC']],
      transaction: tx
    })

    for (const raw of rawSheets) {
      if (remaining <= 0) break
      const L = parseFloat(raw.length || 0)
      const W = parseFloat(raw.width || 0)
      const A = parseFloat(reqLength)
      const B = parseFloat(reqWidth)

      // compute how many fit on this sheet
      const perSheet = piecesFitInSheet(L, W, A, B, allowRotation)

      if (perSheet <= 0) continue

      const cutCount = Math.min(perSheet, remaining)

      // record consumption of the raw sheet (stock -1)
      const newStockAfterConsume = Number(material.stock || 0) - 1

      // If stock is exactly zero, mark as empty and block
      if (Number(material.stock || 0) === 0 && !allowNegative) {
        await InventoryTransaction.create(
          {
            materialId: Number(materialId),
            materialPieceId: Number(raw.id),
            change: 0,
            action: 'stock_empty',
            source: client || 'order',
            reference: 'نفذ المخزون',
            user
          },
          { transaction: tx }
        )
        const err = new Error('نفذ المخزون')

        err.code = 'STOCK_EMPTY'
        throw err
      }

      if (newStockAfterConsume < 0 && !allowNegative) {
        const err = new Error('Consuming this sheet would produce negative stock; set allowNegative=true to override')

        err.code = 'NEGATIVE_STOCK'
        throw err
      }

      await InventoryTransaction.create(
        {
          materialId: Number(materialId),
          materialPieceId: Number(raw.id),
          change: -1,
          action: 'cut',
          source: client || 'order',
          reference: `cut ${A}x${B} x${cutCount} from raw ${raw.id}`,
          user
        },
        { transaction: tx }
      )

      // mark raw as used
      await raw.update({ status: 'used' }, { transaction: tx })

      // For simplicity, we will create 'cutCount' consumed piece records (reserved if client) and create leftover pieces from used grid
      const nCols = Math.floor(L / A)
      const nRows = Math.floor(W / B)
      let usedCols = Math.min(nCols, cutCount)
      let usedRows = Math.ceil(cutCount / nCols)

      if (usedCols <= 0) {
        // try rotated orientation
        const nColsR = Math.floor(L / B)
        const nRowsR = Math.floor(W / A)

        usedCols = Math.min(nColsR, cutCount)
        usedRows = Math.ceil(cutCount / nColsR)
      }

      // create consumed pieces
      for (let i = 0; i < cutCount; i++) {
        const validA = Number(A)
        const validB = Number(B)
        const validMaterialId = Number(materialId)
        const validRawId = Number(raw.id)

        if (isNaN(validA) || isNaN(validB) || isNaN(validMaterialId) || isNaN(validRawId)) {
          throw new Error(
            `Invalid values for MaterialPiece: A=${A}, B=${B}, materialId=${materialId}, raw.id=${raw.id}`
          )
        }

        const cp = await MaterialPiece.create(
          {
            materialId: validMaterialId,
            length: validA,
            width: validB,
            quantity: 1,
            isLeftover: false,
            parentPieceId: validRawId,
            status: client ? 'reserved' : 'available'
          },
          { transaction: tx }
        )

        // Decrement raw.quantity if raw tracks multiple identical sheets
        const rawQty = Number(raw.quantity || 1)
        const newRawQty = rawQty - 1

        if (newRawQty <= 0) {
          await raw.update({ quantity: 0, status: 'used' }, { transaction: tx })
        } else {
          await raw.update({ quantity: newRawQty }, { transaction: tx })
        }

        // If reserved for client, add permit transaction
        if (client) {
          await InventoryTransaction.create(
            {
              materialId: Number(materialId),
              materialPieceId: Number(cp.id),
              change: 0,
              action: 'permit',
              source: 'client',
              reference: String(client),
              user
            },
            { transaction: tx }
          )
        }

        results.push({ consumedPiece: cp.toJSON ? cp.toJSON() : cp, leftovers: [], _rawId: raw.id })
        remaining -= 1
      }

      // compute leftovers from grid used area
      const usedWidth = usedCols * A
      const usedHeight = usedRows * B
      const leftovers = []

      // right strip
      if (L - usedWidth > 0) leftovers.push({ length: L - usedWidth, width: W })

      // bottom strip (only the part under the used area, not full width)
      if (W - usedHeight > 0) leftovers.push({ length: L, width: W - usedHeight })

      const createdLeftovers = []

      for (const lf of leftovers) {
        const lfLength = Number(lf.length)
        const lfWidth = Number(lf.width)
        const validMaterialId = Number(materialId)
        const validRawId = Number(raw.id)

        if (lfLength <= 0 || lfWidth <= 0) continue

        if (isNaN(lfLength) || isNaN(lfWidth) || isNaN(validMaterialId) || isNaN(validRawId)) {
          console.error(
            `Skipping leftover with invalid values: length=${lfLength}, width=${lfWidth}, materialId=${materialId}, raw.id=${raw.id}`
          )
          continue
        }

        const np = await MaterialPiece.create(
          {
            materialId: validMaterialId,
            length: lfLength,
            width: lfWidth,
            quantity: 1,
            isLeftover: true,
            parentPieceId: validRawId,
            status: 'available'
          },
          { transaction: tx }
        )

        // Defensive enforcement
        await np.update({ isLeftover: true, status: 'available' }, { transaction: tx })
        await InventoryTransaction.create(
          {
            materialId: Number(materialId),
            materialPieceId: Number(np.id),
            change: 0,
            action: 'cut_leftover',
            source: 'cut_grid',
            reference: `leftover from ${raw.id}`,
            user
          },
          { transaction: tx }
        )
        createdLeftovers.push(np)
        console.log(
          `withdrawDimensionedPieces (raw ${raw.id}): created leftover ${np.id} isLeftover=${np.isLeftover} status=${np.status}`
        )
      }

      // fallback: if leftovers expected but none created, create a fallback single leftover strip
      if (leftovers.length > 0 && createdLeftovers.length === 0) {
        const fbLen = Number(L - usedWidth > 0 ? L - usedWidth : (leftovers[0] && leftovers[0].length) || 0)
        const fbWid = Number(W - usedHeight > 0 ? W - usedHeight : (leftovers[0] && leftovers[0].width) || 0)
        const validMaterialId = Number(materialId)
        const validRawId = Number(raw.id)

        if (fbLen > 0 && fbWid > 0 && !isNaN(fbLen) && !isNaN(fbWid) && !isNaN(validMaterialId) && !isNaN(validRawId)) {
          const np = await MaterialPiece.create(
            {
              materialId: validMaterialId,
              length: fbLen,
              width: fbWid,
              quantity: 1,
              isLeftover: true,
              parentPieceId: validRawId,
              status: 'available'
            },
            { transaction: tx }
          )

          await InventoryTransaction.create(
            {
              materialId: Number(materialId),
              materialPieceId: Number(np.id),
              change: 0,
              action: 'cut_leftover',
              source: 'cut_grid',
              reference: `fallback leftover from ${raw.id}`,
              user
            },
            { transaction: tx }
          )
          createdLeftovers.push(np)
          console.warn(`withdrawDimensionedPieces (raw ${raw.id}): created fallback leftover ${np.id}`)
        }
      }

      // decrement material stock by 1 for this raw sheet
      material.stock = newStockAfterConsume

      // attach leftovers to last result group for visibility
      if (createdLeftovers.length > 0) {
        results[results.length - 1].leftovers = createdLeftovers.map(l => (l.toJSON ? l.toJSON() : l))
      }

      await material.save({ transaction: tx })
    }

    // If still remaining after using available raw sheets, create virtual consumes (virtual pieces + decrement stock per piece)
    while (remaining > 0) {
      const validReqLength = Number(reqLength)
      const validReqWidth = Number(reqWidth)
      const validMaterialId = Number(materialId)

      if (isNaN(validReqLength) || isNaN(validReqWidth) || isNaN(validMaterialId)) {
        throw new Error(
          `Invalid values for virtual MaterialPiece: reqLength=${reqLength}, reqWidth=${reqWidth}, materialId=${materialId}`
        )
      }

      const virtual = await MaterialPiece.create(
        {
          materialId: validMaterialId,
          length: validReqLength,
          width: validReqWidth,
          quantity: 1,
          isLeftover: false,
          parentPieceId: null,
          status: client ? 'reserved' : 'available'
        },
        { transaction: tx }
      )

      // verify material stock permission
      const newStockAfterConsumeVirtual = Number(material.stock || 0) - 1

      if (newStockAfterConsumeVirtual < 0 && !allowNegative) {
        const err = new Error('Consuming this piece would produce negative stock; set allowNegative=true to override')

        err.code = 'NEGATIVE_STOCK'
        throw err
      }

      await InventoryTransaction.create(
        {
          materialId: Number(materialId),
          materialPieceId: Number(virtual.id),
          change: -1,
          action: client ? 'permit' : 'withdraw_virtual',
          source: client || 'order',
          reference: `virtual consume ${reqLength}x${reqWidth}`,
          user
        },
        { transaction: tx }
      )

      material.stock = newStockAfterConsumeVirtual
      await material.save({ transaction: tx })

      if (client) {
        // also create permit transaction with reference
        await InventoryTransaction.create(
          {
            materialId: Number(materialId),
            materialPieceId: Number(virtual.id),
            change: 0,
            action: 'permit',
            source: 'client',
            reference: String(client),
            user
          },
          { transaction: tx }
        )
      }

      // Generate leftovers from virtual stock if default dimensions are known
      const createdLeftovers = []

      if (matL > 0 && matW > 0) {
        // Determine rotation
        let usedLen = reqLength
        let usedWid = reqWidth

        if (reqLength > matL || reqWidth > matW) {
          // Must be rotated (validation already passed)
          usedLen = reqWidth
          usedWid = reqLength
        }

        const leftovers = []

        // right strip
        if (matL - usedLen > 0) leftovers.push({ length: matL - usedLen, width: matW })

        // bottom strip (under the used part)
        if (matW - usedWid > 0) leftovers.push({ length: usedLen, width: matW - usedWid })

        for (const lf of leftovers) {
          if (lf.length > 0 && lf.width > 0) {
            const validLfLength = Number(lf.length)
            const validLfWidth = Number(lf.width)
            const validMaterialId = Number(materialId)
            const validVirtualId = Number(virtual.id)

            if (isNaN(validLfLength) || isNaN(validLfWidth) || isNaN(validMaterialId) || isNaN(validVirtualId)) {
              console.error(
                `Skipping virtual leftover with invalid values: length=${lf.length}, width=${lf.width}, materialId=${materialId}, virtual.id=${virtual.id}`
              )
              continue
            }

            const np = await MaterialPiece.create(
              {
                materialId: validMaterialId,
                length: validLfLength,
                width: validLfWidth,
                quantity: 1,
                isLeftover: true,
                parentPieceId: validVirtualId,
                status: 'available'
              },
              { transaction: tx }
            )

            createdLeftovers.push(np)

            await InventoryTransaction.create(
              {
                materialId: Number(materialId),
                materialPieceId: Number(np.id),
                change: 0,
                action: 'cut_leftover',
                source: 'virtual_cut',
                reference: `leftover from virtual ${virtual.id}`,
                user
              },
              { transaction: tx }
            )
          }
        }
      }

      results.push({
        consumedPiece: virtual.toJSON ? virtual.toJSON() : virtual,
        leftovers: createdLeftovers.map(l => (l.toJSON ? l.toJSON() : l))
      })
      remaining -= 1
    }

    return { results }
  })
}

// Keep withdrawPieces alias pointing to multi-piece implementation
const withdrawPieces = withdrawDimensionedPieces

module.exports = { withdrawDimensionedPiece, withdrawRaw, withdrawPieces, withdrawDimensionedPieces, withdrawByCount }
