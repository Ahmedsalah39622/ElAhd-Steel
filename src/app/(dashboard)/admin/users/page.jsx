'use client'

import { useState, useEffect } from 'react'

import {
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Alert,
  CircularProgress,
  Checkbox,
  FormGroup,
  FormControlLabel
} from '@mui/material'
import { Edit as EditIcon, Delete as DeleteIcon, Visibility as ViewIcon, Add as AddIcon } from '@mui/icons-material'

import { useAuth } from '@/@core/contexts/authContext'

const DASHBOARD_CARDS = [
  { id: 'balance', label: 'رصيد الخزينة' },
  { id: 'invoices', label: 'ملخص الفواتير' },
  { id: 'clients', label: 'العملاء' },
  { id: 'workers', label: 'العمال' },
  { id: 'income_summary', label: 'نمو الإيرادات' },
  { id: 'sales_summary', label: 'المبيعات الشهرية' },
  { id: 'income_expense', label: 'الإيرادات vs المصروفات' },
  { id: 'manufacturing_wip', label: 'تحت التشغيل' },
  { id: 'manufacturing_finished', label: 'منتجات تامة' },
  { id: 'manufacturing_issue', label: 'أمر تشغيل سريع' },
  { id: 'inventory_status', label: 'حالة المخزون' },
  { id: 'team_overview', label: 'نظرة عامة على الفريق' },
  { id: 'recent_transactions', label: 'آخر المعاملات' },
  { id: 'recent_invoices', label: 'آخر الفواتير' },
  { id: 'quick_actions', label: 'إجراءات سريعة' }
]

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)

  // استخدام AuthContext لتحديث الجلسة عند تغيير الأدوار
  const { user, refreshUser } = useAuth()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roleIds: [],
    allowedDashboardCards: null // null means all allowed
  })

  useEffect(() => {
    fetchUsers()
    fetchRoles()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users')
      const data = await response.json()

      if (data.success) {
        setUsers(data.users)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('فشل في تحميل المستخدمين')
    } finally {
      setLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/admin/roles')
      const data = await response.json()

      if (data.success) {
        setRoles(data.roles)
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err)
    }
  }

  const handleEdit = user => {
    setSelectedUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      roleIds: user.roles?.map(r => r.id) || [],
      allowedDashboardCards: user.allowedDashboardCards || [] 
    })
    setOpenDialog(true)
  }

  const handleView = user => {
    setSelectedUser(user)
    setOpenViewDialog(true)
  }

  const handleDelete = async userId => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('تم حذف المستخدم بنجاح')
        fetchUsers()
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('فشل في حذف المستخدم')
    }
  }

  const handleSubmit = async () => {
    try {
      const url = selectedUser ? `/api/admin/users/${selectedUser.id}` : '/api/admin/users'

      const method = selectedUser ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(selectedUser ? 'تم تحديث المستخدم بنجاح' : 'تم إضافة المستخدم بنجاح')
        setOpenDialog(false)
        fetchUsers()
        resetForm()

        // إذا تم تحديث المستخدم الحالي المسجل دخوله، حدث بياناته
        if (selectedUser && user && selectedUser.id === user.id) {
          try {
            await refreshUser()
            console.log('تم تحديث بيانات الجلسة بنجاح')
          } catch (refreshError) {
            console.error('فشل في تحديث بيانات الجلسة:', refreshError)
          }
        }
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('فشل في حفظ البيانات')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      roleIds: [],
      allowedDashboardCards: null
    })
    setSelectedUser(null)
  }

  const handleRoleToggle = roleId => {
    setFormData(prev => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId) ? prev.roleIds.filter(id => id !== roleId) : [...prev.roleIds, roleId]
    }))
  }

  const handleCardToggle = cardId => {
    setFormData(prev => {
      const currentCards = prev.allowedDashboardCards || DASHBOARD_CARDS.map(c => c.id)
      
      if (currentCards.includes(cardId)) {
        // Remove it
        return { ...prev, allowedDashboardCards: currentCards.filter(id => id !== cardId) }
      } else {
        // Add it
        return { ...prev, allowedDashboardCards: [...currentCards, cardId] }
      }
    })
  }

  const handleSelectAllCards = (checked) => {
     setFormData(prev => ({
       ...prev,
       allowedDashboardCards: checked ? null : []
     }))
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
          <Typography variant='h4'>إدارة المستخدمين</Typography>
          <Button
            variant='contained'
            color='primary'
            startIcon={<AddIcon />}
            onClick={() => {
              resetForm()
              setOpenDialog(true)
            }}
          >
            إضافة مستخدم جديد
          </Button>
        </Box>

        {error && (
          <Alert severity='error' onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity='success' onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>الاسم</TableCell>
                <TableCell>البريد الإلكتروني</TableCell>
                <TableCell>الأدوار</TableCell>
                <TableCell>تاريخ الإنشاء</TableCell>
                <TableCell align='center'>الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.roles?.map(role => (
                      <Chip key={role.id} label={role.name} size='small' color='primary' sx={{ mr: 0.5 }} />
                    ))}
                  </TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString('ar-EG')}</TableCell>
                  <TableCell align='center'>
                    <IconButton color='info' onClick={() => handleView(user)} title='عرض التفاصيل'>
                      <ViewIcon />
                    </IconButton>
                    <IconButton color='primary' onClick={() => handleEdit(user)} title='تعديل'>
                      <EditIcon />
                    </IconButton>
                    <IconButton color='error' onClick={() => handleDelete(user.id)} title='حذف'>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Edit/Add Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth='sm' fullWidth>
          <DialogTitle>{selectedUser ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label='الاسم'
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                margin='normal'
              />
              <TextField
                fullWidth
                label='البريد الإلكتروني'
                type='email'
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                margin='normal'
              />
              <TextField
                fullWidth
                label={selectedUser ? 'كلمة المرور الجديدة (اختياري)' : 'كلمة المرور'}
                type='password'
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                margin='normal'
              />

              <Typography variant='subtitle1' sx={{ mt: 2, mb: 1 }}>
                الأدوار والصلاحيات:
              </Typography>
              <FormGroup>
                {roles.map(role => (
                  <FormControlLabel
                    key={role.id}
                    control={
                      <Checkbox
                        checked={formData.roleIds.includes(role.id)}
                        onChange={() => handleRoleToggle(role.id)}
                      />
                    }
                    label={`${role.name} - ${role.description || ''}`}
                  />
                ))}
              </FormGroup>

              <Typography variant='subtitle1' sx={{ mt: 3, mb: 1 }}>
                لوحة التحكم (البطاقات المسموح بها):
              </Typography>
               <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.allowedDashboardCards === null}
                      onChange={(e) => handleSelectAllCards(e.target.checked)}
                    />
                  }
                  label='السماح بجميع البطاقات'
                />
              
              {formData.allowedDashboardCards !== null && (
                <FormGroup sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 1 }}>
                  {DASHBOARD_CARDS.map(card => (
                    <FormControlLabel
                      key={card.id}
                      control={
                        <Checkbox
                          checked={formData.allowedDashboardCards?.includes(card.id) || false}
                          onChange={() => handleCardToggle(card.id)}
                          size='small'
                        />
                      }
                      label={card.label}
                      sx={{ width: '45%' }}
                    />
                  ))}
                </FormGroup>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>إلغاء</Button>
            <Button onClick={handleSubmit} variant='contained' color='primary'>
              حفظ
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth='md' fullWidth>
          <DialogTitle>تفاصيل المستخدم</DialogTitle>
          <DialogContent>
            {selectedUser && (
              <Box sx={{ pt: 2 }}>
                <Typography variant='body1'>
                  <strong>الاسم:</strong> {selectedUser.name}
                </Typography>
                <Typography variant='body1' sx={{ mt: 1 }}>
                  <strong>البريد الإلكتروني:</strong> {selectedUser.email}
                </Typography>
                <Typography variant='body1' sx={{ mt: 1 }}>
                  <strong>الأدوار:</strong> {selectedUser.roles?.map(r => r.name).join(', ') || 'لا يوجد'}
                </Typography>
                <Typography variant='body1' sx={{ mt: 1 }}>
                  <strong>تاريخ الإنشاء:</strong> {new Date(selectedUser.createdAt).toLocaleString('ar-EG')}
                </Typography>
                <Typography variant='body1' sx={{ mt: 1 }}>
                  <strong>آخر تحديث:</strong> {new Date(selectedUser.updatedAt).toLocaleString('ar-EG')}
                </Typography>

                <Box mt={3}>
                  <Button
                    variant='outlined'
                    color='primary'
                    fullWidth
                    href={`/admin/audit-logs?userId=${selectedUser.id}`}
                  >
                    عرض سجل الأنشطة
                  </Button>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenViewDialog(false)}>إغلاق</Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  )
}
