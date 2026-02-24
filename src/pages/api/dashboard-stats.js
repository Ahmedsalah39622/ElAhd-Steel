import { Op } from 'sequelize'

import { initializeDatabase } from '@/utils/db'
import { withAuth } from '@/utils/auth'

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const db = await initializeDatabase()
    const { SafeEntry, Invoice, Client, Worker, Material, Attendance, sequelize } = db

    // Get date ranges
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    const startOfWeek = new Date(now)

    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    // Calculate last 6 months for charts
    const last6Months = []

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)

      last6Months.push({
        month: d.toLocaleString('en-US', { month: 'short' }),
        year: d.getFullYear(),
        start: new Date(d.getFullYear(), d.getMonth(), 1),
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
      })
    }

    // === SAFE STATS ===
    let safeStats = {
      totalIncoming: 0,
      totalOutgoing: 0,
      balance: 0,
      monthlyIncoming: 0,
      monthlyOutgoing: 0,
      transactionCount: 0,
      safes: [] // per-safe breakdown
    }

    // Recent transactions for table
    let recentTransactions = []

    // Monthly data for charts
    let monthlyChartData = {
      labels: last6Months.map(m => m.month),
      incoming: [],
      outgoing: []
    }

    try {
      const [safeEntries, safes] = await Promise.all([
        SafeEntry.findAll({ order: [['createdAt', 'DESC']] }),
        sequelize.models.Safe ? sequelize.models.Safe.findAll({ order: [['id', 'ASC']] }) : []
      ])

      // Initialize per-safe buckets
      const safeBuckets = {}
      safes.forEach(s => {
        safeBuckets[s.id] = { id: s.id, name: s.name, totalIncoming: 0, totalOutgoing: 0, balance: 0 }
      })

      // Initialize monthly data
      const monthlyIncoming = {}
      const monthlyOutgoing = {}

      last6Months.forEach(m => {
        monthlyIncoming[m.month] = 0
        monthlyOutgoing[m.month] = 0
      })

      safeEntries.forEach(entry => {
        const incoming = parseFloat(entry.incoming) || 0
        const outgoing = parseFloat(entry.outgoing) || 0
        const entryDate = new Date(entry.date || entry.createdAt)

        safeStats.totalIncoming += incoming
        safeStats.totalOutgoing += outgoing
        safeStats.transactionCount++

        if (entryDate >= startOfMonth) {
          safeStats.monthlyIncoming += incoming
          safeStats.monthlyOutgoing += outgoing
        }

        // Aggregate for chart
        last6Months.forEach(m => {
          if (entryDate >= m.start && entryDate <= m.end) {
            monthlyIncoming[m.month] += incoming
            monthlyOutgoing[m.month] += outgoing
          }
        })

        // Per-safe accumulation
        const sid = entry.safeId || (safes[0] && safes[0].id)
        if (sid) {
          if (!safeBuckets[sid]) {
            safeBuckets[sid] = { id: sid, name: `Safe ${sid}`, totalIncoming: 0, totalOutgoing: 0, balance: 0 }
          }
          safeBuckets[sid].totalIncoming += incoming
          safeBuckets[sid].totalOutgoing += outgoing
        }
      })

      // Build chart arrays
      monthlyChartData.incoming = last6Months.map(m => Math.round(monthlyIncoming[m.month]))
      monthlyChartData.outgoing = last6Months.map(m => Math.round(monthlyOutgoing[m.month]))

      // Get recent transactions (last 5)
      recentTransactions = safeEntries.slice(0, 5).map(entry => ({
        id: entry.id,
        description: entry.description || 'Transaction',
        type: (parseFloat(entry.incoming) || 0) > 0 ? 'incoming' : 'outgoing',
        amount: (parseFloat(entry.incoming) || 0) > 0 ? parseFloat(entry.incoming) : parseFloat(entry.outgoing) || 0,
        date: entry.date || entry.createdAt,
        status: entry.paymentMethod || 'cash',
        customer: entry.customer || null,
        safeId: entry.safeId || null
      }))

      // Finalize per-safe balances
      safeStats.safes = Object.values(safeBuckets).map(s => ({ ...s, balance: s.totalIncoming - s.totalOutgoing }))

      safeStats.balance = safeStats.totalIncoming - safeStats.totalOutgoing
    } catch (e) {
      console.error('Safe stats error:', e)
    }

    // === INVOICE STATS ===
    let invoiceStats = {
      totalInvoices: 0,
      pendingInvoices: 0,
      paidInvoices: 0,
      totalAmount: 0,
      monthlyAmount: 0,
      overdueCount: 0
    }

    // Recent invoices
    let recentInvoices = []

    // Monthly invoice data for charts
    let monthlyInvoiceData = []

    try {
      const invoices = await Invoice.findAll({
        order: [['createdAt', 'DESC']]
      })

      // Initialize monthly invoice data
      const monthlyInvoices = {}

      last6Months.forEach(m => {
        monthlyInvoices[m.month] = 0
      })

      invoices.forEach(inv => {
        invoiceStats.totalInvoices++
        const amount = parseFloat(inv.total) || 0

        invoiceStats.totalAmount += amount

        const status = (inv.status || '').toLowerCase()

        if (status === 'paid') {
          invoiceStats.paidInvoices++
        } else if (status === 'pending' || status === 'draft') {
          invoiceStats.pendingInvoices++
        }

        if (status === 'overdue') {
          invoiceStats.overdueCount++
        }

        const invDate = new Date(inv.date || inv.createdAt)

        if (invDate >= startOfMonth) {
          invoiceStats.monthlyAmount += amount
        }

        // Aggregate for chart
        last6Months.forEach(m => {
          if (invDate >= m.start && invDate <= m.end) {
            monthlyInvoices[m.month] += amount
          }
        })
      })

      // Build chart array
      monthlyInvoiceData = last6Months.map(m => Math.round(monthlyInvoices[m.month] / 1000)) // in thousands

      // Get recent invoices (last 5)
      recentInvoices = invoices.slice(0, 5).map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber || `INV-${inv.id}`,
        client: inv.clientName || 'Unknown Client',
        amount: parseFloat(inv.total) || 0,
        status: inv.status || 'pending',
        date: inv.date || inv.createdAt
      }))
    } catch (e) {
      console.error('Invoice stats error:', e)
    }

    // === CLIENT STATS ===
    let clientStats = {
      totalClients: 0,
      activeClients: 0,
      newThisMonth: 0,
      totalBudget: 0
    }

    try {
      const clients = await Client.findAll()

      clients.forEach(client => {
        clientStats.totalClients++
        clientStats.totalBudget += parseFloat(client.budget) || 0

        const clientDate = new Date(client.createdAt)

        if (clientDate >= startOfMonth) {
          clientStats.newThisMonth++
        }

        if (client.status !== 'inactive') {
          clientStats.activeClients++
        }
      })
    } catch (e) {
      console.error('Client stats error:', e)
    }

    // === WORKER STATS ===
    let workerStats = {
      totalWorkers: 0,
      activeWorkers: 0,
      totalSalary: 0,
      presentToday: 0
    }

    try {
      const workers = await Worker.findAll()

      workers.forEach(worker => {
        workerStats.totalWorkers++
        workerStats.totalSalary += parseFloat(worker.baseSalary) || 0

        if (worker.status === 'active') {
          workerStats.activeWorkers++
        }
      })

      // Check today's attendance
      const today = new Date()

      today.setHours(0, 0, 0, 0)

      const tomorrow = new Date(today)

      tomorrow.setDate(tomorrow.getDate() + 1)

      if (Attendance) {
        const todayAttendance = await Attendance.count({
          where: {
            date: {
              [Op.gte]: today,
              [Op.lt]: tomorrow
            },
            status: 'present'
          }
        })

        workerStats.presentToday = todayAttendance
      }
    } catch (e) {
      console.error('Worker stats error:', e)
    }

    // === INVENTORY STATS ===
    let inventoryStats = {
      totalMaterials: 0,
      totalStock: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      categories: 0,
      lowStockItems: [],
      outOfStockItems: []
    }

    try {
      const materials = await Material.findAll()
      const categories = new Set()

      materials.forEach(material => {
        inventoryStats.totalMaterials++
        const stock = parseFloat(material.qty) || parseFloat(material.stock) || 0
        const minStock = parseFloat(material.minStock) || 10

        inventoryStats.totalStock += stock

        if (stock === 0) {
          inventoryStats.outOfStockCount++
          inventoryStats.outOfStockItems.push({
            id: material.id,
            name: material.name,
            sku: material.sku,
            stock: stock,
            minStock: minStock,
            unit: material.unit || 'قطعة',
            category: material.category
          })
        } else if (stock <= minStock) {
          inventoryStats.lowStockCount++
          inventoryStats.lowStockItems.push({
            id: material.id,
            name: material.name,
            sku: material.sku,
            stock: stock,
            minStock: minStock,
            unit: material.unit || 'قطعة',
            category: material.category
          })
        }

        if (material.category) {
          categories.add(material.category)
        }
      })

      inventoryStats.categories = categories.size
      // Sort by stock ascending (most critical first)
      inventoryStats.lowStockItems.sort((a, b) => a.stock - b.stock)
      inventoryStats.outOfStockItems.sort((a, b) => a.name.localeCompare(b.name, 'ar'))
    } catch (e) {
      console.error('Inventory stats error:', e)
    }



    // === MANUFACTURING STATS ===
    let manufacturingStats = {
      wipCount: 0,
      finishedCount: 0,
      finishedStock: 0
    }

    try {
      // Import needed if not already available in db object
      const { InventoryTransaction } = db
      
      // 1. WIP: Count of Issue Orders (approximate - just total issued rows for now, or distinct JobCards if possible)
      // Since we don't have a strict "Closed" status on issue orders in the DB (yet), we count total recent or simple count
      // For now, let's just count all 'issue_order' transactions as activity
      /* 
         Better: Count Material where materialType = 'product' for Finished Goods
      */
      
      // Finished Products count
      const finishedProducts = await Material.findAll({
        where: { type: 'product' }
      })
      manufacturingStats.finishedCount = finishedProducts.length
      manufacturingStats.finishedStock = finishedProducts.reduce((sum, p) => sum + (parseFloat(p.stock) || parseFloat(p.count) || 0), 0)

      // WIP (Issue Orders) - We can count transactions with action 'issue_order' that are effectively "open"
      // Detailed WIP tracking requires more complex checking, for now let's just count total issue transactions this month as "Activity"
      // Or just hardcode a count of *all* issue_order lines for the dashboard "Total WIP Lines"
      // Checking `InventoryTransaction` model availability
       if (db.InventoryTransaction) {
          const wipCount = await db.InventoryTransaction.count({
            where: { action: 'issue_order' }
          })
          manufacturingStats.wipCount = wipCount
       }

    } catch (e) {
      console.error('Manufacturing stats error:', e)
    }

    // === Calculate trends (comparing to last month) ===
    let trends = {
      incomingTrend: 0,
      invoiceTrend: 0,
      clientTrend: 0
    }

    try {
      // Last month safe entries
      const lastMonthEntries = await SafeEntry.findAll({
        where: {
          createdAt: {
            [Op.gte]: startOfLastMonth,
            [Op.lt]: startOfMonth
          }
        }
      })

      let lastMonthIncoming = 0

      lastMonthEntries.forEach(e => {
        lastMonthIncoming += parseFloat(e.incoming) || 0
      })

      if (lastMonthIncoming > 0) {
        trends.incomingTrend = (((safeStats.monthlyIncoming - lastMonthIncoming) / lastMonthIncoming) * 100).toFixed(1)
      }
    } catch (e) {
      console.error('Trends error:', e)
    }

    res.status(200).json({
      success: true,
      data: {
        safe: safeStats,
        invoices: invoiceStats,
        clients: clientStats,
        workers: workerStats,
        inventory: inventoryStats,
        manufacturing: manufacturingStats,
        trends,
        recentTransactions,
        recentInvoices,
        charts: {
          monthly: monthlyChartData,
          invoices: monthlyInvoiceData
        }
      }
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

export default withAuth(handler)
