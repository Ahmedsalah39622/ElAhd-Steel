'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  Box,
  Alert,
  CircularProgress,
  Chip,
  Tooltip
} from '@mui/material'
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Group as GroupIcon,
  Shield as ShieldIcon
} from '@mui/icons-material'

export default function AdminRolesPage() {
  const router = useRouter()
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedRole, setSelectedRole] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/roles')
      const data = await response.json()
      if (data.success) {
        setRoles(data.roles)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('فشل في تحميل الأدوار')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = role => {
    setSelectedRole(role)
    setFormData({
      name: role.name,
      description: role.description || ''
    })
    setOpenDialog(true)
  }

  const handleDelete = async roleId => {
    if (!confirm('هل أنت متأكد من حذف هذا الدور؟')) return

    try {
      const response = await fetch(`/api/admin/roles/${roleId}`, {
        method: 'DELETE'
      })
      const data = await response.json()

      if (data.success) {
        setSuccess('تم حذف الدور بنجاح')
        fetchRoles()
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('فشل في حذف الدور')
    }
  }

  const handleSubmit = async () => {
    try {
      const url = selectedRole ? `/api/admin/roles/${selectedRole.id}` : '/api/admin/roles'

      const method = selectedRole ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(selectedRole ? 'تم تحديث الدور بنجاح' : 'تم إضافة الدور بنجاح')
        setOpenDialog(false)
        fetchRoles()
        resetForm()
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
      description: ''
    })
    setSelectedRole(null)
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
          <Typography variant='h4'>إدارة الأدوار والصلاحيات</Typography>
          <Button
            variant='contained'
            color='primary'
            startIcon={<AddIcon />}
            onClick={() => {
              resetForm()
              setOpenDialog(true)
            }}
          >
            إضافة دور جديد
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
                <TableCell>اسم الدور</TableCell>
                <TableCell>الوصف</TableCell>
                <TableCell align='center'>عدد الصلاحيات</TableCell>
                <TableCell align='center'>عدد المستخدمين</TableCell>
                <TableCell align='center'>الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {roles.map(role => (
                <TableRow key={role.id}>
                  <TableCell>
                    <Box display='flex' alignItems='center'>
                      <Chip label={role.name} color='primary' variant='outlined' />
                    </Box>
                  </TableCell>
                  <TableCell>{role.description || '-'}</TableCell>
                  <TableCell align='center'>
                    <Chip
                      icon={<ShieldIcon />}
                      label={role.permissions?.length || 0}
                      size='small'
                      color={role.permissions?.length > 0 ? 'info' : 'default'}
                    />
                  </TableCell>
                  <TableCell align='center'>
                    <Chip
                      icon={<GroupIcon />}
                      label={role.userCount || 0}
                      size='small'
                      color={role.userCount > 0 ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align='center'>
                    <Tooltip title='تعديل الصلاحيات'>
                      <IconButton color='info' onClick={() => router.push('/admin/permissions')}>
                        <ShieldIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title='تعديل الدور'>
                      <IconButton color='primary' onClick={() => handleEdit(role)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title='حذف الدور'>
                      <IconButton color='error' onClick={() => handleDelete(role.id)} disabled={role.userCount > 0}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Add/Edit Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth='sm' fullWidth>
          <DialogTitle>{selectedRole ? 'تعديل الدور' : 'إضافة دور جديد'}</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label='اسم الدور'
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                margin='normal'
                required
                placeholder='مثال: Admin, Manager, Employee'
              />
              <TextField
                fullWidth
                label='الوصف'
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                margin='normal'
                multiline
                rows={3}
                placeholder='وصف موجز للدور والصلاحيات المتاحة'
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>إلغاء</Button>
            <Button onClick={handleSubmit} variant='contained' color='primary' disabled={!formData.name}>
              حفظ
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  )
}
