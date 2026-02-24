# نظام إدارة المستخدمين والصلاحيات - Admin Panel

## نظرة عامة

نظام شامل لإدارة المستخدمين والأدوار والصلاحيات مع تتبع كامل لجميع الأنشطة والعمليات التي يقوم بها المستخدمون في النظام.

## المميزات

### 1. إدارة المستخدمين

- **عرض جميع المستخدمين** في جدول منظم
- **إضافة مستخدمين جدد** مع البريد الإلكتروني وكلمة المرور
- **تعديل بيانات المستخدمين** (الاسم، البريد، كلمة المرور)
- **تعيين أدوار متعددة** لكل مستخدم
- **حذف المستخدمين** (مع تأكيد)
- **عرض تفاصيل المستخدم** الكاملة
- **الانتقال المباشر** لسجل أنشطة كل مستخدم

### 2. إدارة الأدوار والصلاحيات

- **إنشاء أدوار جديدة** (Admin, Manager, Employee, إلخ)
- **تعديل الأدوار** وأوصافها
- **حذف الأدوار** (مع منع حذف الأدوار المستخدمة)
- **عرض عدد المستخدمين** لكل دور
- **وصف تفصيلي** لكل دور وصلاحياته

### 3. سجل الأنشطة (Audit Logs)

تتبع شامل لجميع الأنشطة:

- تسجيل الدخول والخروج
- إنشاء وتعديل وحذف المستخدمين
- تغيير الأدوار والصلاحيات
- العمليات المالية (الفواتير، الدفعات)
- جميع العمليات الحساسة في النظام

**معلومات مسجلة:**

- المستخدم الذي قام بالعملية
- نوع الإجراء
- تفاصيل العملية
- التاريخ والوقت
- عنوان IP
- User Agent (المتصفح والجهاز)

**فلاتر متقدمة:**

- البحث حسب المستخدم
- البحث حسب نوع الإجراء
- البحث حسب فترة زمنية محددة
- ترقيم صفحات متقدم

### 4. لوحة تحكم الإدارة

- **إحصائيات سريعة** (عدد المستخدمين، الأدوار، السجلات)
- **آخر الأنشطة** في الوقت الفعلي
- **روابط سريعة** لجميع صفحات الإدارة

## الصفحات والروابط

| الصفحة               | الرابط              | الوصف                           |
| -------------------- | ------------------- | ------------------------------- |
| لوحة التحكم الرئيسية | `/admin`            | نظرة عامة وإحصائيات             |
| إدارة المستخدمين     | `/admin/users`      | قائمة المستخدمين والتحكم الكامل |
| الأدوار والصلاحيات   | `/admin/roles`      | إدارة الأدوار                   |
| سجل الأنشطة          | `/admin/audit-logs` | تتبع جميع العمليات              |

## API Endpoints

### Users Management

#### GET /api/admin/users

احصل على قائمة جميع المستخدمين مع أدوارهم

**Response:**

```json
{
  "success": true,
  "users": [
    {
      "id": 1,
      "name": "أحمد محمد",
      "email": "ahmad@example.com",
      "roles": [
        {
          "id": 1,
          "name": "Admin",
          "description": "مدير النظام"
        }
      ],
      "createdAt": "2026-01-01T10:00:00Z"
    }
  ]
}
```

#### GET /api/admin/users/[id]

احصل على تفاصيل مستخدم واحد

#### PUT /api/admin/users/[id]

تحديث بيانات مستخدم

**Request Body:**

```json
{
  "name": "الاسم الجديد",
  "email": "email@example.com",
  "password": "كلمة المرور الجديدة (اختياري)",
  "roleIds": [1, 2]
}
```

#### DELETE /api/admin/users/[id]

حذف مستخدم

### Roles Management

#### GET /api/admin/roles

احصل على قائمة جميع الأدوار

#### POST /api/admin/roles

إنشاء دور جديد

**Request Body:**

```json
{
  "name": "Manager",
  "description": "مدير القسم"
}
```

#### PUT /api/admin/roles/[id]

تحديث دور

#### DELETE /api/admin/roles/[id]

حذف دور (لا يمكن حذف الأدوار المستخدمة)

### Audit Logs

#### GET /api/admin/audit-logs

احصل على سجل الأنشطة مع فلاتر

**Query Parameters:**

- `userId` - تصفية حسب المستخدم
- `action` - تصفية حسب نوع الإجراء
- `startDate` - من تاريخ
- `endDate` - إلى تاريخ
- `page` - رقم الصفحة
- `limit` - عدد السجلات في الصفحة

**Response:**

```json
{
  "success": true,
  "logs": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalLogs": 500,
    "logsPerPage": 50
  }
}
```

#### GET /api/admin/audit-logs/user/[userId]

احصل على سجل أنشطة مستخدم معين

#### POST /api/admin/audit-logs

إنشاء سجل يدوي (للاستخدام البرمجي)

## تسجيل الأنشطة تلقائياً

لتسجيل أي نشاط في النظام، استخدم:

