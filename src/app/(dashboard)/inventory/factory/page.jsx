'use client'

import { useEffect, useState, useMemo } from 'react'

import dynamic from 'next/dynamic'

const MissingPiecesPanel = dynamic(() => import('@views/inventory/MissingPiecesPanel'), { ssr: false })

import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'

import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Card from '@mui/material/Card'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Checkbox from '@mui/material/Checkbox'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import InputAdornment from '@mui/material/InputAdornment'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'
import Divider from '@mui/material/Divider'
import AddIcon from '@mui/icons-material/Add'
import Badge from '@mui/material/Badge'
import Fade from '@mui/material/Fade'
import Barcode from 'react-barcode'

import { useAuth } from '@core/contexts/authContext'
import MaterialReportDialog from '@views/inventory/MaterialReportDialog'
import { useInventoryClient } from '@views/inventory/useInventoryClient'
import OperatingIssueOrderDialog from '@views/inventory/OperatingIssueOrderDialog'

export default function InventoryFactoryPage() {
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportTxs, setReportTxs] = useState([])

  // Add Material State
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newSku, setNewSku] = useState('')
  const [newUnit, setNewUnit] = useState('pcs')
  const [newCategory, setNewCategory] = useState('')
  const [newGrade, setNewGrade] = useState('')
  const [newQty, setNewQty] = useState('')
  const [newLength, setNewLength] = useState('')
  const [newWidth, setNewWidth] = useState('')
  const [newCount, setNewCount] = useState('')
  const [newWeight, setNewWeight] = useState('')
  const [newClass, setNewClass] = useState('factory')
  const [newSupplierId, setNewSupplierId] = useState('')
  const [newDimensionType, setNewDimensionType] = useState('rectangular')
  const [newThickness, setNewThickness] = useState('')

  // Custom input states & dialogs
  const [customUnitDialog, setCustomUnitDialog] = useState(false)
  const [customCategoryDialog, setCustomCategoryDialog] = useState(false)
  const [customGradeDialog, setCustomGradeDialog] = useState(false)
  const [tempCustomValue, setTempCustomValue] = useState('')

  // Dropdown options from database
  const [unitOptions, setUnitOptions] = useState([])
  const [categoryOptions, setCategoryOptions] = useState([])
  const [gradeOptions, setGradeOptions] = useState([])

  // Filters
  const [filter, setFilter] = useState({ q: '', unit: '', minStock: '', maxStock: '', type: '' })
  const [filterAnchorEl, setFilterAnchorEl] = useState(null)

  const [suppliers, setSuppliers] = useState([])
  const [clients, setClients] = useState([])
  const [txDialog, setTxDialog] = useState({ open: false, materialId: null, action: 'add' })
  const [txQty, setTxQty] = useState('')
  const [txSupplierId, setTxSupplierId] = useState('')
  const [txClientId, setTxClientId] = useState('')
  const [txLength, setTxLength] = useState('')
  const [txWidth, setTxWidth] = useState('')
  const [txNote, setTxNote] = useState('')
  const [cuttingResult, setCuttingResult] = useState({ open: false, results: [] })
  const [remnantsRefresh, setRemnantsRefresh] = useState(0)
  const [suggestedRemnants, setSuggestedRemnants] = useState([])
  const [selectedRemnantIds, setSelectedRemnantIds] = useState([])

  // Dispatch to client states
  const [selectedDispatchPieces, setSelectedDispatchPieces] = useState([])
  const [dispatchClientId, setDispatchClientId] = useState('')
  const [dispatchPrice, setDispatchPrice] = useState('')
  const [dispatchLoading, setDispatchLoading] = useState(false)
  const [forceNewSheet, setForceNewSheet] = useState(false)

  // Operating Issue Order dialog state
  const [issueOrderOpen, setIssueOrderOpen] = useState(false)

  // barcode preview dialog state
  const [barcodePreview, setBarcodePreview] = useState({ open: false, material: null })

  const { user } = useAuth()
  const client = useInventoryClient()

  const isAllowed = permission => {
    if (user?.isAdmin) return true
    if (!user?.roles) return false

    return user.roles.some(role => role.permissions?.includes(permission))
  }

  const [tabValue, setTabValue] = useState('1')

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
  }

  const getTabFilter = item => {
    const type = (item.type || item.materialType || '').toLowerCase()

    if (tabValue === '1') return type === 'factory' || type === 'material'
    if (tabValue === '2') return type === 'accessory'
    if (tabValue === '3') return type === 'product'

    return true
  }

  useEffect(() => {
    let mounted = true

    client
      .fetchMaterials()
      .then(data => {
        if (!mounted) return
        const arr = Array.isArray(data) ? data : []

        setMaterials(arr)
      })
      .catch(() => setMaterials([]))
      .finally(() => mounted && setLoading(false))

    return () => (mounted = false)
  }, [])

  useEffect(() => {
    // fetch suppliers and clients for transaction dialogs
    let mounted = true

    ;(async () => {
      try {
        const sRes = await fetch('/api/suppliers', { credentials: 'include' })

        if (!mounted) return
        const sJson = sRes.ok ? await sRes.json() : null

        if (sJson && sJson.data) setSuppliers(sJson.data)
      } catch (e) {
        console.error('Failed to fetch suppliers', e)
      }

      try {
        const cRes = await fetch('/api/clients', { credentials: 'include' })

        if (!mounted) return
        const cJson = cRes.ok ? await cRes.json() : null

        if (cJson && cJson.data) setClients(cJson.data)
      } catch (e) {
        console.error('Failed to fetch clients', e)
      }
    })()

    return () => (mounted = false)
  }, [])

  // Fetch dropdown options from database
  useEffect(() => {
    let mounted = true

    const fetchOptions = async () => {
      try {
        // Fetch units
        const unitsRes = await fetch('/api/material-options?type=units')

        if (mounted && unitsRes.ok) {
          const unitsData = await unitsRes.json()

          setUnitOptions(unitsData.data || [])
        }

        // Fetch categories
        const categoriesRes = await fetch('/api/material-options?type=categories')

        if (mounted && categoriesRes.ok) {
          const categoriesData = await categoriesRes.json()

          setCategoryOptions(categoriesData.data || [])
        }

        // Fetch all grades
        const gradesRes = await fetch('/api/material-options?type=grades')

        if (mounted && gradesRes.ok) {
          const gradesData = await gradesRes.json()

          setGradeOptions(gradesData.data || [])
        }
      } catch (e) {
        console.error('Failed to fetch material options', e)
      }
    }

    fetchOptions()

    return () => (mounted = false)
  }, [])

  const refresh = async () => {
    setLoading(true)

    try {
      const data = await client.fetchMaterials()

      setMaterials(Array.isArray(data) ? data : [])
    } catch (err) {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  // Add custom unit to database
  const handleAddCustomUnit = async () => {
    if (!tempCustomValue.trim()) return

    try {
      const res = await fetch('/api/material-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'unit',
          value: tempCustomValue.trim(),
          label: tempCustomValue.trim()
        })
      })

      if (res.ok) {
        const result = await res.json()

        setUnitOptions(prev => [...prev, result.data])
        setNewUnit(result.data.value)
        setCustomUnitDialog(false)
        setTempCustomValue('')
      } else {
        const error = await res.json()

        alert(error.message || 'فشل في الإضافة')
      }
    } catch (e) {
      console.error('Error adding unit:', e)
      alert('حدث خطأ أثناء الإضافة')
    }
  }

  // Add custom category to database
  const handleAddCustomCategory = async () => {
    if (!tempCustomValue.trim()) return

    try {
      const res = await fetch('/api/material-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'category',
          value: tempCustomValue.trim(),
          label: tempCustomValue.trim()
        })
      })

      if (res.ok) {
        const result = await res.json()

        setCategoryOptions(prev => [...prev, result.data])
        setNewCategory(result.data.value)
        setCustomCategoryDialog(false)
        setTempCustomValue('')
      } else {
        const error = await res.json()

        alert(error.message || 'فشل في الإضافة')
      }
    } catch (e) {
      console.error('Error adding category:', e)
      alert('حدث خطأ أثناء الإضافة')
    }
  }

  // Add custom grade to database
  const handleAddCustomGrade = async () => {
    if (!tempCustomValue.trim() || !newCategory) return

    try {
      const res = await fetch('/api/material-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'grade',
          categoryValue: newCategory,
          value: tempCustomValue.trim(),
          label: tempCustomValue.trim()
        })
      })

      if (res.ok) {
        const result = await res.json()

        setGradeOptions(prev => [...prev, result.data])
        setNewGrade(result.data.value)
        setCustomGradeDialog(false)
        setTempCustomValue('')
      } else {
        const error = await res.json()

        alert(error.message || 'فشل في الإضافة')
      }
    } catch (e) {
      console.error('Error adding grade:', e)
      alert('حدث خطأ أثناء الإضافة')
    }
  }

  const handleCreate = async () => {
    if (!newName) return alert('الاسم مطلوب')

    try {
      await client.createMaterial({
        name: newName,
        sku: newSku,
        unit: newUnit,
        materialType: newClass,
        createdBy: user?.email || user?.name || 'unknown',
        materialName: newCategory || null,
        grade: newGrade || null,
        initialQuantity: newQty ? Number(newQty) : 0,
        length: newLength ? Number(newLength) : null,
        width: newWidth ? Number(newWidth) : null,
        count: newCount ? Number(newCount) : 0,
        weight: newWeight ? Number(newWeight) : 0,
        supplierId: newSupplierId || null,
        dimensionType: newDimensionType || 'rectangular',
        thickness: newThickness ? Number(newThickness) : null,
        type: 'material'
      })
      setNewName('')
      setNewSku('')
      setNewCategory('')
      setNewGrade('')
      setNewQty('')
      setNewLength('')
      setNewWidth('')
      setNewCount('')
      setNewWeight('')
      setNewSupplierId('')
      setNewDimensionType('rectangular')
      setNewThickness('')
      setAddDialogOpen(false) // Close dialog
      await refresh()
    } catch (err) {
      alert(err.message || 'فشل في الإنشاء')
    }
  }

  const handleDelete = async id => {
    if (!confirm('هل أنت متأكد من حذف هذه المادة؟ لا يمكن التراجع عن هذا الإجراء.')) return

    try {
      await client.deleteMaterial(id)
      await refresh()
      alert('تم الحذف بنجاح')
    } catch (err) {
      alert('فشل الحذف: ' + err.message)
    }
  }

  const handleAdjust = async (materialId, action) => {
    setTxQty('')
    setTxSupplierId('')
    setTxClientId('')
    setTxLength('')
    setTxWidth('')
    setTxNote('')
    setForceNewSheet(false)
    setSelectedRemnantIds([])
    setTxDialog({ open: true, materialId, action })
  }

  // Fetch suggested remnants code
  useEffect(() => {
    let mounted = true

    const fetchSuggestions = async () => {
      if (txDialog.action !== 'remove' || !txDialog.materialId || !txLength || !txWidth) {
        setSuggestedRemnants([])

        return
      }

      try {
        const L = Number(txLength)
        const W = Number(txWidth)

        if (L <= 0 || W <= 0) return

        const params = new URLSearchParams({
          materialId: txDialog.materialId,
          status: 'available',
          isLeftover: 'true'
        })

        const res = await fetch('/api/material-pieces?' + params.toString())

        if (!mounted) return

        if (res.ok) {
          const json = await res.json()
          const list = Array.isArray(json) ? json : []

          const compatible = list.filter(p => {
            const pL = Number(p.length)
            const pW = Number(p.width)
            const fitsNormal = pL >= L && pW >= W
            const fitsRotated = pL >= W && pW >= L

            return fitsNormal || fitsRotated
          })

          compatible.sort((a, b) => a.length * a.width - b.length * b.width)
          setSuggestedRemnants(compatible)
        }
      } catch (err) {
        console.error('Failed to fetch suggestions', err)
      }
    }

    const timer = setTimeout(fetchSuggestions, 300)

    return () => {
      mounted = false
      clearTimeout(timer)
    }
  }, [txDialog.materialId, txDialog.action, txLength, txWidth, remnantsRefresh])

  const handleTxSubmit = async ({ materialId, action, amount, supplierId, clientId, note }) => {
    if (!amount || Number(amount) <= 0) return alert('الكمية مطلوبة')
    const userId = user?.email || user?.name || 'unknown'
    const source = 'client'
    const reference = String(clientId || '')
    const hasDimensions = txLength && txWidth && action === 'remove'

    try {
      const response = await client.transact({
        materialId,
        amount,
        action,
        user: userId,
        source,
        reference,
        note,
        length: txLength ? Number(txLength) : null,
        width: txWidth ? Number(txWidth) : null,
        specificPieceId: selectedRemnantIds.length > 0 ? selectedRemnantIds[0] : null,
        forceNewSheet: forceNewSheet
      })

      setTxDialog({ open: false, materialId: null, action: 'add' })
      setSelectedRemnantIds([])
      setForceNewSheet(false)

      if (hasDimensions && response && response.results && response.results.length > 0) {
        setCuttingResult({ open: true, results: response.results })
        setRemnantsRefresh(prev => prev + 1)
      }

      await refresh()
    } catch (err) {
      if (err && err.code === 'NEGATIVE_STOCK') {
        const ok = confirm(err.message + '\n\nForce consume and allow negative stock?')

        if (ok) {
          try {
            const response = await client.transact({
              materialId,
              amount,
              action,
              user: userId,
              source,
              reference,
              note,
              length: txLength ? Number(txLength) : null,
              width: txWidth ? Number(txWidth) : null,
              allowNegative: true
            })

            setTxDialog({ open: false, materialId: null, action: 'add' })
            setSelectedRemnantIds([])
            setForceNewSheet(false)

            if (hasDimensions && response && response.results && response.results.length > 0) {
              setCuttingResult({ open: true, results: response.results })
              setRemnantsRefresh(prev => prev + 1)
            }

            await refresh()

            return
          } catch (err2) {
            alert(err2.message || 'فشل في العملية')

            return
          }
        }
      }

      alert(err.message || 'فشل في العملية')
    }
  }

  const openReport = async materialId => {
    try {
      const txs = await client.fetchTransactions(materialId)

      setReportTxs(txs || [])
      setReportOpen(true)
    } catch (err) {
      alert('فشل في تحميل التقرير')
    }
  }

  const handleDispatchToClient = async () => {
    if (selectedDispatchPieces.length === 0) return alert('اختر قطعة واحدة على الأقل')
    if (!dispatchClientId) return alert('اختر عميل')
    setDispatchLoading(true)

    try {
      let lastInvoiceNumber = ''

      let totalBudgetDeducted = 0

      for (const piece of selectedDispatchPieces) {
        const res = await fetch('/api/dispatch-piece', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pieceId: piece.id,
            clientId: dispatchClientId,
            length: piece.length,
            width: piece.width,
            materialId: piece.materialId || cuttingResult.results[0]?.consumedPiece?.materialId,
            price: dispatchPrice ? Number(dispatchPrice) : 0
          })
        })

        if (!res.ok) {
          console.error(`Failed to dispatch piece ${piece.id}`)
        } else {
          const data = await res.json()

          lastInvoiceNumber = data.invoiceNumber || lastInvoiceNumber
          totalBudgetDeducted += Number(data.budgetDeducted || 0)
        }
      }

      let msg = `تم صرف ${selectedDispatchPieces.length} قطعة للعميل بنجاح!`
      if (lastInvoiceNumber) msg += `\nفاتورة رقم: ${lastInvoiceNumber}`
      if (totalBudgetDeducted > 0) msg += `\nتم خصم ${totalBudgetDeducted} ج.م من رصيد العميل`

      alert(msg)
      setSelectedDispatchPieces([])
      setDispatchClientId('')
      setDispatchPrice('')
      setCuttingResult({ open: false, results: [] })
      setRemnantsRefresh(prev => prev + 1)
      await refresh()
    } catch (err) {
      alert(err.message || 'فشل في صرف القطع')
    } finally {
      setDispatchLoading(false)
    }
  }

  // Calculate stats
  const totalItems = useMemo(() => materials.filter(m => getTabFilter(m)).length, [materials, tabValue])

  const lowStockItems = useMemo(
    () => materials.filter(m => getTabFilter(m) && Number(m.stock) <= Number(filter.minStock || 5)).length,
    [materials, tabValue, filter.minStock]
  )

  const getTabCount = typeVal => {
    if (typeVal === '1')
      return materials.filter(
        m => (m.type || m.materialType || '').toLowerCase() === 'factory' || (m.type || '').toLowerCase() === 'material'
      ).length
    if (typeVal === '2')
      return materials.filter(m => (m.type || m.materialType || '').toLowerCase() === 'accessory').length
    if (typeVal === '3')
      return materials.filter(m => (m.type || m.materialType || '').toLowerCase() === 'product').length

    return 0
  }

  return (
    <div className='p-6' dir='rtl'>
      {/* Top Header */}
      <Box
        sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2 }}
      >
        <Box>
          <Typography variant='h5' fontWeight='bold' color='text.primary'>
            🏭 إدارة المخزون
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
            <Chip
              label={`${totalItems} عنصر`}
              size='small'
              variant='outlined'
              color='primary'
              sx={{ borderRadius: 1 }}
            />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {isAllowed('manufacturing') && (
            <Button
              variant='outlined'
              color='warning'
              onClick={() => setIssueOrderOpen(true)}
              startIcon={<i className='tabler-file-export' />}
            >
              إذن تشغيل
            </Button>
          )}
          <Button
            variant='contained'
            // Use primary color, do not hardcode BG
            color='primary'
            onClick={() => setAddDialogOpen(true)}
            startIcon={<i className='tabler-plus' />}
            sx={{ boxShadow: 2 }}
          >
            مادة جديدة
          </Button>
        </Box>
      </Box>

      {/* Missing Pieces Panel */}
      {process.env.NEXT_PUBLIC_ENABLE_CUTTING === 'true' && (
        <div style={{ marginBottom: 24 }}>
          <MissingPiecesPanel refreshTrigger={remnantsRefresh} />
        </div>
      )}

      <Card sx={{ bgcolor: 'background.paper', overflow: 'hidden', boxShadow: 2 }}>
        {/* Tabs & Search Header */}
        <Box
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1,
            gap: 2,
            bgcolor: 'background.default'
          }}
        >
          <TabContext value={tabValue}>
            <TabList onChange={handleTabChange} aria-label='inventory tabs' variant='scrollable' scrollButtons='auto'>
              <Tab
                icon={
                  <Badge
                    badgeContent={getTabCount('1')}
                    color='primary'
                    sx={{ '& .MuiBadge-badge': { fontSize: 10, minWidth: 16, height: 16 } }}
                  >
                    <i className='tabler-box' style={{ marginRight: 8 }} />
                  </Badge>
                }
                iconPosition='start'
                label='المواد الخام'
                value='1'
              />
              <Tab
                icon={
                  <Badge
                    badgeContent={getTabCount('2')}
                    color='warning'
                    sx={{ '& .MuiBadge-badge': { fontSize: 10, minWidth: 16, height: 16 } }}
                  >
                    <i className='tabler-tool' style={{ marginRight: 8 }} />
                  </Badge>
                }
                iconPosition='start'
                label='الإكسسوارات'
                value='2'
              />
              <Tab
                icon={
                  <Badge
                    badgeContent={getTabCount('3')}
                    color='success'
                    sx={{ '& .MuiBadge-badge': { fontSize: 10, minWidth: 16, height: 16 } }}
                  >
                    <i className='tabler-package' style={{ marginRight: 8 }} />
                  </Badge>
                }
                label='منتجات لإعادة التصنيع'
                value='3'
              />
            </TabList>
          </TabContext>

          {/* Search Bar */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 2 }}>
            <TextField
              placeholder='بحث (اسم، كود...)'
              size='small'
              value={filter.q}
              onChange={e => setFilter(prev => ({ ...prev, q: e.target.value }))}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <i className='tabler-search text-gray-400' />
                  </InputAdornment>
                ),
                sx: { bgcolor: 'background.paper', width: 220, fontSize: '0.9rem' }
              }}
            />
          </Box>
        </Box>

        {/* Content Table */}
        <TableContainer sx={{ maxHeight: 600 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  border: '4px solid #eee',
                  borderTopColor: '#1976d2',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}
              />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </Box>
          ) : (
            <Table stickyHeader size='medium'>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>المادة / الرمز</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>التصنيف</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>الرصيد</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>المواصفات</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>إجراءات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {materials
                  .filter(m => getTabFilter(m))
                  .filter(m => {
                    const q = (filter.q || '').toString().trim().toLowerCase()

                    if (q) {
                      const match = (m.name || '').toLowerCase().includes(q) || (m.sku || '').toLowerCase().includes(q)

                      if (!match) return false
                    }

                    if (filter.unit && m.unit !== filter.unit) return false
                    if (filter.minStock && Number(m.stock) < Number(filter.minStock)) return false

                    return true
                  })
                  .map(material => {
                    const isLowStock = Number(material.stock) <= Number(filter.minStock || 5)

                    return (
                      <TableRow key={material.id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant='subtitle2' fontWeight='bold'>
                              {material.name}
                            </Typography>
                            {material.sku && (
                              <Typography
                                variant='caption'
                                sx={{ bgcolor: 'action.hover', px: 0.5, borderRadius: 0.5, fontFamily: 'monospace' }}
                              >
                                {material.sku}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>{material.materialName || '-'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography fontWeight='bold' color={isLowStock ? 'error.main' : 'text.primary'}>
                              {Number(material.stock).toLocaleString()}
                            </Typography>
                            <Typography variant='caption' color='text.secondary'>
                              {material.unit}
                            </Typography>
                            {isLowStock && (
                              <Tooltip title='مخزون منخفض'>
                                <i className='tabler-alert-circle text-red-500' style={{ fontSize: 16 }} />
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            {material.grade && (
                              <Typography variant='caption' display='block'>
                                الدرجة: {material.grade}
                              </Typography>
                            )}
                            {Number(material.weight) > 0 && (
                              <Typography variant='caption' display='block'>
                                وزن: {Number(material.weight).toFixed(2)} كجم
                              </Typography>
                            )}
                            {material.length && Number(material.length) > 0 && (
                              <Tooltip title='اضغط لتغيير نوع البُعد (عرض / قطر)'>
                                <Typography
                                  variant='caption'
                                  display='block'
                                  sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main', textDecoration: 'underline' } }}
                                  onClick={async () => {
                                    const newType = material.dimensionType === 'circular' ? 'rectangular' : 'circular'
                                    const label = newType === 'circular' ? 'قطر (دائري)' : 'عرض (مستطيل)'

                                    if (!confirm(`تغيير نوع البُعد إلى: ${label}؟`)) return

                                    try {
                                      await client.updateMaterial(material.id, { dimensionType: newType })
                                      await refresh()
                                    } catch (err) {
                                      alert('فشل التحديث: ' + err.message)
                                    }
                                  }}
                                >
                                  {material.dimensionType === 'circular'
                                    ? `أبعاد (طول × قطر): ${Number(material.length)}×ø${Number(material.width)}${material.thickness ? ` (سُمك: ${Number(material.thickness)})` : ''}`
                                    : `أبعاد (طول × عرض): ${Number(material.length)}×${Number(material.width)}`}
                                </Typography>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align='center'>
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                            <Tooltip title='إضافة رصيد'>
                              <IconButton size='small' color='primary' onClick={() => handleAdjust(material.id, 'add')}>
                                <i className='tabler-plus' />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title='صرف / قص'>
                              <IconButton
                                size='small'
                                color='warning'
                                onClick={() => handleAdjust(material.id, 'remove')}
                              >
                                <i className='tabler-minus' />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title='طباعة باركود'>
                              <IconButton
                                size='small'
                                onClick={() => setBarcodePreview({ open: true, material })}
                              >
                                <i className='tabler-printer' />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title='تقرير حركة'>
                              <IconButton size='small' onClick={() => openReport(material.id)}>
                                <i className='tabler-clipboard-list' />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title='حذف'>
                              <IconButton size='small' color='error' onClick={() => handleDelete(material.id)}>
                                <i className='tabler-trash' />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                {materials.filter(m => getTabFilter(m)).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align='center' sx={{ py: 8 }}>
                      <Typography color='text.secondary'>لا توجد سجلات</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      </Card>

      {/* Add Material Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth='lg'
        fullWidth
        TransitionComponent={Fade}
        transitionDuration={300}
        PaperProps={{
          sx: {
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            py: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <i className='tabler-box-seam' />
            <Typography variant='h6'>إضافة مادة جديدة</Typography>
          </Box>
          <IconButton onClick={() => setAddDialogOpen(false)} color='inherit'>
            <i className='tabler-x' />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 4 }}>
          <Box sx={{ mt: 1 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant='subtitle2' sx={{ mb: 1, color: 'primary.main', fontWeight: 'bold' }}>
                  بيانات أساسية
                </Typography>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  select
                  label='تصنيف المادة'
                  SelectProps={{ native: true }}
                  value={newClass}
                  onChange={e => setNewClass(e.target.value)}
                  variant='outlined'
                  size='medium'
                >
                  <option value='factory'>مادة خام (Raw)</option>
                  <option value='accessory'>اكسسوار (Accessory)</option>
                  <option value='product'>منتج لإعادة التصنيع (Product)</option>
                </TextField>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label='اسم المادة'
                  placeholder='مثال: لوح ستانلس'
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  size='medium'
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label='الكود (SKU)'
                  value={newSku}
                  onChange={e => setNewSku(e.target.value)}
                  size='medium'
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  select
                  label='الوحدة'
                  value={newUnit}
                  onChange={e => {
                    if (e.target.value === 'custom') {
                      setCustomUnitDialog(true)
                      setTempCustomValue('')
                    } else {
                      setNewUnit(e.target.value)
                    }
                  }}
                  size='medium'
                >
                  <MenuItem value=''>اختر...</MenuItem>
                  {unitOptions.map(unit => (
                    <MenuItem key={unit.id} value={unit.value}>
                      {unit.label}
                    </MenuItem>
                  ))}
                  <Divider />
                  <MenuItem value='custom' sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                    <AddIcon fontSize='small' sx={{ mr: 1 }} />
                    إضافة وحدة جديدة
                  </MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  select
                  label='نوع الخامة'
                  value={newCategory}
                  onChange={e => {
                    if (e.target.value === 'custom') {
                      setCustomCategoryDialog(true)
                      setTempCustomValue('')
                    } else {
                      setNewCategory(e.target.value)
                      setNewGrade('')
                    }
                  }}
                  size='medium'
                >
                  <MenuItem value=''>اختر...</MenuItem>
                  {categoryOptions.map(cat => (
                    <MenuItem key={cat.id} value={cat.value}>
                      {cat.label}
                    </MenuItem>
                  ))}
                  <Divider />
                  <MenuItem value='custom' sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                    <AddIcon fontSize='small' sx={{ mr: 1 }} />
                    إضافة نوع خامة جديد
                  </MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={4}>
                {/* Dynamic Durability/Grade Field - always dropdown */}
                <TextField
                  fullWidth
                  select
                  label='المتانة / الدرجة'
                  value={newGrade}
                  onChange={e => {
                    if (e.target.value === 'custom') {
                      setCustomGradeDialog(true)
                      setTempCustomValue('')
                    } else {
                      setNewGrade(e.target.value)
                    }
                  }}
                  size='medium'
                >
                  <MenuItem value=''>اختر...</MenuItem>
                  {(newCategory ? gradeOptions.filter(g => g.categoryValue === newCategory) : gradeOptions).map(
                    grade => (
                      <MenuItem key={grade.id} value={grade.value}>
                        {grade.label}
                      </MenuItem>
                    )
                  )}
                  <Divider />
                  <MenuItem value='custom' sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                    <AddIcon fontSize='small' sx={{ mr: 1 }} />
                    إضافة درجة جديدة
                  </MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label='المورد'
                  SelectProps={{ native: true }}
                  value={newSupplierId}
                  onChange={e => setNewSupplierId(e.target.value)}
                  size='medium'
                >
                  <option value=''>اختر مورد...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </TextField>
              </Grid>

              {/* Stock & Dimensions Divider */}
              <Grid item xs={12}>
                <Box sx={{ mt: 2, mb: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant='subtitle2' sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                    الأرصدة والأبعاد (اختياري)
                  </Typography>
                  <Box sx={{ height: 1, flex: 1, bgcolor: 'divider' }} />
                </Box>
              </Grid>

              <Grid item xs={6} md={3}>
                <TextField
                  fullWidth
                  type='number'
                  label='العدد'
                  value={newCount}
                  onChange={e => setNewCount(e.target.value)}
                  size='medium'
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField
                  fullWidth
                  type='number'
                  label='الوزن الكلي (كجم)'
                  value={newWeight}
                  onChange={e => setNewWeight(e.target.value)}
                  size='medium'
                />
              </Grid>
              {process.env.NEXT_PUBLIC_ENABLE_CUTTING === 'true' && (
                <>
                  <Grid item xs={6} md={3}>
                    <TextField
                      fullWidth
                      select
                      SelectProps={{ native: true }}
                      label='نمط الأبعاد'
                      value={newDimensionType}
                      onChange={e => setNewDimensionType(e.target.value)}
                      size='medium'
                    >
                      <option value='rectangular'>عرض (مستطيل)</option>
                      <option value='circular'>قطر (دائري - أنبوب/ماسورة)</option>
                    </TextField>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField
                      fullWidth
                      type='number'
                      label='الطول (متر)'
                      value={newLength}
                      onChange={e => setNewLength(e.target.value)}
                      size='medium'
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField
                      fullWidth
                      type='number'
                      label={newDimensionType === 'circular' ? 'القطر (مم) ' : 'العرض '}
                      value={newWidth}
                      onChange={e => setNewWidth(e.target.value)}
                      size='medium'
                      helperText={newDimensionType === 'circular' ? 'القطر الخارجي للأنبوب' : ''}
                    />
                  </Grid>
                  {newDimensionType === 'circular' && (
                    <Grid item xs={6} md={3}>
                      <TextField
                        fullWidth
                        type='number'
                        label='السُمك (مم)'
                        value={newThickness}
                        onChange={e => setNewThickness(e.target.value)}
                        size='medium'
                        helperText='سُمك جدار الأنبوب'
                      />
                    </Grid>
                  )}
                </>
              )}

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type='number'
                  label='الرصيد الافتتاحي'
                  placeholder='الكمية بالوحدة المختارة'
                  value={newQty}
                  onChange={e => setNewQty(e.target.value)}
                  InputProps={{
                    endAdornment: <InputAdornment position='end'>{newUnit}</InputAdornment>
                  }}
                  size='medium'
                  sx={{ bgcolor: 'background.default' }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: 'background.default' }}>
          <Button onClick={() => setAddDialogOpen(false)} color='inherit'>
            إلغاء
          </Button>
          <Button onClick={handleCreate} variant='contained' color='primary'>
            حفظ
          </Button>
        </DialogActions>
      </Dialog>

      {/* Barcode preview dialog */}
      <Dialog open={barcodePreview.open} onClose={() => setBarcodePreview({ open: false, material: null })} maxWidth='xs' fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography>معاينة باركود</Typography>
          <IconButton onClick={() => setBarcodePreview({ open: false, material: null })}>
            <i className='tabler-x' />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pt: 3 }}>
          {barcodePreview.material ? (
            <div>
              <Typography variant='h6' sx={{ mb: 2 }}>
                {barcodePreview.material.name}
              </Typography>
              <div style={{ display: 'inline-block', padding: 12, border: '1px solid #ddd', borderRadius: 8 }}>
                <Barcode value={String(barcodePreview.material.sku || barcodePreview.material.id)} format='CODE128' />
                <Typography variant='body2' sx={{ mt: 1 }}>{barcodePreview.material.sku || barcodePreview.material.id}</Typography>
              </div>
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Button
                  variant='contained'
                  onClick={() => window.open(`/api/print-barcode?materialId=${barcodePreview.material.id}`, '_blank')}
                >
                  طباعة
                </Button>
                <Button variant='outlined' onClick={() => setBarcodePreview({ open: false, material: null })}>
                  إغلاق
                </Button>
              </Box>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Transaction Dialog (Keep existing logic) */}
      <Dialog
        open={txDialog.open}
        onClose={() => {
          setTxDialog({ open: false, materialId: null })
          setSelectedRemnantIds([])
          setForceNewSheet(false)
        }}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: txDialog.action === 'add' ? 'success.main' : 'warning.main', color: 'white' }}>
          {txDialog.action === 'add' ? 'إضافة رصيد (وارد)' : 'صرف / قص (صادر)'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <div className='flex flex-col gap-4 mt-2'>
            {txDialog.action === 'add' && (
              <TextField
                select
                SelectProps={{ native: true }}
                label='المورد'
                value={txSupplierId}
                onChange={e => setTxSupplierId(e.target.value)}
                size='small'
                fullWidth
              >
                <option value=''> </option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </TextField>
            )}

            {txDialog.action === 'remove' && (
              <>
                <TextField
                  select
                  SelectProps={{ native: true }}
                  label='العميل / الجهة'
                  value={txClientId}
                  onChange={e => setTxClientId(e.target.value)}
                  size='small'
                  fullWidth
                >
                  <option value=''> </option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </TextField>

                {/* Dimensions inputs for advanced cutting */}
                {process.env.NEXT_PUBLIC_ENABLE_CUTTING === 'true' && (
                  <>
                    <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                      <Typography variant='caption' fontWeight='bold' color='primary' display='block' mb={1}>
                        {(() => {
                          const currentMaterial = materials.find(m => m.id === txDialog.materialId)
                          const isCircular = currentMaterial?.dimensionType === 'circular'

                          return isCircular ? 'أبعاد القص (طول × قطر) - اختياري' : 'أبعاد القص (طول × عرض) - اختياري'
                        })()}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                          label='الطول'
                          type='number'
                          size='small'
                          value={txLength}
                          onChange={e => setTxLength(e.target.value)}
                          fullWidth
                          sx={{ bgcolor: 'white' }}
                        />
                        <TextField
                          label={(() => {
                            const currentMaterial = materials.find(m => m.id === txDialog.materialId)
                            const isCircular = currentMaterial?.dimensionType === 'circular'

                            return isCircular ? 'القطر' : 'العرض'
                          })()}
                          type='number'
                          size='small'
                          value={txWidth}
                          onChange={e => setTxWidth(e.target.value)}
                          fullWidth
                          sx={{ bgcolor: 'white' }}
                        />
                      </Box>
                    </Box>

                    {/* Suggested Remnants Panel */}
                    {suggestedRemnants.length > 0 && (
                      <Card variant='outlined' sx={{ p: 1, bgcolor: 'action.hover', borderColor: 'divider' }}>
                        <Typography
                          variant='caption'
                          fontWeight='bold'
                          color='primary'
                          display='flex'
                          alignItems='center'
                          gap={0.5}
                        >
                          <i className='tabler-bulb' />
                          فرصة توفير (بواقي متاحة):
                        </Typography>
                        <div className='flex flex-col gap-1 mt-1 max-h-32 overflow-y-auto'>
                          {suggestedRemnants.map(rem => (
                            <div
                              key={rem.id}
                              onClick={() => {
                                const exists = selectedRemnantIds.includes(rem.id)

                                if (exists) {
                                  setSelectedRemnantIds(prev => prev.filter(id => id !== rem.id))
                                } else {
                                  setSelectedRemnantIds(prev => [...prev, rem.id])
                                }
                              }}
                              className={`p-1 border rounded cursor-pointer text-xs flex justify-between items-center ${
                                selectedRemnantIds.includes(rem.id)
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-background-default hover:bg-action-hover'
                              }`}
                            >
                              <span>
                                #{rem.id} | {Number(rem.length)}x{Number(rem.width)}
                              </span>
                              <span>({Number((rem.length * rem.width) / 1000000).toFixed(2)}m²)</span>
                            </div>
                          ))}
                        </div>
                        {selectedRemnantIds.length > 0 && (
                          <Typography
                            variant='caption'
                            sx={{ display: 'block', mt: 0.5, color: 'success.dark', fontWeight: 'bold' }}
                          >
                            ✅ سيتم القص من {selectedRemnantIds.length} قطعة: #{selectedRemnantIds.join(', #')}
                            {selectedRemnantIds.length > 1 && (
                              <span style={{ display: 'block', fontSize: '0.7rem', color: 'text.secondary' }}>
                                (سيتم استخدام القطعة الأولى)
                              </span>
                            )}
                          </Typography>
                        )}
                      </Card>
                    )}

                    <div className='flex items-center gap-2'>
                      <Checkbox
                        checked={forceNewSheet}
                        onChange={e => setForceNewSheet(e.target.checked)}
                        disabled={selectedRemnantIds.length > 0}
                        size='small'
                      />
                      <Typography variant='caption'>استخدام لوح جديد (إجبار)</Typography>
                    </div>
                  </>
                )}
              </>
            )}

            <TextField
              label='الكمية'
              type='number'
              value={txQty}
              onChange={e => setTxQty(e.target.value)}
              size='small'
              fullWidth
            />

            <TextField
              label='ملاحظات'
              multiline
              rows={2}
              value={txNote}
              onChange={e => setTxNote(e.target.value)}
              size='small'
              fullWidth
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setTxDialog({ open: false, materialId: null })
              setSelectedRemnantIds([])
              setForceNewSheet(false)
            }}
            color='inherit'
          >
            إلغاء
          </Button>
          <Button
            variant='contained'
            color={txDialog.action === 'add' ? 'success' : 'warning'}
            onClick={() =>
              handleTxSubmit({
                materialId: txDialog.materialId,
                action: txDialog.action,
                amount: txQty,
                supplierId: txSupplierId,
                clientId: txClientId,
                note: txNote
              })
            }
          >
            تأكيد
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reuse Report Dialog */}
      <MaterialReportDialog open={reportOpen} onClose={() => setReportOpen(false)} transactions={reportTxs} />

      {/* Cutting Result Dialog */}
      <Dialog
        open={cuttingResult.open}
        onClose={() => setCuttingResult({ open: false, results: [] })}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle sx={{ color: 'success.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <i className='tabler-check' />
          تم التنفيذ بنجاح
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant='body2' sx={{ mb: 2 }}>
            تفاصيل العملية:
          </Typography>

          {cuttingResult.results.map((res, idx) => (
            <Card key={idx} variant='outlined' sx={{ mb: 2, p: 2, bgcolor: 'background.default' }}>
              <Typography variant='subtitle2' fontWeight='bold'>
                القطعة المستهلكة:
              </Typography>
              <Typography variant='body2' fontFamily='monospace' fontSize='0.8rem'>
                #{res.consumedPiece?.id} | {Number(res.consumedPiece?.length)}x{Number(res.consumedPiece?.width)}
              </Typography>

              <Typography variant='subtitle2' fontWeight='bold' sx={{ mt: 1, color: 'warning.main' }}>
                الفضلات المتبقية:
              </Typography>
              {res.leftovers && res.leftovers.length > 0 ? (
                <div className='flex flex-wrap gap-2 mt-1'>
                  {res.leftovers.map(l => (
                    <Chip
                      key={l.id}
                      label={`${Number(l.length)}x${Number(l.width)}`}
                      color='warning'
                      variant='outlined'
                      size='small'
                    />
                  ))}
                </div>
              ) : (
                <Typography variant='caption' color='text.secondary'>
                  استهلاك كامل (بدون فضلات)
                </Typography>
              )}
            </Card>
          ))}

          <Box sx={{ mt: 2, borderTop: 1, borderColor: 'divider', pt: 2 }}>
            <Typography variant='subtitle2' fontWeight='bold' mb={1}>
              إصدار فاتورة للعميل (اختياري)
            </Typography>

            <TextField
              fullWidth
              select
              SelectProps={{ native: true }}
              label='العميل'
              size='small'
              value={dispatchClientId}
              onChange={e => setDispatchClientId(e.target.value)}
              sx={{ mb: 1 }}
            >
              <option value=''> </option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </TextField>

            <TextField
              fullWidth
              type='number'
              label='السعر'
              size='small'
              value={dispatchPrice}
              onChange={e => setDispatchPrice(e.target.value)}
              sx={{ mb: 2 }}
            />

            <Typography variant='caption' display='block' mb={1}>
              القطع المراد صرفها (اضغط للاختيار):
            </Typography>
            <div className='flex flex-wrap gap-2'>
              {cuttingResult.results.map((res, i) => (
                <Chip
                  key={i}
                  label={`القصة: ${Number(res.consumedPiece?.length)}x${Number(res.consumedPiece?.width)}`}
                  // clickable
                  color={selectedDispatchPieces.some(p => p.id === res.consumedPiece?.id) ? 'primary' : 'default'}
                  onClick={() => {
                    const p = res.consumedPiece
                    const exists = selectedDispatchPieces.find(x => x.id === p.id)

                    if (exists) setSelectedDispatchPieces(prev => prev.filter(x => x.id !== p.id))
                    else setSelectedDispatchPieces(prev => [...prev, p])
                  }}
                />
              ))}
            </div>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCuttingResult({ open: false, results: [] })} color='inherit'>
            إغلاق
          </Button>
          <Button
            variant='contained'
            color='success'
            onClick={handleDispatchToClient}
            disabled={selectedDispatchPieces.length === 0 || !dispatchClientId || dispatchLoading}
            startIcon={<i className='tabler-file-invoice' />}
          >
            {dispatchLoading ? 'جاري...' : 'إصدار الفاتورة'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Operating Issue Order Dialog */}
      {/* Operating Issue Order Dialog */}
      <OperatingIssueOrderDialog
        open={issueOrderOpen}
        onClose={() => setIssueOrderOpen(false)}
        materials={materials}
        onSubmit={async data => {
          try {
            // Determine user
            const currentUser = user?.email || user?.name || 'unknown'

            // Generate unique Job ID for this issue order
            const jobId = `JOB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

            // Job Card Data with unique jobId - clean values to prevent NaN
            const jobCard = {
              jobId: jobId, // Unique identifier for this issue order
              expectedName: data.expectedName || '',
              expectedType: data.expectedType || '',
              expectedCount: data.expectedCount || null,
              expectedWeight: data.expectedWeight || null
            }

            console.log('=== Factory Page: Job Card Created ===', jobCard)

            // Iterate and submit transactions
            for (const item of data.items) {
              console.log('=== Factory Page: Processing Item ===', item)

              const remnantIds = item.selectedRemnantIds || []

              // If multiple remnants selected, create separate transaction for each
              if (remnantIds.length > 0) {
                for (const remnantId of remnantIds) {
                  console.log('=== Factory Page: Processing Remnant ===', remnantId)
                  await client.issueOrder({
                    materialId: item.materialId,
                    countToDeduct: 1, // Each remnant is 1 piece
                    weightToDeduct: null,
                    description: data.description,
                    user: currentUser,
                    jobCard,
                    length: item.length,
                    width: item.width,
                    selectedRemnantIds: [remnantId] // Single remnant per request
                  })
                }
              } else {
                // No remnants selected, use regular deduction
                await client.issueOrder({
                  materialId: item.materialId,
                  countToDeduct: item.countToDeduct,
                  weightToDeduct: item.weightToDeduct,
                  description: data.description,
                  user: currentUser,
                  jobCard,
                  length: item.length,
                  width: item.width,
                  selectedRemnantIds: []
                })
              }
            }

            alert('تم إنشاء إذن التشغيل بنجاح')
            setIssueOrderOpen(false)
            await refresh()
          } catch (err) {
            alert(err.message || 'فشل العملية')
          }
        }}
      />

      {/* Custom Unit Dialog */}
      <Dialog open={customUnitDialog} onClose={() => setCustomUnitDialog(false)} maxWidth='sm' fullWidth>
        <DialogTitle>إضافة وحدة جديدة</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            fullWidth
            label='الوحدة الجديدة'
            placeholder='مثال: علبة، كرتونة، لفة إلخ...'
            value={tempCustomValue}
            onChange={e => setTempCustomValue(e.target.value)}
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter' && tempCustomValue.trim()) {
                handleAddCustomUnit()
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomUnitDialog(false)}>إلغاء</Button>
          <Button variant='contained' onClick={handleAddCustomUnit} disabled={!tempCustomValue.trim()}>
            حفظ
          </Button>
        </DialogActions>
      </Dialog>

      {/* Custom Category Dialog */}
      <Dialog open={customCategoryDialog} onClose={() => setCustomCategoryDialog(false)} maxWidth='sm' fullWidth>
        <DialogTitle>إضافة نوع خامة جديد</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            fullWidth
            label='نوع الخامة الجديد'
            placeholder='مثال: بلاستيك، خشب، حديد إلخ...'
            value={tempCustomValue}
            onChange={e => setTempCustomValue(e.target.value)}
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter' && tempCustomValue.trim()) {
                handleAddCustomCategory()
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomCategoryDialog(false)}>إلغاء</Button>
          <Button variant='contained' onClick={handleAddCustomCategory} disabled={!tempCustomValue.trim()}>
            حفظ
          </Button>
        </DialogActions>
      </Dialog>

      {/* Custom Grade Dialog */}
      <Dialog open={customGradeDialog} onClose={() => setCustomGradeDialog(false)} maxWidth='sm' fullWidth>
        <DialogTitle>إضافة درجة متانة جديدة</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            fullWidth
            label='الدرجة الجديدة'
            placeholder='مثال: 201، 430، إلخ...'
            value={tempCustomValue}
            onChange={e => setTempCustomValue(e.target.value)}
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter' && tempCustomValue.trim()) {
                handleAddCustomGrade()
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomGradeDialog(false)}>إلغاء</Button>
          <Button variant='contained' onClick={handleAddCustomGrade} disabled={!tempCustomValue.trim()}>
            حفظ
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
