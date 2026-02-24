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

export default function SuppliersPage() {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [isEditing, setIsEditing] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    bankName: '',
    accountNumber: '',
    iban: ''
  })

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/suppliers', { credentials: 'include' })

      if (!response.ok) {
        throw new Error('Failed to fetch suppliers')
      }

      const data = await response.json()

      setSuppliers(data.data || [])
    } catch (err) {
      setError(err.message)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (supplier = null) => {
    if (supplier) {
      setIsEditing(true)
      setSelectedSupplier(supplier)
      setFormData(supplier)
    } else {
      setIsEditing(false)
      setSelectedSupplier(null)
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: '',
        bankName: '',
        accountNumber: '',
        iban: ''
      })
    }

    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: '',
      bankName: '',
      accountNumber: '',
      iban: ''
    })
  }

  const handleInputChange = e => {
    const { name, value } = e.target

    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSaveSupplier = async () => {
    if (!formData.name.trim()) {
      setError('اسم المورد مطلوب')

      return
    }

    try {
      const url = isEditing ? `/api/suppliers/${selectedSupplier.id}` : '/api/suppliers'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const result = await response.json()

        throw new Error(result.message || 'Failed to save supplier')
      }

      handleCloseDialog()
      setError('')
      await fetchSuppliers()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeleteClick = supplier => {
    setSelectedSupplier(supplier)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedSupplier?.id) return

    try {
      const response = await fetch(`/api/suppliers/${selectedSupplier.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })

      if (!response.ok) {
        const result = await response.json()

        throw new Error(result.message || 'Failed to delete supplier')
      }

      setError('')
      await fetchSuppliers()
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleteDialogOpen(false)
      setSelectedSupplier(null)
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
      <h1 className='text-2xl font-semibold mb-6'>إدارة الموردين</h1>

      <Card>
        <CardHeader
          title={`إجمالي الموردين: ${suppliers.length}`}
          sx={{
            backgroundColor: 'var(--mui-palette-background-paper)',
            '& .MuiCardHeader-title': {
              color: 'var(--mui-palette-text-primary)'
            },
            '& .MuiCardHeader-action': {
              alignSelf: 'center'
            }
          }}
          action={
            <Button variant='contained' color='primary' onClick={() => handleOpenDialog()}>
              + إضافة مورد
            </Button>
          }
        />
        <CardContent>
          {error && (
            <Alert severity='error' style={{ marginBottom: '16px' }}>
              {error}
            </Alert>
          )}

          {suppliers.length === 0 ? (
            <Alert severity='info'>لم يتم العثور على موردين. أضف مورداً للبدء.</Alert>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'var(--mui-palette-action-hover)' }}>
                    <TableCell>
                      <strong>الاسم</strong>
                    </TableCell>
                    <TableCell>
                      <strong>البريد الإلكتروني</strong>
                    </TableCell>
                    <TableCell>
                      <strong>الهاتف</strong>
                    </TableCell>
                    <TableCell>
                      <strong>المدينة</strong>
                    </TableCell>
                    <TableCell>
                      <strong>الدولة</strong>
                    </TableCell>
                    <TableCell>
                      <strong>البنك</strong>
                    </TableCell>
                    <TableCell>
                      <strong>العنوان</strong>
                    </TableCell>
                    <TableCell>
                      <strong>رقم الحساب</strong>
                    </TableCell>
                    <TableCell>
                      <strong>آيبان</strong>
                    </TableCell>
                    <TableCell>
                      <strong>المستحق له</strong>
                    </TableCell>
                    <TableCell align='center'>
                      <strong>الإجراءات</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {suppliers.map(supplier => (
                    <TableRow key={supplier.id} hover>
                      <TableCell>
                        <strong>{supplier.name}</strong>
                      </TableCell>
                      <TableCell>{supplier.email || '-'}</TableCell>
                      <TableCell>{supplier.phone || '-'}</TableCell>
                      <TableCell>{supplier.city || '-'}</TableCell>
                      <TableCell>{supplier.country || '-'}</TableCell>
                      <TableCell>{supplier.bankName || '-'}</TableCell>
                      <TableCell>{supplier.address || '-'}</TableCell>
                      <TableCell>{supplier.accountNumber || '-'}</TableCell>
                      <TableCell>{supplier.iban || '-'}</TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            color: supplier.balance > 0 ? 'error.main' : 'success.main',
                            fontWeight: 'bold'
                          }}
                        >
                          {supplier.balance > 0 ? `${supplier.balance.toLocaleString()} جنيه` : 'لا يوجد'}
                        </Box>
                      </TableCell>
                      <TableCell align='center'>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <IconButton
                            size='small'
                            color='info'
                            onClick={() => router.push(`/suppliers/${supplier.id}/account`)}
                            title='المعاملات'
                          >
                            <ReceiptLongIcon fontSize='small' />
                          </IconButton>
                          <IconButton
                            size='small'
                            color='primary'
                            onClick={() => handleOpenDialog(supplier)}
                            title='تعديل'
                          >
                            <EditIcon fontSize='small' />
                          </IconButton>
                          <IconButton
                            size='small'
                            color='error'
                            onClick={() => handleDeleteClick(supplier)}
                            title='حذف'
                          >
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

      {/* نافذة إضافة/تعديل المورد */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth='sm' fullWidth>
        <DialogTitle>{isEditing ? 'تعديل المورد' : 'إضافة مورد جديد'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='اسم المورد *'
                name='name'
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='البريد الإلكتروني'
                type='email'
                name='email'
                value={formData.email}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label='الهاتف' name='phone' value={formData.phone} onChange={handleInputChange} />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='العنوان'
                name='address'
                value={formData.address}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label='المدينة' name='city' value={formData.city} onChange={handleInputChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='الدولة'
                name='country'
                value={formData.country}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='اسم البنك'
                name='bankName'
                value={formData.bankName}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='رقم الحساب'
                name='accountNumber'
                value={formData.accountNumber}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label='آيبان' name='iban' value={formData.iban} onChange={handleInputChange} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog}>إلغاء</Button>
          <Button onClick={handleSaveSupplier} variant='contained' color='primary'>
            {isEditing ? 'تحديث' : 'إضافة'} المورد
          </Button>
        </DialogActions>
      </Dialog>

      {/* نافذة تأكيد الحذف */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>حذف المورد؟</DialogTitle>
        <DialogContent>هل أنت متأكد من حذف {selectedSupplier?.name}؟ لا يمكن التراجع عن هذا الإجراء.</DialogContent>
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
