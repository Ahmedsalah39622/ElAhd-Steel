'use client'

import { useState, useEffect } from 'react'

import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Alert,
  CircularProgress,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Grid,
  Divider,
  Paper,
  Tabs,
  Tab
} from '@mui/material'
import { Save as SaveIcon, Refresh as RefreshIcon } from '@mui/icons-material'

import { PERMISSIONS, ROLE_PERMISSIONS } from '@/utils/permissions'
import menuData from '@/data/navigation/verticalMenuData'
import { useAuth } from '@/@core/contexts/authContext'

export default function RolePermissionsPage() {
  const [roles, setRoles] = useState([])
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [selectedRole, setSelectedRole] = useState(null)
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [activeTab, setActiveTab] = useState(0)

  // استخدام AuthContext لتحديث الجلسة عند تغيير الصلاحيات
  const { user, refreshUser } = useAuth()

  useEffect(() => {
    fetchRoles()
  }, [])

  useEffect(() => {
    if (selectedRoleId) {
      const role = roles.find(r => r.id === parseInt(selectedRoleId))

      setSelectedRole(role)
      setPermissions(role?.permissions || [])
    }
  }, [selectedRoleId, roles])

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/roles')
      const data = await response.json()

      if (data.success) {
        setRoles(data.roles)

        if (data.roles.length > 0 && !selectedRoleId) {
          setSelectedRoleId(data.roles[0].id.toString())
        }
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('فشل في تحميل الأدوار')
    } finally {
      setLoading(false)
    }
  }

  const handlePermissionToggle = permission => {
    setPermissions(prev => {
      if (prev.includes(permission)) {
        return prev.filter(p => p !== permission)
      } else {
        return [...prev, permission]
      }
    })
  }

  const handleSave = async () => {
    if (!selectedRoleId) return

    try {
      setSaving(true)

      const response = await fetch(`/api/admin/roles/${selectedRoleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: selectedRole.name,
          description: selectedRole.description,
          permissions: permissions
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('تم حفظ الصلاحيات بنجاح')
        fetchRoles()

        // إذا كان المستخدم الحالي لديه نفس الدور المحدث، حدث بيانات الجلسة
        if (user && user.roles && user.roles.some(role => role.id === parseInt(selectedRoleId))) {
          try {
            await refreshUser()
            console.log('تم تحديث بيانات الجلسة بنجاح بعد تحديث الصلاحيات')
          } catch (refreshError) {
            console.error('فشل في تحديث بيانات الجلسة:', refreshError)
          }
        }

        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('فشل في حفظ الصلاحيات')
    } finally {
      setSaving(false)
    }
  }

  const applyPresetPermissions = presetKey => {
    const presetPermissions = ROLE_PERMISSIONS[presetKey]

    if (presetPermissions) {
      setPermissions(presetPermissions)
    }
  }

  // تنظيم الصلاحيات حسب الفئات
  const permissionCategories = {
    الأساسية: ['home', 'about', 'settings', 'settings.menu'],
    المشاريع: ['projects', 'projects.explorer'],
    'الخزينة والمحاسبة': ['safe', 'safe.personal', 'wallet'],
    المخزون: ['inventory', 'inventory.factory', 'inventory.client', 'inventory.operating'],
    التشغيل: ['manufacturing'],
    'الموردين والعملاء': ['suppliers', 'clients'],
    'الفواتير والأسعار': ['invoices', 'price_list', 'price_review'],
    'الموارد البشرية': ['hr', 'hr.workers', 'hr.attendance', 'hr.salaries'],
    التقارير: ['reports'],
    'لوحة الإدارة': ['admin', 'admin.users', 'admin.roles', 'admin.permissions', 'admin.audit_logs']
  }

  const getPermissionLabel = permission => {
    const labels = {
      home: 'الصفحة الرئيسية',
      about: 'عن النظام',
      settings: 'الإعدادات',
      'settings.menu': 'إعدادات القائمة',
      projects: 'الأرشيف',
      'projects.explorer': 'مستكشف العملاء',
      safe: 'الخزينة',
      'safe.personal': 'الخزنة الشخصية',
      wallet: 'المحفظة',
      inventory: 'المخزون',
      'inventory.factory': 'مواد المصنع',
      'inventory.client': 'مواد العملاء',
      'inventory.operating': 'مخزن وارد تشغيل',
      manufacturing: 'إدارة التشغيل',
      suppliers: 'الموردين',
      clients: 'العملاء',
      invoices: 'الفواتير',
      price_list: 'قوائم الأسعار',
      price_review: 'مراجعة الأسعار',
      hr: 'الموارد البشرية',
      'hr.workers': 'العمال',
      'hr.attendance': 'الحضور',
      'hr.salaries': 'المرتبات',
      reports: 'التقارير',
      admin: 'لوحة الإدارة',
      'admin.users': 'إدارة المستخدمين',
      'admin.roles': 'إدارة الأدوار',
      'admin.permissions': 'إدارة الصلاحيات',
      'admin.audit_logs': 'سجل الأنشطة'
    }

    return labels[permission] || permission
  }

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='400px'>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Card>
      <CardContent>
        <Box display='flex' justifyContent='space-between' alignItems='center' mb={3}>
          <Typography variant='h4'>إدارة صلاحيات الأدوار</Typography>
          <Button variant='outlined' startIcon={<RefreshIcon />} onClick={fetchRoles}>
            تحديث
          </Button>
        </Box>

        {error && (
          <Alert severity='error' onClose={() => setError(null)} sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity='success' onClose={() => setSuccess(null)} sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* اختيار الدور */}
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>اختر الدور</InputLabel>
              <Select value={selectedRoleId} onChange={e => setSelectedRoleId(e.target.value)} label='اختر الدور'>
                {roles.map(role => (
                  <MenuItem key={role.id} value={role.id.toString()}>
                    {role.name} {role.description && `- ${role.description}`}{' '}
                    {role.userCount > 0 && `(${role.userCount} مستخدم)`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* التبويبات */}
          {selectedRole && (
            <Grid item xs={12}>
              <Paper variant='outlined' sx={{ mb: 2 }}>
                <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} centered>
                  <Tab label='الصلاحيات' />
                  <Tab label='معلومات الدور' />
                </Tabs>
              </Paper>

              {/* Tab 1: الصلاحيات */}
              {activeTab === 0 && (
                <>
                  {/* القوالب الجاهزة */}
                  <Paper variant='outlined' sx={{ p: 2, mb: 2 }}>
                    <Typography variant='subtitle1' gutterBottom>
                      تطبيق قالب صلاحيات جاهز:
                    </Typography>
                    <Box display='flex' gap={1} flexWrap='wrap'>
                      <Button size='small' variant='outlined' onClick={() => applyPresetPermissions('admin')}>
                        مدير (كل الصلاحيات)
                      </Button>
                      <Button size='small' variant='outlined' onClick={() => applyPresetPermissions('accountant')}>
                        محاسب
                      </Button>
                      <Button
                        size='small'
                        variant='outlined'
                        onClick={() => applyPresetPermissions('inventory_manager')}
                      >
                        مدير مخزون
                      </Button>
                      <Button size='small' variant='outlined' onClick={() => applyPresetPermissions('sales_manager')}>
                        مدير مبيعات
                      </Button>
                      <Button size='small' variant='outlined' onClick={() => applyPresetPermissions('hr_manager')}>
                        مدير موارد بشرية
                      </Button>
                      <Button size='small' variant='outlined' onClick={() => applyPresetPermissions('project_manager')}>
                        مدير مشاريع
                      </Button>
                    </Box>
                  </Paper>

                  {/* الصلاحيات */}
                  <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
                    <Typography variant='h6'>
                      الصلاحيات المتاحة ({permissions.length} من {Object.values(PERMISSIONS).length})
                    </Typography>
                    <Box display='flex' gap={1}>
                      <Button size='small' onClick={() => setPermissions(Object.values(PERMISSIONS))}>
                        تحديد الكل
                      </Button>
                      <Button size='small' onClick={() => setPermissions([])}>
                        إلغاء الكل
                      </Button>
                    </Box>
                  </Box>

                  {Object.entries(permissionCategories).map(([category, categoryPerms]) => (
                    <Paper key={category} variant='outlined' sx={{ p: 2, mb: 2 }}>
                      <Typography variant='subtitle1' color='primary' gutterBottom>
                        {category}
                      </Typography>
                      <FormGroup row>
                        {categoryPerms.map(perm => (
                          <FormControlLabel
                            key={perm}
                            control={
                              <Checkbox
                                checked={permissions.includes(perm)}
                                onChange={() => handlePermissionToggle(perm)}
                              />
                            }
                            label={getPermissionLabel(perm)}
                            sx={{ minWidth: '200px' }}
                          />
                        ))}
                      </FormGroup>
                    </Paper>
                  ))}
                </>
              )}

              {/* Tab 2: معلومات الدور */}
              {activeTab === 1 && (
                <Paper variant='outlined' sx={{ p: 3 }}>
                  <Typography variant='h6' gutterBottom>
                    معلومات الدور: {selectedRole.name}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant='body2' color='text.secondary'>
                        اسم الدور
                      </Typography>
                      <Typography variant='body1' fontWeight='bold'>
                        {selectedRole.name}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant='body2' color='text.secondary'>
                        عدد المستخدمين
                      </Typography>
                      <Typography variant='body1' fontWeight='bold'>
                        {selectedRole.userCount || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant='body2' color='text.secondary'>
                        الوصف
                      </Typography>
                      <Typography variant='body1'>{selectedRole.description || 'لا يوجد وصف'}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant='body2' color='text.secondary' gutterBottom>
                        عدد الصلاحيات الحالية
                      </Typography>
                      <Chip label={`${permissions.length} صلاحية`} color='primary' variant='outlined' />
                    </Grid>
                    <Grid item xs={12}>
                      <Alert severity='info'>
                        <Typography variant='body2'>
                          💡 <strong>ملاحظة:</strong> يمكن للمستخدمين الذين لديهم هذا الدور الوصول فقط للصفحات المحددة
                          في قسم الصلاحيات. إذا كان المستخدم أدمن، سيتم عرض جميع الصفحات تلقائياً.
                        </Typography>
                      </Alert>
                    </Grid>
                  </Grid>
                </Paper>
              )}

              {/* زر الحفظ */}
              <Box mt={3}>
                <Button
                  variant='contained'
                  color='primary'
                  size='large'
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={saving}
                  fullWidth
                >
                  {saving ? 'جاري الحفظ...' : 'حفظ الصلاحيات'}
                </Button>
              </Box>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  )
}
