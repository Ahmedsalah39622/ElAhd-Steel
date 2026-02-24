'use client'

import { useEffect, useState, useMemo } from 'react'

import { COMPANY_NAME } from '@/utils/companyInfo'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormControl from '@mui/material/FormControl'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import InputAdornment from '@mui/material/InputAdornment'
import Menu from '@mui/material/Menu'

// Icons
import SearchIcon from '@mui/icons-material/Search'
import RefreshIcon from '@mui/icons-material/Refresh'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import InventoryIcon from '@mui/icons-material/Inventory'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import DeleteIcon from '@mui/icons-material/Delete'
import PrintIcon from '@mui/icons-material/Print'
import FactoryIcon from '@mui/icons-material/Factory'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'
import { useInventoryClient } from '@views/inventory/useInventoryClient'
import { useAuth } from '@core/contexts/authContext'
import CountUp from '@/components/CountUp'
import RecentDeliveriesList from './RecentDeliveriesList'

// Styles
import tableStyles from '@core/styles/table.module.css'

const OperatingStockPage = () => {
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState([])
  const [clients, setClients] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('available')
  const [history, setHistory] = useState([])

  // Actions Menu State
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedRow, setSelectedRow] = useState(null)

  // Delivery Dialog State
  const [deliverDialog, setDeliverDialog] = useState({ open: false, product: null })
  const [delClientId, setDelClientId] = useState('')
  const [delCount, setDelCount] = useState('')
  const [delWeight, setDelWeight] = useState('')
  const [delPrice, setDelPrice] = useState('')

  const { user } = useAuth()
  const client = useInventoryClient()

  const fetchData = async () => {
    setLoading(true)

    try {
      const data = await client.fetchMaterials({ type: 'product' })

      setProducts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch finished products:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients')
      const json = await res.json()

      if (json.data) setClients(json.data)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchHistory = async () => {
    try {
      // We use fetchMaterials but pass action='operating_history' which our API now supports
      const data = await client.fetchMaterials({ action: 'operating_history' })

      setHistory(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Failed to fetch history', e)
    }
  }

  useEffect(() => {
    fetchData()
    fetchHistory() // Load history
    fetchClients()
  }, [])

  // Stats
  const stats = useMemo(() => {
    return {
      totalItems: products.length,
      count: products.reduce((acc, curr) => acc + (Number(curr.count) || Number(curr.stock) || 0), 0),
      weight: products.reduce((acc, curr) => acc + (Number(curr.weight) || 0), 0)
    }
  }, [products])

  const filteredProducts = useMemo(() => {
    const lower = searchQuery.toLowerCase()

    return products.filter(p => {
      const matchesSearch =
        !searchQuery ||
        (p.name && p.name.toLowerCase().includes(lower)) ||
        (p.sku && p.sku.toLowerCase().includes(lower))

      if (!matchesSearch) return false

      const isAvailable = Number(p.count || p.stock || 0) > 0

      if (statusFilter === 'available') return isAvailable
      if (statusFilter === 'out') return !isAvailable

      return true
    })
  }, [products, searchQuery, statusFilter])

  // Handlers
  const handleOpenMenu = (event, row) => {
    setAnchorEl(event.currentTarget)
    setSelectedRow(row)
  }

  const handleCloseMenu = () => {
    setAnchorEl(null)
    setSelectedRow(null)
  }

  const handleDelete = async () => {
    if (!selectedRow) return
    if (!window.confirm('هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.')) return

    try {
      const res = await fetch('/api/inventory', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedRow.id })
      })

      if (res.ok) {
        // Remove from list immediately
        setProducts(prev => prev.filter(p => p.id !== selectedRow.id))

        alert('تم الحذف بنجاح')
        fetchHistory() // Refresh history
        handleCloseMenu()
      } else {
        alert('فشل الحذف')
      }
    } catch (e) {
      console.error(e)
      alert('حدث خطأ أثناء الحذف')
    }
  }

  // Return to Factory State
  const [returnDialog, setReturnDialog] = useState({ open: false, product: null })
  const [returnType, setReturnType] = useState('material')

  const handleOpenReturn = () => {
    setReturnDialog({ open: true, product: selectedRow })
    setReturnType('material') // default
    handleCloseMenu()
  }

  const handleSubmitReturn = async () => {
    if (!returnDialog.product) return

    try {
      const res = await fetch('/api/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: returnDialog.product.id,
          type: returnType,
          materialType: returnType, // Sync both for safety
          user: user?.email || user?.name || 'unknown'
        })
      })

      if (res.ok) {
        // Remove product from list immediately (faster UX)
        setProducts(prev => prev.filter(p => p.id !== returnDialog.product.id))

        alert('تم النقل بنجاح')
        fetchHistory() // Refresh history
        setReturnDialog({ open: false, product: null })
      } else {
        const errorText = await res.text()

        alert('فشل النقل: ' + errorText)
      }
    } catch (e) {
      console.error(e)
      alert('حدث خطأ أثناء النقل')
    }
  }

  const handlePrint = async () => {
    if (!selectedRow) return

    const date = new Date(selectedRow.createdAt).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    const time = new Date(selectedRow.createdAt).toLocaleTimeString('ar-EG')
    const producer = selectedRow.createdBy ? selectedRow.createdBy.split('@')[0] : 'غير معروف'
    const dimensions = selectedRow.length && selectedRow.width ? `${selectedRow.length} x ${selectedRow.width}` : '-'

    // Fetch Ingredients Info
    let ingredientsHTML = ''

    try {
      // We need to fetch transactions for this material to find creation note
      const txs = await client.fetchTransactions(selectedRow.id)

      // Find 'add' action or note with Ingredients
      const creationTx = txs.find(t => t.note && t.note.includes('Ingredients:')) || txs.find(t => t.action === 'add')

      if (creationTx && creationTx.note && creationTx.note.includes('Ingredients:')) {
        const cleanNote = creationTx.note.split('Ingredients:')[1].split('[Job:')[0].trim()
        const itemsList = cleanNote
          .split('|')
          .map(i => i.trim())
          .filter(Boolean)

        if (itemsList.length > 0) {
          const listItems = itemsList.map(item => `<li style="margin-bottom: 4px;">${item}</li>`).join('')

          ingredientsHTML = `
                    <div style="margin-top: 15px; border-top: 1px dashed #ccc; padding-top: 10px;">
                        <div class="label" style="margin-bottom: 5px;">المكونات / المواد المستخدمة:</div>
                        <ul style="margin: 0; padding-right: 20px; font-size: 13px;">${listItems}</ul>
                    </div>
                 `
        }
      }
    } catch (e) {
      console.error('Failed to fetch ingredients for print', e)
    }

    // Create a print window with detailed styling
    const printWindow = window.open('', '_blank')

    printWindow.document.write(`
        <html>
          <head>
            <title>بطاقة منتج - ${selectedRow.name}</title>
            <style>
              @page { size: A6 landscape; margin: 0; }
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                direction: rtl; 
                margin: 0; 
                padding: 10px;
                background: white; 
              }
              .label-container {
                border: 3px solid #000;
                border-radius: 8px;
                padding: 15px;
                min-height: 95vh;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                box-sizing: border-box;
              }
              .header {
                text-align: center;
                border-bottom: 2px solid #333;
                padding-bottom: 10px;
                margin-bottom: 10px;
              }
              .header h1 { margin: 0; font-size: 24px; color: #000; }
              .header p { margin: 5px 0 0; font-size: 14px; color: #555; }
              
              .content { flex-grow: 1; }
              .row { display: flex; justify-content: space-between; margin-bottom: 6px; border-bottom: 1px dashed #eee; padding-bottom: 2px; }
              .label { font-weight: bold; font-size: 14px; color: #444; }
              .value { font-weight: 700; font-size: 16px; color: #000; }
              
              .footer { 
                margin-top: 10px; 
                text-align: center; 
                font-size: 10px; 
                border-top: 1px solid #333;
                padding-top: 5px;
              }
              
              .big-stat {
                display: flex;
                justify-content: space-around;
                background: #f0f0f0;
                padding: 8px;
                border-radius: 6px;
                margin: 8px 0;
                border: 1px solid #999;
              }
              .stat-box { text-align: center; }
              .stat-val { font-size: 18px; font-weight: 900; }
              .stat-lbl { font-size: 11px; }
            </style>
          </head>
          <body>
             <div class="label-container">
                <div class="header">
                   <h1>${COMPANY_NAME}</h1>
                   <p>بطاقة تعريف منتج تام (Finished Good)</p>
                </div>
                
                <div class="content">
                    <div class="row">
                        <span class="label">اسم المنتج:</span>
                        <span class="value">${selectedRow.name}</span>
                    </div>
                    <div class="row">
                        <span class="label">كود الصنف (SKU):</span>
                        <span class="value">${selectedRow.sku}</span>
                    </div>
                    <div class="row">
                        <span class="label">النوع / التصنيف:</span>
                        <span class="value">${selectedRow.materialName || selectedRow.type || '-'}</span>
                    </div>
                     <div class="row">
                        <span class="label">الأبعاد:</span>
                        <span class="value" dir="ltr">${dimensions}</span>
                    </div>
                    
                    <div class="big-stat">
                        <div class="stat-box">
                            <div class="stat-val">${selectedRow.count || 0}</div>
                            <div class="stat-lbl">العدد</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-val">${Number(selectedRow.weight || 0).toFixed(2)}</div>
                            <div class="stat-lbl">الوزن (كجم)</div>
                        </div>
                    </div>

                    <div class="row">
                        <span class="label">تاريخ الإنتاج:</span>
                        <span class="value">${date} - ${time}</span>
                    </div>
                    <div class="row">
                        <span class="label">تم الإنتاج بواسطة:</span>
                        <span class="value">${producer}</span>
                    </div>
                     <div class="row">
                        <span class="label">المنطقة / المخزن:</span>
                        <span class="value">المخزن الرئيسي (Main Zone)</span>
                    </div>

                    ${ingredientsHTML}
                </div>

                <div class="footer">
                    تمت الطباعة آلياً من نظام ${COMPANY_NAME} لإدارة المخزون
                </div>
             </div>
             <script>window.print()</script>
          </body>
        </html>
      `)
    printWindow.document.close()
    handleCloseMenu()
  }

  const handlePrintHistory = () => {
    const printWindow = window.open('', '_blank')

    const rows =
      history.length > 0
        ? history
            .map(
              tx => `
      <tr>
        <td>${new Date(tx.createdAt).toLocaleString('ar-EG')}</td>
        <td>
          ${tx.Material?.name || 'منتج محذوف'}
          ${tx.Material?.sku ? `<br/><small>${tx.Material.sku}</small>` : ''}
        </td>
        <td>${tx.action === 'transfer' ? 'نقل للمصنع' : tx.action === 'withdraw_by_count' && tx.source === 'delivery' ? 'تسليم عميل' : tx.action}</td>
        <td dir="ltr" align="right">${Math.abs(tx.change)}</td>
        <td>${tx.note || tx.reference || '-'}</td>
        <td>${tx.user ? tx.user.split('@')[0] : '-'}</td>
      </tr>
    `
            )
            .join('')
        : '<tr><td colspan="6" style="text-align: center;">لا يوجد سجل عمليات</td></tr>'

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>سجل عمليات التشغيل</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; }
            h1 { text-align: center; color: #333; margin-bottom: 5px; }
            .date { text-align: center; color: #666; font-size: 14px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
            th { background-color: #f2f2f2; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          <h1>سجل عمليات التشغيل والتسليمات</h1>
          <div class="date">تاريخ الطباعة: ${new Date().toLocaleString('ar-EG')}</div>
          <table>
            <thead>
              <tr>
                <th>تاريخ العملية</th>
                <th>المنتج</th>
                <th>العملية</th>
                <th>التغيير</th>
                <th>التفاصيل</th>
                <th>المستخدم</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
          <script>window.print()</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const handleOpenDeliver = product => {
    setDeliverDialog({ open: true, product })
    setDelClientId('')
    setDelCount('')
    setDelWeight('')
    setDelPrice('')
  }

  const handleCloseDeliver = () => setDeliverDialog({ open: false, product: null })

  const handleSubmitDeliver = async () => {
    try {
      const deliveredCount = Number(delCount)
      const productStock = Number(deliverDialog.product.count || deliverDialog.product.stock || 0)

      await client.deliverProduct({
        materialId: deliverDialog.product.id,
        count: deliveredCount,
        weight: delWeight ? Number(delWeight) : null,
        clientId: delClientId,
        price: Number(delPrice),
        user: user?.email || 'unknown'
      })

      // Update UI immediately for faster UX
      if (deliveredCount >= productStock) {
        // All units delivered - remove from list
        setProducts(prev => prev.filter(p => p.id !== deliverDialog.product.id))
      } else {
        // Partial delivery - update count
        setProducts(prev =>
          prev.map(p =>
            p.id === deliverDialog.product.id
              ? { ...p, stock: productStock - deliveredCount, count: productStock - deliveredCount }
              : p
          )
        )
      }

      alert('تم تسليم المنتج بنجاح')
      handleCloseDeliver()
      fetchHistory() // Update history
    } catch (e) {
      alert('خطأ: ' + e.message)
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <div className='flex items-center justify-between gap-4'>
          <div>
            <Typography variant='h4' className='mb-1'>
              مخزن وارد تشغيل
            </Typography>
            <Typography color='text.secondary'>المنتجات التامة والجاهزة للتسليم</Typography>
          </div>
          <Button
            variant='contained'
            onClick={() => {
              fetchData()
              fetchHistory()
            }}
            startIcon={<RefreshIcon />}
          >
            تحديث
          </Button>
        </div>
      </Grid>

      {/* ... Stats ... */}
      <Grid item xs={12} sm={4}>
        <Card>
          <CardContent className='flex gap-3'>
            <CustomAvatar variant='rounded' skin='light' color='primary'>
              <i className='tabler-box' />
            </CustomAvatar>
            <div className='flex flex-col'>
              <Typography variant='h5'>
                <CountUp end={stats.totalItems} />
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                أنواع المنتجات
              </Typography>
            </div>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={4}>
        <Card>
          <CardContent className='flex gap-3'>
            <CustomAvatar variant='rounded' skin='light' color='success'>
              <i className='tabler-check' />
            </CustomAvatar>
            <div className='flex flex-col'>
              <Typography variant='h5'>
                <CountUp end={stats.count} />
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                إجمالي العدد المتاح
              </Typography>
            </div>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={4}>
        <Card>
          <CardContent className='flex gap-3'>
            <CustomAvatar variant='rounded' skin='light' color='warning'>
              <i className='tabler-scale' />
            </CustomAvatar>
            <div className='flex flex-col'>
              <Typography variant='h5'>
                <CountUp end={stats.weight} decimals={2} /> <span className='text-sm'>كجم</span>
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                إجمالي الوزن
              </Typography>
            </div>
          </CardContent>
        </Card>
      </Grid>
      {/* ... End Stats ... */}

      {/* Table */}
      <Grid item xs={12}>
        <Card>
          <CardHeader
            title='قائمة المنتجات (المتاحة)'
            subheader='يتم إخفاء المنتجات التي تم تسليمها تلقائياً'
            action={
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  id='operating-stock-status-filter'
                  select
                  size='small'
                  label='الحالة'
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  sx={{ minWidth: 120 }}
                >
                  <MenuItem value='all'>الكل</MenuItem>
                  <MenuItem value='available'>متوفر (Stock &gt; 0)</MenuItem>
                  <MenuItem value='out'>تم التسليم / نفذ</MenuItem>
                </TextField>
                <TextField
                  id='operating-stock-search'
                  size='small'
                  placeholder='بحث...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <SearchIcon fontSize='small' />
                      </InputAdornment>
                    )
                  }}
                />
              </Box>
            }
          />
          <div className='overflow-x-auto'>
            <table className={tableStyles.table}>
              <thead>
                <tr>
                  <th>المنتج</th>
                  <th>النوع</th>
                  <th>المخزون</th>
                  <th>الوزن</th>
                  <th>الأبعاد</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map(row => (
                    <tr key={row.id}>
                      <td>
                        <div className='flex flex-col'>
                          <Typography variant='body2' className='font-medium'>
                            {row.name}
                          </Typography>
                          <Typography variant='caption' color='text.disabled'>
                            {row.sku}
                          </Typography>
                        </div>
                      </td>
                      <td>
                        <Chip label={row.materialName || 'منتج'} size='small' variant='tonal' />
                      </td>
                      <td>
                        <Typography color='primary.main' className='font-bold'>
                          {row.count || row.stock}
                        </Typography>
                      </td>
                      <td>{Number(row.weight).toFixed(2)}</td>
                      <td>{row.length ? `${row.length} x ${row.width}` : '-'}</td>
                      <td>
                        <Chip
                          label={(row.count || row.stock) > 0 ? 'متوفر' : 'تم التسليم'}
                          color={(row.count || row.stock) > 0 ? 'success' : 'default'}
                          size='small'
                          variant='tonal'
                        />
                      </td>
                      <td>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Button
                            size='small'
                            variant='outlined'
                            onClick={() => handleOpenDeliver(row)}
                            disabled={(row.count || 0) <= 0}
                          >
                            تسليم
                          </Button>
                          <IconButton size='small' onClick={e => handleOpenMenu(e, row)}>
                            <MoreVertIcon />
                          </IconButton>
                        </Box>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className='text-center p-4'>
                      لا توجد منتجات مطابقة للبحث
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </Grid>

      {/* History Section */}
      <Grid item xs={12}>
        <Card>
          <CardHeader
            title='سجل العمليات (History)'
            subheader='قائمة التسليمات والتحويلات السابقة'
            action={
              <IconButton onClick={handlePrintHistory} title='طباعة السجل'>
                <PrintIcon />
              </IconButton>
            }
            avatar={
              <CustomAvatar skin='light' color='warning' variant='rounded'>
                <i className='tabler-history' />
              </CustomAvatar>
            }
          />
          <div className='overflow-x-auto'>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>تاريخ العملية</TableCell>
                  <TableCell>المنتج</TableCell>
                  <TableCell>العملية</TableCell>
                  <TableCell>التغيير (العدد)</TableCell>
                  <TableCell>تفاصيل</TableCell>
                  <TableCell>المستخدم</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.length > 0 ? (
                  history.map(tx => (
                    <TableRow key={tx.id} hover>
                      <TableCell>{new Date(tx.createdAt).toLocaleString('ar-EG')}</TableCell>
                      <TableCell>
                        {tx.Material?.name || 'منتج محذوف'}
                        {tx.Material?.sku && (
                          <Typography variant='caption' display='block'>
                            {tx.Material.sku}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            tx.action === 'transfer'
                              ? 'نقل للمصنع'
                              : tx.action === 'withdraw_by_count' && tx.source === 'delivery'
                                ? 'تسليم عميل'
                                : tx.action
                          }
                          color={tx.action === 'transfer' ? 'warning' : 'info'}
                          size='small'
                        />
                      </TableCell>
                      <TableCell dir='ltr' align='right'>
                        {Math.abs(tx.change) > 0 ? `${Math.abs(tx.change)} pcs` : '-'}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 300 }}>
                        <Typography variant='caption'>{tx.note || tx.reference || '-'}</Typography>
                      </TableCell>
                      <TableCell>{tx.user ? tx.user.split('@')[0] : '-'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align='center'>
                      لا يوجد سجل عمليات سابق
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </Grid>

      {/* Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
        <MenuItem onClick={handlePrint} sx={{ '& svg': { mr: 2 } }}>
          <PrintIcon fontSize='small' /> طباعة
        </MenuItem>
        <MenuItem onClick={handleOpenReturn} sx={{ '& svg': { mr: 2 }, color: 'warning.main' }}>
          <FactoryIcon fontSize='small' /> نقل للمصنع (إعادة تشغيل)
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ '& svg': { mr: 2 }, color: 'error.main' }}>
          <DeleteIcon fontSize='small' /> حذف
        </MenuItem>
      </Menu>

      {/* Deliver Dialog */}
      <Dialog open={deliverDialog.open} onClose={handleCloseDeliver} maxWidth='sm' fullWidth>
        <DialogTitle>تسليم منتج للعميل</DialogTitle>
        <DialogContent>
          <Grid container spacing={4} className='mt-1'>
            <Grid item xs={12}>
              <Typography variant='subtitle2'>المنتج: {deliverDialog.product?.name}</Typography>
              <Typography variant='caption'>المتاح: {deliverDialog.product?.count}</Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                label='العميل'
                fullWidth
                value={delClientId}
                onChange={e => setDelClientId(e.target.value)}
              >
                {clients.map(c => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                label='العدد'
                type='number'
                fullWidth
                value={delCount}
                onChange={e => setDelCount(e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label='الوزن (اختياري)'
                type='number'
                fullWidth
                value={delWeight}
                onChange={e => setDelWeight(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label='السعر (اختياري)'
                type='number'
                fullWidth
                value={delPrice}
                onChange={e => setDelPrice(e.target.value)}
                helperText='يضاف للفاتورة'
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeliver}>إلغاء</Button>
          <Button variant='contained' onClick={handleSubmitDeliver}>
            تأكيد
          </Button>
        </DialogActions>
      </Dialog>
      {/* Dialog 3: Return to Factory */}
      <Dialog
        open={returnDialog.open}
        onClose={() => setReturnDialog({ open: false, product: null })}
        maxWidth='xs'
        fullWidth
      >
        <DialogTitle>إعادة للمخزن / المصنع</DialogTitle>
        <DialogContent>
          <Typography variant='body2' gutterBottom>
            حدد تصنيف المنتج عند إعادته للمخزن:
          </Typography>
          <FormControl component='fieldset'>
            <RadioGroup value={returnType} onChange={e => setReturnType(e.target.value)}>
              <FormControlLabel value='material' control={<Radio />} label='مادة خام (Raw Material)' />
              <FormControlLabel value='accessory' control={<Radio />} label='اكسسوار (Accessory)' />
              <FormControlLabel value='product' control={<Radio />} label='منتج لإعادة التصنيع (Product)' />
            </RadioGroup>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReturnDialog({ open: false, product: null })}>إلغاء</Button>
          <Button variant='contained' onClick={handleSubmitReturn}>
            تأكيد النقل
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  )
}

export default OperatingStockPage
