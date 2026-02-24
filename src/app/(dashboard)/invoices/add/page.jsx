'use client'

import React, { useEffect, useState } from 'react'

import Link from 'next/link'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Drawer from '@mui/material/Drawer'
import Tooltip from '@mui/material/Tooltip'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import Box from '@mui/material/Box'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import CircularProgress from '@mui/material/CircularProgress'
import DeleteIcon from '@mui/icons-material/Delete'

const initialFormData = {
  name: '',
  company: '',
  email: '',
  address: '',
  country: 'مصر',
  contactNumber: '',
  contact: ''
}

const AddCustomerDrawer = ({ open, setOpen, onFormSubmit }) => {
  const [data, setData] = useState(initialFormData)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: data.name,
          company: data.company,
          email: data.email,
          phone: data.contactNumber,
          address: data.address,
          country: data.country,
          contact: data.contact
        })
      })

      if (response.ok) {
        const newClient = await response.json()

        onFormSubmit(newClient)
        setOpen(false)
        setData(initialFormData)
      }
    } catch (error) {
      console.error('خطأ في إضافة العميل:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setOpen(false)
    setData(initialFormData)
  }

  return (
    <Drawer
      open={open}
      anchor='left'
      variant='temporary'
      onClose={handleReset}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}
    >
      <div className='flex items-center justify-between plb-5 pli-6' dir='rtl'>
        <Typography variant='h5'>إضافة عميل جديد</Typography>
        <IconButton size='small' onClick={handleReset}>
          <i className='tabler-x text-2xl text-textPrimary' />
        </IconButton>
      </div>
      <Divider />
      <div className='p-6' dir='rtl'>
        <div className='flex flex-col gap-5'>
          <TextField
            fullWidth
            label='الاسم'
            value={data.name}
            onChange={e => setData({ ...data, name: e.target.value })}
          />
          <TextField
            fullWidth
            label='الشركة'
            value={data.company}
            onChange={e => setData({ ...data, company: e.target.value })}
          />
          <TextField
            fullWidth
            label='البريد الإلكتروني'
            type='email'
            value={data.email}
            onChange={e => setData({ ...data, email: e.target.value })}
          />
          <TextField
            fullWidth
            label='الدولة'
            value={data.country}
            onChange={e => setData({ ...data, country: e.target.value })}
          />
          <TextField
            fullWidth
            multiline
            rows={2}
            label='العنوان'
            value={data.address}
            onChange={e => setData({ ...data, address: e.target.value })}
          />
          <TextField
            fullWidth
            label='جهة الاتصال'
            value={data.contact}
            onChange={e => setData({ ...data, contact: e.target.value })}
          />
          <TextField
            fullWidth
            label='رقم الموبايل'
            value={data.contactNumber}
            onChange={e => setData({ ...data, contactNumber: e.target.value })}
          />
          <div className='flex items-center gap-4'>
            <Button variant='contained' onClick={handleSubmit} disabled={loading}>
              {loading ? 'جاري الإضافة...' : 'إضافة'}
            </Button>
            <Button variant='outlined' color='error' onClick={handleReset}>
              إلغاء
            </Button>
          </div>
        </div>
      </div>
    </Drawer>
  )
}

