/**
 * Script لاختبار تحديث الأدوار والصلاحيات
 *
 * هذا الـ script يوضح كيفية عمل النظام الجديد:
 * 1. تحديث دور المستخدم
 * 2. تحديث بيانات الجلسة تلقائياً
 * 3. تطبيق الصلاحيات الجديدة فوراً
 */

const modelsModule = require('./models')

async function testRoleUpdate() {
  try {
    const models = await modelsModule.getDb()
    const { User, Role, UserRole } = models

    console.log('🔄 بدء اختبار تحديث الأدوار...')

    // العثور على المستخدم AYA
    const user = await User.findOne({
      where: { email: 'aya@gmail.com' },
      include: [
        {
          model: UserRole,
          as: 'userRoles',
          include: [
            {
              model: Role,
              as: 'role',
              attributes: ['id', 'name', 'description', 'permissions']
            }
          ]
        }
      ]
    })

    if (!user) {
      console.error('❌ المستخدم AYA غير موجود!')

      return
    }

    console.log(`📋 المستخدم: ${user.name} (${user.email})`)
    console.log(`📊 الأدوار الحالية:`)
    user.userRoles.forEach(ur => {
      console.log(`   - ${ur.role.name}: ${ur.role.description || 'لا يوجد وصف'}`)
    })

    // العثور على دور Admin
    const adminRole = await Role.findOne({ where: { name: 'Admin' } })
    const accountantRole = await Role.findOne({ where: { name: 'Accountant' } })

    if (!adminRole || !accountantRole) {
      console.error('❌ الأدوار غير موجودة!')

      return
    }

    console.log('\n🔄 تحديث دور AYA من Accountant إلى Admin...')

    // حذف جميع الأدوار الحالية
    await UserRole.destroy({ where: { userId: user.id } })

    // إضافة دور Admin
    await UserRole.create({
      userId: user.id,
      roleId: adminRole.id
    })

    console.log('✅ تم تحديث الدور بنجاح!')
    console.log('\n📝 ملاحظة مهمة:')
    console.log('   - الآن عندما تفتح admin panel وتدخل على المستخدمين')
    console.log('   - ستجد أن AYA أصبحت Admin')
    console.log('   - وعندما تغير دورها، ستشعر بالتأثير فوراً')
    console.log('   - النظام سيحدث بيانات الجلسة تلقائياً')

    console.log('\n🎯 خطوات الاختبار:')
    console.log('1. سجل دخول كـ AYA')
    console.log('2. تأكد من ظهور Admin Panel في القائمة')
    console.log('3. ادخل على إدارة المستخدمين')
    console.log('4. غير دور AYA إلى Accountant')
    console.log('5. ستختفي Admin Panel من القائمة فوراً')
    console.log('6. غير الدور مرة أخرى إلى Admin')
    console.log('7. ستظهر Admin Panel في القائمة فوراً')

    process.exit(0)
  } catch (error) {
    console.error('❌ خطأ:', error)
    process.exit(1)
  }
}

testRoleUpdate()
