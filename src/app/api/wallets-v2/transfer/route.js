import { NextResponse } from 'next/server'
let WalletV2, WT, Safe, SafeEntry, sequelize

async function init() {
  if (!WalletV2) {
    const modelsModule = require('../../../../../models')
    const models = await modelsModule.getDb()
    WalletV2 = models.WalletV2
    WT = models.WalletTransaction
    Safe = models.Safe
    SafeEntry = models.SafeEntry
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
    const { fromWalletId, toWalletId, toSafeId, amount, description, password } = body
    if (!fromWalletId || (!toWalletId && !toSafeId) || !amount || Number(amount) <= 0) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

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

    const fromWallet = await WalletV2.findByPk(fromWalletId)
    if (!fromWallet) return NextResponse.json({ error: 'From wallet not found' }, { status: 404 })
    if (fromWallet.ownerId !== user.id) return NextResponse.json({ error: 'You do not own the source wallet' }, { status: 403 })

    // require password if wallet requires it
    if (fromWallet.requirePasswordAccess && !password) return NextResponse.json({ error: 'Password required' }, { status: 401 })
    if (fromWallet.requirePasswordAccess) {
      const bcrypt = require('bcryptjs')
      const valid = await bcrypt.compare(password, user.password)
      if (!valid) return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    const t = await sequelize.transaction()
    try {
      const amt = Number(amount)
      const currentBalance = Number(fromWallet.balance || 0)
      if (currentBalance < amt) { await t.rollback(); return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 }) }

      await fromWallet.update({ balance: (currentBalance - amt).toFixed(2) }, { transaction: t })
      const txRef = `walletv2-tx-${Date.now()}`
      await WT.create({ walletId: fromWalletId, type: 'withdraw', amount: amt, description, relatedWalletId: toWalletId || null, relatedSafeId: toSafeId || null, txRef, initiatedBy: user.id }, { transaction: t })

      if (toWalletId) {
        const toWallet = await WalletV2.findByPk(toWalletId, { transaction: t })
        if (!toWallet) { await t.rollback(); return NextResponse.json({ error: 'Destination wallet not found' }, { status: 404 }) }
        await toWallet.update({ balance: (Number(toWallet.balance || 0) + amt).toFixed(2) }, { transaction: t })
        await WT.create({ walletId: toWallet.id, type: 'deposit', amount: amt, description: `Transfer from wallet ${fromWalletId}`, initiatedBy: user.id }, { transaction: t })
      }

      if (toSafeId) {
        const safe = await Safe.findByPk(toSafeId, { transaction: t })
        if (!safe) { await t.rollback(); return NextResponse.json({ error: 'Destination safe not found' }, { status: 404 }) }

        // enforce allowMainSafeWithdraw when depositing to main safe
        if (safe.isDefault) {
          if (!fromWallet.allowMainSafeWithdraw) { await t.rollback(); return NextResponse.json({ error: 'This wallet is not permitted to transfer to the Main Safe' }, { status: 403 }) }
        }

        const tx = `walletv2-to-safe-${Date.now()}`
        await SafeEntry.create({ date: new Date(), description: description || `Deposit from wallet ${fromWalletId}`, incoming: amt, incomingMethod: 'wallet', incomingTxn: tx, entryType: 'incoming', safeId: toSafeId }, { transaction: t })
      }

      await t.commit()
      return NextResponse.json({ success: true })
    } catch (e) { await t.rollback(); throw e }
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
