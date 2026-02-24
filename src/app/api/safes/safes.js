import { NextResponse } from 'next/server'
import { checkAuth } from '@/utils/auth'

let Safe, sequelize

async function init() {
  if (!Safe) {
    const modelsModule = require('../../../../models')
    const models = await modelsModule.getDb()
    Safe = models.Safe
    sequelize = models.sequelize
  }
}

export async function GET(req) {
  const auth = checkAuth(req)
  if (!auth.authenticated) return auth.response

  try {
    await init()
    await sequelize.authenticate()
    const safes = await Safe.findAll({ order: [['id', 'ASC']] })
    return NextResponse.json(safes)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req) {
  const auth = checkAuth(req)
  if (!auth.authenticated) return auth.response

  try {
    await init()
    await sequelize.authenticate()
    const body = await req.json()
    const { name, type, isDefault } = body
    const safe = await Safe.create({ name, type, isDefault: !!isDefault })
    return NextResponse.json(safe, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
