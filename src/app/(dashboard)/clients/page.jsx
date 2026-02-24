'use client'

import { useState, useEffect } from 'react'

import {
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Box,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import { useRouter } from 'next/navigation'

export default function ClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  const [isEditing, setIsEditing] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    profile: '',
    budget: '',
    material: [
      {
        name: '',
        qty: ''
      }
    ]
  })

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/clients', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch clients')
      }

      const data = await response.json()

      setClients(data.data || [])
    } catch (err) {
      setError(err.message)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (client = null) => {
    if (client) {
      setIsEditing(true)
      setSelectedClient(client)
      // client.material may already be parsed as array by API
      const materialArray = Array.isArray(client.material)
        ? client.material
        : client.material
          ? tryParseMaterial(client.material)
          : [{ name: '', qty: '' }]

      setFormData({
        name: client.name || '',
        phone: client.phone || '',
        profile: client.profile || '',
        budget: client.budget || '',
        material: materialArray.length ? materialArray : [{ name: '', qty: '' }]
      })
    } else {
      setIsEditing(false)
      setSelectedClient(null)
      setFormData({ name: '', phone: '', profile: '', budget: '', material: [{ name: '', qty: '' }] })
    }

    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setFormData({ name: '', phone: '', profile: '', budget: '', material: '' })
  }

  const handleInputChange = e => {
    const { name, value } = e.target

    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  function tryParseMaterial(mat) {
    if (!mat) return []
    if (Array.isArray(mat)) return mat
    try {
      const parsed = JSON.parse(mat)
      if (Array.isArray(parsed)) return parsed
    } catch (e) {}
    // fallback: comma-separated names -> convert to objects
    return String(mat)
      .split(',')
      .map(s => ({ name: s.trim(), qty: '' }))
      .filter(m => m.name)
  }

  const handleMaterialChange = (index, field, value) => {
    setFormData(prev => {
      const next = { ...prev }
      next.material = next.material.map((m, i) => (i === index ? { ...m, [field]: value } : m))
      return next
    })
  }

  const handleAddMaterial = () => {
    setFormData(prev => ({ ...prev, material: [...prev.material, { name: '', qty: '' }] }))
  }

  const handleRemoveMaterial = index => {
    setFormData(prev => ({ ...prev, material: prev.material.filter((_, i) => i !== index) }))
  }

  const handleSaveClient = async () => {
    if (!formData.name.trim()) {
      setError('اسم العميل مطلوب')
      return
    }

    try {
      const payload = { ...formData }
      // ensure material sent as array of objects; strip empty rows
      payload.material = Array.isArray(payload.material)
        ? payload.material.map(m => ({ name: m.name || '', qty: m.qty || '' })).filter(m => m.name)
        : []

      if (isEditing && selectedClient?.id) {
        const response = await fetch(`/api/clients/${selectedClient.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload)
        })

        if (!response.ok) {
          const result = await response.json()
          throw new Error(result.message || 'Failed to update client')
        }
      } else {
        const response = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload)
        })

        if (!response.ok) {
          const result = await response.json()
          throw new Error(result.message || 'Failed to save client')
        }
      }

      handleCloseDialog()
      setError('')
      await fetchClients()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeleteClick = client => {
    setSelectedClient(client)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedClient?.id) return

    try {
      const response = await fetch(`/api/clients/${selectedClient.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || 'Failed to delete client')
      }

      setError('')
      await fetchClients()
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleteDialogOpen(false)
      setSelectedClient(null)
    }
  }

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='400px'>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <div className='p-6' dir='rtl'>
      <h1 className='text-2xl font-semibold mb-6'>إدارة العملاء</h1>

      <Card>
        <CardHeader
          title={`إجمالي العملاء: ${clients.length}`}
          sx={{
            '& .MuiCardHeader-title': {
              color: 'var(--mui-palette-text-primary)'
            }
          }}
          action={
            <Button variant='contained' color='primary' onClick={() => handleOpenDialog()}>
              + إضافة عميل
            </Button>
          }
        />
        <CardContent>
          {error && (
            <Alert severity='error' style={{ marginBottom: '16px' }}>
              {error}
            </Alert>
          )}

          {clients.length === 0 ? (
            <Alert severity='info'>لم يتم العثور على عملاء. أضف عميلاً للبدء.</Alert>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'var(--mui-palette-action-hover)' }}>
                    <TableCell>
                      <strong>الاسم</strong>
                    </TableCell>
                    <TableCell>
                      <strong>الهاتف</strong>
                    </TableCell>
                    <TableCell>
                      <strong>الميزانية</strong>
                    </TableCell>
                    <TableCell>
                      <strong>المواد</strong>
                    </TableCell>
                    <TableCell>
                      <strong>المستحق</strong>
                    </TableCell>
                    <TableCell align='center'>
                      <strong>الإجراءات</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clients.map(client => (
                    <TableRow key={client.id} hover>
                      <TableCell>
                        <strong>{client.name}</strong>
                      </TableCell>
                      <TableCell>{client.phone || '-'}</TableCell>
                      <TableCell>{client.budget ?? '-'}</TableCell>
                      <TableCell>
                        {Array.isArray(client.material)
                          ? client.material.map(m => `${m.name}${m.qty ? ` (${m.qty})` : ''}`).join(', ')
                          : client.material || '-'}
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            color: client.balance > 0 ? 'error.main' : 'success.main',
                            fontWeight: 'bold'
                          }}
                        >
                          {client.balance > 0 ? `${client.balance.toLocaleString()} جنيه` : 'لا يوجد'}
                        </Box>
                      </TableCell>
                      <TableCell align='center'>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <IconButton
                            size='small'
                            color='info'
                            onClick={() => router.push(`/clients/${client.id}/account`)}
                            title='المعاملات'
                          >
                            <ReceiptLongIcon fontSize='small' />
                          </IconButton>
                          <IconButton
                            size='small'
                            color='primary'
                            onClick={() => handleOpenDialog(client)}
                            title='تعديل'
                          >
                            <EditIcon fontSize='small' />
                          </IconButton>
                          <IconButton size='small' color='error' onClick={() => handleDeleteClick(client)} title='حذف'>
                            <DeleteIcon fontSize='small' />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth='sm' fullWidth>
        <DialogTitle>{isEditing ? 'تعديل العميل' : 'إضافة عميل جديد'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='اسم العميل *'
                name='name'
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label='الهاتف' name='phone' value={formData.phone} onChange={handleInputChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='الميزانية'
                name='budget'
                value={formData.budget}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <strong>المواد</strong>
                  <Button size='small' onClick={handleAddMaterial} sx={{ ml: 'auto' }}>
                    + إضافة
                  </Button>
                </Box>
                {(Array.isArray(formData.material) ? formData.material : tryParseMaterial(formData.material)).map(
                  (m, idx) => (
                    <Grid container spacing={1} key={idx} sx={{ mb: 1 }}>
                      <Grid item xs={8}>
                        <TextField
                          fullWidth
                          label={`المادة #${idx + 1}`}
                          value={m.name}
                          onChange={e => handleMaterialChange(idx, 'name', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={3}>
                        <TextField
                          fullWidth
                          label='الكمية'
                          value={m.qty}
                          onChange={e => handleMaterialChange(idx, 'qty', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={1}>
                        <Button color='error' onClick={() => handleRemoveMaterial(idx)}>
                          -
                        </Button>
                      </Grid>
                    </Grid>
                  )
                )}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label='الملف الشخصي / ملاحظات'
                name='profile'
                value={formData.profile}
                onChange={handleInputChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog}>إلغاء</Button>
          <Button onClick={handleSaveClient} variant='contained' color='primary'>
            {isEditing ? 'تحديث' : 'إضافة'} العميل
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>حذف العميل؟</DialogTitle>
        <DialogContent>هل أنت متأكد من حذف {selectedClient?.name}؟ لا يمكن التراجع عن هذا الإجراء.</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>إلغاء</Button>
          <Button onClick={handleDeleteConfirm} color='error' variant='contained'>
            حذف
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
