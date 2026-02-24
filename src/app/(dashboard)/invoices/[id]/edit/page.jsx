'use client'

import { useState, useEffect, useMemo } from 'react'

import { useParams, useRouter } from 'next/navigation'

import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import Collapse from '@mui/material/Collapse'
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'
import DeleteIcon from '@mui/icons-material/Delete'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Checkbox from '@mui/material/Checkbox'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction'

// تعريف أنواع التصنيع والوحدات بالعربية
const MANUFACTURING_TYPES = [
  { value: 'laser', label: 'ليزر' },
  { value: 'plasma', label: 'بلازما' },
  { value: 'cnc', label: 'CNC' },
  { value: 'bending', label: 'ثني' },
  { value: 'welding', label: 'لحام' },
  { value: 'drilling', label: 'تخريم' },
  { value: 'cutting', label: 'قطع' },
  { value: 'painting', label: 'دهان' },
  { value: 'galvanizing', label: 'جلفنة' },
  { value: 'other', label: 'أخرى' }
]

const MANUFACTURING_SUBTYPES = {
  laser: [
    { value: 'ton', label: 'طن' },
    { value: 'minutes', label: 'دقائق' },
    { value: 'kg', label: 'كجم' },
    { value: 'meter', label: 'متر' }
  ],
  plasma: [
    { value: 'ton', label: 'طن' },
    { value: 'minutes', label: 'دقائق' },
    { value: 'kg', label: 'كجم' },
    { value: 'meter', label: 'متر' }
  ],
  cnc: [
    { value: 'piece', label: 'قطعة' },
    { value: 'hour', label: 'ساعة' },
    { value: 'meter', label: 'متر' }
  ],
  bending: [
    { value: 'nozla', label: 'نزلة' },
    { value: 'piece', label: 'قطعة' },
    { value: 'meter', label: 'متر' }
  ],
  welding: [
    { value: 'meter', label: 'متر' },
    { value: 'piece', label: 'قطعة' },
    { value: 'hour', label: 'ساعة' }
  ],
  drilling: [
    { value: 'hole', label: 'ثقب' },
    { value: 'piece', label: 'قطعة' }
  ],
  cutting: [
    { value: 'meter', label: 'متر' },
    { value: 'piece', label: 'قطعة' }
  ],
  painting: [
    { value: 'sqm', label: 'متر مربع' },
    { value: 'piece', label: 'قطعة' }
  ],
  galvanizing: [
    { value: 'kg', label: 'كجم' },
    { value: 'ton', label: 'طن' },
    { value: 'piece', label: 'قطعة' }
  ],
  other: [
    { value: 'piece', label: 'قطعة' },
    { value: 'unit', label: 'وحدة' },
    { value: 'hour', label: 'ساعة' }
  ]
}

