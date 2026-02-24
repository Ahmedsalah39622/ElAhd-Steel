import { NextResponse } from 'next/server'
let WalletV2, WT, sequelize

async function init() {
  if (!WalletV2) {
    const modelsModule = require('../../../../../models')
    const models = await modelsModule.getDb()
    WalletV2 = models.WalletV2
    WT = models.WalletTransaction
    sequelize = models.sequelize
  }
}

function verifyTokenAndGetEmail(token) {
  try { const jwt = require('jsonwebtoken'); const secret = process.env.JWT_SECRET || 'dev-jwt-secret'; const payload = jwt.verify(token, secret); return payload && payload.email ? payload.email : null } catch (e) { return null }
}

export async function POST(req) {
  try {
    await init()
    const body = await req.json()
    const { walletId, amount, description, password } = body
    if (!walletId || !amount || Number(amount) <= 0) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

    // auth
    let currentEmail = null
    try { const h = req.headers.get('authorization') || ''; if (h && h.startsWith('Bearer ')) currentEmail = verifyTokenAndGetEmail(h.slice(7)) } catch(e){}
    if (!currentEmail) {
      try { const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'token'; const cookieHeader = req.headers.get('cookie') || ''; const match = cookieHeader.split(';').map(c=>c.trim()).find(c=>c.startsWith(`${COOKIE_NAME}=`)); if (match) currentEmail = verifyTokenAndGetEmail(match.split('=')[1]) } catch(e){}
    }
    if (!currentEmail) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const User = sequelize.models.User
    const user = await User.findOne({ where: { email: currentEmail } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 401 })

    const w = await WalletV2.findByPk(walletId)
    if (!w) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    if (w.ownerId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // require password if wallet requires it
    if (w.requirePasswordAccess && !password) return NextResponse.json({ error: 'Password required' }, { status: 401 })
    if (w.requirePasswordAccess) {
      const bcrypt = require('bcryptjs')
      const ok = await bcrypt.compare(password, user.password)
      if (!ok) return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    const t = await sequelize.transaction()
    try {
      const newBalance = Number(w.balance || 0) + Number(amount)
      await w.update({ balance: newBalance }, { transaction: t })
      const tx = await WT.create({ walletId, type: 'deposit', amount, description, initiatedBy: user.id, txRef: `walletv2-dep-${Date.now()}` }, { transaction: t })
      await t.commit()
      return NextResponse.json({ success: true, wallet: w, tx })
    } catch (e) { await t.rollback(); throw e }
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
