#!/usr/bin/env node
/*
  Script: create-wallets-for-existing-clients.js
  Usage:
    node scripts/create-wallets-for-existing-clients.js --ownerId=1
    OWNER_ID=1 node scripts/create-wallets-for-existing-clients.js

  This script finds clients with budget > 0 and creates a Wallet for the provided ownerId
  if a wallet with the name `محفظة ${client.name}` does not already exist.
*/

const args = process.argv.slice(2)
const argMap = {}
args.forEach(a => {
  const m = a.match(/^--([^=]+)=?(.*)/)
  if (m) argMap[m[1]] = m[2] || ''
})

const ownerId = process.env.OWNER_ID || argMap.ownerId || argMap.owner || null

async function main() {
  if (!ownerId) {
    console.error('Error: ownerId is required. Pass --ownerId=1 or set OWNER_ID=1')
    process.exit(1)
  }

  try {
    // Use models/getDb directly to avoid ES module import issues
    const modelsModule = require('../models')
    const db = await modelsModule.getDb()
    // ensure connection
    await db.sequelize.authenticate()
    const { Client, Wallet, Sequelize } = db
    const { Op } = Sequelize

    const clients = await Client.findAll({ where: { budget: { [Op.gt]: 0 } } })

    if (!clients || clients.length === 0) {
      console.log('No clients found with budget > 0')
      return
    }

    const created = []

    for (const c of clients) {
      const client = c.get ? c.get({ plain: true }) : c
      const walletName = `محفظة ${client.name}`

      const exists = await Wallet.findOne({ where: { ownerId: Number(ownerId), name: walletName } })
      if (exists) {
        console.log(`Skipping existing wallet for client: ${client.name}`)
        continue
      }

      const balance = Number(client.budget || 0)

      const w = await Wallet.create({ ownerId: Number(ownerId), name: walletName, balance })
      created.push(w.get ? w.get({ plain: true }) : w)
      console.log(`Created wallet for ${client.name} with balance ${balance}`)
    }

    console.log('\nDone. Created wallets count:', created.length)
  } catch (err) {
    console.error('Script failed:', err && err.message ? err.message : err)
    process.exit(2)
  }
}

main()
