import { NextResponse } from 'next/server'

// GET single role
export async function GET(request, { params }) {
  try {
    const modelsModule = require('../../../../../../models')
    const db = await modelsModule.getDb()
    const { Role, UserRole, AuditLog } = db

    const { id } = await params

    const role = await Role.findByPk(id, {
      include: [
        {
          model: UserRole,
          as: 'userRoles',
          attributes: ['userId']
        }
      ]
    })

    if (!role) {
      return NextResponse.json({ success: false, error: 'Role not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, role })
  } catch (error) {
    console.error('Error fetching role:', error)

    return NextResponse.json({ success: false, error: 'Failed to fetch role' }, { status: 500 })
  }
}

// PUT update role
export async function PUT(request, { params }) {
  try {
    const modelsModule = require('../../../../../../models')
    const db = await modelsModule.getDb(true) // Force refresh to pick up model changes
    const { Role, UserRole, AuditLog } = db

    const { id } = await params
    const body = await request.json()
    const { name, description, permissions } = body

    const role = await Role.findByPk(id)

    if (!role) {
      return NextResponse.json({ success: false, error: 'Role not found' }, { status: 404 })
    }

    // Update basic fields
    role.name = name || role.name
    role.description = description !== undefined ? description : role.description

    // Force-set permissions (Sequelize may not detect JSON changes)
    if (permissions !== undefined) {
      role.permissions = permissions
      role.changed('permissions', true)
    }

    await role.save()

    // Reload to get the fresh data from DB
    await role.reload()

    // Log the action
    await AuditLog.create({
      userId: 1, // Replace with actual admin ID from session
      action: 'ROLE_UPDATED',
      details: `Role ${role.name} was updated`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({
      success: true,
      message: 'Role updated successfully',
      role: role.toJSON()
    })
  } catch (error) {
    console.error('Error updating role:', error)

    return NextResponse.json({ success: false, error: 'Failed to update role' }, { status: 500 })
  }
}

// DELETE role
export async function DELETE(request, { params }) {
  try {
    const modelsModule = require('../../../../../../models')
    const db = await modelsModule.getDb(true)
    const { Role, UserRole, AuditLog } = db

    const { id } = await params

    const role = await Role.findByPk(id)

    if (!role) {
      return NextResponse.json({ success: false, error: 'Role not found' }, { status: 404 })
    }

    // Check if role is assigned to any users
    const userRolesCount = await UserRole.count({ where: { roleId: id } })

    if (userRolesCount > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete role that is assigned to users' },
        { status: 400 }
      )
    }

    // Log the action
    await AuditLog.create({
      userId: 1, // Replace with actual admin ID from session
      action: 'ROLE_DELETED',
      details: `Role ${role.name} was deleted`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    await role.destroy()

    return NextResponse.json({
      success: true,
      message: 'Role deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting role:', error)

    return NextResponse.json({ success: false, error: 'Failed to delete role' }, { status: 500 })
  }
}
