const { setupInMemoryDb } = require('./setupTestDb')

let db
let inventoryService

beforeAll(async () => {
  const res = await setupInMemoryDb([
    '../../models/material.js',
    '../../models/materialpiece.js',
    '../../models/inventorytransaction.js'
  ])

  db = {
    Material: res.models.Material,
    MaterialPiece: res.models.MaterialPiece,
    InventoryTransaction: res.models.InventoryTransaction,
    sequelize: res.sequelize
  }

  // inject our in-memory getDb into require cache so services use it
  const modelsPath = require.resolve('../../models')
  require.cache[modelsPath] = { exports: { getDb: async () => db } }

  // require the service after injecting the mock
  inventoryService = require('../src/services/inventoryService')
})

afterAll(async () => {
  if (db && db.sequelize) await db.sequelize.close()
})

test('consuming a leftover piece does not change material stock', async () => {
  const { Material, MaterialPiece, InventoryTransaction } = db

  const mat = await Material.create({ name: 'TestMat', stock: 5 })
  const piece = await MaterialPiece.create({ materialId: mat.id, length: 100, width: 100, quantity: 1, isLeftover: true, status: 'available' })

  const res = await inventoryService.withdrawDimensionedPiece({ materialId: mat.id, reqLength: 50, reqWidth: 50, client: 'cli1', user: 'testuser' })

  // consumed piece should be the existing leftover
  expect(res.consumedPiece.id).toBe(piece.id)

  // material stock unchanged
  const mat2 = await Material.findByPk(mat.id)
  expect(Number(mat2.stock)).toBe(5)

  // piece marked used
  const piece2 = await MaterialPiece.findByPk(piece.id)
  expect(piece2.status).toBe('used')

  // transaction should exist with change 0 and action consume_piece
  const txs = await InventoryTransaction.findAll({ where: { materialPieceId: piece.id } })
  expect(txs.length).toBeGreaterThan(0)
  const found = txs.find(t => t.action === 'consume_piece')
  expect(found).toBeDefined()
  expect(Number(found.change)).toBe(0)
})

test('consuming when no suitable leftover decrements stock', async () => {
  const { Material, MaterialPiece, InventoryTransaction } = db

  const mat = await Material.create({ name: 'RawMat', stock: 3 })

  // ensure no leftovers exist
  const res = await inventoryService.withdrawDimensionedPiece({ materialId: mat.id, reqLength: 1000, reqWidth: 1000, client: 'cli2', user: 'testuser', allowNegative: true })

  // should produce a virtual consumed piece
  expect(res.consumedPiece).toBeDefined()

  const mat2 = await Material.findByPk(mat.id)
  expect(Number(mat2.stock)).toBe(2) // decreased by one

  const txs = await InventoryTransaction.findAll({ where: { materialId: mat.id } })
  const delTx = txs.find(t => Number(t.change) < 0)
  expect(delTx).toBeDefined()
})

test('packing-first cuts multiple pieces from a single raw sheet when possible and updates parent quantity', async () => {
  const { Material, MaterialPiece } = db

  const mat = await Material.create({ name: 'PackMat', stock: 1 })
  // create a single raw sheet 120x120 with quantity 2 (two sheets)
  const raw = await MaterialPiece.create({ materialId: mat.id, length: 120, width: 120, quantity: 2, isLeftover: false, parentPieceId: null, status: 'available' })

  const res = await inventoryService.withdrawDimensionedPieces({ materialId: mat.id, reqLength: 60, reqWidth: 60, qty: 2, client: 'cli3', user: 'tester' })

  expect(res.results.length).toBe(2)

  // parent raw quantity should be decremented (was 2 -> expect 0 or 1 depending on packing)
  const rawAfter = await MaterialPiece.findByPk(raw.id)
  expect(Number(rawAfter.quantity)).toBeLessThanOrEqual(1)

  // stock should be decreased by 1 (one raw sheet used)
  const m2 = await Material.findByPk(mat.id)
  expect(Number(m2.stock)).toBe(0)

  // leftovers should be created (one or more strips) and be available
  const leftovers = await MaterialPiece.findAll({ where: { materialId: mat.id, isLeftover: true } })
  expect(leftovers.length).toBeGreaterThan(0)
  expect(leftovers.find(l => l.status === 'available')).toBeDefined()
})

test('rotation allowed packs more pieces when rotated fit better', async () => {
  const { Material, MaterialPiece } = db

  const mat = await Material.create({ name: 'RotMat', stock: 1 })
  // sheet 90x120
  const raw = await MaterialPiece.create({ materialId: mat.id, length: 90, width: 120, quantity: 1, isLeftover: false, parentPieceId: null, status: 'available' })

  // requesting 2 pieces of 80x60; without rotation only 1 fits, with rotation 2 fit
  const res = await inventoryService.withdrawDimensionedPieces({ materialId: mat.id, reqLength: 80, reqWidth: 60, qty: 2, client: 'cli4', user: 'tester' })

  expect(res.results.length).toBe(2)
  const m2 = await Material.findByPk(mat.id)
  expect(Number(m2.stock)).toBe(0)
})

test('cutting 20x20 from 50x50 creates available leftovers and decrements stock', async () => {
  const { Material, MaterialPiece } = db

  const mat = await Material.create({ name: 'CutMat', stock: 1 })
  const raw = await MaterialPiece.create({ materialId: mat.id, length: 50, width: 50, quantity: 1, isLeftover: false, parentPieceId: null, status: 'available' })

  const res = await inventoryService.withdrawDimensionedPiece({ materialId: mat.id, reqLength: 20, reqWidth: 20, client: 'cliX', user: 'tester' })

  expect(res.consumedPiece).toBeDefined()
  expect(Number(res.consumedPiece.parentPieceId)).toBe(raw.id)

  // leftovers should be created and available
  const leftovers = await MaterialPiece.findAll({ where: { materialId: mat.id, isLeftover: true } })
  expect(leftovers.length).toBeGreaterThan(0)
  expect(leftovers.find(l => l.status === 'available')).toBeDefined()

  // stock decremented by 1
  const m2 = await Material.findByPk(mat.id)
  expect(Number(m2.stock)).toBe(0)
})

test('throws STOCK_EMPTY when not allowed and stock is zero', async () => {
  const { Material, InventoryTransaction } = db
  const mat = await Material.create({ name: 'NoStock', stock: 0 })
  let threw = false
  try {
    await inventoryService.withdrawDimensionedPieces({ materialId: mat.id, reqLength: 100, reqWidth: 100, qty: 1, client: 'cli5', user: 'tester', allowNegative: false })
  } catch (err) {
    threw = true
    expect(err).toBeDefined()
    expect(err.code).toBe('STOCK_EMPTY')
    expect(err.message).toBe('نفذ المخزون')
  }
  expect(threw).toBe(true)

  // confirm a stock_empty transaction exists
  const txs = await InventoryTransaction.findAll({ where: { materialId: mat.id, action: 'stock_empty' } })
  expect(txs.length).toBeGreaterThan(0)
})