```javascript
import db from '../models'
const { AuditLog } = db

// مثال على تسجيل عملية
await AuditLog.create({
  userId: currentUser.id,
  action: 'INVOICE_CREATED',
  details: `فاتورة رقم ${invoice.id} تم إنشاؤها`,
  ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
  userAgent: request.headers.get('user-agent') || 'unknown'
})
```

### أنواع الإجراءات المتاحة

```javascript
const ACTION_TYPES = {
  // User Management
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',

  // Role Management
  ROLE_CREATED: 'ROLE_CREATED',
  ROLE_UPDATED: 'ROLE_UPDATED',
  ROLE_DELETED: 'ROLE_DELETED',

  // Business Operations
  INVOICE_CREATED: 'INVOICE_CREATED',
  INVOICE_UPDATED: 'INVOICE_UPDATED',
  INVOICE_DELETED: 'INVOICE_DELETED',
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  PAYMENT_SENT: 'PAYMENT_SENT'

  // Add more as needed...
}
```

## الإعداد والتثبيت

### 1. تشغيل Migration

```bash
# تشغيل جميع الـ migrations
npx sequelize-db:migrate

# أو تشغيل migration محدد
npx sequelize-db:migrate --name 20260109150000-create-audit-logs.js
```

### 2. إنشاء أدوار افتراضية (اختياري)

يمكنك إنشاء أدوار افتراضية من خلال واجهة الإدارة أو عن طريق seeder:

```javascript
// إنشاء admin role
const adminRole = await Role.create({
  name: 'Admin',
  description: 'مدير النظام - صلاحيات كاملة'
})

// إنشاء manager role
const managerRole = await Role.create({
  name: 'Manager',
  description: 'مدير - صلاحيات محدودة'
})

// إنشاء employee role
const employeeRole = await Role.create({
  name: 'Employee',
  description: 'موظف - صلاحيات القراءة فقط'
})
```

### 3. تعيين دور للمستخدم الأول

```javascript
// تعيين دور Admin للمستخدم الأول
await UserRole.create({
  userId: 1,
  roleId: adminRole.id
})
```

## الصلاحيات والأمان

### التحقق من الصلاحيات

يمكن إضافة middleware للتحقق من صلاحيات المستخدم:

```javascript
// middleware/checkRole.js
export const requireRole = allowedRoles => {
  return async (req, res, next) => {
    const userId = req.session.userId

    const userRoles = await UserRole.findAll({
      where: { userId },
      include: [{ model: Role, as: 'role' }]
    })

    const hasRole = userRoles.some(ur => allowedRoles.includes(ur.role.name))

    if (!hasRole) {
      return res.status(403).json({
        error: 'ليس لديك صلاحية للوصول'
      })
    }

    next()
  }
}

// استخدام في API
app.get('/api/admin/users', requireRole(['Admin']), async (req, res) => {
  // ...
})
```

## أمثلة الاستخدام

### إضافة مستخدم جديد مع أدوار

```javascript
// 1. إنشاء المستخدم
const user = await User.create({
  name: 'محمد أحمد',
  email: 'mohamed@example.com',
  password: await bcrypt.hash('password123', 10)
})

// 2. تعيين الأدوار
await UserRole.bulkCreate([
  { userId: user.id, roleId: 1 }, // Admin
  { userId: user.id, roleId: 2 } // Manager
])

// 3. تسجيل العملية
await AuditLog.create({
  userId: currentUser.id,
  action: 'USER_CREATED',
  details: `تم إنشاء مستخدم جديد: ${user.email}`,
  ipAddress: req.ip,
  userAgent: req.headers['user-agent']
})
```

### البحث في سجل الأنشطة

```javascript
// البحث عن جميع عمليات تسجيل الدخول في آخر 7 أيام
const logs = await AuditLog.findAll({
  where: {
    action: 'USER_LOGIN',
    createdAt: {
      [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    }
  },
  include: [{ model: User, as: 'user' }],
  order: [['createdAt', 'DESC']]
})
```

## التخصيص والتطوير

### إضافة أعمدة جديدة للـ Audit Log

```javascript
// في migration جديد
await queryInterface.addColumn('audit_logs', 'resourceType', {
  type: Sequelize.STRING,
  allowNull: true
})

await queryInterface.addColumn('audit_logs', 'resourceId', {
  type: Sequelize.INTEGER,
  allowNull: true
})
```

### إضافة فلاتر إضافية

يمكن تعديل API endpoint لإضافة فلاتر جديدة مثل:

- البحث النصي في التفاصيل
- تصفية حسب نوع الجهاز
- تصفية حسب موقع IP

## الأمان والخصوصية

- **تشفير كلمات المرور** باستخدام bcrypt
- **عدم تخزين كلمات المرور** في السجلات
- **تسجيل IP Addresses** للمراجعة الأمنية
- **صلاحيات محددة** لكل دور
- **منع حذف الأدوار** المستخدمة

## الدعم الفني

للمساعدة أو الإبلاغ عن مشاكل، يرجى إنشاء issue في المشروع.

---

**تم التطوير بواسطة:** فريق Ahd Steel
**التاريخ:** فبراير 2026
