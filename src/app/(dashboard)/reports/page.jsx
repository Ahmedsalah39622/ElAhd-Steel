'use client'

import { useState, useEffect, useCallback } from 'react'

import {
  Box,
  Card,
  CardContent,
  Tabs,
  Tab,
  TextField,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  CircularProgress,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import TableChartIcon from '@mui/icons-material/TableChart'
import FilterListIcon from '@mui/icons-material/FilterList'
import RefreshIcon from '@mui/icons-material/Refresh'

import { exportToCSV, exportToPDF, formatCurrency, formatDate, formatNumber } from '@/utils/exportUtils'

// Helper: compute running balances for safe entries (oldest -> newest, then return newest-first)
function computeRunningBalances(entries) {
  if (!Array.isArray(entries)) return []
  const copy = entries.slice()
  copy.sort((a, b) => new Date(a.date || a.createdAt || 0) - new Date(b.date || b.createdAt || 0))
  let running = 0
  const withBal = copy.map(e => {
    const inNum = parseFloat(e.incoming) || 0
    const outNum = parseFloat(e.outgoing) || 0
    running += inNum - outNum
    // populate month from date if missing
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
    const dt = new Date(e.date || e.createdAt || Date.now())
    const monthName = e.month || months[dt.getMonth()] || ''
    return { ...e, balance: running, month: monthName }
  })
  return withBal.reverse()
}

const methodLabels = {
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

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div role='tabpanel' hidden={value !== index} id={`report-tabpanel-${index}`} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

// Report Table Component
function ReportTable({ columns, data, loading, emptyMessage = 'لا توجد بيانات' }) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <Typography color='text.secondary'>{emptyMessage}</Typography>
      </Box>
    )
  }

  return (
    <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
      <Table stickyHeader size='small'>
        <TableHead>
          <TableRow>
            {columns.map((col, idx) => (
              <TableCell
                key={idx}
                align={col.align || 'right'}
                sx={{ fontWeight: 'bold', backgroundColor: 'var(--mui-palette-action-hover)' }}
              >
                {col.header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, rowIdx) => (
            <TableRow key={rowIdx} hover>
              {columns.map((col, colIdx) => (
                <TableCell key={colIdx} align={col.align || 'right'}>
                  {col.format ? col.format(row[col.key], row) : (row[col.key] ?? '-')}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

// Filter Bar Component
function FilterBar({ onApply, onReset, children }) {
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <FilterListIcon color='primary' />
          <Typography variant='subtitle1' fontWeight='bold'>
            الفلاتر
          </Typography>
        </Box>
        <Grid container spacing={2} alignItems='flex-end'>
          {children}
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant='contained' onClick={onApply} startIcon={<RefreshIcon />}>
                تطبيق
              </Button>
              <Button variant='outlined' onClick={onReset}>
                إعادة تعيين
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

// Export Buttons Component
function ExportButtons({ onExportCSV, onExportPDF }) {
  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Button variant='outlined' color='success' startIcon={<TableChartIcon />} onClick={onExportCSV}>
        تصدير Excel
      </Button>
      <Button variant='outlined' color='error' startIcon={<PictureAsPdfIcon />} onClick={onExportPDF}>
        تصدير PDF
      </Button>
    </Box>
  )
}

// ==================== REPORTS ====================

// 1. Clients Report
function ClientsReport() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ name: '', phone: '' })

  const columns = [
    { key: 'id', header: '#', align: 'center' },
    { key: 'name', header: 'اسم العميل' },
    { key: 'phone', header: 'الهاتف' },
    { key: 'profile', header: 'الوصف' },
    { key: 'budget', header: 'الميزانية', format: v => formatCurrency(v) },
    { key: 'createdAt', header: 'تاريخ الإنشاء', format: v => formatDate(v) }
  ]

  const fetchData = useCallback(async () => {
    setLoading(true)

    try {
      const res = await fetch('/api/clients', { credentials: 'include' })

      if (res.ok) {
        const result = await res.json()
        let clients = Array.isArray(result) ? result : result.data || []

        if (filters.name) {
          clients = clients.filter(c => c.name?.toLowerCase().includes(filters.name.toLowerCase()))
        }

        if (filters.phone) {
          clients = clients.filter(c => c.phone?.includes(filters.phone))
        }

        setData(clients)
      }
    } catch (err) {
      console.error('Error fetching clients:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleReset = () => {
    setFilters({ name: '', phone: '' })
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant='h6'>تقرير العملاء</Typography>
        <ExportButtons
          onExportCSV={() => exportToCSV(data, columns, 'clients-report')}
          onExportPDF={() => exportToPDF(data, columns, 'تقرير العملاء', 'clients-report')}
        />
      </Box>

      <FilterBar onApply={fetchData} onReset={handleReset}>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            size='small'
            label='اسم العميل'
            value={filters.name}
            onChange={e => setFilters({ ...filters, name: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            size='small'
            label='الهاتف'
            value={filters.phone}
            onChange={e => setFilters({ ...filters, phone: e.target.value })}
          />
        </Grid>
      </FilterBar>

      <Card>
        <CardContent>
          <Typography variant='body2' component='div' color='text.secondary' sx={{ mb: 2 }}>
            إجمالي العملاء: <Chip label={data.length} size='small' color='primary' />
          </Typography>
          <ReportTable columns={columns} data={data} loading={loading} />
        </CardContent>
      </Card>
    </Box>
  )
}

// 2. Suppliers Report
function SuppliersReport() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ name: '', category: '' })

  const columns = [
    { key: 'id', header: '#', align: 'center' },
    { key: 'name', header: 'اسم المورد' },
    { key: 'contactPerson', header: 'الشخص المسؤول' },
    { key: 'phone', header: 'الهاتف' },
    { key: 'email', header: 'البريد الإلكتروني' },
    { key: 'address', header: 'العنوان' },
    { key: 'category', header: 'التصنيف' },
    { key: 'createdAt', header: 'تاريخ الإنشاء', format: v => formatDate(v) }
  ]

  const fetchData = useCallback(async () => {
    setLoading(true)

    try {
      const res = await fetch('/api/suppliers', { credentials: 'include' })

      if (res.ok) {
        const result = await res.json()
        let suppliers = Array.isArray(result) ? result : result.data || []

        if (filters.name) {
          suppliers = suppliers.filter(s => s.name?.toLowerCase().includes(filters.name.toLowerCase()))
        }

        if (filters.category) {
          suppliers = suppliers.filter(s => s.category?.toLowerCase().includes(filters.category.toLowerCase()))
        }

        setData(suppliers)
      }
    } catch (err) {
      console.error('Error fetching suppliers:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleReset = () => {
    setFilters({ name: '', category: '' })
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant='h6'>تقرير الموردين</Typography>
        <ExportButtons
          onExportCSV={() => exportToCSV(data, columns, 'suppliers-report')}
          onExportPDF={() => exportToPDF(data, columns, 'تقرير الموردين', 'suppliers-report')}
        />
      </Box>

      <FilterBar onApply={fetchData} onReset={handleReset}>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            size='small'
            label='اسم المورد'
            value={filters.name}
            onChange={e => setFilters({ ...filters, name: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            size='small'
            label='التصنيف'
            value={filters.category}
            onChange={e => setFilters({ ...filters, category: e.target.value })}
          />
        </Grid>
      </FilterBar>

      <Card>
        <CardContent>
          <Typography variant='body2' component='div' color='text.secondary' sx={{ mb: 2 }}>
            إجمالي الموردين: <Chip label={data.length} size='small' color='primary' />
          </Typography>
          <ReportTable columns={columns} data={data} loading={loading} />
        </CardContent>
      </Card>
    </Box>
  )
}

// 3. Inventory Report
function InventoryReport() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ name: '', type: '', stockStatus: '' })

  const columns = [
    { key: 'id', header: '#', align: 'center' },
    { key: 'name', header: 'اسم المادة' },
    { key: 'sku', header: 'الكود' },
    { key: 'type', header: 'النوع' },
    { key: 'stock', header: 'الكمية', format: v => formatNumber(v) },
    { key: 'price', header: 'السعر', format: v => formatCurrency(v) },
    {
      key: 'totalValue',
      header: 'القيمة الإجمالية',
      format: (v, row) => formatCurrency((row.stock || 0) * (row.price || 0))
    },
    { key: 'createdAt', header: 'تاريخ الإضافة', format: v => formatDate(v) }
  ]

  const fetchData = useCallback(async () => {
    setLoading(true)

    try {
      const res = await fetch('/api/inventory', { credentials: 'include' })

      if (res.ok) {
        const result = await res.json()
        let materials = Array.isArray(result) ? result : result.data || []

        if (filters.name) {
          materials = materials.filter(m => m.name?.toLowerCase().includes(filters.name.toLowerCase()))
        }

        if (filters.type) {
          materials = materials.filter(m => m.type?.toLowerCase().includes(filters.type.toLowerCase()))
        }

        if (filters.stockStatus === 'low') {
          materials = materials.filter(m => (m.stock || 0) < 10)
        } else if (filters.stockStatus === 'out') {
          materials = materials.filter(m => (m.stock || 0) === 0)
        } else if (filters.stockStatus === 'available') {
          materials = materials.filter(m => (m.stock || 0) > 0)
        }

        setData(materials)
      }
    } catch (err) {
      console.error('Error fetching inventory:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleReset = () => {
    setFilters({ name: '', type: '', stockStatus: '' })
  }

  const totalValue = data.reduce((sum, m) => sum + (m.stock || 0) * (m.price || 0), 0)

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant='h6'>تقرير المخزون</Typography>
        <ExportButtons
          onExportCSV={() => exportToCSV(data, columns, 'inventory-report')}
          onExportPDF={() => exportToPDF(data, columns, 'تقرير المخزون', 'inventory-report')}
        />
      </Box>

      <FilterBar onApply={fetchData} onReset={handleReset}>
        <Grid item xs={12} md={2}>
          <TextField
            fullWidth
            size='small'
            label='اسم المادة'
            value={filters.name}
            onChange={e => setFilters({ ...filters, name: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <TextField
            fullWidth
            size='small'
            label='النوع'
            value={filters.type}
            onChange={e => setFilters({ ...filters, type: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <FormControl fullWidth size='small'>
            <InputLabel>حالة المخزون</InputLabel>
            <Select
              value={filters.stockStatus}
              label='حالة المخزون'
              onChange={e => setFilters({ ...filters, stockStatus: e.target.value })}
            >
              <MenuItem value=''>الكل</MenuItem>
              <MenuItem value='available'>متوفر</MenuItem>
              <MenuItem value='low'>مخزون منخفض</MenuItem>
              <MenuItem value='out'>نفذ</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </FilterBar>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Typography variant='body2' component='div' color='text.secondary'>
              عدد الأصناف: <Chip label={data.length} size='small' color='primary' />
            </Typography>
            <Typography variant='body2' component='div' color='text.secondary'>
              إجمالي قيمة المخزون: <Chip label={formatCurrency(totalValue)} size='small' color='success' />
            </Typography>
          </Box>
          <ReportTable columns={columns} data={data} loading={loading} />
        </CardContent>
      </Card>
    </Box>
  )
}

// 4. Invoices Report
function InvoicesReport() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', clientName: '' })

  const columns = [
    { key: 'id', header: '#', align: 'center' },
    { key: 'number', header: 'رقم الفاتورة' },
    { key: 'clientName', header: 'العميل', format: (v, row) => row.client?.name || v || '-' },
    { key: 'date', header: 'التاريخ', format: v => formatDate(v) },
    { key: 'subtotal', header: 'المبلغ قبل الضريبة', format: v => formatCurrency(v) },
    { key: 'tax', header: 'الضريبة', format: v => formatCurrency(v) },
    { key: 'discount', header: 'الخصم', format: v => formatCurrency(v) },
    { key: 'total', header: 'الإجمالي', format: v => formatCurrency(v) },
    { key: 'status', header: 'الحالة', format: v => v || 'جديد' }
  ]

  const fetchData = useCallback(async () => {
    setLoading(true)

    try {
      const res = await fetch('/api/invoices', { credentials: 'include' })

      if (res.ok) {
        const result = await res.json()
        let invoices = Array.isArray(result) ? result : []

        if (filters.dateFrom) {
          const from = new Date(filters.dateFrom)

          invoices = invoices.filter(i => new Date(i.date) >= from)
        }

        if (filters.dateTo) {
          const to = new Date(filters.dateTo)

          invoices = invoices.filter(i => new Date(i.date) <= to)
        }

        if (filters.clientName) {
          invoices = invoices.filter(i => i.client?.name?.toLowerCase().includes(filters.clientName.toLowerCase()))
        }

        setData(invoices)
      }
    } catch (err) {
      console.error('Error fetching invoices:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleReset = () => {
    setFilters({ dateFrom: '', dateTo: '', clientName: '' })
  }

  const totalAmount = data.reduce((sum, i) => sum + (parseFloat(i.total) || 0), 0)

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant='h6'>تقرير الفواتير</Typography>
        <ExportButtons
          onExportCSV={() => exportToCSV(data, columns, 'invoices-report')}
          onExportPDF={() => exportToPDF(data, columns, 'تقرير الفواتير', 'invoices-report')}
        />
      </Box>

      <FilterBar onApply={fetchData} onReset={handleReset}>
        <Grid item xs={12} md={2}>
          <TextField
            fullWidth
            size='small'
            type='date'
            label='من تاريخ'
            InputLabelProps={{ shrink: true }}
            value={filters.dateFrom}
            onChange={e => setFilters({ ...filters, dateFrom: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <TextField
            fullWidth
            size='small'
            type='date'
            label='إلى تاريخ'
            InputLabelProps={{ shrink: true }}
            value={filters.dateTo}
            onChange={e => setFilters({ ...filters, dateTo: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <TextField
            fullWidth
            size='small'
            label='اسم العميل'
            value={filters.clientName}
            onChange={e => setFilters({ ...filters, clientName: e.target.value })}
          />
        </Grid>
      </FilterBar>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Typography variant='body2' component='div' color='text.secondary'>
              عدد الفواتير: <Chip label={data.length} size='small' color='primary' />
            </Typography>
            <Typography variant='body2' component='div' color='text.secondary'>
              إجمالي المبيعات: <Chip label={formatCurrency(totalAmount)} size='small' color='success' />
            </Typography>
          </Box>
          <ReportTable columns={columns} data={data} loading={loading} />
        </CardContent>
      </Card>
    </Box>
  )
}

// 5. Safe (Treasury) Report
function SafeReport() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', project: '' })

  const columns = [
    { key: 'id', header: '#', align: 'center' },
    { key: 'date', header: 'التاريخ', format: v => formatDate(v) },
    { key: 'month', header: 'الشهر' },
    { key: 'customer', header: 'العميل' },
    { key: 'description', header: 'الوصف' },
    { key: 'incoming', header: 'الوارد', format: v => formatCurrency(v) },
    { key: 'incomingMethod', header: 'طريقة الوارد', format: v => methodLabels[v] || v },
    { key: 'outgoing', header: 'الصادر', format: v => formatCurrency(v) },
    { key: 'outgoingMethod', header: 'طريقة الصادر', format: v => methodLabels[v] || v },
    { key: 'balance', header: 'الرصيد', format: v => formatCurrency(v) }
  ]

  const fetchData = useCallback(async () => {
    setLoading(true)

    try {
      const res = await fetch('/api/safe', { credentials: 'include' })

      if (res.ok) {
        const result = await res.json()
        let entries = Array.isArray(result) ? result : result.rows || []

        if (filters.dateFrom) {
          const from = new Date(filters.dateFrom)

          entries = entries.filter(e => new Date(e.date) >= from)
        }

        if (filters.dateTo) {
          const to = new Date(filters.dateTo)

          entries = entries.filter(e => new Date(e.date) <= to)
        }

        if (filters.project) {
          entries = entries.filter(e => e.project?.toLowerCase().includes(filters.project.toLowerCase()))
        }

        // compute running balances so `balance` column reflects cumulative totals
        const computed = computeRunningBalances(entries)
        setData(computed)
      }
    } catch (err) {
      console.error('Error fetching safe:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleReset = () => {
    setFilters({ dateFrom: '', dateTo: '', project: '' })
  }

  const totalIncoming = data.reduce((sum, e) => sum + (parseFloat(e.incoming) || 0), 0)
  const totalOutgoing = data.reduce((sum, e) => sum + (parseFloat(e.outgoing) || 0), 0)

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant='h6'>تقرير الخزينة</Typography>
        <ExportButtons
          onExportCSV={() => exportToCSV(data, columns, 'safe-report')}
          onExportPDF={() => exportToPDF(data, columns, 'تقرير الخزينة', 'safe-report')}
        />
      </Box>

      <FilterBar onApply={fetchData} onReset={handleReset}>
        <Grid item xs={12} md={2}>
          <TextField
            fullWidth
            size='small'
            type='date'
            label='من تاريخ'
            InputLabelProps={{ shrink: true }}
            value={filters.dateFrom}
            onChange={e => setFilters({ ...filters, dateFrom: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <TextField
            fullWidth
            size='small'
            type='date'
            label='إلى تاريخ'
            InputLabelProps={{ shrink: true }}
            value={filters.dateTo}
            onChange={e => setFilters({ ...filters, dateTo: e.target.value })}
          />
        </Grid>
        {/* project filter removed */}
      </FilterBar>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <Typography variant='body2' component='div' color='text.secondary'>
              عدد الحركات: <Chip label={data.length} size='small' color='primary' />
            </Typography>
            <Typography variant='body2' component='div' color='text.secondary'>
              إجمالي الوارد: <Chip label={formatCurrency(totalIncoming)} size='small' color='success' />
            </Typography>
            <Typography variant='body2' component='div' color='text.secondary'>
              إجمالي الصادر: <Chip label={formatCurrency(totalOutgoing)} size='small' color='error' />
            </Typography>
            <Typography variant='body2' component='div' color='text.secondary'>
              الرصيد: <Chip label={formatCurrency(totalIncoming - totalOutgoing)} size='small' color='info' />
            </Typography>
          </Box>
          <ReportTable columns={columns} data={data} loading={loading} />
        </CardContent>
      </Card>
    </Box>
  )
}

// 6. Workers Report
function WorkersReport() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ name: '', status: '', department: '' })

  const columns = [
    { key: 'id', header: '#', align: 'center' },
    { key: 'name', header: 'الاسم' },
    { key: 'phone', header: 'الهاتف' },
    { key: 'position', header: 'المنصب' },
    { key: 'department', header: 'القسم' },
    { key: 'baseSalary', header: 'الراتب الأساسي', format: v => formatCurrency(v) },
    { key: 'hireDate', header: 'تاريخ التعيين', format: v => formatDate(v) },
    { key: 'status', header: 'الحالة', format: v => (v === 'active' ? 'نشط' : 'غير نشط') }
  ]

  const fetchData = useCallback(async () => {
    setLoading(true)

    try {
      const res = await fetch('/api/workers', { credentials: 'include' })

      if (res.ok) {
        const result = await res.json()
        let workers = result.data || []

        if (filters.name) {
          workers = workers.filter(w => w.name?.toLowerCase().includes(filters.name.toLowerCase()))
        }

        if (filters.status) {
          workers = workers.filter(w => w.status === filters.status)
        }

        if (filters.department) {
          workers = workers.filter(w => w.department?.toLowerCase().includes(filters.department.toLowerCase()))
        }

        setData(workers)
      }
    } catch (err) {
      console.error('Error fetching workers:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleReset = () => {
    setFilters({ name: '', status: '', department: '' })
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant='h6'>تقرير العمال</Typography>
        <ExportButtons
          onExportCSV={() => exportToCSV(data, columns, 'workers-report')}
          onExportPDF={() => exportToPDF(data, columns, 'تقرير العمال', 'workers-report')}
        />
      </Box>

      <FilterBar onApply={fetchData} onReset={handleReset}>
        <Grid item xs={12} md={2}>
          <TextField
            fullWidth
            size='small'
            label='الاسم'
            value={filters.name}
            onChange={e => setFilters({ ...filters, name: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <FormControl fullWidth size='small'>
            <InputLabel>الحالة</InputLabel>
            <Select
              value={filters.status}
              label='الحالة'
              onChange={e => setFilters({ ...filters, status: e.target.value })}
            >
              <MenuItem value=''>الكل</MenuItem>
              <MenuItem value='active'>نشط</MenuItem>
              <MenuItem value='inactive'>غير نشط</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={2}>
          <TextField
            fullWidth
            size='small'
            label='القسم'
            value={filters.department}
            onChange={e => setFilters({ ...filters, department: e.target.value })}
          />
        </Grid>
      </FilterBar>

      <Card>
        <CardContent>
          <Typography variant='body2' component='div' color='text.secondary' sx={{ mb: 2 }}>
            عدد العمال: <Chip label={data.length} size='small' color='primary' />
          </Typography>
          <ReportTable columns={columns} data={data} loading={loading} />
        </CardContent>
      </Card>
    </Box>
  )
}

// 7. Attendance Report
function AttendanceReport() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', status: '' })

  const columns = [
    { key: 'id', header: '#', align: 'center' },
    { key: 'workerName', header: 'اسم العامل', format: (v, row) => row.worker?.name || v || '-' },
    { key: 'date', header: 'التاريخ', format: v => formatDate(v) },
    {
      key: 'status',
      header: 'الحالة',
      format: v => {
        const statusMap = { present: 'حاضر', absent: 'غائب', late: 'متأخر', leave: 'إجازة' }

        return statusMap[v] || v
      }
    },
    { key: 'checkInTime', header: 'وقت الحضور' },
    { key: 'checkOutTime', header: 'وقت الانصراف' },
    { key: 'notes', header: 'ملاحظات' }
  ]

  const fetchData = useCallback(async () => {
    setLoading(true)

    try {
      let url = '/api/attendance?'

      if (filters.dateFrom) url += `startDate=${filters.dateFrom}&`
      if (filters.dateTo) url += `endDate=${filters.dateTo}&`

      const res = await fetch(url, { credentials: 'include' })

      if (res.ok) {
        const result = await res.json()
        let attendance = result.data || []

        if (filters.status) {
          attendance = attendance.filter(a => a.status === filters.status)
        }

        setData(attendance)
      }
    } catch (err) {
      console.error('Error fetching attendance:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleReset = () => {
    setFilters({ dateFrom: '', dateTo: '', status: '' })
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant='h6'>تقرير الحضور</Typography>
        <ExportButtons
          onExportCSV={() => exportToCSV(data, columns, 'attendance-report')}
          onExportPDF={() => exportToPDF(data, columns, 'تقرير الحضور', 'attendance-report')}
        />
      </Box>

      <FilterBar onApply={fetchData} onReset={handleReset}>
        <Grid item xs={12} md={2}>
          <TextField
            fullWidth
            size='small'
            type='date'
            label='من تاريخ'
            InputLabelProps={{ shrink: true }}
            value={filters.dateFrom}
            onChange={e => setFilters({ ...filters, dateFrom: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <TextField
            fullWidth
            size='small'
            type='date'
            label='إلى تاريخ'
            InputLabelProps={{ shrink: true }}
            value={filters.dateTo}
            onChange={e => setFilters({ ...filters, dateTo: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <FormControl fullWidth size='small'>
            <InputLabel>الحالة</InputLabel>
            <Select
              value={filters.status}
              label='الحالة'
              onChange={e => setFilters({ ...filters, status: e.target.value })}
            >
              <MenuItem value=''>الكل</MenuItem>
              <MenuItem value='present'>حاضر</MenuItem>
              <MenuItem value='absent'>غائب</MenuItem>
              <MenuItem value='late'>متأخر</MenuItem>
              <MenuItem value='leave'>إجازة</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </FilterBar>

      <Card>
        <CardContent>
          <Typography variant='body2' component='div' color='text.secondary' sx={{ mb: 2 }}>
            عدد السجلات: <Chip label={data.length} size='small' color='primary' />
          </Typography>
          <ReportTable columns={columns} data={data} loading={loading} />
        </CardContent>
      </Card>
    </Box>
  )
}

// 8. Salaries Report
function SalariesReport() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', workerName: '' })

  const columns = [
    { key: 'id', header: '#', align: 'center' },
    { key: 'workerName', header: 'اسم العامل', format: (v, row) => row.worker?.name || v || '-' },
    { key: 'date', header: 'التاريخ', format: v => formatDate(v) },
    { key: 'dailyAmount', header: 'المبلغ اليومي', format: v => formatCurrency(v) },
    { key: 'bonus', header: 'المكافأة', format: v => formatCurrency(v) },
    { key: 'deduction', header: 'الخصم', format: v => formatCurrency(v) },
    {
      key: 'netAmount',
      header: 'صافي المبلغ',
      format: (v, row) => {
        const daily = parseFloat(row.dailyAmount) || 0
        const bonus = parseFloat(row.bonus) || 0
        const deduction = parseFloat(row.deduction) || 0

        return formatCurrency(daily + bonus - deduction)
      }
    },
    { key: 'notes', header: 'ملاحظات' }
  ]

  const fetchData = useCallback(async () => {
    setLoading(true)

    try {
      let url = '/api/daily-salaries?'

      if (filters.dateFrom) url += `startDate=${filters.dateFrom}&`
      if (filters.dateTo) url += `endDate=${filters.dateTo}&`

      const res = await fetch(url, { credentials: 'include' })

      if (res.ok) {
        const result = await res.json()
        let salaries = result.data || []

        if (filters.workerName) {
          salaries = salaries.filter(s => s.worker?.name?.toLowerCase().includes(filters.workerName.toLowerCase()))
        }

        setData(salaries)
      }
    } catch (err) {
      console.error('Error fetching salaries:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleReset = () => {
    setFilters({ dateFrom: '', dateTo: '', workerName: '' })
  }

  const totalSalaries = data.reduce((sum, s) => {
    const daily = parseFloat(s.dailyAmount) || 0
    const bonus = parseFloat(s.bonus) || 0
    const deduction = parseFloat(s.deduction) || 0

    return sum + daily + bonus - deduction
  }, 0)

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant='h6'>تقرير الرواتب</Typography>
        <ExportButtons
          onExportCSV={() => exportToCSV(data, columns, 'salaries-report')}
          onExportPDF={() => exportToPDF(data, columns, 'تقرير الرواتب', 'salaries-report')}
        />
      </Box>

      <FilterBar onApply={fetchData} onReset={handleReset}>
        <Grid item xs={12} md={2}>
          <TextField
            fullWidth
            size='small'
            type='date'
            label='من تاريخ'
            InputLabelProps={{ shrink: true }}
            value={filters.dateFrom}
            onChange={e => setFilters({ ...filters, dateFrom: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <TextField
            fullWidth
            size='small'
            type='date'
            label='إلى تاريخ'
            InputLabelProps={{ shrink: true }}
            value={filters.dateTo}
            onChange={e => setFilters({ ...filters, dateTo: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <TextField
            fullWidth
            size='small'
            label='اسم العامل'
            value={filters.workerName}
            onChange={e => setFilters({ ...filters, workerName: e.target.value })}
          />
        </Grid>
      </FilterBar>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Typography variant='body2' component='div' color='text.secondary'>
              عدد السجلات: <Chip label={data.length} size='small' color='primary' />
            </Typography>
            <Typography variant='body2' component='div' color='text.secondary'>
              إجمالي الرواتب: <Chip label={formatCurrency(totalSalaries)} size='small' color='success' />
            </Typography>
          </Box>
          <ReportTable columns={columns} data={data} loading={loading} />
        </CardContent>
      </Card>
    </Box>
  )
}

// 9. Purchase Orders Report
function PurchaseOrdersReport() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', status: '' })

  const columns = [
    { key: 'id', header: '#', align: 'center' },
    { key: 'orderNumber', header: 'رقم الطلب' },
    { key: 'supplierName', header: 'المورد', format: (v, row) => row.supplier?.name || v || '-' },
    { key: 'orderDate', header: 'تاريخ الطلب', format: v => formatDate(v) },
    { key: 'expectedDate', header: 'التاريخ المتوقع', format: v => formatDate(v) },
    { key: 'totalAmount', header: 'المبلغ الإجمالي', format: v => formatCurrency(v) },
    {
      key: 'status',
      header: 'الحالة',
      format: v => {
        const statusMap = { pending: 'قيد الانتظار', approved: 'موافق عليه', completed: 'مكتمل', cancelled: 'ملغي' }

        return statusMap[v] || v
      }
    },
    { key: 'notes', header: 'ملاحظات' }
  ]

  const fetchData = useCallback(async () => {
    setLoading(true)

    try {
      const res = await fetch('/api/purchase-orders', { credentials: 'include' })

      if (res.ok) {
        const result = await res.json()
        let orders = result.data || []

        if (filters.dateFrom) {
          const from = new Date(filters.dateFrom)

          orders = orders.filter(o => new Date(o.orderDate) >= from)
        }

        if (filters.dateTo) {
          const to = new Date(filters.dateTo)

          orders = orders.filter(o => new Date(o.orderDate) <= to)
        }

        if (filters.status) {
          orders = orders.filter(o => o.status === filters.status)
        }

        setData(orders)
      }
    } catch (err) {
      console.error('Error fetching purchase orders:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleReset = () => {
    setFilters({ dateFrom: '', dateTo: '', status: '' })
  }

  const totalAmount = data.reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0)

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant='h6'>تقرير أوامر الشراء</Typography>
        <ExportButtons
          onExportCSV={() => exportToCSV(data, columns, 'purchase-orders-report')}
          onExportPDF={() => exportToPDF(data, columns, 'تقرير أوامر الشراء', 'purchase-orders-report')}
        />
      </Box>

      <FilterBar onApply={fetchData} onReset={handleReset}>
        <Grid item xs={12} md={2}>
          <TextField
            fullWidth
            size='small'
            type='date'
            label='من تاريخ'
            InputLabelProps={{ shrink: true }}
            value={filters.dateFrom}
            onChange={e => setFilters({ ...filters, dateFrom: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <TextField
            fullWidth
            size='small'
            type='date'
            label='إلى تاريخ'
            InputLabelProps={{ shrink: true }}
            value={filters.dateTo}
            onChange={e => setFilters({ ...filters, dateTo: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <FormControl fullWidth size='small'>
            <InputLabel>الحالة</InputLabel>
            <Select
              value={filters.status}
              label='الحالة'
              onChange={e => setFilters({ ...filters, status: e.target.value })}
            >
              <MenuItem value=''>الكل</MenuItem>
              <MenuItem value='pending'>قيد الانتظار</MenuItem>
              <MenuItem value='approved'>موافق عليه</MenuItem>
              <MenuItem value='completed'>مكتمل</MenuItem>
              <MenuItem value='cancelled'>ملغي</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </FilterBar>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Typography variant='body2' component='div' color='text.secondary'>
              عدد الطلبات: <Chip label={data.length} size='small' color='primary' />
            </Typography>
            <Typography variant='body2' component='div' color='text.secondary'>
              إجمالي المشتريات: <Chip label={formatCurrency(totalAmount)} size='small' color='warning' />
            </Typography>
          </Box>
          <ReportTable columns={columns} data={data} loading={loading} />
        </CardContent>
      </Card>
    </Box>
  )
}

// 10. Client Inventory Balance Report
function ClientInventoryReport() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ clientName: '' })

  const columns = [
    { key: 'id', header: '#', align: 'center' },
    { key: 'clientName', header: 'العميل', format: (v, row) => row.client?.name || v || '-' },
    { key: 'materialName', header: 'المادة', format: (v, row) => row.material?.name || v || '-' },
    { key: 'materialSku', header: 'كود المادة', format: (v, row) => row.material?.sku || v || '-' },
    { key: 'quantity', header: 'الكمية', format: v => formatNumber(v) },
    { key: 'unitPrice', header: 'سعر الوحدة', format: v => formatCurrency(v) },
    {
      key: 'totalValue',
      header: 'القيمة الإجمالية',
      format: (v, row) => formatCurrency((row.quantity || 0) * (row.unitPrice || 0))
    },
    { key: 'lastUpdated', header: 'آخر تحديث', format: v => formatDate(v) }
  ]

  const fetchData = useCallback(async () => {
    setLoading(true)

    try {
      const res = await fetch('/api/client-inventory-balance', { credentials: 'include' })

      if (res.ok) {
        const result = await res.json()
        let balances = Array.isArray(result) ? result : result.data || []

        if (filters.clientName) {
          balances = balances.filter(
            b =>
              b.client?.name?.toLowerCase().includes(filters.clientName.toLowerCase()) ||
              b.clientName?.toLowerCase().includes(filters.clientName.toLowerCase())
          )
        }

        setData(balances)
      }
    } catch (err) {
      console.error('Error fetching client inventory:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleReset = () => {
    setFilters({ clientName: '' })
  }

  const totalValue = data.reduce((sum, b) => sum + (b.quantity || 0) * (b.unitPrice || 0), 0)

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant='h6'>تقرير مخزون العملاء</Typography>
        <ExportButtons
          onExportCSV={() => exportToCSV(data, columns, 'client-inventory-report')}
          onExportPDF={() => exportToPDF(data, columns, 'تقرير مخزون العملاء', 'client-inventory-report')}
        />
      </Box>

      <FilterBar onApply={fetchData} onReset={handleReset}>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            size='small'
            label='اسم العميل'
            value={filters.clientName}
            onChange={e => setFilters({ ...filters, clientName: e.target.value })}
          />
        </Grid>
      </FilterBar>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Typography variant='body2' component='div' color='text.secondary'>
              عدد السجلات: <Chip label={data.length} size='small' color='primary' />
            </Typography>
            <Typography variant='body2' component='div' color='text.secondary'>
              إجمالي القيمة: <Chip label={formatCurrency(totalValue)} size='small' color='success' />
            </Typography>
          </Box>
          <ReportTable columns={columns} data={data} loading={loading} />
        </CardContent>
      </Card>
    </Box>
  )
}

// 11. Manufacturing Report
function ManufacturingReport() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '' })
  const [subTab, setSubTab] = useState(0) // 0 = pending, 1 = confirmed

  const columns = [
    { key: 'orderNumber', header: 'رقم أمر التشغيل' },
    { key: 'clientName', header: 'العميل' },
    { key: 'projectCode', header: 'كود المشروع' },
    {
      key: 'status',
      header: 'الحالة',
      format: v => {
        const statusMap = {
          pending: 'قيد الانتظار',
          'in-progress': 'جاري',
          completed: 'مكتمل',
          cancelled: 'ملغى'
        }
        return statusMap[v] || v
      }
    },
    { key: 'createdAt', header: 'تاريخ الإنشاء', format: v => formatDate(v) },
    {
      key: 'specifications',
      header: 'الكمية',
      format: v => {
        try {
          const specs = typeof v === 'string' ? JSON.parse(v) : v
          return specs?.quantity || '-'
        } catch {
          return '-'
        }
      }
    },
    {
      key: 'specifications',
      header: 'القطر',
      format: v => {
        try {
          const specs = typeof v === 'string' ? JSON.parse(v) : v
          return specs?.diameter ? `${specs.diameter} مم` : '-'
        } catch {
          return '-'
        }
      }
    }
  ]

  const fetchData = useCallback(async () => {
    setLoading(true)

    try {
      const res = await fetch('/api/job-orders', { credentials: 'include' })

      if (res.ok) {
        let orders = await res.json()

        if (filters.dateFrom) {
          const from = new Date(filters.dateFrom)
          orders = orders.filter(o => new Date(o.createdAt) >= from)
        }

        if (filters.dateTo) {
          const to = new Date(filters.dateTo)
          orders = orders.filter(o => new Date(o.createdAt) <= to)
        }

        setData(orders)
      }
    } catch (err) {
      console.error('Error fetching job orders:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleReset = () => {
    setFilters({ dateFrom: '', dateTo: '' })
  }

  // Filter data based on sub-tab
  const pendingOrders = data.filter(o => o.status === 'pending' || o.status === 'in-progress')
  const confirmedOrders = data.filter(o => o.status === 'completed')
  const currentData = subTab === 0 ? pendingOrders : confirmedOrders

  const statusCounts = {
    pending: data.filter(o => o.status === 'pending').length,
    inProgress: data.filter(o => o.status === 'in-progress').length,
    completed: data.filter(o => o.status === 'completed').length
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant='h6'>تقرير التشغيل</Typography>
        <ExportButtons
          onExportCSV={() =>
            exportToCSV(currentData, columns, subTab === 0 ? 'pending-orders-report' : 'confirmed-orders-report')
          }
          onExportPDF={() =>
            exportToPDF(
              currentData,
              columns,
              subTab === 0 ? 'أوامر التشغيل قيد الانتظار' : 'أوامر التشغيل المؤكدة',
              subTab === 0 ? 'pending-orders-report' : 'confirmed-orders-report'
            )
          }
        />
      </Box>

      {/* Sub-tabs for Pending vs Confirmed */}
      <Box sx={{ mb: 2 }}>
        <Tabs
          value={subTab}
          onChange={(e, v) => setSubTab(v)}
          sx={{
            '& .MuiTab-root': { minHeight: 48, fontSize: '0.9rem' },
            bgcolor: 'action.hover',
            borderRadius: 1
          }}
        >
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>⏳</span>
                <span>قيد الانتظار</span>
                <Chip label={pendingOrders.length} size='small' color='warning' />
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>✅</span>
                <span>مؤكدة/مكتملة</span>
                <Chip label={confirmedOrders.length} size='small' color='success' />
              </Box>
            }
          />
        </Tabs>
      </Box>

      <FilterBar onApply={fetchData} onReset={handleReset}>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            size='small'
            type='date'
            label='من تاريخ'
            InputLabelProps={{ shrink: true }}
            value={filters.dateFrom}
            onChange={e => setFilters({ ...filters, dateFrom: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            size='small'
            type='date'
            label='إلى تاريخ'
            InputLabelProps={{ shrink: true }}
            value={filters.dateTo}
            onChange={e => setFilters({ ...filters, dateTo: e.target.value })}
          />
        </Grid>
      </FilterBar>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <Typography variant='body2' component='div' color='text.secondary'>
              إجمالي الطلبات: <Chip label={data.length} size='small' color='primary' />
            </Typography>
            <Typography variant='body2' component='div' color='text.secondary'>
              قيد الانتظار: <Chip label={statusCounts.pending} size='small' color='warning' />
            </Typography>
            <Typography variant='body2' component='div' color='text.secondary'>
              جاري: <Chip label={statusCounts.inProgress} size='small' color='info' />
            </Typography>
            <Typography variant='body2' component='div' color='text.secondary'>
              مكتمل: <Chip label={statusCounts.completed} size='small' color='success' />
            </Typography>
          </Box>
          <ReportTable columns={columns} data={currentData} loading={loading} />
        </CardContent>
      </Card>
    </Box>
  )
}

// ==================== MAIN COMPONENT ====================

export default function ReportsPage() {
  const [tabValue, setTabValue] = useState(0)

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
  }

  const tabs = [
    { label: 'العملاء', icon: '👥' },
    { label: 'الموردين', icon: '🏭' },
    { label: 'المخزون', icon: '📦' },
    { label: 'الفواتير', icon: '🧾' },
    { label: 'الخزينة', icon: '💰' },
    { label: 'العمال', icon: '👷' },
    { label: 'الحضور', icon: '📅' },
    { label: 'الرواتب', icon: '💵' },
    { label: 'أوامر الشراء', icon: '🛒' },
    { label: 'مخزون العملاء', icon: '📋' },
    { label: 'التشغيل', icon: '⚙️' }
  ]

  return (
    <Box sx={{ p: 3 }} dir='rtl'>
      <Typography variant='h4' sx={{ mb: 3, fontWeight: 'bold' }}>
        📊 التقارير
      </Typography>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant='scrollable'
            scrollButtons='auto'
            sx={{
              '& .MuiTab-root': {
                minHeight: 60,
                fontSize: '0.95rem'
              }
            }}
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </Box>
                }
              />
            ))}
          </Tabs>
        </Box>

        <CardContent>
          <TabPanel value={tabValue} index={0}>
            <ClientsReport />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <SuppliersReport />
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            <InventoryReport />
          </TabPanel>
          <TabPanel value={tabValue} index={3}>
            <InvoicesReport />
          </TabPanel>
          <TabPanel value={tabValue} index={4}>
            <SafeReport />
          </TabPanel>
          <TabPanel value={tabValue} index={5}>
            <WorkersReport />
          </TabPanel>
          <TabPanel value={tabValue} index={6}>
            <AttendanceReport />
          </TabPanel>
          <TabPanel value={tabValue} index={7}>
            <SalariesReport />
          </TabPanel>
          <TabPanel value={tabValue} index={8}>
            <PurchaseOrdersReport />
          </TabPanel>
          <TabPanel value={tabValue} index={9}>
            <ClientInventoryReport />
          </TabPanel>
          <TabPanel value={tabValue} index={10}>
            <ManufacturingReport />
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  )
}
