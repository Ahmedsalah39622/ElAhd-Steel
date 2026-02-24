import { NextResponse } from 'next/server'

// GET audit logs for specific user
export async function GET(request, { params }) {
  try {
    const modelsModule = require('@models')
    const db = await modelsModule.getDb()
    const { AuditLog, User } = db

    const { userId } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 50
    const offset = (page - 1) * limit

    const { count, rows: logs } = await AuditLog.findAndCountAll({
      where: { userId },
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
    console.error('Error fetching user audit logs:', error)

    return NextResponse.json({ success: false, error: 'Failed to fetch user audit logs' }, { status: 500 })
  }
}
