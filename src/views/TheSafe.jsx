'use client'

import { useEffect, useState } from 'react'

import { COMPANY_NAME, COMPANY_LOGO, COMPANY_LOGO_FALLBACK } from '@/utils/companyInfo'

import Link from 'next/link'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import FormLabel from '@mui/material/FormLabel'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import InputAdornment from '@mui/material/InputAdornment'
import Alert from '@mui/material/Alert'
import Skeleton from '@mui/material/Skeleton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import CircularProgress from '@mui/material/CircularProgress'
import Autocomplete from '@mui/material/Autocomplete'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'
import CountUp from '@/components/CountUp'

// Clients Receivables Component
const ClientsReceivables = ({ clients }) => {
  const [clientsData, setClientsData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchClientsBalances = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/clients', { credentials: 'include' })
        if (response.ok) {
          const result = await response.json()
          // Filter only clients with balance > 0
          const withDebts = (result.data || []).filter(c => c.balance > 0)
          setClientsData(withDebts)
        }
      } catch (err) {
        console.error('Failed to fetch clients:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchClientsBalances()
  }, [clients])

  const totalReceivables = clientsData.reduce((sum, c) => sum + (c.balance || 0), 0)

  if (loading) {
    return (
      <Card className='mb-6'>
        <CardContent className='flex items-center justify-center py-8'>
          <CircularProgress size={24} />
        </CardContent>
      </Card>
    )
  }

  if (clientsData.length === 0) {
    return null
  }

  return (
    <Card className='mb-6'>
      <CardHeader
        title={
          <div className='flex items-center gap-2'>
            <i className='tabler-users text-2xl text-warning' />
            <Typography variant='h5'>عملاء عليهم فلوس (آجل)</Typography>
          </div>
        }
        action={
          <Chip
            label={`${totalReceivables.toLocaleString('ar-EG')} ج.م`}
            color='warning'
            variant='filled'
            size='medium'
            sx={{ fontWeight: 'bold', fontSize: '1rem' }}
          />
        }
      />
      <CardContent>
        <Grid container spacing={2}>
          {clientsData.slice(0, 6).map(client => (
            <Grid key={client.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card variant='outlined' className='h-full hover:shadow-md transition-shadow'>
                <CardContent className='flex items-center justify-between p-3'>
                  <div className='flex items-center gap-3'>
                    <CustomAvatar skin='light' color='warning' size={40}>
                      <i className='tabler-user text-xl' />
                    </CustomAvatar>
                    <div>
                      <Typography variant='body1' className='font-semibold'>
                        {client.name}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {client.phone || '-'}
                      </Typography>
                    </div>
                  </div>
                  <div className='text-end'>
                    <Typography variant='h6' color='warning.main' className='font-bold'>
                      {client.balance.toLocaleString('ar-EG')}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      عليه
                    </Typography>
                  </div>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        {clientsData.length > 6 && (
          <Box className='mt-4 text-center'>
            <Button
              component={Link}
              href='/clients'
              variant='outlined'
              color='warning'
              size='small'
              startIcon={<i className='tabler-arrow-left' />}
            >
              عرض جميع العملاء المدينين ({clientsData.length})
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

// Suppliers Payables Component
const SuppliersPayables = ({ suppliers }) => {
  const [suppliersData, setSuppliersData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSuppliersBalances = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/suppliers', { credentials: 'include' })
        if (response.ok) {
          const result = await response.json()
          // Filter only suppliers with balance > 0
          const withDebts = (result.data || []).filter(s => s.balance > 0)
          setSuppliersData(withDebts)
        }
      } catch (err) {
        console.error('Failed to fetch suppliers:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSuppliersBalances()
  }, [suppliers])

  const totalPayables = suppliersData.reduce((sum, s) => sum + (s.balance || 0), 0)

  if (loading) {
    return (
      <Card className='mb-6'>
        <CardContent className='flex items-center justify-center py-8'>
          <CircularProgress size={24} />
        </CardContent>
      </Card>
    )
  }

  if (suppliersData.length === 0) {
    return null // لا تعرض شيء إذا لم يكن هناك موردين بمستحقات
  }

  return (
    <Card className='mb-6'>
      <CardHeader
        title={
          <div className='flex items-center gap-2'>
            <i className='tabler-truck text-2xl text-error' />
            <Typography variant='h5'>مستحقات الموردين</Typography>
          </div>
        }
        action={
          <Chip
            label={`${totalPayables.toLocaleString('ar-EG')} ج.م`}
            color='error'
            variant='filled'
            size='medium'
            sx={{ fontWeight: 'bold', fontSize: '1rem' }}
          />
        }
      />
      <CardContent>
        <Grid container spacing={2}>
          {suppliersData.slice(0, 6).map(supplier => (
            <Grid key={supplier.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card variant='outlined' className='h-full hover:shadow-md transition-shadow'>
                <CardContent className='flex items-center justify-between p-3'>
                  <div className='flex items-center gap-3'>
                    <CustomAvatar skin='light' color='error' size={40}>
                      <i className='tabler-building text-xl' />
                    </CustomAvatar>
                    <div>
                      <Typography variant='body1' className='font-semibold'>
                        {supplier.name}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {supplier.phone || '-'}
                      </Typography>
                    </div>
                  </div>
                  <div className='text-end'>
                    <Typography variant='h6' color='error' className='font-bold'>
                      {supplier.balance.toLocaleString('ar-EG')}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      ج.م
                    </Typography>
                  </div>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        {suppliersData.length > 6 && (
          <Box className='mt-4 text-center'>
            <Button
              component={Link}
              href='/suppliers'
              variant='outlined'
              color='error'
              size='small'
              startIcon={<i className='tabler-arrow-left' />}
            >
              عرض جميع الموردين ({suppliersData.length})
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

// Safe Statistics Component
const SafeStats = ({ entries }) => {
  const totalIncoming = entries.reduce((sum, e) => sum + (parseFloat(e.incoming) || 0), 0)
  const totalOutgoing = entries.reduce((sum, e) => sum + (parseFloat(e.outgoing) || 0), 0)
  const balance = totalIncoming - totalOutgoing

  const stats = [
    {
      title: 'إجمالي الوارد',
      value: totalIncoming,
      icon: 'tabler-trending-up',
      color: 'success',
      bgClass: 'bg-success/10'
    },
    {
      title: 'إجمالي الصادر',
      value: totalOutgoing,
      icon: 'tabler-trending-down',
      color: 'error',
      bgClass: 'bg-error/10'
    },
    {
      title: 'الرصيد الحالي',
      value: balance,
      icon: 'tabler-wallet',
      color: balance >= 0 ? 'primary' : 'error',
      bgClass: balance >= 0 ? 'bg-primary/10' : 'bg-error/10'
    },
    {
      title: 'عدد القيود',
      value: entries.length,
      icon: 'tabler-list-numbers',
      color: 'info',
      bgClass: 'bg-info/10',
      isCount: true
    }
  ]

  return (
    <Grid container spacing={4} className='mb-6'>
      {stats.map((stat, index) => (
        <Grid key={index} size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card className='stat-card h-full'>
            <CardContent className='flex items-center gap-4'>
              <CustomAvatar skin='light' color={stat.color} size={50} className='shadow-sm'>
                <i className={`${stat.icon} text-2xl`} />
              </CustomAvatar>
              <div className='flex-1'>
                <Typography variant='body2' color='text.secondary'>
                  {stat.title}
                </Typography>
                <Typography variant='h5' className='font-bold'>
                  {stat.isCount ? (
                    <CountUp end={stat.value} duration={1} />
                  ) : (
                    <>
                      <CountUp end={stat.value} decimals={2} duration={1} />
                      <span className='text-sm font-normal me-1'>ج.م</span>
                    </>
                  )}
                </Typography>
              </div>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}

// Month options
const months = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر'
]

// Payment method labels
const paymentMethods = {
  cash: 'نقدي',
  shek: 'شيك',
  online: 'تحويل بنكي',
  'manual-deposit': 'ايداع رصيد اضافى',
  'client-registration-deposit': 'العربون عميل جديد',
  invoice: 'فاتورة',
  Invoice: 'فاتورة',
  wallet: 'محفظة',
  Wallet: 'محفظة',
  transfer: 'تحويل',
  Transfer: 'تحويل'
}

// Print entry as treasury movement report
const handlePrintEntry = (entry, previousBalance = 0, entryNumber = 0) => {
  const entryDate = entry.date ? new Date(entry.date) : new Date()
  const formattedDate = entryDate.toLocaleDateString('ar-EG')
  const incoming = parseFloat(entry.incoming || 0)
  const outgoing = parseFloat(entry.outgoing || 0)
  const balance = parseFloat(entry.balance || 0)
  const incomingMethodLabel = paymentMethods[entry.incomingMethod] || entry.incomingMethod || '-'
  const outgoingMethodLabel = paymentMethods[entry.outgoingMethod] || entry.outgoingMethod || '-'
  const isIncomingCash = entry.incomingMethod === 'cash'
  const isIncomingCheck = entry.incomingMethod === 'shek'
  const isOutgoingCash = entry.outgoingMethod === 'cash'
  const isOutgoingCheck = entry.outgoingMethod === 'shek'

  const printWindow = window.open('', '_blank')
  printWindow.document.write(`
    <html dir="rtl">
      <head>
        <title>كشف حركة الخزينة - ${formattedDate}</title>
        <style>
          @page { size: A4 portrait !important; margin: 10mm; }
          @media print {
            @page { size: A4 portrait !important; margin: 10mm; }
            html, body { width: 100% !important; min-height: 297mm !important; }
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html { width: 100%; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            padding: 0; 
            font-size: 13px;
            line-height: 1.4;
            box-sizing: border-box;
            background: #fff;
          }
          /* internal safe container to respect @page margins and avoid clipping */
          .print-wrapper {
            padding: 10mm; /* matches @page margin */
            max-width: calc(210mm - 20mm);
            margin: 0 auto;
            box-sizing: border-box;
          }
          .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            border-bottom: 2px solid #000; 
            padding-bottom: 10px; 
            margin-bottom: 10px; 
          }
          .logo-section { text-align: center; }
          .logo { max-height: 70px; max-width: 100px; }
          .company-name { 
            font-size: 18px; 
            font-weight: bold; 
            margin-top: 5px; 
          }
          .doc-number { font-size: 16px; font-weight: bold; }
          .date-section { text-align: left; }
          .title { 
            text-align: center; 
            font-size: 18px; 
            font-weight: bold; 
            margin: 10px 0; 
            background: #f0f0f0; 
            padding: 8px; 
            border: 1px solid #333; 
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 10px; 
          }
          th, td { 
            border: 1px solid #333; 
            padding: 5px; 
            text-align: center; 
          }
          th { background: #e8e8e8; font-weight: bold; }
          .section-title { 
            background: #d0d0d0; 
            font-weight: bold; 
            font-size: 14px; 
          }
          .movement-table { margin-bottom: 15px; }
          .summary-container {
            display: flex;
            justify-content: space-between;
            gap: 15px;
            margin-top: 15px;
          }
          .summary-box {
            flex: 1;
            border: 2px solid #333;
          }
          .summary-box th { background: #c0c0c0; }
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px dashed #ccc;
          }
          .signature-box {
            text-align: center;
            min-width: 100px;
          }
          .signature-line {
            border-bottom: 1px solid #000;
            height: 25px;
            margin-bottom: 3px;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-section">
            <img src="${COMPANY_LOGO}" alt="${COMPANY_NAME} Logo" class="logo" onerror="this.onerror=null; this.src='${COMPANY_LOGO_FALLBACK}'" />
            <div class="company-name">الوطنية للمقاولات العمومية<br/>والتوريدات الهندسية<br/>ويسكو</div>
          </div>
          <div>
            <div class="doc-number">${String(entryNumber).padStart(6, '0')}</div>
            <div style="margin-top: 10px;">الموافق: ${formattedDate}</div>
          </div>
        </div>

        <div class="title">كشف حركة الخزينة عن يوم</div>

        <!-- Main Movement Table -->
        <table class="movement-table">
          <thead>
            <tr>
              <th colspan="3" class="section-title">حركة الوارد</th>
              <th rowspan="2">رقم التوريد</th>
              <th rowspan="2">البيان</th>
              <th colspan="2" class="section-title">حركة الصادر</th>
              <th rowspan="2">البيان</th>
            </tr>
            <tr>
              <th>نقدية</th>
              <th>شيكات</th>
              <th>اخرى</th>
              <th>نقدية</th>
              <th>شيكات</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${isIncomingCash && incoming > 0 ? incoming.toLocaleString('ar-EG') : '-'}</td>
              <td>${isIncomingCheck && incoming > 0 ? incoming.toLocaleString('ar-EG') : '-'}</td>
              <td>${!isIncomingCash && !isIncomingCheck && incoming > 0 ? incoming.toLocaleString('ar-EG') + ' (' + incomingMethodLabel + ')' : '-'}</td>
              <td>${entry.id || '-'}</td>
              <td>${entry.description || '-'}</td>
              <td>${isOutgoingCash && outgoing > 0 ? outgoing.toLocaleString('ar-EG') : '-'}</td>
              <td>${isOutgoingCheck && outgoing > 0 ? outgoing.toLocaleString('ar-EG') : '-'}</td>
              <td>${entry.customer || '-'}</td>
            </tr>
            ${Array(5).fill('<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>').join('')}
            <tr style="font-weight: bold; background: #f5f5f5;">
              <td colspan="3">الإجمالي: ${incoming > 0 ? incoming.toLocaleString('ar-EG') : '-'}</td>
              <td></td>
              <td></td>
              <td colspan="2">الإجمالي: ${outgoing > 0 ? outgoing.toLocaleString('ar-EG') : '-'}</td>
              <td></td>
            </tr>
          </tbody>
        </table>

        <!-- Summary Boxes -->
        <div class="summary-container">
          <!-- Movement Summary -->
          <table class="summary-box">
            <thead>
              <tr><th colspan="2">ملخص الحركة</th></tr>
              <tr><th>البيان</th><th>المبلغ</th></tr>
            </thead>
            <tbody>
              <tr><td>رصيد اليوم السابق</td><td>${previousBalance.toLocaleString('ar-EG')}</td></tr>
              <tr><td>إجمالي الوارد</td><td>${incoming.toLocaleString('ar-EG')}</td></tr>
              <tr><td>إجمالي الصادر</td><td>${outgoing.toLocaleString('ar-EG')}</td></tr>
              <tr style="font-weight: bold; background: #e8e8e8;"><td>رصيد آخر اليوم</td><td>${balance.toLocaleString('ar-EG')}</td></tr>
            </tbody>
          </table>

          <!-- Balance Breakdown -->
          <table class="summary-box">
            <thead>
              <tr><th colspan="2">تحليل الرصيد</th></tr>
              <tr><th>البيان</th><th>المبلغ</th></tr>
            </thead>
            <tbody>
              <tr><td>نقدية بالجنيه المصري</td><td>${(isIncomingCash ? incoming : 0) - (isOutgoingCash ? outgoing : 0) > 0 ? ((isIncomingCash ? incoming : 0) - (isOutgoingCash ? outgoing : 0)).toLocaleString('ar-EG') : '-'}</td></tr>
              <tr><td>نقدية بالعملة الاجنبية</td><td>-</td></tr>
              <tr><td>شيكات بالجنيه المصري</td><td>${(isIncomingCheck ? incoming : 0) - (isOutgoingCheck ? outgoing : 0) > 0 ? ((isIncomingCheck ? incoming : 0) - (isOutgoingCheck ? outgoing : 0)).toLocaleString('ar-EG') : '-'}</td></tr>
              <tr><td>شيكات بالعملة الاجنبية</td><td>-</td></tr>
              <tr><td>ايصالات عهدة</td><td>-</td></tr>
              <tr><td>طوابع بريد ودمغة</td><td>-</td></tr>
              <tr style="font-weight: bold; background: #e8e8e8;"><td>الإجمالي</td><td>${balance.toLocaleString('ar-EG')}</td></tr>
            </tbody>
          </table>
        </div>

        <!-- Signatures -->
        <div class="signatures">
          <div class="signature-box">
            <div class="signature-line"></div>
            <div>أمين الخزينة</div>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <div>المراجعة</div>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <div>الحسابات</div>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <div>يعتمد،،،،</div>
          </div>
        </div>
      </body>
    </html>
  `)
  printWindow.document.close()
  setTimeout(() => {
    printWindow.print()
  }, 500)
}

// Compute running balances for an entries array (returns newest-first)
function computeRunningBalances(entries) {
  if (!Array.isArray(entries)) return []
  const arr = entries.slice()
  arr.sort((a, b) => {
    const da = new Date(a.date || a.createdAt || 0).getTime()
    const db = new Date(b.date || b.createdAt || 0).getTime()
    if (da !== db) return da - db
    return (a.id || 0) - (b.id || 0)
  })

  let running = 0
  const withBalances = arr.map(e => {
    const inNum = parseFloat(e.incoming) || 0
    const outNum = parseFloat(e.outgoing) || 0
    running += inNum - outNum
    // ensure month is populated (use existing or derive from date)
    const dt = new Date(e.date || e.createdAt || Date.now())
    const monthName = e.month || months[dt.getMonth()] || ''
    return { ...e, balance: running, month: monthName }
  })

  // return newest-first (UI expects descending)
  return withBalances.reverse()
}

export default function TheSafe({ personalOnly = false }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [clients, setClients] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [materials, setMaterials] = useState([])
  const [purchaseSubmitting, setPurchaseSubmitting] = useState(false)

  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    month: '',
    project: ''
  })

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    month: months[new Date().getMonth()],
    description: '',
    project: '',
    customer: '',
    entryType: 'general', // 'general', 'supplier-payment', 'client-payment'
    clientId: '',
    supplierId: '',
    incoming: '',
    incomingMethod: 'cash',
    incomingTxn: '',
    outgoing: '',
    outgoingMethod: 'cash',
    outgoingTxn: ''
  })

  // Purchase form state
  const [purchaseForm, setPurchaseForm] = useState({
    supplierId: '',
    materialId: '',
    materialName: '',
    materialUnit: 'kg', // unit for new materials
    isNewMaterial: false, // true if user wants to add a new material
    quantity: '',
    unitPrice: '',
    totalPrice: '',
    paymentMethod: 'cash',
    inventoryType: 'factory', // 'factory' or 'client'
    clientId: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  })

  // Petty expense form state (مصروفات نثرية)
  const [pettyExpenseForm, setPettyExpenseForm] = useState({
    name: '',
    quantity: 1,
    unit: 'pcs',
    price: '',
    totalPrice: '',
    paymentMethod: 'cash',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  })
  const [pettyExpenseSubmitting, setPettyExpenseSubmitting] = useState(false)

  // Safes state (for personal page)
  const [safes, setSafes] = useState([])
  const [selectedSafe, setSelectedSafe] = useState(null)
  const [safesLoading, setSafesLoading] = useState(false)
  const [showTransferDialog, setShowTransferDialog] = useState(false)
  const [transferForm, setTransferForm] = useState({
    fromSafeId: null,
    toSafeId: null,
    amount: '',
    description: '',
    password: ''
  })

  // Fetch entries (supports personalOnly prop)
  useEffect(() => {
    const fetchData = async () => {
      try {
        let entriesData = []
        let displayedSafe = null

        if (personalOnly) {
          // Fetch all safes, create Personal if missing, then load entries for selected safe
          try {
            setSafesLoading(true)
            const sRes = await fetch('/api/safes', { credentials: 'include' })
            const safesData = await sRes.json()
            const safesArr = Array.isArray(safesData) ? safesData : []

            // find personal
            let personal = safesArr.find(s => s.type === 'personal' || s.name === 'Personal Safe')

            if (!personal) {
              // Auto-create Personal Safe
              const createRes = await fetch('/api/safes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Personal Safe', type: 'personal', isDefault: false })
              })
              const created = await createRes.json()
              if (createRes.ok) {
                personal = created
                safesArr.push(created)
              } else {
                setError(created.error || 'فشل في إنشاء الخزنة الشخصية')
              }
            }

            setSafes(safesArr)
            setSelectedSafe(personal)
            displayedSafe = personal

            if (personal) {
              const res = await fetch(`/api/safe?safeId=${personal.id}`, { credentials: 'include' })
              const data = await res.json()

              // Normalize response
              if (Array.isArray(data)) entriesData = data
              else if (data && Array.isArray(data.rows)) entriesData = data.rows
              else if (data && Array.isArray(data.data)) entriesData = data.data
              else if (data && data.error) {
                setError(data.error)
                entriesData = []
              } else entriesData = []
            }
          } catch (safeErr) {
            console.error('Failed to fetch personal safe or entries:', safeErr)
            setError('فشل في جلب بيانات الخزنة الشخصية')
            setEntries([])
            setLoading(false)
            return
          } finally {
            setSafesLoading(false)
          }
        } else {
          const res = await fetch('/api/safe', { credentials: 'include' })
          const contentType = res.headers.get('content-type') || ''
          const data = contentType.includes('application/json') ? await res.json().catch(() => []) : []

          if (Array.isArray(data)) entriesData = data
          else if (data && Array.isArray(data.rows)) entriesData = data.rows
          else if (data && Array.isArray(data.data)) entriesData = data.data
          else if (data && data.error) {
            setError(data.error)
            entriesData = []
          } else entriesData = data ? [data] : []
        }

        // Ensure entries is always an array
        if (!Array.isArray(entriesData)) entriesData = []

        setEntries(computeRunningBalances(entriesData))
        if (displayedSafe) setSuccess(`عرض الخزنة: ${displayedSafe.name}`)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [personalOnly])

  // When selectedSafe changes (user chooses different vault), fetch its entries
  useEffect(() => {
    const loadForSelected = async () => {
      if (!selectedSafe) return
      setLoading(true)
      try {
        const res = await fetch(`/api/safe?safeId=${selectedSafe.id}`)
        const data = await res.json()
        const arr = Array.isArray(data)
          ? data
          : data && Array.isArray(data.rows)
            ? data.rows
            : data && Array.isArray(data.data)
              ? data.data
              : []
        setEntries(computeRunningBalances(arr))
        setSuccess(`عرض الخزنة: ${selectedSafe.name}`)
      } catch (err) {
        setError('فشل في تحميل قيود الخزنة')
      } finally {
        setLoading(false)
      }
    }

    loadForSelected()
  }, [selectedSafe])

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients', { credentials: 'include' })
      const data = await res.json()

      if (data.success) {
        setClients(data.data || [])
      } else if (Array.isArray(data)) {
        setClients(data)
      }
    } catch (err) {
      console.error('Error fetching clients:', err)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/suppliers', { credentials: 'include' })
      const data = await res.json()

      if (data.success) {
        setSuppliers(data.data || [])
      } else if (Array.isArray(data)) {
        setSuppliers(data)
      }
    } catch (err) {
      console.error('Error fetching suppliers:', err)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  useEffect(() => {
    fetchSuppliers()
  }, [])

  // Fetch materials
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const res = await fetch('/api/inventory', { credentials: 'include' })
        const data = await res.json()

        if (data.success) {
          setMaterials(data.data || [])
        } else if (Array.isArray(data)) {
          setMaterials(data)
        }
      } catch (err) {
        console.error('Error fetching materials:', err)
      }
    }

    fetchMaterials()
  }, [])

  const handleChange = e => {
    const { name, value } = e.target

    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handlePurchaseChange = e => {
    const { name, value } = e.target

    setPurchaseForm(prev => {
      const updated = { ...prev, [name]: value }

      // Auto-calculate total price
      if (name === 'quantity' || name === 'unitPrice') {
        const qty = name === 'quantity' ? parseFloat(value) || 0 : parseFloat(prev.quantity) || 0
        const price = name === 'unitPrice' ? parseFloat(value) || 0 : parseFloat(prev.unitPrice) || 0

        updated.totalPrice = (qty * price).toFixed(2)
      }

      return updated
    })
  }

  // Petty expense handlers
  const handlePettyExpenseChange = e => {
    const { name, value } = e.target

    setPettyExpenseForm(prev => {
      const updated = { ...prev, [name]: value }

      // Auto-calculate total price
      if (name === 'quantity' || name === 'price') {
        const qty = name === 'quantity' ? parseFloat(value) || 0 : parseFloat(prev.quantity) || 0
        const price = name === 'price' ? parseFloat(value) || 0 : parseFloat(prev.price) || 0

        updated.totalPrice = (qty * price).toFixed(2)
      }

      return updated
    })
  }

  const handlePettyExpenseSubmit = async e => {
    e.preventDefault()
    setPettyExpenseSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const totalAmount = parseFloat(pettyExpenseForm.totalPrice) || 0
      const quantity = parseFloat(pettyExpenseForm.quantity) || 0
      const price = parseFloat(pettyExpenseForm.price) || 0

      if (!pettyExpenseForm.name.trim()) {
        throw new Error('يرجى إدخال اسم المصروف')
      }

      if (totalAmount <= 0) {
        throw new Error('يرجى إدخال الكمية والسعر')
      }

      // Create safe entry for the petty expense (outgoing)
      const unitLabel =
        pettyExpenseForm.unit === 'kg'
          ? 'كجم'
          : pettyExpenseForm.unit === 'ton'
            ? 'طن'
            : pettyExpenseForm.unit === 'meter'
              ? 'متر'
              : pettyExpenseForm.unit === 'cm'
                ? 'سم'
                : pettyExpenseForm.unit === 'mm'
                  ? 'مم'
                  : pettyExpenseForm.unit === 'pcs'
                    ? 'قطعة'
                    : pettyExpenseForm.unit === 'liter'
                      ? 'لتر'
                      : pettyExpenseForm.unit === 'box'
                        ? 'صندوق'
                        : pettyExpenseForm.unit === 'roll'
                          ? 'رول'
                          : pettyExpenseForm.unit === 'sheet'
                            ? 'لوح'
                            : pettyExpenseForm.unit || 'قطعة'

      const safeBody = {
        month: months[new Date(pettyExpenseForm.date).getMonth()],
        date: pettyExpenseForm.date,
        description: `مصروفات نثرية: ${pettyExpenseForm.name} (${quantity} ${unitLabel} × ${price} ج.م)${pettyExpenseForm.notes ? ' - ' + pettyExpenseForm.notes : ''}`,
        project: 'مصروفات نثرية',
        customer: null,
        incoming: null,
        incomingMethod: null,
        incomingTxn: null,
        outgoing: totalAmount,
        outgoingMethod: pettyExpenseForm.paymentMethod,
        outgoingTxn: null,
        balance: -totalAmount
      }

      const safeRes = await fetch('/api/safe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(safeBody)
      })

      if (!safeRes.ok) {
        throw new Error('فشل في إضافة قيد الخزينة')
      }

      const safeData = await safeRes.json()

      setEntries(prev => [...prev, safeData.data || safeData])
      setSuccess('تم تسجيل المصروفات النثرية بنجاح')

      // Reset form
      setPettyExpenseForm({
        name: '',
        quantity: 1,
        unit: 'pcs',
        price: '',
        totalPrice: '',
        paymentMethod: 'cash',
        notes: '',
        date: new Date().toISOString().split('T')[0]
      })

      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setPettyExpenseSubmitting(false)
    }
  }

  const handlePurchaseSubmit = async e => {
    e.preventDefault()
    setPurchaseSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const totalAmount = parseFloat(purchaseForm.totalPrice) || 0
      const quantity = parseFloat(purchaseForm.quantity) || 0
      const unitPrice = parseFloat(purchaseForm.unitPrice) || 0
      const supplier = suppliers.find(s => s.id == purchaseForm.supplierId)
      const material = materials.find(m => m.id == purchaseForm.materialId)
      const isCredit = purchaseForm.paymentMethod === 'credit'

      // 1. Handle material first (create or use existing)
      let materialId = purchaseForm.materialId

      if (purchaseForm.isNewMaterial && purchaseForm.materialName) {
        // Create new material
        const materialRes = await fetch('/api/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            type: 'material',
            name: purchaseForm.materialName,
            materialName: purchaseForm.materialName,
            unit: purchaseForm.materialUnit || 'kg',
            materialType: purchaseForm.inventoryType === 'client' ? 'client' : 'factory',
            initialQuantity: quantity,
            supplierId: purchaseForm.supplierId
          })
        })

        if (materialRes.ok) {
          const newMaterial = await materialRes.json()
          materialId = newMaterial.id
        }
      } else if (materialId) {
        // Add transaction to existing material
        const txRes = await fetch('/api/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            type: 'transaction',
            materialId: materialId,
            amount: quantity,
            action: 'add',
            source: 'supplier',
            reference: supplier?.name || purchaseForm.supplierId || '',
            user: 'system',
            note: `شراء من مورد: ${supplier?.name || '-'} - سعر الوحدة: ${unitPrice} ج.م${purchaseForm.notes ? ' - ' + purchaseForm.notes : ''}`
          })
        })

        if (!txRes.ok) {
          console.error('Warning: Failed to add inventory transaction')
        }
      }

      // 2. Create PurchaseOrder record (for supplier accounting)
      if (purchaseForm.supplierId && materialId) {
        const purchaseOrderBody = {
          supplierId: parseInt(purchaseForm.supplierId),
          materialId: parseInt(materialId),
          price: unitPrice,
          quantity: quantity,
          recipient: purchaseForm.recipient || 'المستودع', // إضافة recipient
          paymentMethod: purchaseForm.paymentMethod,
          transactionNumber: purchaseForm.transactionNumber || null, // إضافة transactionNumber
          notes: purchaseForm.notes,
          paymentStatus: isCredit ? 'credit' : 'paid',
          paidAmount: isCredit ? 0 : totalAmount,
          weight: purchaseForm.weight || null // إضافة weight
        }

        const poRes = await fetch('/api/purchase-orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(purchaseOrderBody)
        })

        if (!poRes.ok) {
          const errorData = await poRes.json().catch(() => ({}))
          console.error('Warning: Failed to create purchase order:', errorData)
          // عرض رسالة خطأ للمستخدم
          alert(`فشل إنشاء أمر الشراء: ${errorData.message || 'خطأ غير معروف'}`)
        } else {
          const poData = await poRes.json()
          console.log('Purchase order created successfully:', poData)
        }
      }

      // 3. Create safe entry (only for non-credit purchases)
      // Skip safe entry creation for credit purchases (آجل) as they should not appear in safe until payment
      if (!isCredit) {
        const safeBody = {
          month: months[new Date().getMonth()],
          date: purchaseForm.date,
          description: `شراء ${material?.name || purchaseForm.materialName} من ${supplier?.name || 'مورد'}`,
          project: null,
          customer: supplier?.name || null,
          supplierId: purchaseForm.supplierId || null,
          incoming: null,
          incomingMethod: null,
          incomingTxn: null,
          outgoing: totalAmount,
          outgoingMethod: purchaseForm.paymentMethod,
          outgoingTxn: purchaseForm.transactionNumber || null,
          balance: -totalAmount,
          entryType: 'purchase',
          safeId: null
        }

        const safeRes = await fetch('/api/safe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(safeBody)
        })

        if (safeRes.ok) {
          const safeData = await safeRes.json()
          setEntries(prev => [...prev, safeData.data || safeData])
        } else {
          console.error('Warning: Failed to create safe entry')
        }
      }

      // 4. If client inventory, also track in client-inventory API
      if (purchaseForm.inventoryType === 'client' && purchaseForm.clientId) {
        try {
          await fetch('/api/client-inventory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              clientId: purchaseForm.clientId,
              materialId: materialId,
              materialName: material?.name || purchaseForm.materialName,
              quantity: quantity,
              type: 'IN',
              notes: `شراء من مورد: ${supplier?.name || '-'}`
            })
          })
        } catch (err) {
          console.error('Warning: Failed to add client inventory entry')
        }
      }

      setSuccess('تم تسجيل عملية الشراء بنجاح')
      fetchSuppliers()

      // Reset form
      setPurchaseForm({
        supplierId: '',
        materialId: '',
        materialName: '',
        materialUnit: 'kg',
        isNewMaterial: false,
        quantity: '',
        unitPrice: '',
        totalPrice: '',
        paymentMethod: 'cash',
        inventoryType: 'factory',
        clientId: '',
        notes: '',
        date: new Date().toISOString().split('T')[0]
      })

      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setPurchaseSubmitting(false)
    }
  }

  const handleFilterChange = e => {
    const { name, value } = e.target

    setFilters(prev => ({ ...prev, [name]: value }))
  }

  const clearFilters = () => {
    setFilters({ dateFrom: '', dateTo: '', month: '', project: '' })
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const incomingNum = form.incoming ? parseFloat(String(form.incoming).replace(/,/g, '')) : null
      const outgoingNum = form.outgoing ? parseFloat(String(form.outgoing).replace(/,/g, '')) : null

      // Check if both incoming and outgoing are 0 or null/empty
      const incomingValue = typeof incomingNum === 'number' && !isNaN(incomingNum) ? incomingNum : 0
      const outgoingValue = typeof outgoingNum === 'number' && !isNaN(outgoingNum) ? outgoingNum : 0

      if (incomingValue === 0 && outgoingValue === 0) {
        setError('لا يمكن إضافة قيد بدون مبلغ وارد أو صادر')
        setSubmitting(false)
        return
      }

      const balance = incomingValue - outgoingValue

      // Build description based on entry type
      let description = form.description
      if (form.entryType === 'client-payment') {
        const client = clients.find(c => c.id === parseInt(form.clientId))
        description = description || `دفعة من العميل: ${client?.name || 'عميل'}`
      } else if (form.entryType === 'supplier-payment') {
        const supplier = suppliers.find(s => s.id === parseInt(form.supplierId))
        description = description || `دفعة للمورد: ${supplier?.name || 'مورد'}`
      } else if (form.entryType === 'client-credit') {
        const client = clients.find(c => c.id === parseInt(form.clientId))
        description = description || `آجل عميل: ${client?.name || 'عميل'}`
      }

      const isClientCredit = form.entryType === 'client-credit'

      if (isClientCredit) {
        if (!form.clientId) {
          setError('العميل مطلوب لإنشاء آجل للعميل')
          setSubmitting(false)
          return
        }

        const invoiceBody = {
          number: `INV-${Date.now()}`,
          clientId: parseInt(form.clientId),
          date: form.date || new Date().toISOString().split('T')[0],
          dueDate: null,
          items: [],
          total: incomingNum,
          status: 'credit',
          paidAmount: 0,
          notes: description || null
        }

        const invRes = await fetch('/api/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(invoiceBody)
        })

        const invData = await invRes.json()

        if (invRes.ok) {
          setSuccess('تم تسجيل آجل العميل بنجاح')
          fetchClients()

          setForm({
            date: new Date().toISOString().split('T')[0],
            month: months[new Date().getMonth()],
            description: '',
            project: '',
            customer: '',
            entryType: 'general',
            clientId: '',
            supplierId: '',
            incoming: '',
            incomingMethod: 'cash',
            incomingTxn: '',
            outgoing: '',
            outgoingMethod: 'cash',
            outgoingTxn: ''
          })
          setTimeout(() => setSuccess(null), 3000)
        } else {
          setError(invData.error || invData.message || 'حدث خطأ في إنشاء فاتورة الآجل')
        }

        setSubmitting(false)
        return
      }

      const body = {
        month: form.month || null,
        date: form.date || null,
        description: description || null,
        project: form.project || null,
        customer: form.customer || null,
        clientId: form.entryType === 'client-payment' ? parseInt(form.clientId) : null,
        supplierId: form.entryType === 'supplier-payment' ? parseInt(form.supplierId) : null,
        incoming: incomingNum,
        incomingMethod: form.incomingMethod || null,
        incomingTxn: form.incomingTxn || null,
        outgoing: outgoingNum,
        outgoingMethod: form.outgoingMethod || null,
        outgoingTxn: form.outgoingTxn || null,
        entryType:
          form.entryType === 'client-payment'
            ? 'client-payment'
            : form.entryType === 'supplier-payment'
              ? 'supplier-payment'
              : 'general',
        balance
      }

      const res = await fetch('/api/safe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      })

      const data = await res.json()

      if (res.ok) {
        const successMessage =
          form.entryType === 'client-payment'
            ? 'تم تسجيل دفعة العميل بنجاح'
            : form.entryType === 'supplier-payment'
              ? 'تم تسجيل دفعة المورد بنجاح'
              : 'تم إضافة القيد بنجاح'

        setSuccess(successMessage)

        const newEntry = data.data || data

        setEntries(prev => [...prev, newEntry])

        if (form.entryType === 'client-payment') fetchClients()
        if (form.entryType === 'supplier-payment' || form.entryType === 'general') fetchSuppliers()
        if (form.entryType === 'client-payment' || form.entryType === 'general') fetchClients()

        setForm({
          date: new Date().toISOString().split('T')[0],
          month: months[new Date().getMonth()],
          description: '',
          project: '',
          customer: '',
          entryType: 'general',
          clientId: '',
          supplierId: '',
          incoming: '',
          incomingMethod: 'cash',
          incomingTxn: '',
          outgoing: '',
          outgoingMethod: 'cash',
          outgoingTxn: ''
        })
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(data.error || 'حدث خطأ أثناء الإضافة')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const downloadCSV = () => {
    const headers = [
      'التاريخ',
      'العميل',
      'الشهر',
      'الوصف',
      'الوارد',
      'طريقة الوارد',
      'رقم عملية الوارد',
      'الصادر',
      'طريقة الصادر',
      'رقم عملية الصادر',
      'الرصيد'
    ]

    const escape = v => {
      if (v === null || v === undefined) return ''
      const s = String(v)

      if (s.includes(',') || s.includes('\n') || s.includes('"')) {
        return '"' + s.replace(/"/g, '""') + '"'
      }

      return s
    }

    const rows = filteredEntries.map(e => [
      e.date ? new Date(e.date).toLocaleDateString('ar-EG') : '',
      e.customer || '',
      e.month || '',
      e.description || '',
      e.incoming || '',
      paymentMethods[e.incomingMethod] || e.incomingMethod || '',
      e.incomingTxn || '',
      e.outgoing || '',
      paymentMethods[e.outgoingMethod] || e.outgoingMethod || '',
      e.outgoingTxn || '',
      e.balance || ''
    ])

    const csvContent =
      '\uFEFF' + [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `safe-entries-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Filter entries
  const filteredEntries = entries.filter(entry => {
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom)
      const eDate = entry.date ? new Date(entry.date) : null

      if (!eDate || eDate < from) return false
    }

    if (filters.dateTo) {
      const to = new Date(filters.dateTo)
      const eDate = entry.date ? new Date(entry.date) : null

      if (!eDate || eDate > to) return false
    }

    if (filters.month && filters.month !== entry.month) return false

    if (filters.project) {
      const p = (entry.project || '').toLowerCase()

      if (!p.includes(String(filters.project).toLowerCase())) return false
    }

    return true
  })

  // Get unique projects for filter dropdown
  const uniqueProjects = [...new Set(entries.map(e => e.project).filter(Boolean))]

  if (loading) {
    return (
      <div className='p-6'>
        <Typography variant='h4' className='mb-6 font-bold'>
          الخزينة
        </Typography>
        <Grid container spacing={4} className='mb-6'>
          {[1, 2, 3, 4].map(i => (
            <Grid key={i} size={{ xs: 12, sm: 6, lg: 3 }}>
              <Card>
                <CardContent>
                  <Skeleton variant='circular' width={50} height={50} className='mb-3' />
                  <Skeleton variant='text' width='60%' height={24} />
                  <Skeleton variant='text' width='40%' height={32} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        <Card>
          <CardContent>
            <Skeleton variant='rectangular' height={200} />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='p-6'>
      {/* Page Header */}
      <div className='flex flex-wrap items-center justify-between gap-4 mb-6'>
        <div>
          <Typography variant='h4' className='font-bold'>
            الخزينة
          </Typography>
          <Typography color='text.secondary'>إدارة القيود المالية والحسابات</Typography>
        </div>
        <div className='flex gap-2 flex-wrap'>
          <Button
            variant='outlined'
            color='secondary'
            startIcon={<i className='tabler-file-spreadsheet' />}
            onClick={downloadCSV}
          >
            تحميل CSV
          </Button>
          <Button
            component={Link}
            href='/the-safe/deposits'
            variant='outlined'
            color='success'
            startIcon={<i className='tabler-plus' />}
          >
            إضافة رصيد إضافي
          </Button>
          <Button
            component={Link}
            href='/invoices'
            variant='outlined'
            color='primary'
            startIcon={<i className='tabler-file-invoice' />}
          >
            الفواتير
          </Button>
          <Button
            component={Link}
            href='/price-list'
            variant='contained'
            color='primary'
            startIcon={<i className='tabler-list-check' />}
          >
            مراجعة الأسعار
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {/* Personal vault selector + configuration */}
      {personalOnly && (
        <div className='mb-4 flex items-center gap-4'>
          <FormControl size='small' sx={{ minWidth: 220 }}>
            <InputLabel>اختيار الخزنة</InputLabel>
            <Select
              label='اختيار الخزنة'
              IconComponent={KeyboardArrowDownIcon}
              value={selectedSafe ? selectedSafe.id : ''}
              onChange={e => {
                const sid = e.target.value
                const s = safes.find(x => x.id === sid)
                setSelectedSafe(s)
              }}
              sx={{ '& .MuiSelect-icon': { fontSize: 20 } }}
            >
              {safes
                .filter(s => s.type !== 'personal' && s.name !== 'Personal Safe')
                .map(s => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          <div className='flex gap-2'>
            <Button
              variant='outlined'
              size='small'
              onClick={async () => {
                try {
                  // Refresh safes list
                  const res = await fetch('/api/safes')
                  const safesData = await res.json()
                  setSafes(Array.isArray(safesData) ? safesData : [])
                  setSuccess('قائمة الخزن تم تحديثها')
                } catch (err) {
                  setError('فشل في تحديث قائمة الخزن')
                }
              }}
            >
              تحديث
            </Button>
          </div>
        </div>
      )}

      {/* Clients Receivables Card */}
      <ClientsReceivables clients={clients} />

      {/* Suppliers Payables Card */}
      <SuppliersPayables suppliers={suppliers} />

      <SafeStats entries={filteredEntries} />

      {/* Transfer dialog (simple) */}
      {showTransferDialog && (
        <div className='fixed inset-0 z-50 flex items-center justify-center'>
          <div className='bg-black/60 absolute inset-0' onClick={() => setShowTransferDialog(false)} />
          <Card className='z-50 p-6 w-[640px]'>
            <Typography variant='h6' className='mb-4'>
              تحويل بين الخزن
            </Typography>

            <FormControl fullWidth size='small' className='mb-3'>
              <InputLabel>من</InputLabel>
              <Select
                label='من'
                value={transferForm.fromSafeId || (selectedSafe && selectedSafe.id) || ''}
                onChange={e => setTransferForm(prev => ({ ...prev, fromSafeId: e.target.value }))}
              >
                {safes.map(s => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name} {s.ownerId ? '(محفظة شخصية)' : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size='small' className='mb-3'>
              <InputLabel>إلى</InputLabel>
              <Select
                label='إلى'
                value={transferForm.toSafeId || ''}
                onChange={e => setTransferForm(prev => ({ ...prev, toSafeId: e.target.value }))}
              >
                {safes.map(s => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name} {s.ownerId ? '(محفظة شخصية)' : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              size='small'
              label='المبلغ'
              className='mb-3'
              value={transferForm.amount}
              onChange={e => setTransferForm(prev => ({ ...prev, amount: e.target.value }))}
            />
            <TextField
              fullWidth
              size='small'
              label='الوصف'
              className='mb-3'
              value={transferForm.description}
              onChange={e => setTransferForm(prev => ({ ...prev, description: e.target.value }))}
            />
            <TextField
              fullWidth
              size='small'
              type='password'
              label='كلمة المرور لتأكيد'
              className='mb-3'
              value={transferForm.password}
              onChange={e => setTransferForm(prev => ({ ...prev, password: e.target.value }))}
            />

            <div className='flex gap-2 justify-end'>
              <Button variant='outlined' onClick={() => setShowTransferDialog(false)}>
                إلغاء
              </Button>
              <Button
                variant='contained'
                color='primary'
                onClick={async () => {
                  try {
                    if (!transferForm.fromSafeId || !transferForm.toSafeId || !parseFloat(transferForm.amount))
                      throw new Error('بيانات التحويل غير كاملة')

                    const res = await fetch('/api/safes/transfer', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ ...transferForm })
                    })

                    const data = await res.json()
                    if (!res.ok) throw new Error(data.error || 'فشل التحويل')
                    setSuccess('تم التحويل بنجاح')
                    setShowTransferDialog(false)
                    // refresh selected safe entries
                    const entriesRes = await fetch(`/api/safe?safeId=${selectedSafe.id}`)
                    const entriesJson = await entriesRes.json()
                    setEntries(Array.isArray(entriesJson) ? entriesJson : entriesJson.rows || [])
                  } catch (err) {
                    setError(err.message)
                  }
                }}
              >
                نفّذ التحويل
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Alerts */}
      {error && (
        <Alert severity='error' className='mb-4' onClose={() => setError(null)}>
          <div className='flex items-center justify-between'>
            <div>{error}</div>
            {personalOnly && (
              <Button
                variant='contained'
                color='primary'
                size='small'
                onClick={async () => {
                  setSubmitting(true)
                  try {
                    const res = await fetch('/api/safes', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name: 'Personal Safe', type: 'personal', isDefault: false })
                    })
                    const data = await res.json()
                    if (!res.ok) throw new Error(data.error || 'فشل إنشاء الخزنة')

                    // fetch entries for new safe
                    const entriesRes = await fetch(`/api/safe?safeId=${data.id}`)
                    const entriesJson = await entriesRes.json()
                    setEntries(entriesJson)
                    setSuccess('تم إنشاء الخزنة الشخصية بنجاح')
                    setError(null)
                  } catch (err) {
                    setError(err.message)
                  } finally {
                    setSubmitting(false)
                  }
                }}
              >
                أنشئ خزنة شخصية
              </Button>
            )}
          </div>
        </Alert>
      )}
      {success && (
        <Alert severity='success' className='mb-4' onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Filters Card */}
      <Card className='mb-6'>
        <CardHeader
          title={
            <div className='flex items-center gap-2'>
              <i className='tabler-filter text-xl' />
              <span>فلترة القيود</span>
            </div>
          }
          action={
            <Button variant='text' color='secondary' size='small' onClick={clearFilters}>
              مسح الفلاتر
            </Button>
          }
        />
        <CardContent>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                type='date'
                label='من تاريخ'
                name='dateFrom'
                value={filters.dateFrom}
                onChange={handleFilterChange}
                InputLabelProps={{ shrink: true }}
                size='small'
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                type='date'
                label='إلى تاريخ'
                name='dateTo'
                value={filters.dateTo}
                onChange={handleFilterChange}
                InputLabelProps={{ shrink: true }}
                size='small'
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size='small'>
                <InputLabel>الشهر</InputLabel>
                <Select name='month' value={filters.month} onChange={handleFilterChange} label='الشهر'>
                  <MenuItem value=''>الكل</MenuItem>
                  {months.map(m => (
                    <MenuItem key={m} value={m}>
                      {m}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size='small'>
                <InputLabel>المشروع</InputLabel>
                <Select name='project' value={filters.project} onChange={handleFilterChange} label='المشروع'>
                  <MenuItem value=''>الكل</MenuItem>
                  {uniqueProjects.map(p => (
                    <MenuItem key={p} value={p}>
                      {p}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Purchase from Supplier Card */}
      <Card className='mb-6'>
        <CardHeader
          title={
            <div className='flex items-center gap-2'>
              <CustomAvatar skin='light' color='warning' size={36}>
                <i className='tabler-shopping-cart text-lg' />
              </CustomAvatar>
              <span>شراء من مورد</span>
            </div>
          }
          sx={{
            backgroundColor: 'var(--mui-palette-background-paper)',
            '& .MuiCardHeader-title': {
              color: 'var(--mui-palette-text-primary)'
            }
          }}
        />
        <CardContent>
          <form onSubmit={handlePurchaseSubmit}>
            <Grid container spacing={4}>
              {/* Supplier Selection */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>المورد</InputLabel>
                  <Select
                    name='supplierId'
                    value={purchaseForm.supplierId}
                    onChange={handlePurchaseChange}
                    label='المورد'
                    required
                  >
                    <MenuItem value=''>اختر المورد</MenuItem>
                    {suppliers.map(s => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Material Selection */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>المادة / الصنف</InputLabel>
                  <Select
                    name='materialId'
                    value={purchaseForm.isNewMaterial ? 'new' : purchaseForm.materialId}
                    onChange={e => {
                      const value = e.target.value
                      if (value === 'new') {
                        setPurchaseForm(prev => ({ ...prev, materialId: '', materialName: '', isNewMaterial: true }))
                      } else {
                        const selectedMaterial = materials.find(m => m.id == value)
                        setPurchaseForm(prev => ({
                          ...prev,
                          materialId: value,
                          materialName: selectedMaterial?.name || '',
                          isNewMaterial: false
                        }))
                      }
                    }}
                    label='المادة / الصنف'
                    required
                  >
                    <MenuItem value=''>اختر المادة</MenuItem>
                    <MenuItem value='new' sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                      <i className='tabler-plus' style={{ marginLeft: '8px' }} />➕ صنف جديد
                    </MenuItem>
                    <MenuItem disabled divider sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                      ── الأصناف الموجودة ──
                    </MenuItem>
                    {materials
                      .filter(m => {
                        const type = m.type || m.materialType || 'factory'
                        if (purchaseForm.inventoryType === 'factory') {
                          // Show factory materials or materials without type (default to factory)
                          return type === 'factory' || (!m.type && !m.materialType)
                        } else {
                          return type === 'client'
                        }
                      })
                      .map(m => (
                        <MenuItem key={m.id} value={m.id}>
                          {m.name || m.materialName} {m.sku ? `(${m.sku})` : ''}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* New Material Name (if new material selected) */}
              {purchaseForm.isNewMaterial && (
                <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                  <TextField
                    fullWidth
                    label='اسم الصنف الجديد'
                    name='materialName'
                    value={purchaseForm.materialName}
                    onChange={handlePurchaseChange}
                    placeholder='أدخل اسم الصنف الجديد'
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position='start'>
                          <i className='tabler-tag' />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
              )}

              {/* Unit Selection (only for new material) */}
              {purchaseForm.isNewMaterial && (
                <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>الوحدة</InputLabel>
                    <Select
                      name='materialUnit'
                      value={purchaseForm.materialUnit}
                      onChange={handlePurchaseChange}
                      label='الوحدة'
                      required
                    >
                      <MenuItem value='kg'>كجم</MenuItem>
                      <MenuItem value='ton'>طن</MenuItem>
                      <MenuItem value='meter'>متر</MenuItem>
                      <MenuItem value='cm'>سم</MenuItem>
                      <MenuItem value='mm'>مم</MenuItem>
                      <MenuItem value='pcs'>قطعة</MenuItem>
                      <MenuItem value='liter'>لتر</MenuItem>
                      <MenuItem value='box'>صندوق</MenuItem>
                      <MenuItem value='roll'>رول</MenuItem>
                      <MenuItem value='sheet'>لوح</MenuItem>
                      <MenuItem value='other'>أخرى</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {/* Date */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  fullWidth
                  type='date'
                  label='التاريخ'
                  name='date'
                  value={purchaseForm.date}
                  onChange={handlePurchaseChange}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>

              {/* Payment Method */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>طريقة الدفع</InputLabel>
                  <Select
                    name='paymentMethod'
                    value={purchaseForm.paymentMethod}
                    onChange={handlePurchaseChange}
                    label='طريقة الدفع'
                  >
                    <MenuItem value='cash'>نقدي</MenuItem>
                    <MenuItem value='shek'>شيك</MenuItem>
                    <MenuItem value='online'>تحويل بنكي</MenuItem>
                    <MenuItem value='credit'>آجل</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Quantity */}
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  fullWidth
                  type='number'
                  label='الكمية'
                  name='quantity'
                  value={purchaseForm.quantity}
                  onChange={handlePurchaseChange}
                  InputProps={{
                    inputProps: { min: 0, step: 0.01 }
                  }}
                  required
                />
              </Grid>

              {/* Unit Price */}
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  fullWidth
                  type='number'
                  label='سعر الوحدة'
                  name='unitPrice'
                  value={purchaseForm.unitPrice}
                  onChange={handlePurchaseChange}
                  InputProps={{
                    inputProps: { min: 0, step: 0.01 },
                    endAdornment: <InputAdornment position='end'>ج.م</InputAdornment>
                  }}
                  required
                />
              </Grid>

              {/* Total Price */}
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  fullWidth
                  label='الإجمالي'
                  name='totalPrice'
                  value={purchaseForm.totalPrice}
                  InputProps={{
                    readOnly: true,
                    endAdornment: <InputAdornment position='end'>ج.م</InputAdornment>
                  }}
                  sx={{ bgcolor: 'action.hover' }}
                />
              </Grid>

              {/* Inventory Location */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>مكان التخزين</InputLabel>
                  <Select
                    name='inventoryType'
                    value={purchaseForm.inventoryType}
                    onChange={handlePurchaseChange}
                    label='مكان التخزين'
                    required
                  >
                    <MenuItem value='factory'>مخزن المصنع</MenuItem>
                    <MenuItem value='client'>مخزن العميل</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Client Selection (if client inventory) */}
              {purchaseForm.inventoryType === 'client' && (
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <FormControl fullWidth>
                    <InputLabel>العميل</InputLabel>
                    <Select
                      name='clientId'
                      value={purchaseForm.clientId}
                      onChange={handlePurchaseChange}
                      label='العميل'
                      required={purchaseForm.inventoryType === 'client'}
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
              )}

              {/* Notes */}
              <Grid size={{ xs: 12, md: purchaseForm.inventoryType === 'client' ? 6 : 9 }}>
                <TextField
                  fullWidth
                  label='ملاحظات'
                  name='notes'
                  value={purchaseForm.notes}
                  onChange={handlePurchaseChange}
                  placeholder='ملاحظات إضافية'
                />
              </Grid>
            </Grid>

            <Box className='flex justify-end mt-6'>
              <Button
                type='submit'
                variant='contained'
                color='warning'
                size='large'
                disabled={purchaseSubmitting}
                startIcon={
                  purchaseSubmitting ? (
                    <CircularProgress size={20} color='inherit' />
                  ) : (
                    <i className='tabler-shopping-cart' />
                  )
                }
              >
                {purchaseSubmitting ? 'جاري التسجيل...' : 'تسجيل عملية الشراء'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>

      {/* Petty Expenses Card - مصروفات نثرية */}
      <Card className='mb-6'>
        <CardHeader
          title={
            <div className='flex items-center gap-2'>
              <CustomAvatar skin='light' color='error' size={36}>
                <i className='tabler-receipt text-lg' />
              </CustomAvatar>
              <span>مصروفات نثرية</span>
            </div>
          }
          subheader='مصروفات صغيرة لا تحتاج مورد'
          sx={{
            backgroundColor: 'var(--mui-palette-background-paper)',
            '& .MuiCardHeader-title': {
              color: 'var(--mui-palette-text-primary)'
            }
          }}
        />
        <CardContent>
          <form onSubmit={handlePettyExpenseSubmit}>
            <Grid container spacing={4}>
              {/* Expense Name */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  label='اسم المصروف'
                  name='name'
                  value={pettyExpenseForm.name}
                  onChange={handlePettyExpenseChange}
                  placeholder='مثال: وجبات، مواصلات، أدوات...'
                  required
                />
              </Grid>

              {/* Date */}
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  fullWidth
                  type='date'
                  label='التاريخ'
                  name='date'
                  value={pettyExpenseForm.date}
                  onChange={handlePettyExpenseChange}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>

              {/* Quantity */}
              <Grid size={{ xs: 12, sm: 6, md: 1 }}>
                <TextField
                  fullWidth
                  type='number'
                  label='الكمية'
                  name='quantity'
                  value={pettyExpenseForm.quantity}
                  onChange={handlePettyExpenseChange}
                  InputProps={{
                    inputProps: { min: 1, step: 1 }
                  }}
                  required
                />
              </Grid>

              {/* Unit */}
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>الوحدة</InputLabel>
                  <Select name='unit' value={pettyExpenseForm.unit} onChange={handlePettyExpenseChange} label='الوحدة'>
                    <MenuItem value='pcs'>قطعة</MenuItem>
                    <MenuItem value='kg'>كجم</MenuItem>
                    <MenuItem value='ton'>طن</MenuItem>
                    <MenuItem value='meter'>متر</MenuItem>
                    <MenuItem value='cm'>سم</MenuItem>
                    <MenuItem value='mm'>مم</MenuItem>
                    <MenuItem value='liter'>لتر</MenuItem>
                    <MenuItem value='box'>صندوق</MenuItem>
                    <MenuItem value='roll'>رول</MenuItem>
                    <MenuItem value='sheet'>لوح</MenuItem>
                    <MenuItem value='other'>أخرى</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Price */}
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  fullWidth
                  type='number'
                  label='السعر'
                  name='price'
                  value={pettyExpenseForm.price}
                  onChange={handlePettyExpenseChange}
                  InputProps={{
                    inputProps: { min: 0, step: 0.01 },
                    endAdornment: <InputAdornment position='end'>ج.م</InputAdornment>
                  }}
                  required
                />
              </Grid>

              {/* Total Price */}
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  fullWidth
                  label='الإجمالي'
                  name='totalPrice'
                  value={pettyExpenseForm.totalPrice}
                  InputProps={{
                    readOnly: true,
                    endAdornment: <InputAdornment position='end'>ج.م</InputAdornment>
                  }}
                  sx={{ bgcolor: 'action.hover' }}
                />
              </Grid>

              {/* Payment Method */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>طريقة الدفع</InputLabel>
                  <Select
                    name='paymentMethod'
                    value={pettyExpenseForm.paymentMethod}
                    onChange={handlePettyExpenseChange}
                    label='طريقة الدفع'
                  >
                    <MenuItem value='cash'>نقدي</MenuItem>
                    <MenuItem value='shek'>شيك</MenuItem>
                    <MenuItem value='online'>تحويل بنكي</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Notes */}
              <Grid size={{ xs: 12, md: 9 }}>
                <TextField
                  fullWidth
                  label='ملاحظات'
                  name='notes'
                  value={pettyExpenseForm.notes}
                  onChange={handlePettyExpenseChange}
                  placeholder='ملاحظات إضافية (اختياري)'
                />
              </Grid>
            </Grid>

            <Box className='flex justify-end mt-6'>
              <Button
                type='submit'
                variant='contained'
                color='error'
                size='large'
                disabled={pettyExpenseSubmitting}
                startIcon={
                  pettyExpenseSubmitting ? (
                    <CircularProgress size={20} color='inherit' />
                  ) : (
                    <i className='tabler-receipt' />
                  )
                }
              >
                {pettyExpenseSubmitting ? 'جاري التسجيل...' : 'تسجيل المصروف'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>

      {/* Add Entry Form Card */}
      <Card className='mb-6'>
        <CardHeader
          title={
            <div className='flex items-center gap-2'>
              <i className='tabler-plus text-xl' />
              <span>إضافة قيد جديد</span>
            </div>
          }
        />
        <CardContent>
          <form onSubmit={handleSubmit}>
            {/* Entry Type Selection */}
            <Box className='mb-6'>
              <FormControl component='fieldset'>
                <FormLabel component='legend' sx={{ mb: 2, fontWeight: 'bold' }}>
                  نوع القيد
                </FormLabel>
                <RadioGroup row name='entryType' value={form.entryType} onChange={handleChange} sx={{ gap: 2 }}>
                  <FormControlLabel
                    value='general'
                    control={<Radio color='primary' />}
                    label='قيد عام'
                    sx={{ marginLeft: 0, marginRight: 0 }}
                  />
                  <FormControlLabel
                    value='client-payment'
                    control={<Radio color='success' />}
                    label='💵 دفعة من عميل'
                    sx={{ marginLeft: 0, marginRight: 0 }}
                  />
                  <FormControlLabel
                    value='client-credit'
                    control={<Radio color='warning' />}
                    label='📝 آجال عميل'
                    sx={{ marginLeft: 0, marginRight: 0 }}
                  />
                  <FormControlLabel
                    value='supplier-payment'
                    control={<Radio color='error' />}
                    label='💰 دفعة لمورد'
                    sx={{ marginLeft: 0, marginRight: 0 }}
                  />
                </RadioGroup>
              </FormControl>
            </Box>

            {/* Basic Info */}
            <Grid container spacing={4} className='mb-6'>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  fullWidth
                  type='date'
                  label='التاريخ'
                  name='date'
                  value={form.date}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>الشهر</InputLabel>
                  <Select name='month' value={form.month} onChange={handleChange} label='الشهر' required>
                    {months.map(m => (
                      <MenuItem key={m} value={m}>
                        {m}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                {(form.entryType === 'client-payment' || form.entryType === 'client-credit') ? (
                  <FormControl fullWidth required>
                    <InputLabel>العميل</InputLabel>
                    <Select name='clientId' value={form.clientId} onChange={handleChange} label='العميل'>
                      {clients.map(c => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : form.entryType === 'supplier-payment' ? (
                  <FormControl fullWidth required>
                    <InputLabel>المورد</InputLabel>
                    <Select name='supplierId' value={form.supplierId} onChange={handleChange} label='المورد'>
                      {suppliers.map(s => (
                        <MenuItem key={s.id} value={s.id}>
                          {s.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : (
                  <Autocomplete
                    freeSolo
                    options={clients.map(c => c.name)}
                    value={form.customer}
                    onChange={(e, newValue) => setForm(prev => ({ ...prev, customer: newValue || '' }))}
                    onInputChange={(e, newValue) => setForm(prev => ({ ...prev, customer: newValue }))}
                    renderInput={params => <TextField {...params} label='العميل' name='customer' fullWidth />}
                  />
                )}
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  fullWidth
                  label='المشروع'
                  name='project'
                  value={form.project}
                  onChange={handleChange}
                  placeholder='اسم المشروع'
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label='الوصف'
                  name='description'
                  value={form.description}
                  onChange={handleChange}
                  placeholder='وصف القيد'
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>

            <Divider className='my-4' />

            {/* Incoming & Outgoing */}
            <Grid container spacing={4}>
              {/* Incoming Section - Show for general and client-payment */}
              {(form.entryType === 'general' || form.entryType === 'client-payment' || form.entryType === 'client-credit') && (
                <Grid size={{ xs: 12, md: form.entryType === 'general' ? 6 : 12 }}>
                  <Card variant='outlined' className='h-full' sx={{ bgcolor: 'success.lighter' }}>
                    <CardContent>
                      <div className='flex items-center gap-2 mb-4'>
                        <CustomAvatar skin='light' color='success' size={36}>
                          <i className='tabler-trending-up text-lg' />
                        </CustomAvatar>
                        <Typography variant='h6' color='success.main'>
                          {form.entryType === 'client-payment'
                            ? 'دفعة من العميل'
                            : form.entryType === 'client-credit'
                              ? 'آجل عميل'
                              : 'الوارد'}
                        </Typography>
                      </div>
                      <TextField
                        fullWidth
                        label={
                          form.entryType === 'client-payment'
                            ? 'مبلغ الدفعة'
                            : form.entryType === 'client-credit'
                              ? 'مبلغ الآجل'
                              : 'مبلغ الوارد'
                        }
                        name='incoming'
                        type='number'
                        value={form.incoming}
                        onChange={handleChange}
                        placeholder='0.00'
                        InputLabelProps={{ shrink: true }}
                        InputProps={{
                          endAdornment: <InputAdornment position='end'>ج.م</InputAdornment>
                        }}
                        className='mb-4'
                        required={form.entryType === 'client-payment' || form.entryType === 'client-credit'}
                      />
                      <FormControl component='fieldset' className='mb-4'>
                        <FormLabel component='legend'>طريقة الدفع</FormLabel>
                        <RadioGroup
                          row
                          name='incomingMethod'
                          value={form.incomingMethod}
                          onChange={handleChange}
                          sx={{ gap: 2 }}
                        >
                          <FormControlLabel
                            value='cash'
                            control={<Radio color='success' />}
                            label='نقدي'
                            sx={{ marginLeft: 0, marginRight: 0 }}
                          />
                          <FormControlLabel
                            value='shek'
                            control={<Radio color='success' />}
                            label='شيك'
                            sx={{ marginLeft: 0, marginRight: 0 }}
                          />
                          <FormControlLabel
                            value='online'
                            control={<Radio color='success' />}
                            label='تحويل بنكي'
                            sx={{ marginLeft: 0, marginRight: 0 }}
                          />
                        </RadioGroup>
                      </FormControl>
                      {form.incomingMethod === 'online' && (
                        <TextField
                          fullWidth
                          label='رقم العملية'
                          name='incomingTxn'
                          value={form.incomingTxn}
                          onChange={handleChange}
                          placeholder='رقم عملية التحويل'
                          size='small'
                        />
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Outgoing Section - Show for general and supplier-payment */}
              {(form.entryType === 'general' || form.entryType === 'supplier-payment') && (
                <Grid size={{ xs: 12, md: form.entryType === 'general' ? 6 : 12 }}>
                  <Card variant='outlined' className='h-full' sx={{ bgcolor: 'error.lighter' }}>
                    <CardContent>
                      <div className='flex items-center gap-2 mb-4'>
                        <CustomAvatar skin='light' color='error' size={36}>
                          <i className='tabler-trending-down text-lg' />
                        </CustomAvatar>
                        <Typography variant='h6' color='error.main'>
                          {form.entryType === 'supplier-payment' ? 'دفعة للمورد' : 'الصادر'}
                        </Typography>
                      </div>
                      <TextField
                        fullWidth
                        label={form.entryType === 'supplier-payment' ? 'مبلغ الدفعة' : 'مبلغ الصادر'}
                        name='outgoing'
                        type='number'
                        value={form.outgoing}
                        onChange={handleChange}
                        placeholder='0.00'
                        InputLabelProps={{ shrink: true }}
                        InputProps={{
                          endAdornment: <InputAdornment position='end'>ج.م</InputAdornment>
                        }}
                        className='mb-4'
                        required={form.entryType === 'supplier-payment'}
                      />
                      <FormControl component='fieldset' className='mb-4'>
                        <FormLabel component='legend'>طريقة الدفع</FormLabel>
                        <RadioGroup
                          row
                          name='outgoingMethod'
                          value={form.outgoingMethod}
                          onChange={handleChange}
                          sx={{ gap: 2 }}
                        >
                          <FormControlLabel
                            value='cash'
                            control={<Radio color='error' />}
                            label='نقدي'
                            sx={{ marginLeft: 0, marginRight: 0 }}
                          />
                          <FormControlLabel
                            value='shek'
                            control={<Radio color='error' />}
                            label='شيك'
                            sx={{ marginLeft: 0, marginRight: 0 }}
                          />
                          <FormControlLabel
                            value='online'
                            control={<Radio color='error' />}
                            label='تحويل بنكي'
                            sx={{ marginLeft: 0, marginRight: 0 }}
                          />
                        </RadioGroup>
                      </FormControl>
                      {form.outgoingMethod === 'online' && (
                        <TextField
                          fullWidth
                          label='رقم العملية'
                          name='outgoingTxn'
                          value={form.outgoingTxn}
                          onChange={handleChange}
                          placeholder='رقم عملية التحويل'
                          size='small'
                        />
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>

            <Box className='flex justify-end mt-6'>
              <Button
                type='submit'
                variant='contained'
                color='primary'
                size='large'
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={20} color='inherit' /> : <i className='tabler-plus' />}
              >
                {submitting
                  ? 'جاري الإضافة...'
                  : form.entryType === 'client-payment'
                    ? 'تسجيل الدفعة من العميل'
                    : form.entryType === 'supplier-payment'
                      ? 'تسجيل الدفعة للمورد'
                      : 'إضافة القيد'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>

      {/* Entries Table Card */}
      <Card>
        <CardHeader
          title={
            <div className='flex items-center gap-2'>
              <i className='tabler-list text-xl' />
              <span>سجل القيود</span>
              <Chip label={`${filteredEntries.length} قيد`} size='small' color='primary' variant='tonal' />
            </div>
          }
        />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 600, width: 60 }} align='center'>
                  رقم القيد
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>التاريخ</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>العميل</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>الشهر</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>الوصف</TableCell>
                {/* project column removed */}
                <TableCell sx={{ fontWeight: 600 }} align='left'>
                  الوارد
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>طريقة الوارد</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align='left'>
                  الصادر
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>طريقة الصادر</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align='left'>
                  الرصيد
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }} align='center'>
                  طباعة
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} align='center' sx={{ py: 8 }}>
                    <div className='flex flex-col items-center gap-2'>
                      <i className='tabler-inbox-off text-4xl' style={{ opacity: 0.5 }} />
                      <Typography color='text.secondary'>لا توجد قيود</Typography>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEntries.map((entry, idx) => {
                  const entryNumber = filteredEntries.length - idx
                  return (
                    <TableRow key={entry.id ?? `row-${idx}`} hover>
                      <TableCell align='center'>
                        <Typography fontWeight={600} color='text.secondary'>
                          {String(entryNumber).padStart(6, '0')}
                        </Typography>
                      </TableCell>
                      <TableCell>{entry.date ? new Date(entry.date).toLocaleDateString('ar-EG') : '-'}</TableCell>
                      <TableCell>{entry.customer || '-'}</TableCell>
                      <TableCell>
                        <Chip label={entry.month} size='small' variant='tonal' color='secondary' />
                      </TableCell>
                      <TableCell
                        sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        title={entry.description}
                      >
                        {entry.description || '-'}
                      </TableCell>
                      {/* project column removed */}
                      <TableCell align='left'>
                        {entry.incoming ? (
                          <Typography color='success.main' fontWeight={600}>
                            {parseFloat(entry.incoming).toLocaleString('ar-EG')} ج.م
                          </Typography>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {entry.incomingMethod && (
                          <Chip
                            label={paymentMethods[entry.incomingMethod] || entry.incomingMethod}
                            size='small'
                            color={entry.incomingMethod === 'cash' ? 'success' : 'info'}
                            variant='tonal'
                          />
                        )}
                      </TableCell>
                      <TableCell align='left'>
                        {entry.outgoing ? (
                          <Typography color='error.main' fontWeight={600}>
                            {parseFloat(entry.outgoing).toLocaleString('ar-EG')} ج.م
                          </Typography>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {entry.outgoingMethod && (
                          <Chip
                            label={paymentMethods[entry.outgoingMethod] || entry.outgoingMethod}
                            size='small'
                            color={entry.outgoingMethod === 'cash' ? 'warning' : 'info'}
                            variant='tonal'
                          />
                        )}
                      </TableCell>
                      <TableCell align='left'>
                        <Typography
                          fontWeight={700}
                          color={parseFloat(entry.balance) >= 0 ? 'primary.main' : 'error.main'}
                        >
                          {parseFloat(entry.balance || 0).toLocaleString('ar-EG')} ج.م
                        </Typography>
                      </TableCell>
                      <TableCell align='center'>
                        <Tooltip title='طباعة كشف الحركة'>
                          <IconButton
                            size='small'
                            color='primary'
                            onClick={() => {
                              const prevEntry = filteredEntries[idx + 1]
                              const prevBalance = prevEntry ? parseFloat(prevEntry.balance || 0) : 0
                              handlePrintEntry(entry, prevBalance, entryNumber)
                            }}
                          >
                            <i className='tabler-printer text-lg' />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  )
}
