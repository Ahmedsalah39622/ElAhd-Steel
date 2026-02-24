'use client'

import { useState, useEffect } from 'react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

import { useAuth } from '@core/contexts/authContext'

// استيراد بيانات القائمة
import menuData from '@/data/navigation/verticalMenuData'
import { canAccessRoute } from '@/utils/permissions'

const MenuSettings = () => {
  const { user, refreshUser } = useAuth()
  const [selectedItems, setSelectedItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)
  const [availableMenuItems, setAvailableMenuItems] = useState([])

  // جمع كل الصلاحيات من جميع أدوار المستخدم
  const userPermissions =
    user?.roles?.reduce((acc, role) => {
      if (role.permissions && Array.isArray(role.permissions)) {
        return [...acc, ...role.permissions]
      }

      return acc
    }, []) || []

  const uniquePermissions = [...new Set(userPermissions)]

  useEffect(() => {
    // إذا كان المستخدم أدمن، عرض جميع عناصر القائمة
    if (user?.isAdmin) {
      const allItems = []
      const menu = menuData()

      menu.forEach(item => {
        allItems.push({ href: item.href, label: item.label, icon: item.icon })

        if (item.children) {
          item.children.forEach(child => {
            allItems.push({ href: child.href, label: `  ← ${child.label}`, icon: child.icon, isChild: true })
          })
        }
      })

      setAvailableMenuItems(allItems)
    } else {
      // عرض فقط العناصر المسموح بها بناء على الصلاحيات
      const allowedItems = []
      const menu = menuData()

      menu.forEach(item => {
        const hasAccess = canAccessRoute(uniquePermissions, item.href)

        if (hasAccess) {
          allowedItems.push({ href: item.href, label: item.label, icon: item.icon })

          if (item.children) {
            item.children.forEach(child => {
              const childHasAccess = canAccessRoute(uniquePermissions, child.href)

              if (childHasAccess) {
                allowedItems.push({
                  href: child.href,
                  label: `  ← ${child.label}`,
                  icon: child.icon,
                  isChild: true
                })
              }
            })
          }
        }
      })

      setAvailableMenuItems(allowedItems)
    }

    // تعيين العناصر المحددة حالياً
    if (user?.visibleMenuItems && Array.isArray(user.visibleMenuItems)) {
      setSelectedItems(user.visibleMenuItems)
    } else {
      // إذا لم يكن هناك عناصر محددة، تحديد الكل افتراضياً
      const menu = menuData()
      const allHrefs = []

      menu.forEach(item => {
        allHrefs.push(item.href)

        if (item.children) {
          item.children.forEach(child => allHrefs.push(child.href))
        }
      })

      setSelectedItems(allHrefs)
    }
  }, [user, uniquePermissions])

  const handleToggle = href => {
    setSelectedItems(prev => {
      if (prev.includes(href)) {
        return prev.filter(item => item !== href)
      } else {
        return [...prev, href]
      }
    })
  }

  const handleSelectAll = () => {
    const allHrefs = availableMenuItems.map(item => item.href)

    setSelectedItems(allHrefs)
  }

  const handleDeselectAll = () => {
    setSelectedItems([])
  }

  const handleReset = () => {
    // إعادة التعيين للإعدادات الافتراضية (كل العناصر)
    const allHrefs = availableMenuItems.map(item => item.href)

    setSelectedItems(allHrefs)
  }

  const handleSave = async () => {
    setLoading(true)
    setSuccess(false)
    setError(null)

    try {
      const response = await fetch('/api/user/menu-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          visibleMenuItems: selectedItems.length > 0 ? selectedItems : null
        })
      })

      if (!response.ok) {
        const data = await response.json()

        throw new Error(data.error || 'حدث خطأ أثناء الحفظ')
      }

      const updatedUser = await response.json()

      // تحديث بيانات المستخدم في localStorage
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('auth_user', JSON.stringify(updatedUser))
      }

      // تحديث السياق
      await refreshUser()

      setSuccess(true)

      // إعادة تحميل الصفحة بعد ثانيتين لتطبيق التغييرات
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // إذا كان المستخدم أدمن، عرض رسالة
  if (user?.isAdmin) {
    return (
      <Card>
        <CardHeader title='إعدادات القائمة الجانبية' />
        <Divider />
        <CardContent>
          <Alert severity='info'>كمسؤول نظام، يتم عرض جميع الصفحات تلقائياً ولا يمكن تخصيص القائمة الجانبية.</Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader title='إعدادات القائمة الجانبية' subheader='اختر الصفحات التي تريد ظهورها في القائمة الجانبية' />
      <Divider />
      <CardContent>
        {success && (
          <Alert severity='success' sx={{ mb: 3 }}>
            تم حفظ الإعدادات بنجاح! سيتم إعادة تحميل الصفحة...
          </Alert>
        )}

        {error && (
          <Alert severity='error' sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
          <Button variant='outlined' size='small' onClick={handleSelectAll}>
            تحديد الكل
          </Button>
          <Button variant='outlined' size='small' onClick={handleDeselectAll}>
            إلغاء تحديد الكل
          </Button>
          <Button variant='outlined' size='small' onClick={handleReset}>
            إعادة تعيين
          </Button>
        </Box>

        <FormGroup>
          {availableMenuItems.map(item => (
            <FormControlLabel
              key={item.href}
              control={
                <Checkbox
                  checked={selectedItems.includes(item.href)}
                  onChange={() => handleToggle(item.href)}
                  disabled={loading}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {item.icon && <i className={item.icon} />}
                  <Typography variant='body2' sx={{ fontWeight: item.isChild ? 400 : 500 }}>
                    {item.label}
                  </Typography>
                </Box>
              }
              sx={{
                ml: item.isChild ? 4 : 0,
                mb: 1
              }}
            />
          ))}
        </FormGroup>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant='contained'
            onClick={handleSave}
            disabled={loading || selectedItems.length === 0}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </Button>
        </Box>

        {selectedItems.length === 0 && (
          <Alert severity='warning' sx={{ mt: 2 }}>
            يجب اختيار صفحة واحدة على الأقل
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

export default MenuSettings
