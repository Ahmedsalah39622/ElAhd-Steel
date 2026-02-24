// Permission Constants for Role-Based Access Control

export const PERMISSIONS = {
  // الصفحة الرئيسية - متاح للجميع
  HOME: 'home',
  ABOUT: 'about',

  // الأرشيف والمشاريع
  PROJECTS: 'projects',
  PROJECTS_EXPLORER: 'projects.explorer',

  // الخزينة والمحاسبة
  SAFE: 'safe',
  SAFE_PERSONAL: 'safe.personal',
  WALLET: 'wallet',

  // المخزون
  INVENTORY: 'inventory',
  INVENTORY_FACTORY: 'inventory.factory',
  INVENTORY_CLIENT: 'inventory.client',
  INVENTORY_OPERATING: 'inventory.operating',

  // التشغيل
  MANUFACTURING: 'manufacturing',

  // الموردين والعملاء
  SUPPLIERS: 'suppliers',
  CLIENTS: 'clients',

  // الفواتير
  INVOICES: 'invoices',

  // قوائم الأسعار
  PRICE_LIST: 'price_list',
  PRICE_REVIEW: 'price_review',

  // الموارد البشرية
  HR: 'hr',
  HR_WORKERS: 'hr.workers',
  HR_ATTENDANCE: 'hr.attendance',
  HR_SALARIES: 'hr.salaries',

  // التقارير
  REPORTS: 'reports',

  // الإعدادات - متاح للجميع
  SETTINGS: 'settings',
  SETTINGS_MENU: 'settings.menu',

  // لوحة الإدارة - Admin فقط
  ADMIN: 'admin',
  ADMIN_USERS: 'admin.users',
  ADMIN_ROLES: 'admin.roles',
  ADMIN_PERMISSIONS: 'admin.permissions',
  ADMIN_AUDIT: 'admin.audit_logs'
}

// الأدوار المحددة مسبقاً مع صلاحياتهم
export const ROLE_PERMISSIONS = {
  // المدير - كل الصلاحيات
  admin: Object.values(PERMISSIONS),

  // محاسب - الخزينة، الفواتير، العملاء، التقارير
  accountant: [
    PERMISSIONS.HOME,
    PERMISSIONS.ABOUT,
    PERMISSIONS.SAFE,
    PERMISSIONS.SAFE_PERSONAL,
    PERMISSIONS.WALLET,
    PERMISSIONS.CLIENTS,
    PERMISSIONS.INVOICES,
    PERMISSIONS.REPORTS,
    PERMISSIONS.SETTINGS,
    PERMISSIONS.SETTINGS_MENU
  ],

  // مدير مخزون - المخزون، المواد، التصنيع
  inventory_manager: [
    PERMISSIONS.HOME,
    PERMISSIONS.ABOUT,
    PERMISSIONS.INVENTORY,
    PERMISSIONS.INVENTORY_FACTORY,
    PERMISSIONS.INVENTORY_CLIENT,
    PERMISSIONS.INVENTORY_OPERATING,
    PERMISSIONS.MANUFACTURING,
    PERMISSIONS.SUPPLIERS,
    PERMISSIONS.REPORTS,
    PERMISSIONS.SETTINGS,
    PERMISSIONS.SETTINGS_MENU
  ],

  // مدير مبيعات - العملاء، الفواتير، قوائم الأسعار
  sales_manager: [
    PERMISSIONS.HOME,
    PERMISSIONS.ABOUT,
    PERMISSIONS.CLIENTS,
    PERMISSIONS.INVOICES,
    PERMISSIONS.PRICE_LIST,
    PERMISSIONS.PRICE_REVIEW,
    PERMISSIONS.PROJECTS,
    PERMISSIONS.PROJECTS_EXPLORER,
    PERMISSIONS.REPORTS,
    PERMISSIONS.SETTINGS,
    PERMISSIONS.SETTINGS_MENU
  ],

  // مدير موارد بشرية
  hr_manager: [
    PERMISSIONS.HOME,
    PERMISSIONS.ABOUT,
    PERMISSIONS.HR,
    PERMISSIONS.HR_WORKERS,
    PERMISSIONS.HR_ATTENDANCE,
    PERMISSIONS.HR_SALARIES,
    PERMISSIONS.REPORTS,
    PERMISSIONS.SETTINGS,
    PERMISSIONS.SETTINGS_MENU
  ],

  // مدير مشاريع
  project_manager: [
    PERMISSIONS.HOME,
    PERMISSIONS.ABOUT,
    PERMISSIONS.PROJECTS,
    PERMISSIONS.PROJECTS_EXPLORER,
    PERMISSIONS.CLIENTS,
    PERMISSIONS.MANUFACTURING,
    PERMISSIONS.REPORTS,
    PERMISSIONS.SETTINGS,
    PERMISSIONS.SETTINGS_MENU
  ],

  // مستخدم عادي - الصفحة الرئيسية فقط
  user: [PERMISSIONS.HOME, PERMISSIONS.ABOUT, PERMISSIONS.SETTINGS, PERMISSIONS.SETTINGS_MENU]
}

// ربط كل عنصر في القائمة بالصلاحيات المطلوبة
export const MENU_PERMISSIONS = {
  '/home': [PERMISSIONS.HOME],
  '/about': [PERMISSIONS.ABOUT],
  '/projects': [PERMISSIONS.PROJECTS],
  '/projects/explorer': [PERMISSIONS.PROJECTS_EXPLORER],
  '/the-safe': [PERMISSIONS.SAFE],
  '/the-safe/personal': [PERMISSIONS.SAFE_PERSONAL],
  '/wallet': [PERMISSIONS.WALLET],
  '/inventory': [PERMISSIONS.INVENTORY],
  '/inventory/factory': [PERMISSIONS.INVENTORY_FACTORY],
  '/inventory/client': [PERMISSIONS.INVENTORY_CLIENT],
  '/inventory/operating-stock': [PERMISSIONS.INVENTORY_OPERATING],
  '/manufacturing': [PERMISSIONS.MANUFACTURING],
  '/suppliers': [PERMISSIONS.SUPPLIERS],
  '/clients': [PERMISSIONS.CLIENTS],
  '/invoices': [PERMISSIONS.INVOICES],
  '/price-list': [PERMISSIONS.PRICE_LIST],
  '/price-review': [PERMISSIONS.PRICE_REVIEW],
  '/hr': [PERMISSIONS.HR],
  '/reports': [PERMISSIONS.REPORTS],
  '/settings/menu': [PERMISSIONS.SETTINGS_MENU],
  '/admin': [PERMISSIONS.ADMIN],
  '/admin/users': [PERMISSIONS.ADMIN_USERS],
  '/admin/roles': [PERMISSIONS.ADMIN_ROLES],
  '/admin/permissions': [PERMISSIONS.ADMIN_PERMISSIONS],
  '/admin/audit-logs': [PERMISSIONS.ADMIN_AUDIT]
}

// دالة للتحقق من وجود صلاحية
export function hasPermission(userPermissions, requiredPermission) {
  if (!userPermissions || !Array.isArray(userPermissions)) return false

  return userPermissions.includes(requiredPermission)
}

// دالة للتحقق من صلاحية الوصول لصفحة
export function canAccessRoute(userPermissions, route) {
  const requiredPermissions = MENU_PERMISSIONS[route]

  if (!requiredPermissions) return true // إذا لم تكن هناك صلاحيات محددة، السماح بالوصول

  return requiredPermissions.some(permission => hasPermission(userPermissions, permission))
}
