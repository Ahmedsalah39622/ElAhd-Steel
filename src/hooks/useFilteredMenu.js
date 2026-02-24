'use client'

import { useAuth } from '@core/contexts/authContext'
import { canAccessRoute } from '@/utils/permissions'

const getFilteredMenu = (menuData, userPermissions, isAdmin, visibleMenuItems) => {
  if (!menuData || !Array.isArray(menuData)) return []

  // Helper: check if an item's permissionKey is satisfied
  const hasPermissionKey = (item) => {
    if (!item.permissionKey) return true // no key = always visible
    return userPermissions.includes(item.permissionKey)
  }

  return menuData
    .map(item => {
      // الأدمن يرى كل الصفحات دائماً
      if (isAdmin) {
        // إذا كان العنصر يحتوي على عناصر فرعية، عرضها جميعاً
        if (item.children) {
          return {
            ...item,
            children: item.children
          }
        }

        return item
      }

      // التحقق من permissionKey (مثل manufacturing)
      if (!hasPermissionKey(item)) return null

      // إذا كان العنصر يحتوي على عناصر فرعية، تصفيتها أيضاً حسب permissionKey
      if (item.children) {
        item = {
          ...item,
          children: item.children.filter(child => hasPermissionKey(child))
        }
        if (item.children.length === 0) return null
      }

      // التحقق من الصلاحية للعنصر الحالي
      const hasAccess = canAccessRoute(userPermissions, item.href)

      if (!hasAccess) return null

      // إذا كان المستخدم لديه قائمة visibleMenuItems محددة
      if (visibleMenuItems && Array.isArray(visibleMenuItems)) {
        // التحقق من أن العنصر في القائمة المرئية
        const isVisible = visibleMenuItems.includes(item.href)

        if (!isVisible) return null

        // إذا كان العنصر يحتوي على عناصر فرعية، تصفيتها أيضاً
        if (item.children) {
          const filteredChildren = item.children.filter(
            child => canAccessRoute(userPermissions, child.href) && visibleMenuItems.includes(child.href)
          )

          // إذا لم يكن هناك أي عناصر فرعية متاحة، لا تعرض العنصر الرئيسي
          if (filteredChildren.length === 0) return null

          return {
            ...item,
            children: filteredChildren
          }
        }

        return item
      }

      // إذا لم يكن لديه visibleMenuItems محددة، عرض كل الصفحات المسموح بها
      if (item.children) {
        const filteredChildren = item.children.filter(child => canAccessRoute(userPermissions, child.href))

        // إذا لم يكن هناك أي عناصر فرعية متاحة، لا تعرض العنصر الرئيسي
        if (filteredChildren.length === 0) return null

        return {
          ...item,
          children: filteredChildren
        }
      }

      return item
    })
    .filter(Boolean) // إزالة العناصر null
}

// Hook لاستخدام القوائم المفلترة
export function useFilteredMenu(menuData) {
  const { user } = useAuth()

  // التحقق من أن المستخدم أدمن
  const isAdmin = user?.isAdmin || false

  // جمع كل الصلاحيات من جميع أدوار المستخدم
  const userPermissions =
    user?.roles?.reduce((acc, role) => {
      if (role.permissions && Array.isArray(role.permissions)) {
        return [...acc, ...role.permissions]
      }

      return acc
    }, []) || []

  // إزالة التكرار
  const uniquePermissions = [...new Set(userPermissions)]

  // الحصول على القائمة المرئية المخصصة
  const visibleMenuItems = user?.visibleMenuItems

  return getFilteredMenu(menuData, uniquePermissions, isAdmin, visibleMenuItems)
}

export default useFilteredMenu
