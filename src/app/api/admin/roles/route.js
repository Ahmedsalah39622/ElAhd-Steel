import { NextResponse } from 'next/server'
import { checkAuth } from '@/utils/auth'

// GET all roles
export async function GET(request) {
  const auth = checkAuth(request)
  if (!auth.authenticated) return auth.response

  try {
    const modelsModule = require('../../../../../models')
    const db = await modelsModule.getDb(true)
    const { Role, UserRole, AuditLog } = db

    const roles = await Role.findAll({
      include: [
        {
          model: UserRole,
          as: 'userRoles',
          attributes: ['userId']
        }
      ],
      order: [['id', 'ASC']]
    })

    // Transform data to ensure permissions field is always an array and include user count
    const transformedRoles = roles.map(role => {
      const roleJson = role.toJSON()
      let permissions = roleJson.permissions
      
      // Safety check for JSON parsing
      if (typeof permissions === 'string') {
        try { permissions = JSON.parse(permissions) } catch (e) { permissions = [] }
      }
      
      return {
        ...roleJson,
        permissions: Array.isArray(permissions) ? permissions : [],
        userCount: roleJson.userRoles?.length || 0
      }
    })

    return NextResponse.json({ success: true, roles: transformedRoles })
  } catch (error) {
    console.error('Error fetching roles:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch roles' }, { status: 500 })
  }
}

// POST create new role
export async function POST(request) {
  const auth = checkAuth(request)
  if (!auth.authenticated) return auth.response

  try {
    const modelsModule = require('../../../../../models')
    const db = await modelsModule.getDb(true)
    const { Role, UserRole, AuditLog } = db

    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ success: false, error: 'Role name is required' }, { status: 400 })
    }

    const role = await Role.create({
      name,
      description: description || ''
    })

    // Log the action
    await AuditLog.create({
      userId: 1, // Replace with actual admin ID from session
      action: 'ROLE_CREATED',
      details: `Role ${name} was created`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({
      success: true,
      message: 'Role created successfully',
      role
    })
  } catch (error) {
    console.error('Error creating role:', error)
    return NextResponse.json({ success: false, error: 'Failed to create role' }, { status: 500 })
  }
}
