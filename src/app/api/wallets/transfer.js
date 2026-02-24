import { NextResponse } from 'next/server'

let Wallet, WalletTransaction, Safe, sequelize

async function init() {
  if (!Wallet) {
    const modelsModule = require('../../../../models')
    const models = await modelsModule.getDb()

    Wallet = models.Wallet
    WalletTransaction = models.WalletTransaction
    Safe = models.Safe
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
    const { fromWalletId, toWalletId, toSafeId, amount, description } = body

    if (!fromWalletId || (!toWalletId && !toSafeId) || !amount || parseFloat(amount) <= 0)
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

    // Read wallet with only DB columns present
    const qi = sequelize.getQueryInterface()
    const tableDef = await qi.describeTable('wallets')
    const attrs = tableDef ? Object.keys(tableDef) : undefined

    const fromWallet = await Wallet.findByPk(fromWalletId, { attributes: attrs, transaction: null })

    if (!fromWallet) return NextResponse.json({ error: 'From wallet not found' }, { status: 404 })

    if (fromWallet.ownerId !== user.id)
      return NextResponse.json({ error: 'You do not own the source wallet' }, { status: 403 })

    // no password re-auth required for transfers — simplified flow

    const t = await sequelize.transaction()

    try {
      const amt = Number(amount)
      const currentBalance = Number(fromWallet.balance || 0)

      if (currentBalance < amt) {
        await t.rollback()

        return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 })
      }

      // deduct
      await fromWallet.update({ balance: (currentBalance - amt).toFixed(2) }, { transaction: t })
      const txRef = `wallet-tx-${Date.now()}`

      const WT = sequelize.models.WalletTransaction

      await WT.create(
        {
          walletId: fromWalletId,
          type: 'withdraw',
          amount: amt,
          description,
          relatedWalletId: toWalletId || null,
          relatedSafeId: toSafeId || null,
          txRef,
          initiatedBy: user.id
        },
        { transaction: t }
      )

      let inTx = null

      if (toWalletId) {
        const toWallet = await Wallet.findByPk(toWalletId, { transaction: t })

        if (!toWallet) {
          await t.rollback()

          return NextResponse.json({ error: 'Destination wallet not found' }, { status: 404 })
        }

        await toWallet.update({ balance: (Number(toWallet.balance || 0) + amt).toFixed(2) }, { transaction: t })
        inTx = await WT.create(
          { walletId: toWallet.id, type: 'deposit', amount: amt, description: `Transfer from wallet ${fromWalletId}` },
          { transaction: t }
        )
      }

      if (toSafeId) {
        // Create SafeEntry incoming record for that safe
        const SafeEntry = sequelize.models.SafeEntry
        const safe = await Safe.findByPk(toSafeId, { transaction: t })

        if (!safe) {
          await t.rollback()

          return NextResponse.json({ error: 'Destination safe not found' }, { status: 404 })
        }

        // If destination is the Main Safe (isDefault), enforce that source wallet allows main-safe withdraw
        if (safe.isDefault) {
          // check whether wallet column exists
          const qi = sequelize.getQueryInterface()
          const tableDef = await qi.describeTable('wallets')

          if (!tableDef || !tableDef.allowMainSafeWithdraw) {
            await t.rollback()

            return NextResponse.json(
              { error: 'Server: enable allowMainSafeWithdraw column (run migrations) to allow transfers to Main Safe' },
              { status: 500 }
            )
          }

          if (!fromWallet.allowMainSafeWithdraw) {
            await t.rollback()

            return NextResponse.json(
              { error: 'This wallet is not permitted to transfer to the Main Safe' },
              { status: 403 }
            )
          }
        }

        const tx = `wallet2safe-${Date.now()}`

        await SafeEntry.create(
          {
            date: new Date(),
            description: description || `Deposit from wallet ${fromWalletId}`,
            incoming: amt,
            incomingMethod: 'wallet',
            incomingTxn: tx,
            entryType: 'incoming',
            safeId: toSafeId
          },
          { transaction: t }
        )
      }

      await t.commit()

      return NextResponse.json({ success: true })
    } catch (err) {
      await t.rollback()
      throw err
    }
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
