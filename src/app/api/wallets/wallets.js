import { NextResponse } from 'next/server'
import { checkAuth } from '@/utils/auth'

let Wallet, sequelize

async function init() {
  if (!Wallet) {
    const modelsModule = require('../../../../models')
    const models = await modelsModule.getDb()

    Wallet = models.Wallet
    sequelize = models.sequelize
  }
}

export async function GET(req) {
  const auth = checkAuth(req)
  if (!auth.authenticated) return auth.response

  try {
    await init()
    const currentEmail = auth.user.email

    const User = sequelize.models.User
    const user = await User.findOne({ where: { email: currentEmail } })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 401 })

    // Only request columns that actually exist in DB to avoid errors when migrations are pending
    const qi = sequelize.getQueryInterface()
    const tableDef = await qi.describeTable('wallets')
    const attrs = tableDef ? Object.keys(tableDef) : undefined
    const wallets = await Wallet.findAll({ where: { ownerId: user.id }, attributes: attrs })

    return NextResponse.json(wallets)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req) {
  const auth = checkAuth(req)
  if (!auth.authenticated) return auth.response

  try {
    await init()
    const body = await req.json()
    const { name, allowMainSafeWithdraw } = body

    const currentEmail = auth.user.email

    const User = sequelize.models.User
    const user = await User.findOne({ where: { email: currentEmail } })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 401 })

    // Only set allowMainSafeWithdraw if the column exists in DB (migration may not have been applied yet)
    const qi = sequelize.getQueryInterface()
    const tableDef = await qi.describeTable('wallets')
    const payload = { ownerId: user.id, name: name || 'Personal Wallet', balance: 0 }

    if (tableDef && tableDef.allowMainSafeWithdraw) payload.allowMainSafeWithdraw = !!allowMainSafeWithdraw

    try {
      // Only insert the fields that are present in payload to avoid inserting attributes the DB may not have
      const w = await Wallet.create(payload, { fields: Object.keys(payload) })

      return NextResponse.json(w, { status: 201 })
    } catch (dbErr) {
      // Handle case where model has a column not present in DB
      if (dbErr && dbErr.original && dbErr.original.code === 'ER_BAD_FIELD_ERROR') {
        return NextResponse.json(
          { error: 'Database schema mismatch: missing column. Please run migrations (db:migrate)' },
          { status: 500 }
        )
      }

      throw dbErr
    }
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
