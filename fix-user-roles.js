const modelsModule = require('./models')

async function fixUserRoles() {
  try {
    const models = await modelsModule.getDb()
    const { User, Role, UserRole } = models

    // الحصول على جميع المستخدمين
    const users = await User.findAll()

    // الحصول على دور Admin
    const adminRole = await Role.findOne({ where: { name: 'Admin' } })

    if (!adminRole) {
      console.error('❌ دور Admin غير موجود!')
      process.exit(1)
    }

    console.log(`Found ${users.length} users`)
    console.log(`Admin role ID: ${adminRole.id}`)

    // تعيين دور Admin لجميع المستخدمين (مؤقتاً للاختبار)
    for (const user of users) {
      // تحقق إذا كان لديه دور بالفعل
      const existingRole = await UserRole.findOne({
        where: { userId: user.id }
      })

      if (!existingRole) {
        await UserRole.create({
          userId: user.id,
          roleId: adminRole.id
        })
        console.log(`✅ تم تعيين دور Admin للمستخدم: ${user.email}`)
      } else {
        console.log(`⏭️  المستخدم ${user.email} لديه دور بالفعل`)
      }
    }

    // مسح الأدوار المكررة
    const allRoles = await Role.findAll()
    const roleNames = new Map()
    const duplicateIds = []

    for (const role of allRoles) {
      if (roleNames.has(role.name)) {
        duplicateIds.push(role.id)
      } else {
        roleNames.set(role.name, role.id)
      }
    }

    if (duplicateIds.length > 0) {
      console.log(`\n🗑️  حذف ${duplicateIds.length} أدوار مكررة...`)
      await Role.destroy({ where: { id: duplicateIds } })
    }

    console.log('\n✅ تم إصلاح الأدوار بنجاح!')

    // التحقق النهائي
    const finalUserRoles = await UserRole.findAll()
    const finalRoles = await Role.findAll()

    console.log(`\n📊 النتيجة النهائية:`)
    console.log(`   - ${users.length} مستخدمين`)
    console.log(`   - ${finalRoles.length} أدوار`)
    console.log(`   - ${finalUserRoles.length} علاقات مستخدم-دور`)

    process.exit(0)
  } catch (error) {
    console.error('❌ خطأ:', error.message)
    console.error(error)
    process.exit(1)
  }
}

fixUserRoles()
