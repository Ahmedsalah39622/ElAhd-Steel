import { NextResponse } from 'next/server'

let Wallet, sequelize

async function init() {
  if (!Wallet) {
    const modelsModule = require('../../../../models')
    const models = await modelsModule.getDb()

    Wallet = models.Wallet
    sequelize = models.sequelize
  }
}

function verifyTokenAndGetEmail(token) {
  try {
    const jwt = require('jsonwebtoken')
    const secret = process.env.JWT_SECRET || 'dev-jwt-secret'
    const payload = jwt.verify(token, secret)

    return payload && payload.email ? payload.email : null
  } catch (e) {
    return null
  }
}

export async function POST(req) {
  try {
    await init()
    const body = await req.json()
    const { walletId, amount, description } = body

    if (!walletId || !amount || parseFloat(amount) <= 0)
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

    // identify user from Authorization header or cookie
    let currentEmail = null

    try {
      const authHeader = req.headers.get('authorization') || ''

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7)

        currentEmail = verifyTokenAndGetEmail(token)
      }
    } catch (e) {}

    if (!currentEmail) {
      try {
        const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'token'
        const cookieHeader = req.headers.get('cookie') || ''
        const match = cookieHeader
          .split(';')
          .map(c => c.trim())
          .find(c => c.startsWith(`${COOKIE_NAME}=`))

        if (match) {
          const token = match.split('=')[1]

          currentEmail = verifyTokenAndGetEmail(token)
        }
      } catch (e) {}
    }

    if (!currentEmail) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const User = sequelize.models.User
    const user = await User.findOne({ where: { email: currentEmail } })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 401 })

    // Read only existing wallet columns to avoid selecting missing columns
    const qi = sequelize.getQueryInterface()
    const tableDef = await qi.describeTable('wallets')
    const attrs = tableDef ? Object.keys(tableDef) : undefined

    const wallet = await Wallet.findByPk(walletId, { attributes: attrs })

    if (!wallet) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })

    if (wallet.ownerId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // no password re-auth required — simplified flow per request

    const t = await sequelize.transaction()

    try {
      // update wallet balance
      const newBalance = Number(wallet.balance || 0) + Number(amount)

      await wallet.update({ balance: newBalance }, { transaction: t })

      // create transaction entry
      const WT = sequelize.models.WalletTransaction
      const tx = await WT.create(
        { walletId, type: 'deposit', amount, description, initiatedBy: user.id, txRef: `wallet-dep-${Date.now()}` },
        { transaction: t }
      )

      await t.commit()

      return NextResponse.json({ success: true, wallet, tx })
    } catch (err) {
      await t.rollback()
      throw err
    }
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
