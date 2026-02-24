import { NextResponse } from 'next/server'
import { Op } from 'sequelize'

// GET all audit logs with filters
export async function GET(request) {
  try {
    const modelsModule = require('../../../../../models')
    const db = await modelsModule.getDb()
    const { AuditLog, User } = db

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 50
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const offset = (page - 1) * limit

    // Build where clause
    const where = {}

    if (userId) {
      where.userId = userId
    }

    if (action) {
      where.action = action
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt[Op.gte] = new Date(startDate)
      }
      if (endDate) {
        where.createdAt[Op.lte] = new Date(endDate)
      }
    }

    const { count, rows: logs } = await AuditLog.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    })

    const totalPages = Math.ceil(count / limit)

    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        currentPage: page,
        totalPages,
        totalLogs: count,
        logsPerPage: limit
      }
    })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch audit logs' }, { status: 500 })
  }
}

// POST create audit log (manual logging if needed)
export async function POST(request) {
  try {
    const modelsModule = require('../../../../../models')
    const db = await modelsModule.getDb()
    const { AuditLog, User } = db

    const body = await request.json()
    const { userId, action, details } = body

    if (!userId || !action) {
      return NextResponse.json({ success: false, error: 'userId and action are required' }, { status: 400 })
    }

    const log = await AuditLog.create({
      userId,
      action,
      details: details || '',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({
      success: true,
      message: 'Audit log created successfully',
      log
    })
  } catch (error) {
    console.error('Error creating audit log:', error)
    return NextResponse.json({ success: false, error: 'Failed to create audit log' }, { status: 500 })
  }
}
