async function main() {
  const modelsModule = require('../models')
  const db = await modelsModule.getDb()
  const { Safe, SafeEntry, sequelize } = db

  // Ensure there's a personal safe
  let personal = await Safe.findOne({ where: { name: 'Personal Safe' } })

  if (!personal) {
    personal = await Safe.create({ name: 'Personal Safe', type: 'personal', isDefault: false })
    console.log('Created Personal Safe:', personal.id)
  }

  const main = await Safe.findOne({ where: { isDefault: true } })

  if (!main) throw new Error('No main safe exists')

  const t = await sequelize.transaction()

  try {
    const amount = 50.0
    const txRef = `script-transfer:${Date.now()}`

    const out = await SafeEntry.create(
      {
        date: new Date(),
        description: 'Test withdrawal to main',
        outgoing: amount,
        outgoingMethod: 'transfer',
        outgoingTxn: txRef,
        entryType: 'transfer',
        safeId: personal.id,
        targetSafeId: main.id
      },
      { transaction: t }
    )

    const inp = await SafeEntry.create(
      {
        date: new Date(),
        description: 'Test deposit from personal',
        incoming: amount,
        incomingMethod: 'transfer',
        incomingTxn: txRef,
        entryType: 'transfer',
        safeId: main.id,
        targetSafeId: personal.id
      },
      { transaction: t }
    )

    await t.commit()
    console.log('Transfer test successful', out.id, inp.id)
  } catch (err) {
    await t.rollback()
    console.error('Transfer test failed', err)
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit())
    .catch(e => {
      console.error(e)
      process.exit(1)
    })
}