export default function AddInvoiceDashboard() {
  const [clients, setClients] = useState([])
  const [form, setForm] = useState({ number: '', clientId: '', date: '', dueDate: '', notes: '', status: 'draft' })
  const [items, setItems] = useState([{ desc: '', qty: 1, price: 0 }])
  const [manufacturingItems, setManufacturingItems] = useState([])
  const [sendDrawerOpen, setSendDrawerOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectData, setSelectData] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('تحويل بنكي')
  const [bankName, setBankName] = useState('')
  const [transactionNumber, setTransactionNumber] = useState('')
  const [paymentTerms, setPaymentTerms] = useState(true)
  const [clientNotes, setClientNotes] = useState(false)
  const [paymentStub, setPaymentStub] = useState(false)
  const [taxPercent, setTaxPercent] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [paidAmount, setPaidAmount] = useState(0)
  const [clientDeposit, setClientDeposit] = useState(0)
  const [inventoryDialogOpen, setInventoryDialogOpen] = useState(false)
  const [inventoryItems, setInventoryItems] = useState([])
  const [loadingInventory, setLoadingInventory] = useState(false)
  const [selectedInventoryItems, setSelectedInventoryItems] = useState([])
  const [inventoryQuantities, setInventoryQuantities] = useState({})
  const [loadingClientItems, setLoadingClientItems] = useState(false)

  // قائمة البنوك
  const banks = [
    'البنك الأهلي المصري',
    'بنك مصر',
    'البنك التجاري الدولي (CIB)',
    'بنك القاهرة',
    'بنك الإسكندرية',
    'البنك العربي الأفريقي',
    'بنك QNB الأهلي',
    'بنك HSBC مصر',
    'بنك كريدي أجريكول',
    'بنك فيصل الإسلامي',
    'بنك أبوظبي الأول',
    'بنك المشرق',
    'أخرى'
  ]

  // Generate auto invoice number on mount
  useEffect(() => {
    const generateInvoiceNumber = () => {
      const date = new Date()
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')

      const random = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0')

      return `INV-${year}${month}${day}-${random}`
    }

    setForm(prev => ({ ...prev, number: generateInvoiceNumber() }))
  }, [])

  useEffect(() => {
    fetch('/api/clients', { credentials: 'include' })
      .then(r => {
        if (!r.ok) throw new Error('Failed to fetch clients')

        return r.json()
      })
      .then(d => {
        // Handle both direct array and object with data property
        const clientsArray = Array.isArray(d) ? d : d?.data || d?.clients || []

        Array.isArray(clientsArray) && setClients(clientsArray)
        console.log('Clients loaded:', clientsArray)
      })
      .catch(err => console.error('Error fetching clients:', err))
  }, [])

  // Fetch items with negative balance when client is selected
  const handleClientChange = clientId => {
    setForm({ ...form, clientId })

    if (!clientId) {
      setItems([{ desc: '', qty: 1, price: 0 }])
      setClientDeposit(0)
      setLoadingClientItems(false)

      return
    }

    // Fetch items this client owes (minus balance)
    setLoadingClientItems(true)
    fetch(`/api/client-inventory-balance?clientId=${clientId}`, { credentials: 'include' })
      .then(async r => {
        if (!r.ok) {
          const text = await r.text()
          console.error('Client inventory fetch failed:', r.status, text)
          throw new Error('Failed to fetch client inventory: ' + text)
        }

        return r.json()
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          // Auto-populate items with items client owes
          const clientItems = data.map(item => {
            const isPiece = !!item.isPiece
            const qty = item.qty || 0
            const price = item.price || 0
            const materialId = item.materialId || item.id

            let desc = item.name || item.desc || ''

            // If item comes from a draft invoice (pre-formatted by backend), use description as is.
            // Otherwise apply default piece formatting
            if (isPiece && !item.fromDraftInvoice) {
              // Show piece dimensions and mark as a reserved piece / permit
              const len = item.length != null ? item.length : ''
              const wid = item.width != null ? item.width : ''
              const dim = len || wid ? ` (${len}${len && wid ? 'x' : ''}${wid})` : ''

              desc = `قطعة - ${desc || 'مادة'}${dim}`
            }

            return {
              desc,
              qty,
              price,
              materialId,
              sku: item.sku || '',
              isPiece,
              pieceId: item.id,
              length: item.length,
              width: item.width,
              transactionId: item.transactionId || null
            }
          })

          setItems(clientItems.length > 0 ? clientItems : [{ desc: '', qty: 1, price: 0 }])
        } else {
          // No items found, reset to empty
          setItems([{ desc: '', qty: 1, price: 0 }])
        }
        setLoadingClientItems(false)
      })
      .catch(err => {
        console.error('Error fetching client inventory balance:', err)
        setItems([{ desc: '', qty: 1, price: 0 }])
        setLoadingClientItems(false)
      })

    // Fetch client's deposit / wallet balance.
    // Prefer the client's `budget` value if present, otherwise fall back to aggregated safe entries.
    try {
      const clientObj = clients.find(c => String(c.id) === String(clientId))
      const budgetVal = clientObj ? Number(clientObj.budget || 0) : 0

      if (budgetVal > 0) {
        setClientDeposit(budgetVal)
      } else {
        fetch('/api/wallets/clients-pool', { credentials: 'include' })
          .then(r => (r.ok ? r.json() : Promise.resolve([])))
          .then(list => {
            const name = clientObj?.name || ''
            const found = Array.isArray(list) ? list.find(x => String(x.customer).trim() === String(name).trim()) : null

            setClientDeposit(found ? Number(found.balance || 0) : 0)
          })
          .catch(e => {
            console.error('Failed to fetch clients pool balances', e)
            setClientDeposit(0)
          })
      }
    } catch (e) {
      console.error('client deposit lookup error', e)
      setClientDeposit(0)
    }
  }

  const handleItemChange = (idx, key, value) => {
    const copy = [...items]

    copy[idx][key] = key === 'qty' || key === 'price' ? Number(value) : value
    setItems(copy)
  }

  const handleManufacturingChange = (idx, key, value) => {
    const copy = [...manufacturingItems]

    if (!copy[idx]) copy[idx] = {}

    // parse numeric fields
    if (key === 'quantity' || key === 'unitCost') copy[idx][key] = Number(value)
    else copy[idx][key] = value

    // compute total for this manufacturing line
    const line = copy[idx]
    const qty = Number(line.quantity || 0)
    const unit = Number(line.unitCost || 0)

    line.total = +(qty * unit).toFixed(2)

    setManufacturingItems(copy)
  }

  const addManufacturingRow = () =>
    setManufacturingItems([
      ...manufacturingItems,
      { type: 'laser', subtype: 'ton', quantity: 0, unitCost: 0, total: 0 }
    ])

  const removeManufacturingRow = i => setManufacturingItems(manufacturingItems.filter((_, idx) => idx !== i))

  const addRow = () => setItems([...items, { desc: '', qty: 1, price: 0 }])
  const removeRow = async i => {
    const item = items[i]

    if (item && item.transactionId) {
      try {
        await fetch('/api/inventory', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id: item.transactionId, type: 'transaction' })
        })
      } catch (e) {
        console.error('Failed to revert stock for removed item:', e)
      }
    }

    setItems(items.filter((_, idx) => idx !== i))
  }

  // Load inventory items
  const loadInventoryItems = async () => {
    setLoadingInventory(true)
    try {
      const response = await fetch('/api/inventory', { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        console.log('Inventory data received:', data)
        const materials = Array.isArray(data) ? data : data.data || []
        console.log('Materials:', materials)
        // Filter only available items (stock > 0 or count > 0)
        const availableMaterials = materials.filter(item => {
          const stock = Number(item.stock || item.count || 0)
          console.log('Item:', item.name, 'Type:', item.materialType || item.type, 'Stock:', stock)
          return stock > 0
        })
        console.log('Available materials after filter:', availableMaterials)
        setInventoryItems(availableMaterials)
      }
    } catch (error) {
      console.error('خطأ في تحميل المخزون:', error)
    } finally {
      setLoadingInventory(false)
    }
  }

  // Handle inventory dialog open
  const handleInventoryDialogOpen = () => {
    setInventoryDialogOpen(true)
    loadInventoryItems()
    setSelectedInventoryItems([])
    setInventoryQuantities({})
  }

  // Handle inventory item selection
  const handleInventoryItemToggle = itemId => {
    setSelectedInventoryItems(prev => {
      if (prev.includes(itemId)) {
        // Remove item and its quantity
        const newQuantities = { ...inventoryQuantities }
        delete newQuantities[itemId]
        setInventoryQuantities(newQuantities)
        return prev.filter(id => id !== itemId)
      } else {
        // Add item with default quantity of 1
        setInventoryQuantities(prev => ({ ...prev, [itemId]: 1 }))
        return [...prev, itemId]
      }
    })
  }

  // Handle inventory quantity change
  const handleInventoryQuantityChange = (itemId, qty) => {
    const item = inventoryItems.find(i => i.id === itemId)
    const maxStock = Number(item?.stock || item?.count || 0)
    const validQty = Math.min(Math.max(1, Number(qty) || 1), maxStock)
    setInventoryQuantities(prev => ({ ...prev, [itemId]: validQty }))
  }

  // Add selected inventory items to invoice
  const handleAddInventoryItems = async () => {
    const selectedItems = inventoryItems.filter(item => selectedInventoryItems.includes(item.id))
    const userEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : 'unknown'

    const newItems = []

    for (const item of selectedItems) {
      const qty = inventoryQuantities[item.id] || 1
      const price = Number(item.price || 0)

      newItems.push({
        desc: `${item.name || item.materialName} - SKU: ${item.sku || '-'}`,
        qty,
        price,
        materialId: item.id,
        sku: item.sku,
        transactionId: null // No transaction yet, will deduct on invoice creation
      })
    }

    if (newItems.length > 0) {
      // Remove any empty initial row if it's the only one and has no data
      const currentItems =
        items.length === 1 && !items[0].desc && !items[0].materialId ? newItems : [...items, ...newItems]
      setItems(currentItems)
    }

    setInventoryDialogOpen(false)
    setSelectedInventoryItems([])
    setInventoryQuantities({})
  }

  const itemsTotal = items.reduce((s, it) => s + Number(it.qty || 0) * Number(it.price || 0), 0)
  const manufacturingTotal = manufacturingItems.reduce((s, it) => s + Number(it.total || 0), 0)
  const subtotal = itemsTotal + manufacturingTotal
  const taxAmount = +((subtotal * Number(taxPercent || 0)) / 100).toFixed(2)
  const total = +(subtotal - Number(discount || 0) + taxAmount).toFixed(2)
  const netDue = Math.max(0, +(total - Number(clientDeposit || 0)).toFixed(2))

  const onFormSubmit = data => {
    setSelectData(data)
    // Add the new client to the clients list
    const newClientData = data.data || data
    if (newClientData && newClientData.id) {
      setClients(prev => [...prev, newClientData])
      setForm({ ...form, clientId: newClientData.id })
    }
  }

  const handleSubmit = async e => {
    e.preventDefault()

    const payload = {
      ...form,
      items,
      manufacturingItems,
      taxPercent,
      taxAmount,
      discount,
      total,
      clientDeposit: Number(clientDeposit || 0),
      paymentMethod,
      bankName: paymentMethod === 'تحويل بنكي' ? bankName : null,
      transactionNumber: paymentMethod === 'تحويل بنكي' ? transactionNumber : null,
      paymentTerms,
      clientNotes,
      paymentStub,
      paidAmount:
        form.status === 'partial'
          ? paidAmount
          : form.status === 'paid'
            ? Math.max(0, total - Math.min(Number(clientDeposit || 0), total))
            : 0
    }

    // If finalized (not draft), perform stock deductions for items lacking transactionId
    if (form.status !== 'draft') {
      const userEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : 'unknown'
      const updatedItems = [...items]

      for (let i = 0; i < updatedItems.length; i++) {
        const item = updatedItems[i]
        if (item.materialId && !item.transactionId) {
          try {
            const res = await fetch('/api/inventory', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                type: 'transaction',
                materialId: item.materialId,
                amount: item.qty || 1,
                action: 'remove',
                source: 'invoice',
                reference: form.clientId ? `${form.clientId} (INV: ${form.number})` : form.number,
                user: userEmail,
                note: `Deducted for invoice ${form.number}`
              })
            })
            if (res.ok) {
              const txData = await res.json()
              updatedItems[i] = { ...item, transactionId: txData.tx?.id }
            }
          } catch (e) {
            console.error('Failed to deduct stock during invoice submission:', e)
          }
        }
      }

      // Update payload with newly assigned transactionIds
      payload.items = updatedItems
    }

    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    })

    if (res.ok) {
      // For items that are pieces, consume them from inventory ONLY if finalized
      if (form.status !== 'draft') {
        try {
          const pieceDeletes = (items || [])
            .filter(it => it.isPiece && it.pieceId)
            .map(it => {
              const pid = encodeURIComponent(it.pieceId)
              const cid = encodeURIComponent(form.clientId || '')
              const permit = encodeURIComponent(form.clientId || '')
              const url = `/api/material-pieces?id=${pid}&clientId=${cid}&permit=${permit}`

              return fetch(url, { method: 'DELETE', credentials: 'include' })
                .then(r => {
                  if (!r.ok) console.warn('Failed to consume piece', it.pieceId, r.status)

                  return r
                })
                .catch(e => console.error('Error deleting piece', it.pieceId, e))
            })

          await Promise.all(pieceDeletes)
        } catch (e) {
          console.error('Error while consuming piece items:', e)
        }
      }

      window.location.href = '/invoices'
    } else {
      const txt = await res.text().catch(() => 'Failed')

      alert(txt)
    }
  }

  return (
    <div className='p-6' dir='rtl'>
      <div className='flex items-center justify-between mb-6'>
        <h1 className='text-3xl font-semibold'>إضافة فاتورة جديدة</h1>
        <Link href='/invoices'>
          <Button variant='outlined' color='secondary'>
            رجوع
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Main Content */}
        <div className='lg:col-span-2 space-y-4'>
          {/* Invoice Header */}
          <Card>
            <CardContent className='p-6'>
              <div className='flex justify-between gap-4 flex-col sm:flex-row mb-6'>
                <div className='flex flex-col gap-4'>
                  <Typography variant='h6'>تفاصيل الفاتورة</Typography>
                  <Typography color='textSecondary'>إنشاء وإدارة فواتيرك</Typography>
                </div>
              </div>

              {/* Invoice Number and Client Selection */}
              <Grid container spacing={4} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    fullWidth
                    label='رقم الفاتورة'
                    placeholder='INV-001'
                    value={form.number}
                    onChange={e => setForm({ ...form, number: e.target.value })}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <FormControl fullWidth>
                    <InputLabel>حالة الفاتورة</InputLabel>
                    <Select
                      value={form.status}
                      onChange={e => setForm({ ...form, status: e.target.value })}
                      label='حالة الفاتورة'
                    >
                      <MenuItem value='draft'>مسودة</MenuItem>
                      <MenuItem value='sent'>مرسلة</MenuItem>
                      <MenuItem value='paid'>مدفوعة</MenuItem>
                      <MenuItem value='partial'>مدفوعة جزئياً</MenuItem>
                      <MenuItem value='overdue'>متأخرة</MenuItem>
                      <MenuItem value='cancelled'>ملغاة</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <FormControl fullWidth>
                    <InputLabel>اختر العميل</InputLabel>
                    <Select
                      value={form.clientId}
                      onChange={e => handleClientChange(e.target.value)}
                      label='اختر العميل'
                    >
                      <MenuItem value=''>اختر العميل</MenuItem>
                      {clients.map(c => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <FormControl fullWidth>
                    <InputLabel>طريقة الدفع</InputLabel>
                    <Select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} label='طريقة الدفع'>
                      <MenuItem value='تحويل بنكي'>تحويل بنكي</MenuItem>
                      <MenuItem value='نقدي'>نقدي</MenuItem>
                      <MenuItem value='شيك'>شيك</MenuItem>
                      <MenuItem value='بطاقة ائتمان'>بطاقة ائتمان</MenuItem>
                      <MenuItem value='فودافون كاش'>فودافون كاش</MenuItem>
                      <MenuItem value='انستاباي'>انستاباي</MenuItem>
                      <MenuItem value='آجل'>آجل</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Bank Details - Show when payment method is bank transfer */}
                {paymentMethod === 'تحويل بنكي' && (
                  <>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <FormControl fullWidth>
                        <InputLabel>اسم البنك</InputLabel>
                        <Select value={bankName} onChange={e => setBankName(e.target.value)} label='اسم البنك'>
                          <MenuItem value=''>اختر البنك</MenuItem>
                          {banks.map(bank => (
                            <MenuItem key={bank} value={bank}>
                              {bank}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <TextField
                        fullWidth
                        label='رقم العملية'
                        placeholder='أدخل رقم العملية البنكية'
                        value={transactionNumber}
                        onChange={e => setTransactionNumber(e.target.value)}
                      />
                    </Grid>
                  </>
                )}

                {/* Dates */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    fullWidth
                    type='date'
                    label='تاريخ الإصدار'
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    fullWidth
                    type='date'
                    label='تاريخ الاستحقاق'
                    value={form.dueDate}
                    onChange={e => setForm({ ...form, dueDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                {/* Add Client Button */}
                <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant='text'
                    color='primary'
                    startIcon={<i className='ri-add-line' />}
                    onClick={() => setDrawerOpen(true)}
                  >
                    إضافة عميل جديد
                  </Button>
                </Grid>
              </Grid>

              {/* Display Selected Client Info */}
              {(selectData || (form.clientId && clients.length > 0)) && (
                <Box sx={{ backgroundColor: 'action.hover', p: 2, borderRadius: 1, mt: 2 }}>
                  <Typography variant='subtitle2' fontWeight='bold' sx={{ mb: 1 }}>
                    فاتورة إلى:
                  </Typography>
                  {selectData ? (
                    <>
                      <Typography variant='body2'>{selectData?.name}</Typography>
                      <Typography variant='body2'>{selectData?.company}</Typography>
                      <Typography variant='body2'>{selectData?.address}</Typography>
                      <Typography variant='body2'>{selectData?.contactNumber}</Typography>
                      <Typography variant='body2'>{selectData?.email}</Typography>
                    </>
                  ) : (
                    <>
                      <Typography variant='body2'>{clients.find(c => c.id == form.clientId)?.name}</Typography>
                      <Typography variant='body2'>{clients.find(c => c.id == form.clientId)?.email}</Typography>
                    </>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Invoice Items */}
          <Card sx={{ mb: 4 }}>
            <CardHeader
              title='بنود الفاتورة'
              action={
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant='outlined'
                    size='small'
                    startIcon={<i className='ri-inbox-line' />}
                    onClick={handleInventoryDialogOpen}
                  >
                    إضافة من المخزن
                  </Button>
                  <Button variant='contained' size='small' startIcon={<i className='ri-add-line' />} onClick={addRow}>
                    إضافة بند
                  </Button>
                </Box>
              }
            />
            <CardContent>
              {loadingClientItems ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: 4,
                    gap: 2
                  }}
                >
                  <CircularProgress size={40} />
                  <Typography color='text.secondary'>جاري تحميل البنود...</Typography>
                </Box>
              ) : items.length === 0 ? (
                <Typography color='text.secondary' sx={{ textAlign: 'center', py: 4 }}>
                  لا توجد بنود. اضغط على &quot;إضافة بند&quot; لإضافة بند جديد.
                </Typography>
              ) : (
                items.map((it, idx) => (
                  <Box key={idx} sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    <Grid container spacing={3} alignItems='center'>
                      <Grid size={{ xs: 12, sm: 5 }}>
                        <TextField
                          fullWidth
                          size='small'
                          multiline
                          rows={2}
                          label='الوصف'
                          placeholder='وصف البند'
                          value={it.desc}
                          onChange={e => handleItemChange(idx, 'desc', e.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 2 }}>
                        <TextField
                          fullWidth
                          size='small'
                          type='number'
                          label='الكمية'
                          value={it.qty}
                          onChange={e => handleItemChange(idx, 'qty', e.target.value)}
                          inputProps={{ min: 0 }}
                        />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 2 }}>
                        <TextField
                          fullWidth
                          size='small'
                          type='number'
                          label='السعر'
                          value={it.price}
                          onChange={e => handleItemChange(idx, 'price', e.target.value)}
                          InputProps={{
                            endAdornment: <InputAdornment position='end'>ج.م</InputAdornment>
                          }}
                          inputProps={{ min: 0, step: 0.01 }}
                        />
                      </Grid>
                      <Grid
                        size={{ xs: 12, sm: 3 }}
                        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                      >
                        <Typography variant='body2' color='primary' fontWeight='bold'>
                          {(it.qty * it.price).toFixed(2)} ج.م
                        </Typography>
                        <IconButton color='error' onClick={() => removeRow(idx)}>
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Box>
                ))
              )}
              {items.length > 0 && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    mt: 2,
                    pt: 2,
                    borderTop: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Typography variant='subtitle1' fontWeight='bold'>
                    إجمالي البنود: {itemsTotal.toFixed(2)} ج.م
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Tax and Discount */}
          <Card sx={{ mb: 4 }}>
            <CardHeader title='الضريبة والخصم' />
            <CardContent>
              <Grid container spacing={4}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    type='number'
                    label='الخصم'
                    value={discount}
                    onChange={e => setDiscount(Number(e.target.value))}
                    InputProps={{
                      endAdornment: <InputAdornment position='end'>ج.م</InputAdornment>
                    }}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    type='number'
                    label='الضريبة'
                    value={taxPercent}
                    onChange={e => setTaxPercent(Number(e.target.value))}
                    InputProps={{
                      endAdornment: <InputAdornment position='end'>%</InputAdornment>
                    }}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Manufacturing Items */}
          <Card sx={{ mb: 4 }}>
            <CardHeader
              title='التصنيع والتشغيل'
              action={
                <Button
                  variant='contained'
                  size='small'
                  startIcon={<i className='ri-add-line' />}
                  onClick={addManufacturingRow}
                >
                  إضافة عنصر
                </Button>
              }
            />
            <CardContent>
              {manufacturingItems.length === 0 ? (
                <Typography color='text.secondary' sx={{ textAlign: 'center', py: 4 }}>
                  لا توجد عناصر تصنيع. اضغط على &quot;إضافة عنصر&quot; لإضافة عنصر جديد.
                </Typography>
              ) : (
                manufacturingItems.map((m, idx) => (
                  <Box key={idx} sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    <Grid container spacing={3} alignItems='center'>
                      <Grid size={{ xs: 12, sm: 3 }}>
                        <FormControl fullWidth size='small'>
                          <InputLabel>النوع</InputLabel>
                          <Select
                            value={m.type || 'laser'}
                            onChange={e => {
                              handleManufacturingChange(idx, 'type', e.target.value)

                              const defaultUnits = {
                                laser: 'ton',
                                plasma: 'ton',
                                cnc: 'piece',
                                bending: 'nozla',
                                welding: 'meter',
                                drilling: 'hole',
                                cutting: 'meter',
                                painting: 'sqm',
                                galvanizing: 'kg',
                                other: 'piece'
                              }

                              handleManufacturingChange(idx, 'subtype', defaultUnits[e.target.value] || 'piece')
                            }}
                            label='النوع'
                          >
                            <MenuItem value='laser'>ليزر</MenuItem>
                            <MenuItem value='plasma'>بلازما</MenuItem>
                            <MenuItem value='cnc'>CNC</MenuItem>
                            <MenuItem value='bending'>ثني</MenuItem>
                            <MenuItem value='welding'>لحام</MenuItem>
                            <MenuItem value='drilling'>تخريم</MenuItem>
                            <MenuItem value='cutting'>قطع</MenuItem>
                            <MenuItem value='painting'>دهان</MenuItem>
                            <MenuItem value='galvanizing'>جلفنة</MenuItem>
                            <MenuItem value='other'>أخرى</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 3 }}>
                        <FormControl fullWidth size='small'>
                          <InputLabel>الوحدة</InputLabel>
                          <Select
                            value={m.subtype || 'ton'}
                            onChange={e => handleManufacturingChange(idx, 'subtype', e.target.value)}
                            label='الوحدة'
                          >
                            {m.type === 'laser' && [
                              <MenuItem key='ton' value='ton'>
                                طن
                              </MenuItem>,
                              <MenuItem key='minutes' value='minutes'>
                                دقائق
                              </MenuItem>,
                              <MenuItem key='kg' value='kg'>
                                كجم
                              </MenuItem>,
                              <MenuItem key='meter' value='meter'>
                                متر
                              </MenuItem>
                            ]}
                            {m.type === 'plasma' && [
                              <MenuItem key='ton' value='ton'>
                                طن
                              </MenuItem>,
                              <MenuItem key='minutes' value='minutes'>
                                دقائق
                              </MenuItem>,
                              <MenuItem key='kg' value='kg'>
                                كجم
                              </MenuItem>,
                              <MenuItem key='meter' value='meter'>
                                متر
                              </MenuItem>
                            ]}
                            {m.type === 'cnc' && [
                              <MenuItem key='piece' value='piece'>
                                قطعة
                              </MenuItem>,
                              <MenuItem key='hour' value='hour'>
                                ساعة
                              </MenuItem>,
                              <MenuItem key='meter' value='meter'>
                                متر
                              </MenuItem>
                            ]}
                            {m.type === 'bending' && [
                              <MenuItem key='nozla' value='nozla'>
                                نزلة
                              </MenuItem>,
                              <MenuItem key='piece' value='piece'>
                                قطعة
                              </MenuItem>,
                              <MenuItem key='meter' value='meter'>
                                متر
                              </MenuItem>
                            ]}
                            {m.type === 'welding' && [
                              <MenuItem key='meter' value='meter'>
                                متر
                              </MenuItem>,
                              <MenuItem key='piece' value='piece'>
                                قطعة
                              </MenuItem>,
                              <MenuItem key='hour' value='hour'>
                                ساعة
                              </MenuItem>
                            ]}
                            {m.type === 'drilling' && [
                              <MenuItem key='hole' value='hole'>
                                ثقب
                              </MenuItem>,
                              <MenuItem key='piece' value='piece'>
                                قطعة
                              </MenuItem>
                            ]}
                            {m.type === 'cutting' && [
                              <MenuItem key='meter' value='meter'>
                                متر
                              </MenuItem>,
                              <MenuItem key='piece' value='piece'>
                                قطعة
                              </MenuItem>
                            ]}
                            {m.type === 'painting' && [
                              <MenuItem key='sqm' value='sqm'>
                                متر مربع
                              </MenuItem>,
                              <MenuItem key='piece' value='piece'>
                                قطعة
                              </MenuItem>
                            ]}
                            {m.type === 'galvanizing' && [
                              <MenuItem key='kg' value='kg'>
                                كجم
                              </MenuItem>,
                              <MenuItem key='ton' value='ton'>
                                طن
                              </MenuItem>,
                              <MenuItem key='piece' value='piece'>
                                قطعة
                              </MenuItem>
                            ]}
                            {m.type === 'other' && [
                              <MenuItem key='piece' value='piece'>
                                قطعة
                              </MenuItem>,
                              <MenuItem key='unit' value='unit'>
                                وحدة
                              </MenuItem>,
                              <MenuItem key='hour' value='hour'>
                                ساعة
                              </MenuItem>
                            ]}
                            {!m.type && <MenuItem value='piece'>قطعة</MenuItem>}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 2 }}>
                        <TextField
                          fullWidth
                          size='small'
                          type='number'
                          label='سعر الوحدة'
                          value={m.unitCost || 0}
                          onChange={e => handleManufacturingChange(idx, 'unitCost', e.target.value)}
                          InputProps={{
                            endAdornment: <InputAdornment position='end'>ج.م</InputAdornment>
                          }}
                          inputProps={{ min: 0, step: 0.01 }}
                        />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 2 }}>
                        <TextField
                          fullWidth
                          size='small'
                          type='number'
                          label='الكمية'
                          value={m.quantity || 0}
                          onChange={e => handleManufacturingChange(idx, 'quantity', e.target.value)}
                          inputProps={{ min: 0, step: 0.01 }}
                        />
                      </Grid>
                      <Grid
                        size={{ xs: 12, sm: 2 }}
                        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                      >
                        <Typography variant='body2' color='primary' fontWeight='bold'>
                          {(m.total || 0).toFixed(2)} ج.م
                        </Typography>
                        <IconButton color='error' onClick={() => removeManufacturingRow(idx)}>
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Box>
                ))
              )}
              {manufacturingItems.length > 0 && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    mt: 2,
                    pt: 2,
                    borderTop: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Typography variant='subtitle1' fontWeight='bold'>
                    إجمالي التصنيع: {manufacturingTotal.toFixed(2)} ج.م
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card sx={{ mb: 4 }}>
            <CardHeader title='الملاحظات' />
            <CardContent>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder='أضف أي ملاحظات أو شروط لهذه الفاتورة'
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
              />
            </CardContent>
          </Card>

          {/* Partial Payment - Only show when status is 'partial' */}
          {form.status === 'partial' && (
            <Card sx={{ mb: 4, border: '2px solid', borderColor: 'warning.main' }}>
              <CardHeader
                title='المبلغ المدفوع'
                avatar={<i className='tabler-cash text-warning text-2xl' />}
                sx={{ backgroundColor: 'warning.lighter' }}
              />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label='المبلغ المدفوع'
                      type='number'
                      value={paidAmount}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0

                        setPaidAmount(Math.min(val, total))
                      }}
                      InputProps={{
                        endAdornment: <InputAdornment position='end'>ج.م</InputAdornment>,
                        inputProps: { min: 0, max: total, step: 0.01 }
                      }}
                      helperText={`الحد الأقصى: ${total.toLocaleString()} ج.م`}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: 'error.lighter',
                        border: '2px dashed',
                        borderColor: 'error.main'
                      }}
                    >
                      <Typography color='error.main' variant='body2' className='mb-1'>
                        المبلغ المتبقي
                      </Typography>
                      <Typography color='error.main' variant='h5' className='font-bold'>
                        {(total - paidAmount).toLocaleString()} ج.م
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Submit Buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Link href='/invoices'>
              <Button variant='outlined' color='secondary'>
                إلغاء
              </Button>
            </Link>
            <Button type='submit' variant='contained' color='primary'>
              إنشاء الفاتورة
            </Button>
          </Box>
        </div>

        {/* Sidebar - Actions and Settings */}
        <div className='lg:col-span-1'>
          <div className='sticky top-6'>
            {/* Invoice Details Card */}
            <Card className='mb-6'>
              <CardContent className='p-6'>
                <Typography variant='h6' className='mb-4 font-semibold'>
                  تفاصيل الفاتورة
                </Typography>
                <div className='space-y-2'>
                  <div className='flex justify-between'>
                    <Typography color='textSecondary'>رقم الفاتورة:</Typography>
                    <Typography className='font-semibold'>{form.number || '-'}</Typography>
                  </div>
                  <div className='flex justify-between'>
                    <Typography color='textSecondary'>الحالة:</Typography>
                    <Typography
                      className='font-semibold'
                      sx={{
                        color:
                          form.status === 'paid'
                            ? 'success.main'
                            : form.status === 'draft'
                              ? 'warning.main'
                              : form.status === 'overdue'
                                ? 'error.main'
                                : 'text.primary'
                      }}
                    >
                      {form.status === 'draft'
                        ? 'مسودة'
                        : form.status === 'sent'
                          ? 'مرسلة'
                          : form.status === 'paid'
                            ? 'مدفوعة'
                            : form.status === 'partial'
                              ? 'مدفوعة جزئياً'
                              : form.status === 'overdue'
                                ? 'متأخرة'
                                : form.status === 'cancelled'
                                  ? 'ملغاة'
                                  : form.status}
                    </Typography>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Settings Card */}

            {/* Client Account Card */}
            {form.clientId && (
              <Card
                className='mb-6'
                sx={{
                  border: clientDeposit > 0 ? '2px solid' : '1px solid',
                  borderColor: clientDeposit > 0 ? 'info.main' : 'divider'
                }}
              >
                <CardContent className='p-6'>
                  <Typography
                    variant='h6'
                    className='mb-4 font-semibold'
                    sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    <i className='ri-wallet-3-line' style={{ color: '#1976d2' }} />
                    حساب العميل
                  </Typography>
                  <div className='space-y-2'>
                    <div className='flex justify-between items-center'>
                      <Typography color='textSecondary'>اسم العميل:</Typography>
                      <Typography className='font-semibold'>
                        {clients.find(c => String(c.id) === String(form.clientId))?.name || '-'}
                      </Typography>
                    </div>
                    <Divider />
                    <div className='flex justify-between items-center'>
                      <Typography color='textSecondary'>رصيد العربون:</Typography>
                      <Typography
                        className='font-bold text-lg'
                        sx={{ color: clientDeposit > 0 ? 'success.main' : 'text.secondary' }}
                      >
                        {Number(clientDeposit).toLocaleString()} ج.م
                      </Typography>
                    </div>
                    {clientDeposit > 0 && (
                      <>
                        <Divider />
                        <div className='flex justify-between items-center'>
                          <Typography color='textSecondary'>إجمالي الفاتورة:</Typography>
                          <Typography className='font-medium'>{total.toFixed(2)} ج.م</Typography>
                        </div>
                        <div
                          className='flex justify-between items-center p-2 rounded'
                          style={{ backgroundColor: 'rgba(46, 125, 50, 0.08)' }}
                        >
                          <Typography sx={{ color: 'success.main', fontWeight: 600 }}>سيتم خصم:</Typography>
                          <Typography sx={{ color: 'success.main', fontWeight: 700, fontSize: '1.1rem' }}>
                            -{Math.min(clientDeposit, total).toLocaleString()} ج.م
                          </Typography>
                        </div>
                        <div
                          className='flex justify-between items-center p-2 rounded'
                          style={{ backgroundColor: 'rgba(25, 118, 210, 0.08)' }}
                        >
                          <Typography sx={{ color: 'info.main', fontWeight: 600 }}>الرصيد بعد الخصم:</Typography>
                          <Typography sx={{ color: 'info.main', fontWeight: 700, fontSize: '1.1rem' }}>
                            {Math.max(0, clientDeposit - total).toLocaleString()} ج.م
                          </Typography>
                        </div>
                      </>
                    )}
                    {clientDeposit === 0 && (
                      <Typography variant='body2' color='textSecondary' sx={{ textAlign: 'center', py: 1 }}>
                        لا يوجد عربون مسجل لهذا العميل
                      </Typography>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Summary Card */}
            <Card className='mb-6'>
              <CardContent className='p-6'>
                <Typography variant='h6' className='mb-4 font-semibold'>
                  الملخص
                </Typography>
                <div className='space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <Typography color='textSecondary'>المجموع الفرعي:</Typography>
                    <Typography className='font-medium'>{subtotal.toFixed(2)} ج.م</Typography>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <Typography color='textSecondary'>الخصم:</Typography>
                    <Typography className='font-medium' color='error'>
                      -{Number(discount || 0).toFixed(2)} ج.م
                    </Typography>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <Typography color='textSecondary'>الضريبة ({taxPercent}%):</Typography>
                    <Typography className='font-medium'>{taxAmount.toFixed(2)} ج.م</Typography>
                  </div>
                  <Divider className='my-3' />
                  <div className='flex justify-between items-center'>
                    <Typography className='font-semibold'>الإجمالي المستحق:</Typography>
                    <div style={{ textAlign: 'right' }}>
                      <Typography color='primary' className='text-lg font-bold'>
                        {total.toFixed(2)} ج.م
                      </Typography>
                      {clientDeposit > 0 && (
                        <Typography variant='body2' color='textSecondary'>
                          العربون: -{Number(clientDeposit).toFixed(2)} ج.م
                        </Typography>
                      )}
                    </div>
                  </div>
                  {clientDeposit > 0 && (
                    <div
                      className='flex justify-between items-center p-2 rounded mt-3'
                      style={{ backgroundColor: 'rgba(0,0,0,0.03)' }}
                    >
                      <Typography className='font-semibold'>المتبقي للدفع:</Typography>
                      <Typography color={netDue > 0 ? 'error' : 'success.main'} className='text-lg font-bold'>
                        {netDue.toLocaleString()} ج.م
                      </Typography>
                    </div>
                  )}
                  {form.status === 'partial' && paidAmount > 0 && (
                    <>
                      <Divider className='my-3' />
                      <div className='flex justify-between items-center'>
                        <Typography color='success.main' className='font-medium'>
                          المدفوع:
                        </Typography>
                        <Typography color='success.main' className='font-bold'>
                          {paidAmount.toLocaleString()} ج.م
                        </Typography>
                      </div>
                      <div
                        className='flex justify-between items-center p-2 rounded'
                        style={{ backgroundColor: 'rgba(244, 67, 54, 0.1)' }}
                      >
                        <Typography color='error.main' className='font-semibold'>
                          المتبقي:
                        </Typography>
                        <Typography color='error.main' className='text-lg font-bold'>
                          {(total - paidAmount).toLocaleString()} ج.م
                        </Typography>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card>
              <CardContent className='p-6 flex flex-col gap-3'>
                <Button
                  fullWidth
                  type='submit'
                  variant='contained'
                  color='primary'
                  startIcon={<i className='tabler-file-invoice' />}
                >
                  إنشاء الفاتورة
                </Button>
                <Button
                  fullWidth
                  variant='outlined'
                  color='secondary'
                  onClick={() => setForm({ ...form, status: 'draft' })}
                >
                  حفظ كمسودة
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      {/* Add Customer Drawer */}
      <AddCustomerDrawer open={drawerOpen} setOpen={setDrawerOpen} onFormSubmit={onFormSubmit} />

      {/* Inventory Selection Dialog */}
      <Dialog
        open={inventoryDialogOpen}
        onClose={() => setInventoryDialogOpen(false)}
        maxWidth='md'
        fullWidth
        dir='rtl'
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <i className='ri-inbox-line' />
            <Typography variant='h6'>اختر المواد من المخزن</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {loadingInventory ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : inventoryItems.length === 0 ? (
            <Typography color='text.secondary' sx={{ textAlign: 'center', py: 4 }}>
              لا توجد مواد متاحة في المخزن
            </Typography>
          ) : (
            <Box>
              {/* Show ungrouped items if no types match */}
              {inventoryItems.length > 0 &&
              inventoryItems.every(item => {
                const itemType = (item.materialType || item.type || '').toLowerCase()
                return !['factory', 'material', 'operating_stock', 'product', 'accessory'].includes(itemType)
              }) ? (
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant='subtitle1'
                    sx={{
                      fontWeight: 600,
                      mb: 1,
                      p: 1,
                      backgroundColor: '#9e9e9e15',
                      borderLeft: '4px solid #9e9e9e',
                      color: '#9e9e9e'
                    }}
                  >
                    📋 مواد متاحة ({inventoryItems.length})
                  </Typography>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell padding='checkbox' width='50'>
                          <Checkbox
                            checked={inventoryItems.every(item => selectedInventoryItems.includes(item.id))}
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedInventoryItems(inventoryItems.map(i => i.id))
                                const newQtys = {}
                                inventoryItems.forEach(item => {
                                  newQtys[item.id] = 1
                                })
                                setInventoryQuantities(newQtys)
                              } else {
                                setSelectedInventoryItems([])
                                setInventoryQuantities({})
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <strong>الاسم</strong>
                        </TableCell>
                        <TableCell width='120'>
                          <strong>SKU</strong>
                        </TableCell>
                        <TableCell align='center' width='100'>
                          <strong>المتاح</strong>
                        </TableCell>
                        <TableCell align='center' width='120'>
                          <strong>الكمية المطلوبة</strong>
                        </TableCell>
                        <TableCell align='right' width='100'>
                          <strong>السعر</strong>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {inventoryItems.map(item => {
                        const maxStock = Number(item.stock || item.count || 0)
                        const isSelected = selectedInventoryItems.includes(item.id)
                        return (
                          <TableRow
                            key={item.id}
                            hover
                            sx={{ backgroundColor: isSelected ? 'action.selected' : 'inherit' }}
                          >
                            <TableCell padding='checkbox'>
                              <Checkbox checked={isSelected} onChange={() => handleInventoryItemToggle(item.id)} />
                            </TableCell>
                            <TableCell>{item.name || item.materialName}</TableCell>
                            <TableCell>{item.sku || '-'}</TableCell>
                            <TableCell align='center'>
                              <Typography variant='body2' fontWeight='600' color='success.main'>
                                {maxStock} {item.unit || 'pcs'}
                              </Typography>
                            </TableCell>
                            <TableCell align='center'>
                              {isSelected ? (
                                <TextField
                                  type='number'
                                  size='small'
                                  value={inventoryQuantities[item.id] || 1}
                                  onChange={e => handleInventoryQuantityChange(item.id, e.target.value)}
                                  inputProps={{ min: 1, max: maxStock, style: { textAlign: 'center' } }}
                                  sx={{ width: '80px' }}
                                  onClick={e => e.stopPropagation()}
                                />
                              ) : (
                                <Typography variant='body2' color='text.secondary'>
                                  -
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align='right'>
                              <Typography variant='body2'>{Number(item.price || 0).toFixed(2)} ج.م</Typography>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </Box>
              ) : null}

              {/* Group materials by type */}
              {[
                {
                  types: ['factory', 'material'],
                  label: '🔨 الخامات (Raw Materials)',
                  color: '#2196f3'
                },
                {
                  types: ['operating_stock', 'product'],
                  label: '📦 المنتجات (Products)',
                  color: '#4caf50'
                },
                {
                  types: ['accessory'],
                  label: '🔧 الاكسسوارات (Accessories)',
                  color: '#ff9800'
                }
              ].map(({ types, label, color }) => {
                const filteredItems = inventoryItems.filter(item => {
                  const itemType = (item.materialType || item.type || '').toLowerCase()
                  return types.some(t => itemType === t.toLowerCase())
                })
                if (filteredItems.length === 0) return null
                return (
                  <Box key={types[0]} sx={{ mb: 3 }}>
                    <Typography
                      variant='subtitle1'
                      sx={{
                        fontWeight: 600,
                        mb: 1,
                        p: 1,
                        backgroundColor: color + '15',
                        borderLeft: `4px solid ${color}`,
                        color: color
                      }}
                    >
                      {label} ({filteredItems.length})
                    </Typography>
                    <Table size='small'>
                      <TableHead>
                        <TableRow>
                          <TableCell padding='checkbox' width='50'>
                            <Checkbox
                              indeterminate={
                                filteredItems.some(item => selectedInventoryItems.includes(item.id)) &&
                                !filteredItems.every(item => selectedInventoryItems.includes(item.id))
                              }
                              checked={filteredItems.every(item => selectedInventoryItems.includes(item.id))}
                              onChange={e => {
                                if (e.target.checked) {
                                  const newSelected = [
                                    ...new Set([...selectedInventoryItems, ...filteredItems.map(i => i.id)])
                                  ]
                                  setSelectedInventoryItems(newSelected)
                                  const newQtys = { ...inventoryQuantities }
                                  filteredItems.forEach(item => {
                                    if (!newQtys[item.id]) newQtys[item.id] = 1
                                  })
                                  setInventoryQuantities(newQtys)
                                } else {
                                  const idsToRemove = filteredItems.map(i => i.id)
                                  setSelectedInventoryItems(prev => prev.filter(id => !idsToRemove.includes(id)))
                                  const newQtys = { ...inventoryQuantities }
                                  idsToRemove.forEach(id => delete newQtys[id])
                                  setInventoryQuantities(newQtys)
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <strong>الاسم</strong>
                          </TableCell>
                          <TableCell width='120'>
                            <strong>SKU</strong>
                          </TableCell>
                          <TableCell align='center' width='100'>
                            <strong>المتاح</strong>
                          </TableCell>
                          <TableCell align='center' width='120'>
                            <strong>الكمية المطلوبة</strong>
                          </TableCell>
                          <TableCell align='right' width='100'>
                            <strong>السعر</strong>
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredItems.map(item => {
                          const maxStock = Number(item.stock || item.count || 0)
                          const isSelected = selectedInventoryItems.includes(item.id)
                          return (
                            <TableRow
                              key={item.id}
                              hover
                              sx={{ backgroundColor: isSelected ? 'action.selected' : 'inherit' }}
                            >
                              <TableCell padding='checkbox'>
                                <Checkbox checked={isSelected} onChange={() => handleInventoryItemToggle(item.id)} />
                              </TableCell>
                              <TableCell>{item.name || item.materialName}</TableCell>
                              <TableCell>{item.sku || '-'}</TableCell>
                              <TableCell align='center'>
                                <Typography variant='body2' fontWeight='600' color='success.main'>
                                  {maxStock} {item.unit || 'pcs'}
                                </Typography>
                              </TableCell>
                              <TableCell align='center'>
                                {isSelected ? (
                                  <TextField
                                    type='number'
                                    size='small'
                                    value={inventoryQuantities[item.id] || 1}
                                    onChange={e => handleInventoryQuantityChange(item.id, e.target.value)}
                                    inputProps={{ min: 1, max: maxStock, style: { textAlign: 'center' } }}
                                    sx={{ width: '80px' }}
                                    onClick={e => e.stopPropagation()}
                                  />
                                ) : (
                                  <Typography variant='body2' color='text.secondary'>
                                    -
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell align='right'>
                                <Typography variant='body2'>{Number(item.price || 0).toFixed(2)} ج.م</Typography>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </Box>
                )
              })}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setInventoryDialogOpen(false)} color='secondary'>
            إلغاء
          </Button>
          <Button
            onClick={handleAddInventoryItems}
            variant='contained'
            disabled={selectedInventoryItems.length === 0}
            startIcon={<i className='ri-add-line' />}
          >
            إضافة ({selectedInventoryItems.length})
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
