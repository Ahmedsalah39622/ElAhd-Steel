'use client'

import { useEffect, useState } from 'react'

import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import CircularProgress from '@mui/material/CircularProgress'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'

export default function EditPriceListPage() {
  const router = useRouter()
  const { id } = useParams()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [clients, setClients] = useState([])
  const [materials, setMaterials] = useState([])
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  const [form, setForm] = useState({
    clientId: '',
    clientName: '',
    projectName: '',
    projectDescription: '',
    validUntil: '',
    status: 'draft',
    notes: ''
  })

  const [items, setItems] = useState([])
  const [manufacturingItems, setManufacturingItems] = useState([])

  useEffect(() => {
    fetchClients()
    fetchMaterials()

    if (id) {
      fetchPriceList()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients', { credentials: 'include' })

      if (res.ok) {
        const data = await res.json()

        setClients(Array.isArray(data) ? data : data.clients || [])
      }
    } catch (err) {
      console.error('Error fetching clients:', err)
    }
  }

  const fetchMaterials = async () => {
    try {
      const res = await fetch('/api/inventory', { credentials: 'include' })

      if (res.ok) {
        const data = await res.json()

        setMaterials(Array.isArray(data) ? data : data.materials || [])
      }
    } catch (err) {
      console.error('Error fetching materials:', err)
    }
  }

  const fetchPriceList = async () => {
    setLoading(true)

    try {
      const res = await fetch(`/api/price-lists?id=${id}`, { credentials: 'include' })

      if (res.ok) {
        const data = await res.json()

        setForm({
          clientId: data.clientId || '',
          clientName: data.clientName || '',
          projectName: data.projectName || '',
          projectDescription: data.projectDescription || '',
          validUntil: data.validUntil ? new Date(data.validUntil).toISOString().split('T')[0] : '',
          status: data.status || 'draft',
          notes: data.notes || ''
        })

        setItems(data.items || [])
        setManufacturingItems(data.manufacturingItems || [])
      }
    } catch (err) {
      console.error('Error fetching price list:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFormChange = e => {
    const { name, value } = e.target

    if (name === 'clientId') {
      const selectedClient = clients.find(c => c.id == value)

      setForm({
        ...form,
        clientId: value,
        clientName: selectedClient?.name || ''
      })
    } else {
      setForm({ ...form, [name]: value })
    }
  }

  // Items handlers
  const addItem = () => {
    setItems([...items, { materialId: '', name: '', description: '', qty: 1, unit: 'kg', price: 0 }])
  }

  const updateItem = (idx, field, val) => {
    const upd = [...items]

    upd[idx][field] = val

    if (field === 'materialId') {
      const mat = materials.find(m => m.id == val)

      if (mat) {
        upd[idx].name = mat.name
        upd[idx].price = mat.pricePerUnit || 0
        upd[idx].unit = mat.unit || 'kg'
      }
    }

    setItems(upd)
  }

  const removeItem = idx => {
    setItems(items.filter((_, i) => i !== idx))
  }

  // Manufacturing handlers
  const addManufacturingItem = () => {
    setManufacturingItems([...manufacturingItems, { type: '', description: '', quantity: 1, unitCost: 0, total: 0 }])
  }

  const updateManufacturingItem = (idx, field, val) => {
    const upd = [...manufacturingItems]

    upd[idx][field] = val

    if (field === 'quantity' || field === 'unitCost') {
      upd[idx].total = Number(upd[idx].quantity || 0) * Number(upd[idx].unitCost || 0)
    }

    setManufacturingItems(upd)
  }

  const removeManufacturingItem = idx => {
    setManufacturingItems(manufacturingItems.filter((_, i) => i !== idx))
  }

  const calculateTotals = () => {
    const itemsTotal = items.reduce((s, it) => s + Number(it.qty || 0) * Number(it.price || 0), 0)
    const mfgTotal = manufacturingItems.reduce((s, it) => s + Number(it.total || 0), 0)

    return { itemsTotal, mfgTotal, grandTotal: itemsTotal + mfgTotal }
  }

  const handleSubmit = async () => {
    setSaving(true)

    try {
      const res = await fetch('/api/price-lists', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id,
          ...form,
          items,
          manufacturingItems
        })
      })

      if (res.ok) {
        setSnackbar({ open: true, message: 'تم تحديث قائمة الأسعار بنجاح', severity: 'success' })
        setTimeout(() => router.push(`/price-list/${id}`), 1500)
      } else {
        throw new Error('Failed to update')
      }
    } catch (err) {
      console.error('Error updating price list:', err)
      setSnackbar({ open: true, message: 'حدث خطأ أثناء التحديث', severity: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = value => {
    return Number(value || 0).toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })
  }

  const { itemsTotal, mfgTotal, grandTotal } = calculateTotals()

  const manufacturingTypes = [
    { value: 'laser', label: 'قطع ليزر' },
    { value: 'plasma', label: 'قطع بلازما' },
    { value: 'cnc', label: 'تشغيل CNC' },
    { value: 'bending', label: 'ثني' },
    { value: 'welding', label: 'لحام' },
    { value: 'drilling', label: 'تخريم' },
    { value: 'cutting', label: 'قطع' },
    { value: 'painting', label: 'دهان' },
    { value: 'galvanizing', label: 'جلفنة' },
    { value: 'other', label: 'أخرى' }
  ]

  const unitOptions = [
    { value: 'kg', label: 'كجم' },
    { value: 'ton', label: 'طن' },
    { value: 'meter', label: 'متر' },
    { value: 'piece', label: 'قطعة' },
    { value: 'sheet', label: 'لوح' },
    { value: 'bar', label: 'سيخ' }
  ]

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <div className='p-6'>
      <div className='flex items-center justify-between mb-6'>
        <Typography variant='h4' className='font-bold'>
          ✏️ تعديل قائمة الأسعار
        </Typography>
        <Link href={`/price-list/${id}`}>
          <Button variant='outlined' color='secondary'>
            إلغاء
          </Button>
        </Link>
      </div>

      {/* Basic Info */}
      <Card className='mb-6'>
        <CardContent>
          <Typography variant='h6' className='font-semibold mb-4'>
            معلومات أساسية
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label='العميل'
                name='clientId'
                value={form.clientId}
                onChange={handleFormChange}
              >
                <MenuItem value=''>اختر العميل</MenuItem>
                {clients.map(c => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='اسم المشروع'
                name='projectName'
                value={form.projectName}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label='وصف المشروع'
                name='projectDescription'
                value={form.projectDescription}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type='date'
                label='صالحة حتى'
                name='validUntil'
                value={form.validUntil}
                onChange={handleFormChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth select label='الحالة' name='status' value={form.status} onChange={handleFormChange}>
                <MenuItem value='draft'>مسودة</MenuItem>
                <MenuItem value='active'>نشط</MenuItem>
                <MenuItem value='expired'>منتهي</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Materials */}
      <Card className='mb-6'>
        <CardContent>
          <div className='flex items-center justify-between mb-4'>
            <Typography variant='h6' className='font-semibold'>
              🏭 المواد الخام
            </Typography>
            <Button variant='contained' size='small' onClick={addItem}>
              + إضافة مادة
            </Button>
          </div>
          <TableContainer component={Paper} variant='outlined'>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell align='right'>المادة</TableCell>
                  <TableCell align='right'>الوصف</TableCell>
                  <TableCell align='right'>الكمية</TableCell>
                  <TableCell align='right'>الوحدة</TableCell>
                  <TableCell align='right'>السعر</TableCell>
                  <TableCell align='right'>الإجمالي</TableCell>
                  <TableCell align='center'>حذف</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <TextField
                        select
                        size='small'
                        fullWidth
                        value={item.materialId}
                        onChange={e => updateItem(idx, 'materialId', e.target.value)}
                      >
                        <MenuItem value=''>اختر مادة</MenuItem>
                        {materials.map(m => (
                          <MenuItem key={m.id} value={m.id}>
                            {m.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField
                        size='small'
                        fullWidth
                        value={item.description}
                        onChange={e => updateItem(idx, 'description', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size='small'
                        type='number'
                        fullWidth
                        value={item.qty}
                        onChange={e => updateItem(idx, 'qty', e.target.value)}
                        inputProps={{ min: 0 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        select
                        size='small'
                        fullWidth
                        value={item.unit}
                        onChange={e => updateItem(idx, 'unit', e.target.value)}
                      >
                        {unitOptions.map(u => (
                          <MenuItem key={u.value} value={u.value}>
                            {u.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField
                        size='small'
                        type='number'
                        fullWidth
                        value={item.price}
                        onChange={e => updateItem(idx, 'price', e.target.value)}
                        inputProps={{ min: 0 }}
                      />
                    </TableCell>
                    <TableCell align='right'>{formatCurrency(item.qty * item.price)}</TableCell>
                    <TableCell align='center'>
                      <IconButton size='small' color='error' onClick={() => removeItem(idx)}>
                        <i className='tabler-trash' />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align='center'>
                      <Typography color='text.secondary'>لا توجد مواد</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Manufacturing */}
      <Card className='mb-6'>
        <CardContent>
          <div className='flex items-center justify-between mb-4'>
            <Typography variant='h6' className='font-semibold'>
              ⚙️ التصنيع والتشغيل
            </Typography>
            <Button variant='contained' size='small' onClick={addManufacturingItem}>
              + إضافة بند
            </Button>
          </div>
          <TableContainer component={Paper} variant='outlined'>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell align='right'>نوع التصنيع</TableCell>
                  <TableCell align='right'>الوصف</TableCell>
                  <TableCell align='right'>الكمية</TableCell>
                  <TableCell align='right'>سعر الوحدة</TableCell>
                  <TableCell align='right'>الإجمالي</TableCell>
                  <TableCell align='center'>حذف</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {manufacturingItems.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <TextField
                        select
                        size='small'
                        fullWidth
                        value={item.type}
                        onChange={e => updateManufacturingItem(idx, 'type', e.target.value)}
                      >
                        <MenuItem value=''>اختر النوع</MenuItem>
                        {manufacturingTypes.map(t => (
                          <MenuItem key={t.value} value={t.value}>
                            {t.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField
                        size='small'
                        fullWidth
                        value={item.description}
                        onChange={e => updateManufacturingItem(idx, 'description', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size='small'
                        type='number'
                        fullWidth
                        value={item.quantity}
                        onChange={e => updateManufacturingItem(idx, 'quantity', e.target.value)}
                        inputProps={{ min: 0 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size='small'
                        type='number'
                        fullWidth
                        value={item.unitCost}
                        onChange={e => updateManufacturingItem(idx, 'unitCost', e.target.value)}
                        inputProps={{ min: 0 }}
                      />
                    </TableCell>
                    <TableCell align='right'>{formatCurrency(item.total)}</TableCell>
                    <TableCell align='center'>
                      <IconButton size='small' color='error' onClick={() => removeManufacturingItem(idx)}>
                        <i className='tabler-trash' />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {manufacturingItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align='center'>
                      <Typography color='text.secondary'>لا توجد بنود تصنيع</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className='mb-6'>
        <CardContent>
          <Typography variant='h6' className='font-semibold mb-4'>
            📝 ملاحظات
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            name='notes'
            value={form.notes}
            onChange={handleFormChange}
            placeholder='أضف ملاحظات...'
          />
        </CardContent>
      </Card>

      {/* Summary & Save */}
      <Card className='mb-6'>
        <CardContent>
          <Grid container spacing={3} alignItems='center'>
            <Grid item xs={12} md={8}>
              <Typography variant='h6'>
                📊 الملخص: إجمالي المواد: {formatCurrency(itemsTotal)} | إجمالي التصنيع: {formatCurrency(mfgTotal)}
              </Typography>
              <Typography variant='h5' color='primary' className='font-bold'>
                الإجمالي الكلي: {formatCurrency(grandTotal)}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4} className='text-left'>
              <Button variant='contained' color='primary' size='large' onClick={handleSubmit} disabled={saving}>
                {saving ? 'جاري الحفظ...' : '💾 حفظ التعديلات'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </div>
  )
}
