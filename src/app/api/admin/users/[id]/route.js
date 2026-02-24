import { NextResponse } from 'next/server'

import bcrypt from 'bcryptjs'

// GET single user
export async function GET(request, { params }) {
  try {
    const modelsModule = require('@models')
    const db = await modelsModule.getDb()
    const { User, Role, UserRole, AuditLog } = db

    const { id } = await params

    const user = await User.findByPk(id, {
      attributes: ['id', 'name', 'email', 'emailVerified', 'createdAt', 'updatedAt'],
      include: [
        {
          model: UserRole,
          as: 'userRoles',
          include: [
            {
              model: Role,
              as: 'role',
              attributes: ['id', 'name', 'description']
            }
          ]
        }
      ]
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const userJson = user.toJSON()

    const transformedUser = {
      ...userJson,
      roles: userJson.userRoles?.map(ur => ur.role) || []
    }

    return NextResponse.json({ success: true, user: transformedUser })
  } catch (error) {
    console.error('Error fetching user:', error)

    return NextResponse.json({ success: false, error: 'Failed to fetch user' }, { status: 500 })
  }
}

// UPDATE user
export async function PUT(request, { params }) {
  try {
    const modelsModule = require('@models')
    const db = await modelsModule.getDb()
    const { User, Role, UserRole, AuditLog } = db

    const { id } = await params
    const body = await request.json()
    const { name, email, password, roleIds, allowedDashboardCards } = body

    const user = await User.findByPk(id)

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Update user basic info
    const updateData = {}

    if (name) updateData.name = name
    if (email) updateData.email = email

    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    if (allowedDashboardCards !== undefined) {
      updateData.allowedDashboardCards = allowedDashboardCards
    }

    await user.update(updateData)

    // Update roles if provided
    if (roleIds && Array.isArray(roleIds)) {
      // Remove existing roles
      await UserRole.destroy({ where: { userId: id } })

      // Add new roles
      const roleAssignments = roleIds.map(roleId => ({
        userId: parseInt(id),
        roleId: parseInt(roleId)
      }))

      await UserRole.bulkCreate(roleAssignments)
    }

    // Log the action
    await AuditLog.create({
      userId: id, // In production, use the admin's ID from session
      action: 'USER_UPDATED',
      details: `User ${user.email} was updated`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user
    })
  } catch (error) {
    console.error('Error updating user:', error)

    return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 })
  }
}

// DELETE user
export async function DELETE(request, { params }) {
  try {
    const modelsModule = require('@models')
    const db = await modelsModule.getDb()
    const { User, Role, UserRole, AuditLog } = db

    const { id } = await params

    const user = await User.findByPk(id)

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Delete user roles first
    await UserRole.destroy({ where: { userId: id } })

    // Log the action
    await AuditLog.create({
      userId: id,
      action: 'USER_DELETED',
      details: `User ${user.email} was deleted`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    // Delete user
    await user.destroy()

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting user:', error)

    return NextResponse.json({ success: false, error: 'Failed to delete user' }, { status: 500 })
  }
}
