'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useInventoryClient } from '@views/inventory/useInventoryClient'
import { useAuth } from '@core/contexts/authContext'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Collapse from '@mui/material/Collapse'
import Box from '@mui/material/Box'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import AddIcon from '@mui/icons-material/Add'
import JobOrderDialog from '@views/inventory/JobOrderDialog'
import OperatingIssueOrderDialog from '@views/inventory/OperatingIssueOrderDialog'

const ManufacturingPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = useState('1')
  const [loading, setLoading] = useState(false)

  // Data
  const [issueOrders, setIssueOrders] = useState([])
  const [products, setProducts] = useState([])
  const [clients, setClients] = useState([])
  const [materials, setMaterials] = useState([])

  // Dialog States
  const [finishDialog, setFinishDialog] = useState({ open: false, order: null })
  const [deliverDialog, setDeliverDialog] = useState({ open: false, product: null })
  const [detailsDialog, setDetailsDialog] = useState({ open: false, order: null })
  const [jobOrderDialog, setJobOrderDialog] = useState({ open: false, data: null })
  const [issueOrderOpen, setIssueOrderOpen] = useState(false)

  // New Product Form State
  const [prodName, setProdName] = useState('')
  const [prodType, setProdType] = useState('')
  const [prodCount, setProdCount] = useState('')
  const [prodWeight, setProdWeight] = useState('')
  const [prodDiameter, setProdDiameter] = useState('')
  const [prodLength, setProdLength] = useState('')

  // Delivery Form State
  const [delClientId, setDelClientId] = useState('')
  const [delCount, setDelCount] = useState('')
  const [delWeight, setDelWeight] = useState('')
  const [delPrice, setDelPrice] = useState('')

  const { user } = useAuth()
  const client = useInventoryClient()

  const isAllowed = permission => {
    if (user?.isAdmin) return true
    if (!user?.roles) return false

    return user.roles.some(role => role.permissions?.includes(permission))
  }

  const handleChange = (event, newValue) => {
    setValue(newValue)
    fetchData(newValue)
  }

  const fetchData = async tabValue => {
    setLoading(true)
    try {
      if (tabValue === '1') {
        const data = await client.fetchMaterials({ action: 'issue_order' })
        setIssueOrders(Array.isArray(data) ? data : [])
      } else {
        const data = await client.fetchMaterials({ type: 'product' })
        setProducts(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Failed to fetch manufacturing data:', error)
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

  const fetchMaterials = async () => {
    try {
      const data = await client.fetchMaterials()
      setMaterials(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchData('1')
    fetchClients()
    fetchMaterials()

    // Auto-open issue order dialog if requested in URL
    if (searchParams.get('action') === 'issue_order') {
      setIssueOrderOpen(true)
    }
  }, [searchParams])

  // Helper to parse Job Card from note
  const parseJobCard = note => {
    try {
      if (!note) return null
      const match = note.match(/JobCard:\s?({.*})/)
      if (match && match[1]) {
        return JSON.parse(match[1])
      }
    } catch (e) {
      console.error('Failed to parse JobCard:', e)
    }
    return null
  }

  // Grouping by jobId - Group all materials from the same issue order
  const groupedOrders = issueOrders.reduce((acc, order) => {
    const jobCard = parseJobCard(order.note)

    // Use jobId to group materials from the same issue order
    let key = 'single-' + order.id // Default: single item
    if (jobCard && jobCard.jobId) {
      key = jobCard.jobId // Group by unique job ID
    }

    if (!acc[key]) {
      acc[key] = {
        id: key,
        isGroup: jobCard && jobCard.jobId ? true : false, // Group only if has jobId
        jobCard: jobCard,
        items: [],
        createdAt: order.createdAt
      }
    }
    acc[key].items.push(order)
    return acc
  }, {})

  const groups = Object.values(groupedOrders).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  // Separate groups based on Job Order status
  const groupsWithoutJobOrder = groups.filter(group => {
    // Check if any item in the group has a jobOrder
    return !group.items.some(i => i.jobOrder)
  })

  const groupsWithJobOrder = groups.filter(group => {
    // Check if any item in the group has a jobOrder
    return group.items.some(i => i.jobOrder)
  })

  // Open "Finish Product" Dialog
  const handleOpenFinish = groupOrOrder => {
    // Determine if it's a Group or Single Order
    const isGroup = groupOrOrder.isGroup
    const item = isGroup ? groupOrOrder.items[0] : groupOrOrder
    const jobCard = isGroup ? groupOrOrder.jobCard : parseJobCard(item.note)

    setFinishDialog({ open: true, order: groupOrOrder }) // we store the whole object

    // Default Values
    let defaultName = ''
    let defaultType = 'finished'
    let defaultCount = ''
    let defaultWeight = ''

    if (jobCard) {
      // Priority 1: Job Card Data
      defaultName = jobCard.expectedName || ''
      defaultType = jobCard.expectedType || 'finished'
      defaultCount = jobCard.expectedCount || ''
      defaultWeight = jobCard.expectedWeight || ''
    } else {
      // Fallback: Material Data
      defaultName = item.Material?.name ? `منتج نهائي من ${item.Material.name}` : ''
      defaultType = item.Material?.materialType || 'finished'
      defaultCount = item.change ? Math.abs(item.change) : ''
      defaultWeight = item.deductedWeight || ''
    }

    setProdName(defaultName)
    setProdType(defaultType)
    setProdCount(defaultCount)
    setProdWeight(defaultWeight)
    // Use width or diameter if available
    setProdDiameter(item.Material?.width || item.Material?.originalWidth || '')
  }

  const handleCloseFinish = () => {
    setFinishDialog({ open: false, order: null })
  }

  const handleSubmitFinish = async () => {
    try {
      // Get dimensionType from source material if available
      const sourceDimensionType = finishDialog.order?.items?.[0]?.Material?.dimensionType || 'rectangular'

      await client.createMaterial({
        name: prodName,
        sku: `PROD-${Date.now()}`, // simple SKU gen
        unit: 'pcs',
        materialType: 'product', // Correct mapping for DB type column
        materialName: prodType, // Store user-defined type (e.g. 'studs') here
        createdBy: user?.email || 'unknown',
        type: 'product', // Explicitly request product type
        count: Number(prodCount),
        weight: Number(prodWeight),
        width: Number(prodDiameter), // Using width for diameter
        length: Number(prodLength),
        dimensionType: sourceDimensionType, // Preserve dimension type from source material
        note: (() => {
          // Build ingredients note inline
          let note = ''
          if (finishDialog.order) {
            const isGroup = finishDialog.order.isGroup
            const items = isGroup ? finishDialog.order.items : [finishDialog.order]
            const ingredients = items.map(i => {
              const matName = i.Material?.name || 'Unknown'
              const qty = Math.abs(i.change || 0)
              const weight = i.note ? i.note.match(/Weight:\s?([\d.]+)/)?.[1] || '' : ''
              return `${matName} (${qty}${weight ? ', ' + weight + 'kg' : ''})`
            })
            note = `Ingredients: ${ingredients.join(' | ')}`
            if (isGroup && finishDialog.order.jobCard) {
              note += ` [Job: ${JSON.stringify(finishDialog.order.jobCard)}]`
            }
          }
          return note
        })()
      })
      alert('تم إنشاء المنتج التام بنجاح')

      // Mark associated transactions as completed
      if (finishDialog.order) {
        const isGroup = finishDialog.order.isGroup
        const items = isGroup ? finishDialog.order.items : [finishDialog.order]
        const ids = items.map(i => i.id)

        // Fire and forget update (or await if strict)
        try {
          await fetch('/api/inventory', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              transactionIds: ids,
              status: 'completed'
            })
          })
        } catch (ignore) {
          console.error(ignore)
        }
      }

      handleCloseFinish()
      router.push('/inventory/operating-stock') // Redirect to new page
    } catch (e) {
      alert('فشل إنشاء المنتج: ' + e.message)
    }
  }

  // Open "Deliver" Dialog
  const handleOpenDeliver = product => {
    setDeliverDialog({ open: true, product })
    setDelClientId('')
    setDelCount('')
    setDelWeight('')
    setDelPrice('')
  }

  const handleCloseDeliver = () => {
    setDeliverDialog({ open: false, product: null })
  }

  const handleSubmitDeliver = async () => {
    try {
      await client.deliverProduct({
        materialId: deliverDialog.product.id,
        count: Number(delCount),
        weight: delWeight ? Number(delWeight) : null,
        clientId: delClientId,
        price: Number(delPrice),
        user: user?.email || 'unknown'
      })
      alert('تم تسليم المنتج وإضافته للفاتورة بنجاح')
      handleCloseDeliver()
      fetchData(value)
    } catch (e) {
      alert('فشل التسليم: ' + e.message)
    }
  }

  // Job Order Handlers
  const handleOpenJobOrder = groupOrOrder => {
    // Determine if it's a Group or Single Order
    const isGroup = groupOrOrder.isGroup
    // Items are either in .items (group) or just the object itself (single) if structure differs
    // My previous logic in handleOpenFinish handles both.
    // For Job Order, we pass the whole object as initialData.
    // If it has jobOrder inside items (from backend include), we should extract it.

    // Check if any item has a jobOrder
    const items = isGroup ? groupOrOrder.items : [groupOrOrder]
    const existingJobOrder = items.find(i => i.jobOrder)?.jobOrder

    setJobOrderDialog({
      open: true,
      data: {
        items: items,
        jobCard: groupOrOrder.jobCard,
        jobOrder: existingJobOrder
      }
    })
  }

  const handleCloseJobOrder = () => {
    setJobOrderDialog({ open: false, data: null })
  }

  const handleSaveJobOrder = async data => {
    try {
      if (jobOrderDialog.data?.jobOrder) {
        // Update
        await client.updateJobOrder(jobOrderDialog.data.jobOrder.id, data)
        alert('تم تحديث أمر التشغيل بنجاح')
      } else {
        // Create
        await client.createJobOrder(data)
        alert('تم إنشاء أمر التشغيل بنجاح')
      }
      handleCloseJobOrder()
      fetchData(value)
    } catch (e) {
      alert('فشل حفظ الأمر: ' + e.message)
    }
  }

  // Open Details Dialog
  const handleOpenDetails = order => {
    setDetailsDialog({ open: true, order })
  }

  const handleCloseDetails = () => {
    setDetailsDialog({ open: false, order: null })
  }

  // Helper to parse weight from note
  const getWeightFromNote = note => {
    if (!note) return '-'
    // Look for "Weight: xxxxkg"
    const match = note.match(/Weight:\s?([\d.]+)/)
    return match ? match[1] : '-'
  }

  // Delete Order
  const handleDelete = async groupOrOrder => {
    const isGroup = groupOrOrder.isGroup
    let items = []
    if (isGroup) {
      items = groupOrOrder.items
    } else if (groupOrOrder.items) {
      items = groupOrOrder.items
    } else {
      items = [groupOrOrder]
    }

    const materialsCount = items.length
    const confirmMessage = `هل أنت متأكد من إلغاء هذا الأمر؟\n\n⚠️ سيتم:
• استرجاع ${materialsCount} مادة/معدة للمخزن
• إلغاء جميع التعاملات المرتبطة
• إضافة الكميات المخصومة مرة أخرى`

    if (!confirm(confirmMessage)) return

    try {
      // Delete all transactions and revert their effects
      const results = await Promise.all(items.map(item => client.deleteTransaction(item.id)))

      // Calculate total reverted items
      const totalReverted = results.reduce((sum, result) => {
        return sum + (result?.revertedCount || 0)
      }, 0)

      alert(
        `✅ تم إلغاء الأمر بنجاح\n\n📦 تم استرجاع ${materialsCount} مادة/معدة للمخزن\n📊 إجمالي الوحدات المسترجعة: ${totalReverted}\n✔️ تمت إضافة الكميات المخصومة`
      )
      fetchData(value)
    } catch (e) {
      console.error(e)
      alert('❌ فشل الإلغاء: ' + e.message)
    }
  }

  const handleIssueOrderSubmit = async data => {
    try {
      const jobCard = {
        jobId: `JOB-${Date.now()}`,
        expectedName: data.expectedName,
        expectedType: data.expectedType,
        expectedCount: data.expectedCount,
        expectedWeight: data.expectedWeight
      }

      for (const item of data.items) {
        await client.issueOrder({
          materialId: item.materialId,
          countToDeduct: item.countToDeduct,
          weightToDeduct: item.weightToDeduct,
          description: data.description,
          user: user?.email || user?.name || 'unknown',
          jobCard,
          length: item.length,
          width: item.width,
          selectedRemnantIds: item.selectedRemnantIds || []
        })
      }

      alert('تم إنشاء إذن التشغيل بنجاح')
      setIssueOrderOpen(false)
      fetchData('1')
      fetchMaterials() // Refresh stock
    } catch (err) {
      console.error(err)
      alert(err.message || 'فشل في إنشاء الإذن')
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <TabContext value={value}>
          <Grid container spacing={6}>
            <Grid item xs={12}>
              <TabList onChange={handleChange} aria-label='manufacturing tabs'>
                <Tab label='وارد تشغيل (Operating Receipt)' value='1' />
                <Tab label='إذن تسليم (Delivery Note)' value='2' />
              </TabList>
            </Grid>
            <Grid item xs={12}>
              {/* Tab 1: Incoming Issue Orders */}
              <TabPanel value='1' sx={{ p: 0 }}>
                {/* Section 1: Pending Confirmation */}
                {groupsWithoutJobOrder.length > 0 && (
                  <>
                    <Card
                      sx={{
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        color: 'white',
                        mb: 4
                      }}
                    >
                      <CardHeader
                        title={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ fontSize: '2rem' }}>⏳</Box>
                            <Box>
                              <Typography variant='h5' fontWeight='bold' color='white'>
                                في انتظار تأكيد أمر التشغيل
                              </Typography>
                              <Typography variant='body2' sx={{ opacity: 0.9, mt: 0.5 }}>
                                أوامر تحتاج إلى إنشاء بطاقة أمر تشغيل
                              </Typography>
                            </Box>
                          </Box>
                        }
                        action={
                          <Chip
                            label={`${groupsWithoutJobOrder.length} أمر`}
                            sx={{
                              bgcolor: 'rgba(255,255,255,0.2)',
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '1rem',
                              height: 40
                            }}
                          />
                        }
                      />
                    </Card>

                    <Card sx={{ mb: 4 }}>
                      <CardHeader
                        title='أوامر بحاجة لتأكيد'
                        subheader='قم بإنشاء أمر التشغيل لبدء التصنيع'
                        action={
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            {isAllowed('manufacturing') && (
                              <Button
                                variant='contained'
                                startIcon={<AddIcon />}
                                onClick={() => setIssueOrderOpen(true)}
                                color='primary'
                              >
                                إذن تشغيل جديد
                              </Button>
                            )}
                            <Button onClick={() => fetchData('1')}>تحديث</Button>
                          </Box>
                        }
                      />
                      <CardContent>
                        <TableContainer>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell />
                                <TableCell>المنتج المتوقع / المادة</TableCell>
                                <TableCell>الكمية (أو عدد المواد)</TableCell>
                                <TableCell>الوزن</TableCell>
                                <TableCell>التاريخ</TableCell>
                                <TableCell>إجراءات</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {groupsWithoutJobOrder.map(group => (
                                <GroupRow
                                  key={group.id}
                                  group={group}
                                  onFinish={handleOpenFinish}
                                  onDetails={handleOpenDetails}
                                  onDelete={handleDelete}
                                  onJobOrder={handleOpenJobOrder}
                                  getWeight={getWeightFromNote}
                                  status='pending'
                                />
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </>
                )}

                {/* Section 2: In Progress */}
                {groupsWithJobOrder.length > 0 && (
                  <>
                    <Card
                      sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        mb: 4
                      }}
                    >
                      <CardHeader
                        title={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box
                              sx={{
                                fontSize: '2rem',
                                animation: 'spin 2s linear infinite',
                                '@keyframes spin': {
                                  '0%': { transform: 'rotate(0deg)' },
                                  '100%': { transform: 'rotate(360deg)' }
                                }
                              }}
                            >
                              ⚙️
                            </Box>
                            <Box>
                              <Typography variant='h5' fontWeight='bold' color='white'>
                                جاري التشغيل
                              </Typography>
                              <Typography variant='body2' sx={{ opacity: 0.9, mt: 0.5 }}>
                                أوامر التصنيع النشطة - سيتم التسليم قريباً
                              </Typography>
                            </Box>
                          </Box>
                        }
                        action={
                          <Chip
                            label={`${groupsWithJobOrder.length} أمر`}
                            sx={{
                              bgcolor: 'rgba(255,255,255,0.2)',
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '1rem',
                              height: 40
                            }}
                          />
                        }
                      />
                    </Card>

                    <Card sx={{ mb: 4 }}>
                      <CardHeader
                        title='أوامر التشغيل النشطة'
                        subheader='أوامر تم تأكيدها وجاري العمل عليها'
                        action={<Button onClick={() => fetchData('1')}>تحديث</Button>}
                      />
                      <CardContent>
                        <TableContainer>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell />
                                <TableCell>المنتج المتوقع / المادة</TableCell>
                                <TableCell>الكمية (أو عدد المواد)</TableCell>
                                <TableCell>الوزن</TableCell>
                                <TableCell>التاريخ</TableCell>
                                <TableCell>إجراءات</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {groupsWithJobOrder.map(group => (
                                <GroupRow
                                  key={group.id}
                                  group={group}
                                  onFinish={handleOpenFinish}
                                  onDetails={handleOpenDetails}
                                  onDelete={handleDelete}
                                  onJobOrder={handleOpenJobOrder}
                                  getWeight={getWeightFromNote}
                                  status='inProgress'
                                />
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </>
                )}

                {/* Empty State - No Orders at all */}
                {groupsWithoutJobOrder.length === 0 && groupsWithJobOrder.length === 0 && (
                  <Card>
                    <CardContent>
                      <Box sx={{ py: 8, textAlign: 'center' }}>
                        <Typography variant='h4' gutterBottom>
                          📦
                        </Typography>
                        <Typography variant='h6' color='text.secondary' gutterBottom>
                          لا يوجد أوامر تشغيل حالياً
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          قم بإنشاء إذن صادر تشغيل من صفحة المخزن لبدء التصنيع
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                )}
              </TabPanel>

              {/* Tab 2: Finished Products */}
              <TabPanel value='2' sx={{ p: 0 }}>
                <Card>
                  <CardHeader
                    title='مخزن المنتجات التامة'
                    subheader='المنتجات الجاهزة للتسليم'
                    action={<Button onClick={() => fetchData('2')}>تحديث</Button>}
                  />
                  <CardContent>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>اسم المنتج</TableCell>
                            <TableCell>النوع</TableCell>
                            <TableCell>العدد المتاح</TableCell>
                            <TableCell>الوزن المتاح</TableCell>
                            <TableCell>الأبعاد</TableCell>
                            <TableCell>إجراءات</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {products.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} align='center'>
                                لا يوجد منتجات تامة
                              </TableCell>
                            </TableRow>
                          ) : (
                            products.map(prod => (
                              <TableRow key={prod.id}>
                                <TableCell>{prod.name}</TableCell>
                                <TableCell>{prod.materialType || '-'}</TableCell>
                                <TableCell>{prod.count || prod.stock}</TableCell>
                                <TableCell>{prod.weight ? Number(prod.weight).toFixed(2) : '-'}</TableCell>
                                <TableCell>
                                  {prod.width || prod.length ? `${prod.length || '-'} x ${prod.width || '-'}` : '-'}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant='contained'
                                    color='secondary'
                                    size='small'
                                    onClick={() => handleOpenDeliver(prod)}
                                  >
                                    تسليم للعميل
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </TabPanel>
            </Grid>
          </Grid>
        </TabContext>
      </Grid>

      {/* Dialog 1: Finish Product */}
      <Dialog open={finishDialog.open} onClose={handleCloseFinish} maxWidth='sm' fullWidth>
        <DialogTitle>إنتاج منتج تام (Finished Product)</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label='اسم المنتج الجديد'
                fullWidth
                value={prodName}
                onChange={e => setProdName(e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField label='النوع (Type)' fullWidth value={prodType} onChange={e => setProdType(e.target.value)} />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label='العدد المنتج'
                type='number'
                fullWidth
                value={prodCount}
                onChange={e => setProdCount(e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label='الوزن المنتج (كجم)'
                type='number'
                fullWidth
                value={prodWeight}
                onChange={e => setProdWeight(e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label={
                  finishDialog.order?.items?.[0]?.Material?.dimensionType === 'circular' ? 'القطر (مم)' : 'العرض (مم)'
                }
                type='number'
                fullWidth
                value={prodDiameter}
                onChange={e => setProdDiameter(e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label='الطول'
                type='number'
                fullWidth
                value={prodLength}
                onChange={e => setProdLength(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseFinish}>إلغاء</Button>
          <Button variant='contained' onClick={handleSubmitFinish}>
            حفظ المنتج
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog 2: Deliver Product */}
      <Dialog open={deliverDialog.open} onClose={handleCloseDeliver} maxWidth='sm' fullWidth>
        <DialogTitle>إذن تسليم للعميل (Delivery Note)</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant='subtitle2' gutterBottom>
                المنتج: {deliverDialog.product?.name}
                (متاح: {deliverDialog.product?.count})
              </Typography>
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
                label='العدد للتسليم'
                type='number'
                fullWidth
                value={delCount}
                onChange={e => setDelCount(e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label='الوزن (للتسليم) - اختياري'
                type='number'
                fullWidth
                value={delWeight}
                onChange={e => setDelWeight(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label='السعر (يضاف للفاتورة)'
                type='number'
                fullWidth
                value={delPrice}
                onChange={e => setDelPrice(e.target.value)}
                helperText='سيتم إضافته لآخر فاتورة مفتوحة (Draft) للعميل'
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeliver}>إلغاء</Button>
          <Button variant='contained' color='secondary' onClick={handleSubmitDeliver}>
            تسليم وتأكيد الفاتورة
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog 3: View Details */}
      <Dialog open={detailsDialog.open} onClose={handleCloseDetails} maxWidth='sm' fullWidth>
        <DialogTitle sx={{ pb: 1 }}>تفاصيل أمر التشغيل</DialogTitle>
        <DialogContent dividers>
          {detailsDialog.order && (
            <Grid container spacing={2}>
              {/* Raw Material Section */}
              <Grid item xs={12}>
                <Typography variant='subtitle1' color='primary' sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  📦 بيانات المادة الخام
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant='caption' color='text.secondary'>
                  المادة
                </Typography>
                <Typography variant='body1' sx={{ fontWeight: 'medium' }}>
                  {detailsDialog.order.Material?.name}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant='caption' color='text.secondary'>
                  كود الصنف (SKU)
                </Typography>
                <Typography variant='body2'>{detailsDialog.order.Material?.sku || '-'}</Typography>
              </Grid>
              <Grid item xs={12}>
                {/* Dimensions */}
                <Typography variant='caption' color='text.secondary'>
                  الأبعاد الأصلية
                </Typography>
                <Typography variant='body2' dir='ltr' sx={{ textAlign: 'right', display: 'flex', gap: 2 }}>
                  {detailsDialog.order.Material?.width && <span>ø {detailsDialog.order.Material.width}</span>}
                  {detailsDialog.order.Material?.length && <span>L {detailsDialog.order.Material.length}</span>}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ my: 1, borderTop: '1px dashed #e0e0e0' }} />
              </Grid>

              {/* Issue Data Section */}
              <Grid item xs={12}>
                <Typography
                  variant='subtitle1'
                  color='secondary'
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  📉 بيانات الصرف
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant='caption' color='text.secondary'>
                  الكمية المصروفة
                </Typography>
                <Typography variant='h6' color='error'>
                  {Math.abs(detailsDialog.order.change)}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant='caption' color='text.secondary'>
                  الوزن المصروف
                </Typography>
                <Typography variant='h6'>
                  {getWeightFromNote(detailsDialog.order.note)} <span style={{ fontSize: '0.8rem' }}>كجم</span>
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant='caption' color='text.secondary'>
                  التاريخ
                </Typography>
                <Typography variant='body2'>
                  {new Date(detailsDialog.order.createdAt).toLocaleDateString('ar-EG')}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant='caption' color='text.secondary'>
                  القائم بالصرف
                </Typography>
                <Typography variant='body2'>
                  {detailsDialog.order.user ? detailsDialog.order.user.split('@')[0] : '-'}
                </Typography>
              </Grid>

              {/* Remnant Section */}
              {detailsDialog.order.MaterialPiece && (
                <>
                  <Grid item xs={12}>
                    <Box sx={{ my: 1, borderTop: '1px dashed #e0e0e0' }} />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography
                      variant='subtitle1'
                      color='info.main'
                      sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                    >
                      📐 البقايا المستخدمة
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant='caption' color='text.secondary'>
                      الطول
                    </Typography>
                    <Typography variant='h6'>
                      {detailsDialog.order.MaterialPiece.length} <span style={{ fontSize: '0.8rem' }}>سم</span>
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant='caption' color='text.secondary'>
                      العرض
                    </Typography>
                    <Typography variant='h6'>
                      {detailsDialog.order.MaterialPiece.width} <span style={{ fontSize: '0.8rem' }}>سم</span>
                    </Typography>
                  </Grid>
                  {detailsDialog.order.MaterialPiece.isLeftover && (
                    <Grid item xs={12}>
                      <Chip label='قطعة بواقي' size='small' color='info' icon={<i className='tabler-recycling' />} />
                    </Grid>
                  )}
                </>
              )}

              {/* Notes Section - Cleaned up */}
              {detailsDialog.order.note && !detailsDialog.order.note.includes('JobCard:') && (
                <>
                  <Grid item xs={12}>
                    <Box sx={{ my: 1, borderTop: '1px dashed #e0e0e0' }} />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant='caption' color='text.secondary'>
                      ملاحظات
                    </Typography>
                    <Typography variant='body2' sx={{ bgcolor: '#f5f5f5', p: 1, borderRadius: 1 }}>
                      {detailsDialog.order.note.replace(/Weight:.*?kg/, '').trim() || '-'}
                    </Typography>
                  </Grid>
                </>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails} variant='contained'>
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>
      {/* Dialog 4: Job Order */}
      <JobOrderDialog
        open={jobOrderDialog.open}
        onClose={handleCloseJobOrder}
        onSubmit={handleSaveJobOrder}
        initialData={jobOrderDialog.data}
      />
      {/* Dialog 4: New Issue Order */}
      <OperatingIssueOrderDialog
        open={issueOrderOpen}
        onClose={() => setIssueOrderOpen(false)}
        onSubmit={handleIssueOrderSubmit}
        materials={materials}
      />
    </Grid>
  )
}

export default ManufacturingPage

// Row Component for Grouping
function GroupRow({ group, onFinish, onDetails, onDelete, onJobOrder, getWeight, status = 'pending' }) {
  const [open, setOpen] = useState(false)

  // Prepare Summary Data
  const jobCard = group.jobCard
  const items = group.items
  const isGroup = group.isGroup
  const hasJobOrder = items.some(i => i.jobOrder)

  // Calculate Totals for render
  const totalDeductedCount = items.reduce((sum, i) => sum + Math.abs(i.change || 0), 0)
  // Approximate weight sum if readable
  const totalDeductedWeight = items.reduce((sum, i) => {
    const w = parseFloat(getWeight(i.note))
    return sum + (isNaN(w) ? 0 : w)
  }, 0)

  // Status badge configuration
  const statusConfig = {
    pending: {
      label: '⏳ بحاجة لتأكيد',
      color: '#f5576c',
      bgcolor: 'rgba(245, 87, 108, 0.1)',
      borderColor: '#f5576c'
    },
    inProgress: {
      label: '🔄 جاري التشغيل',
      color: '#667eea',
      bgcolor: 'rgba(102, 126, 234, 0.1)',
      borderColor: '#667eea'
    }
  }

  const currentStatus = statusConfig[status] || statusConfig.pending

  // Display Product Name as Main Label
  let mainLabel = 'أمر تشغيل'
  let subLabel = ''
  let projectInfo = ''

  if (isGroup && jobCard) {
    // Show expected product name prominently
    const productName = jobCard.expectedName || 'منتج غير مسمى'
    const productType = jobCard.expectedType ? ` (${jobCard.expectedType})` : ''
    mainLabel = `${productName}${productType}`

    // Show expected quantities
    const expectedCount = jobCard.expectedCount || '-'
    const expectedWeight = jobCard.expectedWeight || '-'
    subLabel = `العدد المتوقع: ${expectedCount} | الوزن المتوقع: ${expectedWeight} كجم`

    // Show number of materials used
    projectInfo = `عدد المواد المستخدمة: ${items.length}`
  } else {
    // Single item without job card
    mainLabel = items[0].Material?.name || 'مادة'
    subLabel = items[0].description || 'أمر تشغيل فردي'
  }

  return (
    <>
      <TableRow
        sx={{
          '& > *': { borderBottom: 'unset' },
          backgroundColor: currentStatus.bgcolor,
          borderLeft: `4px solid ${currentStatus.borderColor}`,
          '&:hover': {
            backgroundColor: isGroup ? currentStatus.bgcolor : 'rgba(0, 0, 0, 0.04)',
            opacity: 0.9
          }
        }}
      >
        <TableCell width={50}>
          {isGroup && (
            <IconButton aria-label='expand row' size='small' onClick={() => setOpen(!open)}>
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          )}
        </TableCell>
        <TableCell component='th' scope='row'>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Chip
              label={currentStatus.label}
              size='small'
              sx={{
                bgcolor: currentStatus.color,
                color: 'white',
                fontWeight: 'bold',
                ...(status === 'inProgress' && {
                  animation: 'pulse 2s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.7 }
                  }
                })
              }}
            />
            {isGroup && <Chip label={`${items.length} مادة`} size='small' variant='outlined' color='primary' />}
          </Box>
          <Typography variant='subtitle1' fontWeight='bold' color='primary'>
            {mainLabel}
          </Typography>
          <Typography variant='body2' color='text.secondary' display='block'>
            {subLabel}
          </Typography>
          {projectInfo && (
            <Typography variant='caption' display='block' color='info.main'>
              {projectInfo}
            </Typography>
          )}
        </TableCell>
        <TableCell>
          {isGroup ? (
            <Typography variant='body2' fontWeight='medium'>
              {items.length} مادة
            </Typography>
          ) : (
            Math.abs(items[0].change || 0)
          )}
        </TableCell>
        <TableCell>{isGroup ? `${totalDeductedWeight.toFixed(2)} كجم (إجمالي)` : getWeight(items[0].note)}</TableCell>
        <TableCell>{new Date(group.createdAt).toLocaleDateString('ar-EG')}</TableCell>
        <TableCell>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Button
              variant='contained'
              color={hasJobOrder ? 'secondary' : 'error'}
              size='small'
              onClick={() => onJobOrder(group)}
              sx={{
                ...(status === 'pending' && {
                  animation: 'shake 0.5s ease-in-out infinite',
                  '@keyframes shake': {
                    '0%, 100%': { transform: 'translateX(0)' },
                    '25%': { transform: 'translateX(-2px)' },
                    '75%': { transform: 'translateX(2px)' }
                  }
                })
              }}
            >
              {hasJobOrder ? 'عرض أمر التشغيل' : '⚠️ تأكيد أمر التشغيل'}
            </Button>

            {/* Show "إنتاج تام" button only if Job Order is created */}
            {hasJobOrder ? (
              <Button variant='contained' color='success' size='small' onClick={() => onFinish(group)}>
                إنتاج تام
              </Button>
            ) : (
              <Button variant='outlined' color='success' size='small' disabled title='يجب تأكيد أمر التشغيل أولاً'>
                إنتاج تام
              </Button>
            )}

            {isGroup && (
              <Button variant='outlined' color='info' size='small' onClick={() => setOpen(!open)}>
                الخام المستخدم
              </Button>
            )}
            <Button variant='outlined' color='error' size='small' onClick={() => onDelete(group)}>
              إلغاء
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {/* Expanded Details */}
      {isGroup && (
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
            <Collapse in={open} timeout='auto' unmountOnExit>
              <Box sx={{ margin: 1 }}>
                <Typography
                  variant='h6'
                  gutterBottom
                  component='div'
                  sx={{ fontSize: '0.9rem', color: 'text.secondary' }}
                >
                  تفاصيل المواد الخام المستخدمة لهذا المنتج
                </Typography>
                <Table size='small' aria-label='purchases'>
                  <TableHead>
                    <TableRow>
                      <TableCell>المادة</TableCell>
                      <TableCell>النوع</TableCell>
                      <TableCell>الأبعاد (الطول × العرض)</TableCell>
                      <TableCell>الكمية المخصومة</TableCell>
                      <TableCell>الوزن المخصوم</TableCell>
                      <TableCell>باقي مستخدم؟</TableCell>
                      <TableCell>التاريخ</TableCell>
                      <TableCell>إجراءات</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map(historyRow => (
                      <TableRow key={historyRow.id}>
                        <TableCell component='th' scope='row'>
                          {historyRow.Material?.name}
                          {historyRow.Material?.sku && (
                            <Typography variant='caption' display='block'>
                              {historyRow.Material.sku}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              historyRow.Material?.type === 'factory' || historyRow.Material?.type === 'material'
                                ? 'خام مصنع'
                                : historyRow.Material?.type === 'accessory'
                                  ? 'إكسسوار'
                                  : historyRow.Material?.type === 'product'
                                    ? 'منتج'
                                    : historyRow.Material?.type
                                      ? historyRow.Material.type
                                      : 'مادة'
                            }
                            size='small'
                            color={
                              historyRow.Material?.type === 'factory' || historyRow.Material?.type === 'material'
                                ? 'primary'
                                : historyRow.Material?.type === 'accessory'
                                  ? 'secondary'
                                  : 'default'
                            }
                            variant='outlined'
                          />
                        </TableCell>
                        <TableCell>
                          {historyRow.MaterialPiece ? (
                            <Box>
                              <Typography variant='body2' fontWeight='bold'>
                                {Number(historyRow.MaterialPiece.length).toFixed(1)} ×{' '}
                                {Number(historyRow.MaterialPiece.width).toFixed(1)}
                              </Typography>
                              {historyRow.Material?.unit && (
                                <Typography variant='caption' color='text.secondary'>
                                  {historyRow.Material.unit === 'cm'
                                    ? 'سم'
                                    : historyRow.Material.unit === 'mm'
                                      ? 'مم'
                                      : historyRow.Material.unit}
                                </Typography>
                              )}
                            </Box>
                          ) : historyRow.Material?.originalLength && historyRow.Material?.originalWidth ? (
                            <Box>
                              <Typography variant='body2'>
                                {Number(historyRow.Material.originalLength).toFixed(1)} ×{' '}
                                {Number(historyRow.Material.originalWidth).toFixed(1)}
                              </Typography>
                              <Typography variant='caption' color='text.secondary'>
                                (من المادة الأصلية)
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant='caption' color='text.secondary'>
                              -
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{Math.abs(historyRow.change)}</TableCell>
                        <TableCell>
                          {getWeight(historyRow.note) !== '0' ? (
                            <Chip
                              label={`${getWeight(historyRow.note)} كجم`}
                              size='small'
                              color='warning'
                              variant='filled'
                            />
                          ) : (
                            <Typography variant='caption' color='text.secondary'>
                              -
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {historyRow.MaterialPiece?.isLeftover || historyRow.MaterialPiece?.parentPieceId ? (
                            <Chip
                              label={
                                historyRow.MaterialPiece?.parentPieceId
                                  ? `من باقي #${historyRow.MaterialPiece.parentPieceId}`
                                  : 'نعم - باقي'
                              }
                              size='small'
                              color='success'
                              variant='filled'
                              icon={<i className='tabler-recycle' style={{ fontSize: 14 }} />}
                            />
                          ) : historyRow.MaterialPiece ? (
                            <Chip label='لا - قطعة جديدة' size='small' color='info' variant='outlined' />
                          ) : (
                            <Typography variant='caption' color='text.secondary'>
                              -
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{new Date(historyRow.createdAt).toLocaleDateString('ar-EG')}</TableCell>
                        <TableCell>
                          <Button size='small' onClick={() => onDetails(historyRow)}>
                            تفاصيل
                          </Button>
                          <Button size='small' color='error' onClick={() => onDelete(historyRow)}>
                            إلغاء
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}
