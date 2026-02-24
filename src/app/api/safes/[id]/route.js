'use server'
import { NextResponse } from 'next/server'

let Safe, sequelize

async function initModels() {
  if (!Safe) {
    const modelsModule = require('../../../../../models')
    const models = await modelsModule.getDb()

    Safe = models.Safe
    sequelize = models.sequelize
  }
}

export async function GET(req, { params }) {
  try {
    await initModels()
    await sequelize.authenticate()
    const id = (await params).id
    const s = await Safe.findByPk(id)

    if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json(s)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(req, { params }) {
  try {
    await initModels()
    await sequelize.authenticate()
    const id = (await params).id
    const body = await req.json()
    const s = await Safe.findByPk(id)

    if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { name, type, isDefault } = body

    await s.update({ name: name ?? s.name, type: type ?? s.type, isDefault: isDefault ?? s.isDefault })

    // If isDefault set true, unset other safes
    if (isDefault) {
      await Safe.update({ isDefault: false }, { where: { id: { [sequelize.Op.ne]: s.id } } })
      await s.update({ isDefault: true })
    }

    return NextResponse.json(s)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

export async function DELETE(req, { params }) {
  try {
    await initModels()
    await sequelize.authenticate()
    const id = (await params).id
    const s = await Safe.findByPk(id)

    if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await s.destroy()

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
