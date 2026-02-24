import { NextResponse } from 'next/server'

// GET all users with their roles
export async function GET(request) {
  try {
    const modelsModule = require('../../../../../models')
    const db = await modelsModule.getDb()
    const { User, Role, UserRole, AuditLog } = db

    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'emailVerified', 'createdAt', 'updatedAt', 'allowedDashboardCards'],
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
      ],
      order: [['createdAt', 'DESC']]
    })

    // Transform data to flatten roles
    const transformedUsers = users.map(user => {
      const userJson = user.toJSON()
      return {
        ...userJson,
        roles: userJson.userRoles?.map(ur => ur.role) || []
      }
    })

    return NextResponse.json({ success: true, users: transformedUsers })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 })
  }
}

// POST create new user
export async function POST(request) {
  try {
    const modelsModule = require('../../../../../models')
    const db = await modelsModule.getDb()
    const { User, Role, UserRole, AuditLog } = db
    const bcrypt = require('bcryptjs')

    const body = await request.json()
    const { name, email, password, roleIds, allowedDashboardCards } = body

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ success: false, error: 'User with this email already exists' }, { status: 400 })
    }

    // Create user
    const hashedPassword = await bcrypt.hash(password, 10)
    
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      emailVerified: new Date(),
      allowedDashboardCards
    })

    // Assign roles
    if (roleIds && Array.isArray(roleIds)) {
      const roleAssignments = roleIds.map(roleId => ({
        userId: newUser.id,
        roleId: parseInt(roleId)
      }))
      
      await UserRole.bulkCreate(roleAssignments)
    }

    // Log action
    // Note: In a real app we'd get the current user ID from session
    await AuditLog.create({
      userId: newUser.id, 
      action: 'USER_CREATED',
      details: `User ${email} was created`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    const userJson = newUser.toJSON()
    // Fetch roles again to return complete object or just return basic info
    // For simplicity returning created user
    
    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: userJson
    })

  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ success: false, error: 'Failed to create user' }, { status: 500 })
  }
}