// مكون إضافة عميل جديد
const AddCustomerDrawer = ({ open, setOpen, onAddClient }) => {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    country: 'مصر',
    address: '',
    contact: '',
    mobile: ''
  })

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          company: formData.company,
          email: formData.email,
          phone: formData.mobile,
          address: formData.address,
          country: formData.country,
          contact: formData.contact
        })
      })

      if (response.ok) {
        const newClient = await response.json()

        onAddClient(newClient)
        setOpen(false)
        setFormData({ name: '', company: '', email: '', country: 'مصر', address: '', contact: '', mobile: '' })
      }
    } catch (error) {
      console.error('خطأ في إضافة العميل:', error)
    }
  }

  return (
    <Drawer anchor='left' open={open} onClose={() => setOpen(false)}>
      <Box sx={{ width: 400, p: 5 }}>
        <Typography variant='h5' sx={{ mb: 4 }}>
          إضافة عميل جديد
        </Typography>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label='الاسم'
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label='الشركة'
              value={formData.company}
              onChange={e => setFormData({ ...formData, company: e.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label='البريد الإلكتروني'
              type='email'
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label='الدولة'
              value={formData.country}
              onChange={e => setFormData({ ...formData, country: e.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label='العنوان'
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label='جهة الاتصال'
              value={formData.contact}
              onChange={e => setFormData({ ...formData, contact: e.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label='رقم الموبايل'
              value={formData.mobile}
              onChange={e => setFormData({ ...formData, mobile: e.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 12 }} sx={{ display: 'flex', gap: 2 }}>
            <Button variant='contained' onClick={handleSubmit}>
              إضافة
            </Button>
            <Button variant='outlined' color='secondary' onClick={() => setOpen(false)}>
              إلغاء
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Drawer>
  )
}

// مكون الإجراءات الجانبية
const EditActions = ({
  onSave,
  onPreview,
  onSendInvoice,
  invoiceData,
  onUpdateInvoice,
  clientDeposit = 0,
  initialStatus = 'draft'
}) => {
  const [paymentMethod, setPaymentMethod] = useState('تحويل بنكي')
  const [paymentTerms, setPaymentTerms] = useState(false)
  const [clientNotes, setClientNotes] = useState(false)
  const [paymentStub, setPaymentStub] = useState(false)

  const subtotal = useMemo(() => {
    if (!invoiceData) return 0

    const itemsTotal = (invoiceData.items || []).reduce((sum, item) => {
      return sum + (parseFloat(item.qty) || 0) * (parseFloat(item.price) || 0)
    }, 0)

    const manufacturingTotal = (invoiceData.manufacturingItems || []).reduce((sum, item) => {
      return sum + (parseFloat(item.unitCost) || 0) * (parseFloat(item.quantity) || 0)
    }, 0)

    return itemsTotal + manufacturingTotal
  }, [invoiceData])

  const discount = useMemo(() => {
    if (!invoiceData?.discount) return 0
    const discountValue = parseFloat(invoiceData.discount) || 0

    if (invoiceData.discountType === 'percentage') {
      return (subtotal * discountValue) / 100
    }

    return discountValue
  }, [invoiceData, subtotal])

  const tax = useMemo(() => {
    if (!invoiceData?.tax) return 0
    const taxValue = parseFloat(invoiceData.tax) || 0

    if (invoiceData.taxType === 'percentage') {
      return ((subtotal - discount) * taxValue) / 100
    }

    return taxValue
  }, [invoiceData, subtotal, discount])

  const total = subtotal - discount + tax

  // Calculate paid amount and remaining
  const isTransitioningFromDraft = initialStatus === 'draft' && invoiceData?.status !== 'draft'
  const autoAppliedDeposit = isTransitioningFromDraft ? Math.min(clientDeposit, total) : 0

  const paidAmount = parseFloat(invoiceData?.paidAmount) || 0

  // Display values for UI
  const displayTotalApplied = invoiceData?.status === 'paid' ? total : paidAmount + autoAppliedDeposit
  const remainingAmount = Math.max(0, total - displayTotalApplied)

  // Status labels in Arabic
  const statusLabels = {
    draft: 'مسودة',
    sent: 'مرسلة',
    paid: 'مدفوعة',
    partial: 'مدفوعة جزئياً',
    overdue: 'متأخرة',
    cancelled: 'ملغاة'
  }

  const statusColors = {
    draft: 'warning',
    sent: 'info',
    paid: 'success',
    partial: 'warning',
    overdue: 'error',
    cancelled: 'default'
  }

  return (
    <Card>
      <CardContent>
        {/* Invoice Status */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography fontWeight={600}>حالة الفاتورة:</Typography>
          <Chip
            label={statusLabels[invoiceData?.status] || invoiceData?.status || 'مسودة'}
            color={statusColors[invoiceData?.status] || 'default'}
            size='small'
          />
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography>الإجمالي الفرعي:</Typography>
          <Typography>{subtotal.toFixed(2)} ج.م</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography>الخصم:</Typography>
          <Typography color='error'>-{discount.toFixed(2)} ج.م</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography>الضريبة:</Typography>
          <Typography>{tax.toFixed(2)} ج.م</Typography>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant='h6'>الإجمالي المستحق:</Typography>
          <Typography variant='h6' color='primary'>
            {total.toFixed(2)} ج.م
          </Typography>
        </Box>

        {/* Show client deposit (العربون) */}
        {clientDeposit > 0 && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography color='info.main' fontWeight={600}>
                العربون:
              </Typography>
              <Typography color='info.main' fontWeight={700}>
                -{Number(clientDeposit).toFixed(2)} ج.م
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mb: 2,
                p: 1.5,
                borderRadius: 1,
                backgroundColor: 'rgba(0,0,0,0.03)'
              }}
            >
              <Typography fontWeight={700}>المتبقي للدفع:</Typography>
              <Typography
                color={Math.max(0, total - clientDeposit) > 0 ? 'error.main' : 'success.main'}
                variant='h6'
                fontWeight={800}
              >
                {Math.max(0, total - clientDeposit).toLocaleString(undefined, { minimumFractionDigits: 2 })} ج.م
              </Typography>
            </Box>
          </>
        )}

        {/* Show paid amount and remaining for finalized or partial payments */}
        {(invoiceData?.status !== 'draft' || paidAmount > 0) && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography color='success.main' fontWeight={600}>
                المبلغ المدفوع كاش:
              </Typography>
              <Typography color='success.main' fontWeight={700}>
                {invoiceData?.status === 'paid' && isTransitioningFromDraft
                  ? Math.max(0, total - clientDeposit).toLocaleString(undefined, { minimumFractionDigits: 2 })
                  : paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}{' '}
                ج.م
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mb: 2,
                p: 1.5,
                borderRadius: 1,
                backgroundColor: remainingAmount > 0 ? 'error.lighter' : 'success.lighter',
                border: '2px dashed',
                borderColor: remainingAmount > 0 ? 'error.main' : 'success.main'
              }}
            >
              <Typography color={remainingAmount > 0 ? 'error.main' : 'success.main'} fontWeight={700}>
                {remainingAmount > 0 ? 'المبلغ المتبقي:' : 'تم تسوية الرصيد'}
              </Typography>
              <Typography color={remainingAmount > 0 ? 'error.main' : 'success.main'} variant='h6' fontWeight={800}>
                {remainingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ج.م
              </Typography>
            </Box>
          </>
        )}

        <Divider sx={{ my: 2 }} />

        <Button fullWidth variant='contained' sx={{ mb: 2 }} onClick={onUpdateInvoice}>
          تحديث الفاتورة
        </Button>
        <Button fullWidth variant='outlined' color='secondary' onClick={onSave}>
          حفظ كمسودة
        </Button>
      </CardContent>
    </Card>
  )
}

// المكون الرئيسي
export default function EditInvoiceDashboard() {
  const params = useParams()
  const router = useRouter()
  const invoiceId = params?.id

  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState([])
  const [addCustomerOpen, setAddCustomerOpen] = useState(false)
  const [clientDeposit, setClientDeposit] = useState(0)
  const [initialStatus, setInitialStatus] = useState('draft')

  // حالة الإعدادات
  const [showSettings, setShowSettings] = useState(false)

  const [settings, setSettings] = useState({
    showLogo: true,
    showCompanyInfo: true,
    showClientInfo: true,
    showProjectInfo: true,
    showMaterials: true,
    showManufacturing: true,
    showTotals: true,
    showNotes: true,
    showFooter: true,
    showPrices: true,
    showQuantities: true,
    currency: 'EGP',
    taxRate: 0,
    discountRate: 0
  })

  // بيانات الفاتورة
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    clientId: '',
    dateIssued: '',
    dueDate: '',
    items: [],
    manufacturingItems: [],
    discount: 0,
    discountType: 'percentage',
    tax: 0,
    taxType: 'percentage',
    notes: '',
    status: 'draft',
    paidAmount: 0,
    paymentMethod: 'كاش',
    bankName: '',
    transactionNumber: ''
  })

  // Inventory States
  const [inventoryItems, setInventoryItems] = useState([])
  const [loadingInventory, setLoadingInventory] = useState(false)
  const [inventoryDialogOpen, setInventoryDialogOpen] = useState(false)
  const [selectedInventoryItems, setSelectedInventoryItems] = useState([])
  const [inventoryQuantities, setInventoryQuantities] = useState({})

  // Load inventory items
  const loadInventoryItems = async () => {
    setLoadingInventory(true)
    try {
      const response = await fetch('/api/inventory', { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        const materials = Array.isArray(data) ? data : data.data || []
        // Filter only available items (stock > 0 or count > 0)
        const availableMaterials = materials.filter(item => {
          const stock = Number(item.stock || item.count || 0)
          return stock > 0
        })
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
  const handleAddInventoryItems = () => {
    const selectedItems = inventoryItems.filter(item => selectedInventoryItems.includes(item.id))
    
    const newItems = selectedItems.map(item => ({
      desc: `${item.name || item.materialName} - SKU: ${item.sku || '-'}`,
      qty: inventoryQuantities[item.id] || 1,
      price: Number(item.price || 0),
      materialId: item.id,
      sku: item.sku,
      transactionId: null // No transaction yet, will deduct on update/save if not draft
    }))

    if (newItems.length > 0) {
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, ...newItems]
      }))
    }

    setInventoryDialogOpen(false)
    setSelectedInventoryItems([])
    setInventoryQuantities({})
  }
  // قائمة البنوك

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

  // جلب البيانات عند التحميل
  useEffect(() => {
    const fetchData = async () => {
      let clientsArray = []

      try {
        // جلب العملاء
        const clientsRes = await fetch('/api/clients', { credentials: 'include' })

        if (clientsRes.ok) {
          const clientsData = await clientsRes.json()

          // Handle both array and object response formats
          clientsArray = Array.isArray(clientsData) ? clientsData : clientsData.data || []
          setClients(clientsArray)
        }

        // جلب الفاتورة
        if (invoiceId) {
          const invoiceRes = await fetch(`/api/invoices?id=${invoiceId}`, { credentials: 'include' })

          if (invoiceRes.ok) {
            const invoiceData = await invoiceRes.json()

            // Parse date fields safely
            const parseDateField = dateVal => {
              if (!dateVal) return ''

              try {
                return String(dateVal).split('T')[0]
              } catch {
                return ''
              }
            }

            setFormData({
              invoiceNumber: invoiceData.invoiceNumber || invoiceData.number || '',
              clientId: invoiceData.clientId || '',
              dateIssued: parseDateField(invoiceData.dateIssued || invoiceData.date),
              dueDate: parseDateField(invoiceData.dueDate),
              discount: invoiceData.discount ?? 0,
              discountType: invoiceData.discountType || 'percentage',
              tax: invoiceData.tax ?? invoiceData.taxPercent ?? 0,
              taxType: invoiceData.taxType || 'percentage',
              notes: invoiceData.notes || '',
              items: Array.isArray(invoiceData.items) ? invoiceData.items : [],
              manufacturingItems: Array.isArray(invoiceData.manufacturingItems)
                ? invoiceData.manufacturingItems
                : Array.isArray(invoiceData.manufacturing)
                  ? invoiceData.manufacturing
                  : [],
              status: invoiceData.status || 'draft',
              paidAmount: Number(invoiceData.paidAmount || 0),
              paymentMethod: invoiceData.paymentMethod || 'تحويل بنكي',
              bankName: invoiceData.bankName || '',
              transactionNumber: invoiceData.transactionNumber || ''
            })

            setInitialStatus(invoiceData.status || 'draft')

            // Fetch client deposit (العربون) if client exists
            if (invoiceData.clientId) {
              try {
                const clientObj = clientsArray.find(c => String(c.id) === String(invoiceData.clientId))
                const budgetVal = clientObj ? Number(clientObj.budget || 0) : 0

                if (budgetVal > 0) {
                  setClientDeposit(budgetVal)
                } else {
                  // Fallback to wallet pool balance
                  try {
                    const poolRes = await fetch('/api/wallets/clients-pool', { credentials: 'include' })

                    if (poolRes.ok) {
                      const list = await poolRes.json()
                      const name = clientObj?.name || ''
                      const found = Array.isArray(list)
                        ? list.find(x => String(x.customer).trim() === String(name).trim())
                        : null

                      setClientDeposit(found ? Number(found.balance || 0) : 0)
                    }
                  } catch (e) {
                    console.error('Failed to fetch clients pool balances', e)
                  }
                }
              } catch (e) {
                console.error('client deposit lookup error', e)
              }
            }
          }
        }
      } catch (error) {
        console.error('خطأ في جلب البيانات:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [invoiceId])

  // إضافة عنصر تصنيع
  const addManufacturingItem = () => {
    setFormData(prev => ({
      ...prev,
      manufacturingItems: [...prev.manufacturingItems, { type: 'laser', subtype: 'ton', unitCost: 0, quantity: 0 }]
    }))
  }

  // تحديث عنصر تصنيع
  const updateManufacturingItem = (index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.manufacturingItems]

      newItems[index] = { ...newItems[index], [field]: value }

      // إعادة تعيين النوع الفرعي عند تغيير النوع
      if (field === 'type') {
        newItems[index].subtype = MANUFACTURING_SUBTYPES[value]?.[0]?.value || ''
      }

      return { ...prev, manufacturingItems: newItems }
    })
  }

  // حذف عنصر تصنيع
  const removeManufacturingItem = index => {
    setFormData(prev => ({
      ...prev,
      manufacturingItems: prev.manufacturingItems.filter((_, i) => i !== index)
    }))
  }

  // ========= دوال إدارة بنود الفاتورة =========
  // إضافة بند جديد
  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { desc: '', qty: 1, price: 0 }]
    }))
  }

  // تحديث بند
  const handleItemChange = (index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.items]

      newItems[index] = {
        ...newItems[index],
        [field]: field === 'qty' || field === 'price' ? Number(value) : value
      }

      return { ...prev, items: newItems }
    })
  }

  // حذف بند
  const removeItem = async index => {
    const item = formData.items[index]

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

    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  // حساب إجمالي البنود
  const itemsTotal = useMemo(() => {
    return (formData.items || []).reduce((sum, item) => {
      return sum + (Number(item.qty) || 0) * (Number(item.price) || 0)
    }, 0)
  }, [formData.items])

  // حساب إجمالي التصنيع
  const manufacturingTotal = useMemo(() => {
    return (formData.manufacturingItems || []).reduce((sum, item) => {
      return sum + (Number(item.unitCost) || 0) * (Number(item.quantity) || 0)
    }, 0)
  }, [formData.manufacturingItems])

  // حساب الإجمالي الكلي
  const calculateTotal = () => {
    const subtotal = itemsTotal + manufacturingTotal
    let discountAmount = 0
    let taxAmount = 0

    if (formData.discountType === 'percentage') {
      discountAmount = (subtotal * (formData.discount || 0)) / 100
    } else {
      discountAmount = formData.discount || 0
    }

    if (formData.taxType === 'percentage') {
      taxAmount = ((subtotal - discountAmount) * (formData.tax || 0)) / 100
    } else {
      taxAmount = formData.tax || 0
    }

    return subtotal - discountAmount + taxAmount
  }

  // حفظ الفاتورة
  const handleSave = async () => {
    try {
      const total = calculateTotal()
      const isDraft = initialStatus === 'draft'

      // Helper to clean date values
      const cleanDate = d => {
        if (!d || d === '' || d === 'Invalid Date' || d === 'Invalid date') return null
        return d
      }

      const payload = {
        number: formData.invoiceNumber,
        clientId: formData.clientId,
        date: cleanDate(formData.dateIssued),
        dueDate: cleanDate(formData.dueDate),
        items: formData.items,
        manufacturingItems: formData.manufacturingItems,
        discount: formData.discount,
        taxPercent: formData.tax,
        total: total,
        notes: formData.notes,
        status: 'draft',
        paidAmount:
          formData.status === 'partial'
            ? formData.paidAmount
            : formData.status === 'paid'
              ? isDraft
                ? Math.max(0, total - Math.min(Number(clientDeposit || 0), total))
                : total
              : 0,
        clientDeposit: Number(clientDeposit || 0),
        paymentMethod: formData.paymentMethod,
        bankName: formData.paymentMethod === 'تحويل بنكي' ? formData.bankName : null,
        transactionNumber: formData.paymentMethod === 'تحويل بنكي' ? formData.transactionNumber : null
      }

      const response = await fetch(`/api/invoices?id=${invoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        router.push('/invoices')
      }
    } catch (error) {
      console.error('خطأ في الحفظ:', error)
    }
  }

  // تحديث الفاتورة
  const handleUpdateInvoice = async () => {
    try {
      const total = calculateTotal()
      const isDraft = initialStatus === 'draft'

      // Helper to clean date values
      const cleanDate = d => {
        if (!d || d === '' || d === 'Invalid Date' || d === 'Invalid date') return null
        return d
      }

      const payload = {
        number: formData.invoiceNumber,
        clientId: formData.clientId,
        date: cleanDate(formData.dateIssued),
        dueDate: cleanDate(formData.dueDate),
        items: formData.items,
        manufacturingItems: formData.manufacturingItems,
        discount: formData.discount,
        taxPercent: formData.tax,
        total: total,
        notes: formData.notes,
        status: formData.status,
        paidAmount:
          formData.status === 'partial'
            ? formData.paidAmount
            : formData.status === 'paid'
              ? isDraft
                ? Math.max(0, total - Math.min(Number(clientDeposit || 0), total))
                : total
              : 0,
        clientDeposit: Number(clientDeposit || 0),
        paymentMethod: formData.paymentMethod,
        bankName: formData.paymentMethod === 'تحويل بنكي' ? formData.bankName : null,
        transactionNumber: formData.paymentMethod === 'تحويل بنكي' ? formData.transactionNumber : null
      }

      // If finalized (not draft), perform stock deductions for items lacking transactionId
      if (formData.status !== 'draft') {
        const userEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : 'unknown'
        const updatedItems = [...formData.items]

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
                  reference: formData.clientId ? `${formData.clientId} (INV: ${formData.invoiceNumber})` : formData.invoiceNumber,
                  user: userEmail,
                  note: `Deducted for invoice ${formData.invoiceNumber}`
                })
              })
              if (res.ok) {
                const txData = await res.json()
                updatedItems[i] = { ...item, transactionId: txData.tx?.id }
              }
            } catch (e) {
              console.error('Failed to deduct stock during update:', e)
            }
          }
        }
        payload.items = updatedItems
      }

      const response = await fetch(`/api/invoices?id=${invoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        // For items that are pieces, consume them if finalized
        if (formData.status !== 'draft') {
          try {
            const pieceDeletes = (formData.items || [])
              .filter(it => it.isPiece && it.pieceId)
              .map(it => {
                const pid = encodeURIComponent(it.pieceId)
                const cid = encodeURIComponent(formData.clientId || '')
                const permit = encodeURIComponent(formData.clientId || '')
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
        router.push('/invoices')
      }
 else {
        const err = await response.text()

        console.error('خطأ في التحديث:', err)
        alert('فشل في تحديث الفاتورة')
      }
    } catch (error) {
      console.error('خطأ في التحديث:', error)
    }
  }

  // معاينة الفاتورة
  const handlePreview = () => {
    router.push(`/invoices/${invoiceId}/preview`)
  }

  // إرسال الفاتورة
  const handleSendInvoice = () => {
    // يمكن إضافة منطق إرسال الفاتورة عبر البريد الإلكتروني هنا
    console.log('إرسال الفاتورة')
  }

  // إضافة عميل جديد للقائمة
  const handleAddClient = newClient => {
    setClients(prev => [...prev, newClient])
    setFormData(prev => ({ ...prev, clientId: newClient.id }))
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <>
      <Grid container spacing={6}>
        {/* العمود الرئيسي */}
        <Grid size={{ xs: 12, md: 9 }}>
          {/* بطاقة الإعدادات */}
          <Card sx={{ mb: 4 }}>
            <CardHeader
              title='الإعدادات'
              action={
                <Button
                  variant='outlined'
                  size='small'
                  onClick={() => setShowSettings(!showSettings)}
                  startIcon={<i className={`ri-${showSettings ? 'arrow-up-s-line' : 'arrow-down-s-line'}`} />}
                >
                  {showSettings ? 'إخفاء' : 'عرض'}
                </Button>
              }
            />
            <Collapse in={showSettings}>
              <CardContent>
                <Grid container spacing={4}>
                  {/* إعدادات العرض */}
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant='subtitle2' sx={{ mb: 2, fontWeight: 'bold' }}>
                      خيارات العرض
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.showLogo}
                          onChange={e => setSettings({ ...settings, showLogo: e.target.checked })}
                        />
                      }
                      label='عرض الشعار'
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.showCompanyInfo}
                          onChange={e => setSettings({ ...settings, showCompanyInfo: e.target.checked })}
                        />
                      }
                      label='عرض معلومات الشركة'
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.showClientInfo}
                          onChange={e => setSettings({ ...settings, showClientInfo: e.target.checked })}
                        />
                      }
                      label='عرض معلومات العميل'
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.showProjectInfo}
                          onChange={e => setSettings({ ...settings, showProjectInfo: e.target.checked })}
                        />
                      }
                      label='عرض معلومات المشروع'
                    />
                  </Grid>

                  {/* إعدادات المحتوى */}
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant='subtitle2' sx={{ mb: 2, fontWeight: 'bold' }}>
                      المحتوى
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.showMaterials}
                          onChange={e => setSettings({ ...settings, showMaterials: e.target.checked })}
                        />
                      }
                      label='عرض المواد'
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.showManufacturing}
                          onChange={e => setSettings({ ...settings, showManufacturing: e.target.checked })}
                        />
                      }
                      label='عرض التصنيع'
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.showPrices}
                          onChange={e => setSettings({ ...settings, showPrices: e.target.checked })}
                        />
                      }
                      label='عرض الأسعار'
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.showQuantities}
                          onChange={e => setSettings({ ...settings, showQuantities: e.target.checked })}
                        />
                      }
                      label='عرض الكميات'
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.showTotals}
                          onChange={e => setSettings({ ...settings, showTotals: e.target.checked })}
                        />
                      }
                      label='عرض الإجماليات'
                    />
                  </Grid>

                  {/* الإعدادات المالية */}
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant='subtitle2' sx={{ mb: 2, fontWeight: 'bold' }}>
                      الإعدادات المالية
                    </Typography>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>العملة</InputLabel>
                      <Select
                        value={settings.currency}
                        onChange={e => setSettings({ ...settings, currency: e.target.value })}
                        label='العملة'
                      >
                        <MenuItem value='EGP'>جنيه مصري (ج.م)</MenuItem>
                        <MenuItem value='USD'>دولار أمريكي ($)</MenuItem>
                        <MenuItem value='SAR'>ريال سعودي (ر.س)</MenuItem>
                        <MenuItem value='AED'>درهم إماراتي (د.إ)</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.showNotes}
                          onChange={e => setSettings({ ...settings, showNotes: e.target.checked })}
                        />
                      }
                      label='عرض الملاحظات'
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.showFooter}
                          onChange={e => setSettings({ ...settings, showFooter: e.target.checked })}
                        />
                      }
                      label='عرض التذييل'
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Collapse>
          </Card>

          {/* تفاصيل الفاتورة */}
          <Card sx={{ mb: 4 }}>
            <CardHeader title='تفاصيل الفاتورة' />
            <CardContent>
              <Grid container spacing={4}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    fullWidth
                    label='رقم الفاتورة'
                    value={formData.invoiceNumber || ''}
                    onChange={e => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <FormControl fullWidth>
                    <InputLabel>حالة الفاتورة</InputLabel>
                    <Select
                      value={formData.status || 'draft'}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
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
                      value={formData.clientId || ''}
                      onChange={e => {
                        const newClientId = e.target.value
                        setFormData({ ...formData, clientId: newClientId })

                        // Update client deposit when client changes
                        if (!newClientId) {
                          setClientDeposit(0)
                          return
                        }

                        const clientObj = clients.find(c => String(c.id) === String(newClientId))
                        const budgetVal = clientObj ? Number(clientObj.budget || 0) : 0

                        if (budgetVal > 0) {
                          setClientDeposit(budgetVal)
                        } else {
                          setClientDeposit(0)
                          fetch('/api/wallets/clients-pool', { credentials: 'include' })
                            .then(r => (r.ok ? r.json() : Promise.resolve([])))
                            .then(list => {
                              const name = clientObj?.name || ''
                              const found = Array.isArray(list)
                                ? list.find(x => String(x.customer).trim() === String(name).trim())
                                : null
                              setClientDeposit(found ? Number(found.balance || 0) : 0)
                            })
                            .catch(() => setClientDeposit(0))
                        }
                      }}
                      label='اختر العميل'
                    >
                      <MenuItem value=''>اختر العميل</MenuItem>
                      {clients.map(client => (
                        <MenuItem key={client.id} value={client.id}>
                          {client.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <FormControl fullWidth>
                    <InputLabel>طريقة الدفع</InputLabel>
                    <Select
                      value={formData.paymentMethod || 'تحويل بنكي'}
                      onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                      label='طريقة الدفع'
                    >
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
                {formData.paymentMethod === 'تحويل بنكي' && (
                  <>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <FormControl fullWidth>
                        <InputLabel>اسم البنك</InputLabel>
                        <Select
                          value={formData.bankName || ''}
                          onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                          label='اسم البنك'
                        >
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
                        value={formData.transactionNumber || ''}
                        onChange={e => setFormData({ ...formData, transactionNumber: e.target.value })}
                      />
                    </Grid>
                  </>
                )}

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    fullWidth
                    type='date'
                    label='تاريخ الإصدار'
                    value={formData.dateIssued || ''}
                    onChange={e => setFormData({ ...formData, dateIssued: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    fullWidth
                    type='date'
                    label='تاريخ الاستحقاق'
                    value={formData.dueDate || ''}
                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Button
                    variant='text'
                    color='primary'
                    startIcon={<i className='ri-add-line' />}
                    onClick={() => setAddCustomerOpen(true)}
                  >
                    إضافة عميل جديد
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* بنود الفاتورة */}
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
                  <Button variant='contained' size='small' startIcon={<i className='ri-add-line' />} onClick={addItem}>
                    إضافة بند
                  </Button>
                </Box>
              }
            />
            <CardContent>
              {!formData.items || formData.items.length === 0 ? (
                <Typography color='text.secondary' sx={{ textAlign: 'center', py: 4 }}>
                  لا توجد بنود. اضغط على &quot;إضافة بند&quot; لإضافة بند جديد.
                </Typography>
              ) : (
                formData.items.map((item, index) => (
                  <Box key={index} sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    <Grid container spacing={3} alignItems='center'>
                      <Grid size={{ xs: 12, sm: 5 }}>
                        <TextField
                          fullWidth
                          size='small'
                          multiline
                          rows={2}
                          label='الوصف'
                          placeholder='وصف البند'
                          value={item.desc || ''}
                          onChange={e => handleItemChange(index, 'desc', e.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 2 }}>
                        <TextField
                          fullWidth
                          size='small'
                          type='number'
                          label='الكمية'
                          value={item.qty || 0}
                          onChange={e => handleItemChange(index, 'qty', e.target.value)}
                          inputProps={{ min: 0 }}
                        />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 2 }}>
                        <TextField
                          fullWidth
                          size='small'
                          type='number'
                          label='السعر'
                          value={item.price || 0}
                          onChange={e => handleItemChange(index, 'price', e.target.value)}
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
                          {((Number(item.qty) || 0) * (Number(item.price) || 0)).toFixed(2)} ج.م
                        </Typography>
                        <IconButton color='error' onClick={() => removeItem(index)}>
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Box>
                ))
              )}
              {formData.items && formData.items.length > 0 && (
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

          {/* الضريبة والخصم */}
          <Card sx={{ mb: 4 }}>
            <CardHeader title='الضريبة والخصم' />
            <CardContent>
              <Grid container spacing={4}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      fullWidth
                      type='number'
                      label='الخصم'
                      value={formData.discount ?? 0}
                      onChange={e => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position='end'>
                            {formData.discountType === 'percentage' ? '%' : 'ج.م'}
                          </InputAdornment>
                        )
                      }}
                    />
                    <FormControl sx={{ minWidth: 120 }}>
                      <InputLabel>النوع</InputLabel>
                      <Select
                        value={formData.discountType || 'percentage'}
                        onChange={e => setFormData({ ...formData, discountType: e.target.value })}
                        label='النوع'
                      >
                        <MenuItem value='percentage'>نسبة %</MenuItem>
                        <MenuItem value='fixed'>مبلغ ثابت</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      fullWidth
                      type='number'
                      label='الضريبة'
                      value={formData.tax ?? 0}
                      onChange={e => setFormData({ ...formData, tax: parseFloat(e.target.value) || 0 })}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position='end'>
                            {formData.taxType === 'percentage' ? '%' : 'ج.م'}
                          </InputAdornment>
                        )
                      }}
                    />
                    <FormControl sx={{ minWidth: 120 }}>
                      <InputLabel>النوع</InputLabel>
                      <Select
                        value={formData.taxType || 'percentage'}
                        onChange={e => setFormData({ ...formData, taxType: e.target.value })}
                        label='النوع'
                      >
                        <MenuItem value='percentage'>نسبة %</MenuItem>
                        <MenuItem value='fixed'>مبلغ ثابت</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* قسم التصنيع */}
          <Card sx={{ mb: 4 }}>
            <CardHeader
              title='التصنيع'
              action={
                <Button
                  variant='contained'
                  size='small'
                  startIcon={<i className='ri-add-line' />}
                  onClick={addManufacturingItem}
                >
                  إضافة عنصر
                </Button>
              }
            />
            <CardContent>
              {formData.manufacturingItems.length === 0 ? (
                <Typography color='text.secondary' sx={{ textAlign: 'center', py: 4 }}>
                  لا توجد عناصر تصنيع. اضغط على &quot;إضافة عنصر&quot; لإضافة عنصر جديد.
                </Typography>
              ) : (
                formData.manufacturingItems.map((item, index) => (
                  <Box key={index} sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    <Grid container spacing={3} alignItems='center'>
                      <Grid size={{ xs: 12, sm: 3 }}>
                        <FormControl fullWidth size='small'>
                          <InputLabel>النوع</InputLabel>
                          <Select
                            value={item.type || 'laser'}
                            onChange={e => updateManufacturingItem(index, 'type', e.target.value)}
                            label='النوع'
                          >
                            {MANUFACTURING_TYPES.map(type => (
                              <MenuItem key={type.value} value={type.value}>
                                {type.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 3 }}>
                        <FormControl fullWidth size='small'>
                          <InputLabel>الوحدة</InputLabel>
                          <Select
                            value={item.subtype || 'ton'}
                            onChange={e => updateManufacturingItem(index, 'subtype', e.target.value)}
                            label='الوحدة'
                          >
                            {(MANUFACTURING_SUBTYPES[item.type] || []).map(subtype => (
                              <MenuItem key={subtype.value} value={subtype.value}>
                                {subtype.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 2 }}>
                        <TextField
                          fullWidth
                          size='small'
                          type='number'
                          label='سعر الوحدة'
                          value={item.unitCost ?? 0}
                          onChange={e => updateManufacturingItem(index, 'unitCost', parseFloat(e.target.value) || 0)}
                          InputProps={{
                            endAdornment: <InputAdornment position='end'>ج.م</InputAdornment>
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 2 }}>
                        <TextField
                          fullWidth
                          size='small'
                          type='number'
                          label='الكمية'
                          value={item.quantity ?? 0}
                          onChange={e => updateManufacturingItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        />
                      </Grid>
                      <Grid
                        size={{ xs: 12, sm: 2 }}
                        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                      >
                        <Typography variant='body2' color='primary' fontWeight='bold'>
                          {((item.unitCost || 0) * (item.quantity || 0)).toFixed(2)} ج.م
                        </Typography>
                        <IconButton color='error' onClick={() => removeManufacturingItem(index)}>
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Box>
                ))
              )}
            </CardContent>
          </Card>

          {/* الملاحظات */}
          <Card sx={{ mb: 4 }}>
            <CardHeader title='الملاحظات' />
            <CardContent>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder='أضف ملاحظات للفاتورة...'
                value={formData.notes || ''}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
              />
            </CardContent>
          </Card>

          {/* حالة الفاتورة والدفع الجزئي */}
          <Card sx={{ mb: 4 }}>
            <CardHeader title='حالة الفاتورة' />
            <CardContent>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>حالة الفاتورة</InputLabel>
                    <Select
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
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
                {formData.status === 'partial' && (
                  <>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label='المبلغ المدفوع'
                        type='number'
                        value={formData.paidAmount}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0
                          const total = calculateTotal()
                          const availableToPay = initialStatus === 'draft' ? Math.max(0, total - clientDeposit) : total

                          setFormData({ ...formData, paidAmount: Math.min(val, availableToPay) })
                        }}
                        InputProps={{
                          endAdornment: <InputAdornment position='end'>ج.م</InputAdornment>,
                          inputProps: { min: 0, step: 0.01 }
                        }}
                        helperText={
                          initialStatus === 'draft' && clientDeposit > 0
                            ? `المبلغ المطلوب بعد الخصم من العربون: ${Math.max(0, calculateTotal() - clientDeposit).toLocaleString()} ج.م`
                            : `الحد الأقصى: ${calculateTotal().toLocaleString()} ج.م`
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          backgroundColor: 'error.lighter',
                          border: '2px dashed',
                          borderColor: 'error.main',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <Typography color='error.main' variant='body1' className='font-semibold'>
                          المبلغ المتبقي:
                        </Typography>
                        <Typography color='error.main' variant='h5' className='font-bold'>
                          {(calculateTotal() - formData.paidAmount).toLocaleString()} ج.م
                        </Typography>
                      </Box>
                    </Grid>
                  </>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* أزرار الحفظ */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button variant='outlined' color='secondary' onClick={() => router.push('/invoices')}>
              إلغاء
            </Button>
            <Button variant='outlined' onClick={handleSave}>
              حفظ كمسودة
            </Button>
            <Button variant='contained' onClick={handleUpdateInvoice}>
              تحديث الفاتورة
            </Button>
          </Box>
        </Grid>

        {/* العمود الجانبي */}
        <Grid size={{ xs: 12, md: 3 }}>
          {/* Client Account Card */}
          {formData.clientId && (
            <Card
              sx={{
                mb: 3,
                border: clientDeposit > 0 ? '2px solid' : '1px solid',
                borderColor: clientDeposit > 0 ? 'info.main' : 'divider'
              }}
            >
              <CardContent>
                <Typography variant='h6' sx={{ mb: 2, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <i className='ri-wallet-3-line' style={{ color: '#1976d2' }} />
                  حساب العميل
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography color='text.secondary'>اسم العميل:</Typography>
                  <Typography fontWeight={600}>
                    {clients.find(c => String(c.id) === String(formData.clientId))?.name || '-'}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography color='text.secondary'>رصيد العربون:</Typography>
                  <Typography
                    fontWeight={700}
                    fontSize='1.1rem'
                    color={clientDeposit > 0 ? 'success.main' : 'text.secondary'}
                  >
                    {Number(clientDeposit).toLocaleString()} ج.م
                  </Typography>
                </Box>
                {clientDeposit > 0 && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography color='text.secondary'>إجمالي الفاتورة:</Typography>
                      <Typography fontWeight={500}>{calculateTotal().toFixed(2)} ج.م</Typography>
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        p: 1,
                        borderRadius: 1,
                        backgroundColor: 'rgba(46, 125, 50, 0.08)',
                        mb: 1
                      }}
                    >
                      <Typography color='success.main' fontWeight={600}>
                        سيتم خصم:
                      </Typography>
                      <Typography color='success.main' fontWeight={700} fontSize='1.05rem'>
                        -{Math.min(clientDeposit, calculateTotal()).toLocaleString()} ج.م
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        p: 1,
                        borderRadius: 1,
                        backgroundColor: 'rgba(25, 118, 210, 0.08)'
                      }}
                    >
                      <Typography color='info.main' fontWeight={600}>
                        الرصيد بعد الخصم:
                      </Typography>
                      <Typography color='info.main' fontWeight={700} fontSize='1.05rem'>
                        {Math.max(0, clientDeposit - calculateTotal()).toLocaleString()} ج.م
                      </Typography>
                    </Box>
                  </>
                )}
                {clientDeposit === 0 && (
                  <Typography variant='body2' color='text.secondary' sx={{ textAlign: 'center', py: 1 }}>
                    لا يوجد عربون مسجل لهذا العميل
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}

          <EditActions
            onSave={handleSave}
            onPreview={handlePreview}
            onSendInvoice={handleSendInvoice}
            invoiceData={formData}
            onUpdateInvoice={handleUpdateInvoice}
            clientDeposit={clientDeposit}
            initialStatus={initialStatus}
          />
        </Grid>
      </Grid>

      {/* مكون إضافة عميل */}
      <AddCustomerDrawer open={addCustomerOpen} setOpen={setAddCustomerOpen} onAddClient={handleAddClient} />

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
            <List>
              {inventoryItems.map(item => {
                const itemType = (item.materialType || item.type || '').toLowerCase()
                let iconClass = 'ri-box-3-line'
                if (itemType === 'sheet') iconClass = 'ri-file-copy-2-line'
                else if (itemType === 'round' || itemType === 'pipe') iconClass = 'ri-ruler-2-line'

                return (
                  <ListItem
                    key={item.id}
                    divider
                    sx={{
                      backgroundColor: selectedInventoryItems.includes(item.id) ? 'action.selected' : 'inherit',
                      '&:hover': { backgroundColor: 'action.hover' }
                    }}
                  >
                    <Checkbox
                      checked={selectedInventoryItems.includes(item.id)}
                      onChange={() => handleInventoryItemToggle(item.id)}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
                      <i className={iconClass} style={{ fontSize: '1.2rem', color: '#666' }} />
                      <ListItemText
                        primary={item.name || item.materialName}
                        secondary={
                          <Box component='span' sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                            <Typography variant='caption' component='span'>
                              SKU: {item.sku || '-'}
                            </Typography>
                            <Typography variant='caption' component='span' color='primary' fontWeight='bold'>
                              المتاح: {item.stock || item.count || 0}
                            </Typography>
                            <Typography variant='caption' component='span'>
                              السعر: {item.price || 0} ج.م
                            </Typography>
                          </Box>
                        }
                      />
                    </Box>
                    {selectedInventoryItems.includes(item.id) && (
                      <ListItemSecondaryAction>
                        <TextField
                          size='small'
                          type='number'
                          label='الكمية'
                          value={inventoryQuantities[item.id] || 1}
                          onChange={e => handleInventoryQuantityChange(item.id, e.target.value)}
                          sx={{ width: 100 }}
                          inputProps={{ min: 1, max: Number(item.stock || item.count || 0) }}
                        />
                      </ListItemSecondaryAction>
                    )}
                  </ListItem>
                )
              })}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInventoryDialogOpen(false)} color='secondary'>
            إلغاء
          </Button>
          <Button
            onClick={handleAddInventoryItems}
            variant='contained'
            disabled={selectedInventoryItems.length === 0}
            startIcon={<i className='ri-add-line' />}
          >
            إضافة المختار ({selectedInventoryItems.length})
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
