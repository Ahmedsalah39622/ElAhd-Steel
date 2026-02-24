import { initializeDatabase } from '@/utils/db'
import { withAuth } from '@/utils/auth'

async function handler(req, res) {
  let Invoice, sequelize, prevStatus, prevTotal

  try {
    const db = await initializeDatabase()

    Invoice = db.Invoice
    sequelize = db.sequelize

    // Get available columns to be resilient to missing fields
    const rawCols = await sequelize.getQueryInterface().describeTable('invoices')
    Invoice.availableCols = Object.keys(rawCols)
  } catch (initErr) {
    console.error('Database initialization failed in /api/invoices:', initErr)
    return res.status(500).json({
      error: 'Database initialization failed',
      detail: String(initErr?.message || initErr)
    })
  }

  // Helper to get only columns that actually exist in DB
  const getSafeAttributes = (model) => {
    const modelAttrs = model.getAttributes()
    const dbCols = model.availableCols || []
    return Object.keys(modelAttrs).filter(attr => {
      const colName = modelAttrs[attr].field || attr
      return dbCols.some(c => c.toLowerCase() === colName.toLowerCase())
    })
  }

  const safeInvoiceAttrs = getSafeAttributes(Invoice)

  // Helper function to parse items if it's a string
  const parseInvoice = inv => {
    if (!inv) return inv
    const plain = inv && typeof inv.toJSON === 'function' ? inv.toJSON() : inv

    if (typeof plain.items === 'string') {
      try {
        plain.items = JSON.parse(plain.items)
      } catch (e) {
        // Keep as string if not valid JSON
      }
    }

    if (typeof plain.manufacturing === 'string') {
      try {
        plain.manufacturing = JSON.parse(plain.manufacturing)
      } catch (e) {}
    }

    return plain
  }

  if (req.method === 'GET') {
    const id = req.query?.id

    try {
      if (id) {
        const inv = await Invoice.findByPk(id, {
          attributes: safeInvoiceAttrs,
          include: sequelize.models.Client
            ? [{ model: sequelize.models.Client, as: 'client', attributes: ['id', 'name', 'budget'] }]
            : []
        })

        if (!inv) return res.status(404).json({ error: 'Not found' })
        return res.status(200).json(parseInvoice(inv))
      }

      const options = {
        attributes: safeInvoiceAttrs,
        order: [['createdAt', 'DESC']],
        include: sequelize.models.Client
          ? [{ model: sequelize.models.Client, as: 'client', attributes: ['id', 'name', 'budget'] }]
          : []
      }

      const list = await Invoice.findAll(options)
      return res.status(200).json(list.map(parseInvoice))
    } catch (err) {
      console.error('Error querying invoices:', err)

      const detail = {
        message: err.message,
        stack: err.stack,
        sql: err.sql || (err.parent && err.parent.sql) || null,
        original: err.original || err.parent || null
      }

      return res.status(500).json({ error: 'Failed to query invoices', detail })
    }
  }

  if (req.method === 'POST') {
    try {
      const body = req.body || {}

      const {
        number,
        clientId,
        date,
        dueDate,
        items,
        manufacturingItems,
        total,
        status,
        paidAmount,
        notes,
        taxPercent,
        taxAmount,
        discount,
        paymentMethod,
        bankName,
        transactionNumber,
        clientDeposit
      } = body

      const parseDate = d => {
        if (!d || d === '' || d === 'Invalid Date' || d === 'Invalid date') return null
        try {
          const dt = new Date(d)
          return isNaN(dt.getTime()) ? null : dt
        } catch {
          return null
        }
      }

      const dateVal = parseDate(date) || new Date()
      const dueDateVal = parseDate(dueDate)

      // Stringify items/manufacturing if they're arrays/objects
      const itemsToSave = typeof items === 'string' ? items : JSON.stringify(items || [])

      const manufToSave =
        typeof manufacturingItems === 'string' ? manufacturingItems : JSON.stringify(manufacturingItems || [])

      // Check if there is an existing DRAFT invoice for this client to update/merge
      let inv

      if (status === 'draft' && clientId) {
        inv = await Invoice.findOne({ where: { clientId, status: 'draft' } })
      }

      if (inv) {
        // Update existing draft
        await inv.update({
          clientId: clientId ? Number(clientId) : null,
          date: dateVal || inv.date,
          dueDate: dueDateVal || inv.dueDate,
          items: itemsToSave,
          manufacturing: manufToSave,
          total: total !== undefined ? Number(total || 0) : inv.total,
          notes: notes || inv.notes,
          taxPercent: Number(taxPercent || 0),
          taxAmount: Number(taxAmount || 0),
          discount: Number(discount || 0),
          paymentMethod: paymentMethod || inv.paymentMethod,
          bankName: bankName || inv.bankName,
          transactionNumber: transactionNumber || inv.transactionNumber
        })
      } else {
        // Sanitize body for create
        const saveBody = {
          number,
          clientId: clientId ? Number(clientId) : null,
          date: dateVal,
          dueDate: dueDateVal,
          items: itemsToSave,
          manufacturing: manufToSave,
          total: Number(total || 0),
          status,
          paidAmount: Number(paidAmount || 0),
          notes,
          taxPercent: Number(taxPercent || 0),
          taxAmount: Number(taxAmount || 0),
          discount: Number(discount || 0),
          paymentMethod: paymentMethod || null,
          bankName: bankName || null,
          transactionNumber: transactionNumber || null
        }

        if (!Invoice.availableCols.includes('projectId')) {
          delete saveBody.projectId
        }

        inv = await Invoice.create(saveBody)
      }

      // Deduct client deposit (عربون) from client's budget if applicable
      // Only deduct for non-draft invoices to avoid deducting on saves
      let appliedDeposit = 0 

      if (clientId && Number(clientDeposit || 0) > 0 && status !== 'draft') {
        try {
          const Client = sequelize.models.Client

          if (Client) {
            const client = await Client.findByPk(clientId)

            if (client) {
              const currentBudget = Number(client.budget || 0)
              const invoiceTotal = Number(total || 0)
              const depositToDeduct = Math.min(Number(clientDeposit), currentBudget, invoiceTotal)

              if (depositToDeduct > 0) {
                // Deduct deposit from client budget
                await client.update({
                  budget: currentBudget - depositToDeduct
                })

                // Update invoice paidAmount to include the deposit
                const currentPaid = Number(inv.paidAmount || 0)
                const newPaid = currentPaid + depositToDeduct

                await inv.update({
                  paidAmount: newPaid
                })
                
                appliedDeposit = depositToDeduct
              }
            }
          }
        } catch (budgetErr) {
          console.error('Failed to deduct deposit from client budget:', budgetErr)

          return res.status(500).json({
            error: 'فشل في خصم العربون من الميزانية',
            detail: budgetErr.message
          })
        }
      }

      // Also create a SafeEntry record (incoming) for this invoice if SafeEntry model exists
      try {
        const SafeEntry = sequelize.models.SafeEntry

        if (SafeEntry && status !== 'draft') {
          const cashPortion = Math.max(0, Number(total || 0) - appliedDeposit)

          // Only log if there's actual cash incoming
          if (cashPortion > 0) {
            // resolve client name for customer field
            let clientName = null
            try {
              const Client = sequelize.models.Client
              if (Client && clientId) {
                const c = await Client.findByPk(clientId)
                clientName = c ? c.name : null
              }
            } catch (cErr) {
              console.error('Failed to fetch client for SafeEntry:', cErr)
            }

            const lastEntry = await SafeEntry.findOne({ order: [['date', 'DESC']] })
            const prevBalance = lastEntry ? Number(lastEntry.balance || 0) : 0
            const newBalance = prevBalance + cashPortion

            const monthStr = dateVal
              ? dateVal.toLocaleString('en-US', { month: 'long', year: 'numeric' })
              : new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })

            // Resolve default safe id
            let safeId = null
            if (sequelize.models.Safe) {
              const def = await sequelize.models.Safe.findOne({ where: { isDefault: true } })
              if (def) safeId = def.id
            }

            await SafeEntry.create({
              month: monthStr,
              date: dateVal || new Date(),
              description: `Invoice #${number}`,
              customer: clientName,
              project: null,
              incoming: cashPortion,
              incomingMethod: 'Invoice',
              incomingTxn: `INV-${inv.id}`,
              outgoing: 0,
              balance: newBalance,
              safeId
            })
          }
        }
      } catch (safeErr) {
        console.error('Failed to create SafeEntry for invoice:', safeErr)
      }

      // Auto-create or update project for this client/invoice

      try {
        const Project = sequelize.models.Project
        const ProjectActivity = sequelize.models.ProjectActivity
        const Client = sequelize.models.Client

        if (Project && clientId) {
          // Get client info
          let clientName = null
          let clientData = null

          if (Client) {
            clientData = await Client.findByPk(clientId)
            clientName = clientData ? clientData.name : null
          }

          // Check if a project already exists for this client

          let project = await Project.findOne({ where: { clientId: clientId } })

          if (!project) {
            // Create a new project for this client
            const projectNumber = `PRJ-${Date.now().toString().slice(-8)}`

            project = await Project.create({
              name: clientName ? `مشروع ${clientName}` : `مشروع عميل #${clientId}`,
              projectNumber: projectNumber,
              clientId: clientId,
              clientName: clientName,
              description: `مشروع تم إنشاؤه تلقائياً عند إنشاء فاتورة`,
              status: 'in-progress',
              priority: 'normal',
              progressPercent: 0,
              startDate: dateVal || new Date()
            })

            // Log project creation activity

            if (ProjectActivity) {
              await ProjectActivity.create({
                projectId: project.id,
                activityType: 'project_created',
                title: 'تم إنشاء المشروع تلقائياً',
                description: `تم إنشاء المشروع عند إصدار فاتورة رقم ${number}`,
                createdBy: 'System'
              })
            }
          }

          // Link the invoice to this project if column exists
          if (Invoice.availableCols.includes('projectId')) {
            await inv.update({ projectId: project.id })
          }

          // Log invoice activity
          if (ProjectActivity) {
            await ProjectActivity.create({
              projectId: project.id,
              activityType: 'invoice_created',
              title: 'تم إضافة فاتورة',
              description: `فاتورة رقم ${number} بمبلغ ${total || 0} جنيه`,
              createdBy: 'System'
            })
          }

          // Update project total revenue

          const totalInvoiced = (await Invoice.sum('total', { where: { projectId: project.id } })) || 0

          await project.update({ totalRevenue: totalInvoiced })
        }
      } catch (projErr) {
        console.error('Failed to create/update project for invoice:', projErr)
      }

      return res.status(201).json(parseInvoice(inv))
    } catch (err) {
      return res.status(400).json({ error: err.message })
    }
  }

  if (req.method === 'PUT') {
    try {
      const { id } = req.query
      const body = req.body || {}
      const inv = await Invoice.findByPk(id)

      if (!inv) return res.status(404).json({ error: 'Not found' })

      prevStatus = inv.status
      prevTotal = Number(inv.total || 0)


      // Stringify items/manufacturing if provided and they're arrays or objects
      if (body.items && typeof body.items !== 'string') {
        body.items = JSON.stringify(body.items)
      }

      if (body.manufacturingItems && typeof body.manufacturingItems !== 'string') {
        // store on `manufacturing` column
        body.manufacturing = JSON.stringify(body.manufacturingItems)
        delete body.manufacturingItems
      }

      // Normalize numeric fields
      if (body.taxPercent !== undefined) body.taxPercent = Number(body.taxPercent || 0)
      if (body.taxAmount !== undefined) body.taxAmount = Number(body.taxAmount || 0)
      if (body.discount !== undefined) body.discount = Number(body.discount || 0)
      if (body.paidAmount !== undefined) body.paidAmount = Number(body.paidAmount || 0)
      if (body.total !== undefined) body.total = Number(body.total || 0)
      if (body.clientId !== undefined) body.clientId = body.clientId ? Number(body.clientId) : null
      if (body.projectId !== undefined) body.projectId = body.projectId ? Number(body.projectId) : null

      // Normalize date fields to Date objects to prevent SQL conversion errors
      const parseDate = d => {
        if (!d || d === '' || d === 'Invalid Date' || d === 'Invalid date') return null
        try {
          const dt = new Date(d)
          return isNaN(dt.getTime()) ? null : dt
        } catch {
          return null
        }
      }

      // Only update date fields if they're valid, otherwise remove from body to keep existing values
      if (body.date !== undefined) {
        const parsedDate = parseDate(body.date)
        if (parsedDate) {
          body.date = parsedDate
        } else {
          delete body.date // Don't update if invalid, keep existing value
        }
      }
      if (body.dueDate !== undefined) {
        const parsedDueDate = parseDate(body.dueDate)
        if (parsedDueDate) {
          body.dueDate = parsedDueDate
        } else {
          delete body.dueDate // Don't update if invalid, keep existing value
        }
      }

      // Extract clientDeposit before passing body to update
      const clientDepositVal = Number(body.clientDeposit || 0)
      delete body.clientDeposit

      // Sanitize body for update
      if (!Invoice.availableCols.includes('projectId')) {
        delete body.projectId
      }

      await inv.update(body)

      // Handle client deposit deduction (العربون)
      // Only deduct when status changes from draft to non-draft (first time finalization)
      const statusChanged = prevStatus === 'draft' && body.status && body.status !== 'draft'
      let appliedDeposit = 0

      if (inv.clientId && clientDepositVal > 0 && statusChanged) {
        try {
          const Client = sequelize.models.Client

          if (Client) {
            const client = await Client.findByPk(inv.clientId)

            if (client) {
              const currentBudget = Number(client.budget || 0)
              const invoiceTotal = Number(inv.total || 0)
              const depositToDeduct = Math.min(clientDepositVal, currentBudget, invoiceTotal)

              if (depositToDeduct > 0) {
                // Deduct deposit from client budget
                await client.update({
                  budget: currentBudget - depositToDeduct
                })

                // Update invoice paidAmount to include the deposit
                const currentPaid = Number(inv.paidAmount || 0)
                const newPaid = currentPaid + depositToDeduct

                await inv.update({
                  paidAmount: newPaid
                })

                appliedDeposit = depositToDeduct
              }
            }
          }
        } catch (budgetErr) {
          console.error('Failed to deduct deposit from client budget:', budgetErr)

          return res.status(500).json({
            error: 'فشل في خصم العربون من الميزانية',
            detail: budgetErr.message
          })
        }
      }

      // If status changed to 'paid' or total changed, create SafeEntry adjustment
      try {
        const SafeEntry = sequelize.models.SafeEntry

        if (SafeEntry) {
          const newInv = await Invoice.findByPk(id)
          const newTotal = Number(newInv.total || 0)
          const newStatus = newInv.status

          let incomingNum = 0

          if (prevStatus !== 'paid' && newStatus === 'paid') {
            // treat as full incoming payment, but subtract deposit to avoid double counting
            incomingNum = newTotal - appliedDeposit
          } else if (newTotal !== prevTotal) {
            // create adjustment for the difference
            incomingNum = (newTotal - prevTotal)
          }

          if (incomingNum !== 0) {
            const lastEntry = await SafeEntry.findOne({ order: [['date', 'DESC']] })
            const prevBalance = lastEntry ? Number(lastEntry.balance || 0) : 0
            const newBalance = prevBalance + Number(incomingNum)

            const monthStr = newInv.date
              ? new Date(newInv.date).toLocaleString('en-US', { month: 'long', year: 'numeric' })
              : new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })

            // Resolve default safe id
            let safeId = null

            if (sequelize.models.Safe) {
              const def = await sequelize.models.Safe.findOne({ where: { isDefault: true } })

              if (def) safeId = def.id
            }

            await SafeEntry.create({
              month: monthStr,
              date: newInv.date || new Date(),
              description: `Invoice #${newInv.number} adjustment`,
              customer: null,
              project: null,
              incoming: incomingNum > 0 ? incomingNum : 0,
              outgoing: incomingNum < 0 ? Math.abs(incomingNum) : 0,
              incomingMethod: 'Invoice',
              incomingTxn: `INV-${newInv.id}`,
              outgoingMethod: null,
              outgoingTxn: null,
              balance: newBalance,
              safeId
            })
          }
        }
      } catch (safeErr) {
        console.error('Failed to create SafeEntry on invoice update:', safeErr)
      }

      return res.status(200).json(parseInvoice(inv))
    } catch (err) {
      return res.status(400).json({ error: err.message })
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.query
      const inv = await Invoice.findByPk(id)

      if (!inv) return res.status(404).json({ error: 'Not found' })

      await inv.destroy()

      return res.status(200).json({ success: true })
    } catch (err) {
      return res.status(400).json({ error: err.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default withAuth(handler)
