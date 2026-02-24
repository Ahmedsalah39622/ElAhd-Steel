'use client'

import { useState, useEffect } from 'react'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Box,
  Grid,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Avatar,
  Slider
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import DownloadIcon from '@mui/icons-material/Download'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import ImageIcon from '@mui/icons-material/Image'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import PersonIcon from '@mui/icons-material/Person'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import ReceiptIcon from '@mui/icons-material/Receipt'
import InventoryIcon from '@mui/icons-material/Inventory'
import TimelineIcon from '@mui/icons-material/Timeline'
import PaymentIcon from '@mui/icons-material/Payment'
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing'
import HistoryIcon from '@mui/icons-material/History'
import AddIcon from '@mui/icons-material/Add'
import LinkIcon from '@mui/icons-material/Link'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PendingIcon from '@mui/icons-material/Pending'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import FolderIcon from '@mui/icons-material/Folder'

function TabPanel({ children, value, index, ...other }) {
  return (
    <div role='tabpanel' hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

export default function ProjectDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tabValue, setTabValue] = useState(0)
  const [progressDialogOpen, setProgressDialogOpen] = useState(false)
  const [newProgress, setNewProgress] = useState(0)

  // Dialog states
  const [activityDialogOpen, setActivityDialogOpen] = useState(false)
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false)
  const [phaseDialogOpen, setPhaseDialogOpen] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [manufacturingDialogOpen, setManufacturingDialogOpen] = useState(false)
  const [invoiceLinkDialogOpen, setInvoiceLinkDialogOpen] = useState(false)
  const [availableInvoices, setAvailableInvoices] = useState([])

  // Form states
  const [activityForm, setActivityForm] = useState({ title: '', description: '', activityType: 'note' })
  const [materialForm, setMaterialForm] = useState({
    materialName: '',
    quantity: '',
    unit: '',
    unitCost: '',
    notes: ''
  })
  const [phaseForm, setPhaseForm] = useState({ phaseName: '', description: '', status: 'pending' })
  const [paymentForm, setPaymentForm] = useState({ amount: '', paymentMethod: '', paymentType: 'incoming', notes: '' })
  const [manufacturingForm, setManufacturingForm] = useState({
    processName: '',
    processType: '',
    workerName: '',
    status: 'pending',
    notes: ''
  })

  useEffect(() => {
    if (params.id) {
      fetchProject()
    }
  }, [params.id])

  const fetchProject = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/projects/${params.id}`, { credentials: 'include' })

      if (!res.ok) throw new Error('Failed to fetch project')

      const data = await res.json()

      setProject(data.data)
      setNewProgress(data.data.progressPercent || 0)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('هل أنت متأكد من حذف هذا المشروع وجميع بياناته؟')) return

    try {
      const res = await fetch(`/api/projects/${params.id}`, { method: 'DELETE', credentials: 'include' })

      if (res.ok) router.push('/projects')
      else throw new Error('Failed to delete project')
    } catch (err) {
      setError(err.message)
    }
  }

  const handleUpdateProgress = async () => {
    try {
      const res = await fetch(`/api/projects/${params.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progressPercent: newProgress })
      })

      if (res.ok) {
        fetchProject()
        setProgressDialogOpen(false)
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const handleAddActivity = async () => {
    try {
      const res = await fetch(`/api/projects/${params.id}/activities`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activityForm)
      })

      if (res.ok) {
        fetchProject()
        setActivityDialogOpen(false)
        setActivityForm({ title: '', description: '', activityType: 'note' })
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const handleAddMaterial = async () => {
    try {
      const res = await fetch(`/api/projects/${params.id}/materials`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(materialForm)
      })

      if (res.ok) {
        fetchProject()
        setMaterialDialogOpen(false)
        setMaterialForm({ materialName: '', quantity: '', unit: '', unitCost: '', notes: '' })
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const handleAddPhase = async () => {
    try {
      const res = await fetch(`/api/projects/${params.id}/phases`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(phaseForm)
      })

      if (res.ok) {
        fetchProject()
        setPhaseDialogOpen(false)
        setPhaseForm({ phaseName: '', description: '', status: 'pending' })
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const handleAddPayment = async () => {
    try {
      const res = await fetch(`/api/projects/${params.id}/payments`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentForm)
      })

      if (res.ok) {
        fetchProject()
        setPaymentDialogOpen(false)
        setPaymentForm({ amount: '', paymentMethod: '', paymentType: 'incoming', notes: '' })
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const handleAddManufacturing = async () => {
    try {
      const res = await fetch(`/api/projects/${params.id}/manufacturing`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manufacturingForm)
      })

      if (res.ok) {
        fetchProject()
        setManufacturingDialogOpen(false)
        setManufacturingForm({ processName: '', processType: '', workerName: '', status: 'pending', notes: '' })
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const handleLinkInvoice = async invoiceId => {
    try {
      const res = await fetch(`/api/projects/${params.id}/invoices`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId })
      })

      if (res.ok) {
        fetchProject()
        setInvoiceLinkDialogOpen(false)
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const fetchAvailableInvoices = async () => {
    try {
      const res = await fetch('/api/invoices', { credentials: 'include' })

      if (res.ok) {
        const data = await res.json()

        // Filter invoices not linked to any project
        const unlinked = (Array.isArray(data) ? data : []).filter(inv => !inv.projectId)

        setAvailableInvoices(unlinked)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const getStatusColor = status => {
    const colors = { completed: 'success', 'in-progress': 'primary', pending: 'warning', cancelled: 'error' }

    return colors[status] || 'default'
  }

  const getStatusLabel = status => {
    const labels = { completed: 'مكتمل', 'in-progress': 'قيد التنفيذ', pending: 'معلق', cancelled: 'ملغي' }

    return labels[status] || status
  }

  const getPriorityColor = priority => {
    const colors = { high: 'error', normal: 'primary', low: 'default' }

    return colors[priority] || 'default'
  }

  const getPriorityLabel = priority => {
    const labels = { high: 'عالية', normal: 'عادية', low: 'منخفضة' }

    return labels[priority] || priority
  }

  const formatDate = dateStr => {
    if (!dateStr) return '-'

    return new Date(dateStr).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const formatDateTime = dateStr => {
    if (!dateStr) return '-'

    return new Date(dateStr).toLocaleString('ar-EG')
  }

  const formatCurrency = value => {
    if (!value) return '-'

    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(value)
  }

  const getFileIcon = type => {
    if (type?.includes('pdf')) return <PictureAsPdfIcon color='error' />
    if (type?.includes('image')) return <ImageIcon color='primary' />

    return <InsertDriveFileIcon color='action' />
  }

  const getActivityIcon = type => {
    const icons = {
      project_created: <FolderIcon color='primary' />,
      status_changed: <TimelineIcon color='warning' />,
      progress_updated: <CheckCircleIcon color='success' />,
      material_added: <InventoryIcon color='info' />,
      phase_added: <TimelineIcon color='primary' />,
      payment_recorded: <PaymentIcon color='success' />,
      manufacturing_logged: <PrecisionManufacturingIcon color='secondary' />,
      invoice_linked: <ReceiptIcon color='primary' />,
      invoice_unlinked: <ReceiptIcon color='error' />,
      note: <HistoryIcon color='action' />
    }

    return icons[type] || <HistoryIcon color='action' />
  }

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='400px'>
        <CircularProgress />
      </Box>
    )
  }

  if (error || !project) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity='error'>{error || 'المشروع غير موجود'}</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/projects')} sx={{ mt: 2 }}>
          العودة للقائمة
        </Button>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display='flex' justifyContent='space-between' alignItems='flex-start' flexWrap='wrap' gap={2}>
            <Box>
              <Box display='flex' alignItems='center' gap={2} mb={1}>
                <Typography variant='h4'>{project.name}</Typography>
                <Chip label={getStatusLabel(project.status)} color={getStatusColor(project.status)} />
                <Chip
                  label={getPriorityLabel(project.priority)}
                  color={getPriorityColor(project.priority)}
                  variant='outlined'
                  size='small'
                />
              </Box>
              <Typography variant='body2' color='text.secondary'>
                رقم المشروع: {project.projectNumber || '-'} | العميل:{' '}
                {project.clientName || project.client?.name || '-'}
              </Typography>
            </Box>
            <Box display='flex' gap={1}>
              <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/projects')}>
                العودة
              </Button>
              <Button
                variant='outlined'
                startIcon={<EditIcon />}
                component={Link}
                href={`/projects/${project.id}/edit`}
              >
                تعديل
              </Button>
              <Button variant='outlined' color='error' startIcon={<DeleteIcon />} onClick={handleDelete}>
                حذف
              </Button>
            </Box>
          </Box>

          {/* Progress Bar */}
          <Box sx={{ mt: 3 }}>
            <Box display='flex' justifyContent='space-between' alignItems='center' mb={1}>
              <Typography variant='body2'>نسبة الإنجاز</Typography>
              <Button size='small' onClick={() => setProgressDialogOpen(true)}>
                تحديث
              </Button>
            </Box>
            <LinearProgress
              variant='determinate'
              value={project.progressPercent || 0}
              sx={{ height: 10, borderRadius: 5 }}
            />
            <Typography variant='body2' textAlign='center' mt={0.5}>
              {project.progressPercent || 0}%
            </Typography>
          </Box>

          {/* Summary Stats */}
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <Typography variant='h5'>{formatCurrency(project.totalInvoiced)}</Typography>
                <Typography variant='body2'>إجمالي الفواتير</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'success.contrastText' }}>
                <Typography variant='h5'>{formatCurrency(project.totalPaid)}</Typography>
                <Typography variant='body2'>إجمالي المدفوعات</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                <Typography variant='h5'>{formatCurrency(project.totalMaterialsCost)}</Typography>
                <Typography variant='body2'>تكلفة المواد</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light', color: 'info.contrastText' }}>
                <Typography variant='h5'>{project.phases?.length || 0}</Typography>
                <Typography variant='body2'>المراحل</Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} variant='scrollable' scrollButtons='auto'>
          <Tab icon={<HistoryIcon />} label='سجل الأحداث' />
          <Tab icon={<TimelineIcon />} label='المراحل' />
          <Tab icon={<InventoryIcon />} label='المواد' />
          <Tab icon={<PrecisionManufacturingIcon />} label='التصنيع' />
          <Tab icon={<ReceiptIcon />} label='الفواتير' />
          <Tab icon={<PaymentIcon />} label='المدفوعات' />
          <Tab icon={<InsertDriveFileIcon />} label='المرفقات' />
          <Tab icon={<PersonIcon />} label='التفاصيل' />
        </Tabs>

        {/* Activities Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box display='flex' justifyContent='space-between' mb={2}>
            <Typography variant='h6'>سجل الأحداث (Black Box)</Typography>
            <Button startIcon={<AddIcon />} variant='contained' onClick={() => setActivityDialogOpen(true)}>
              إضافة ملاحظة
            </Button>
          </Box>
          <List>
            {project.activities?.map(activity => (
              <ListItem key={activity.id} divider>
                <ListItemIcon>{getActivityIcon(activity.activityType)}</ListItemIcon>
                <ListItemText
                  primary={activity.title}
                  secondary={
                    <>
                      {activity.description && <Typography variant='body2'>{activity.description}</Typography>}
                      <Typography variant='caption' color='text.secondary'>
                        {formatDateTime(activity.createdAt)} {activity.createdBy && `• ${activity.createdBy}`}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}
            {(!project.activities || project.activities.length === 0) && (
              <Typography color='text.secondary' textAlign='center' py={4}>
                لا توجد أحداث مسجلة
              </Typography>
            )}
          </List>
        </TabPanel>

        {/* Phases Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box display='flex' justifyContent='space-between' mb={2}>
            <Typography variant='h6'>مراحل المشروع</Typography>
            <Button startIcon={<AddIcon />} variant='contained' onClick={() => setPhaseDialogOpen(true)}>
              إضافة مرحلة
            </Button>
          </Box>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>اسم المرحلة</TableCell>
                <TableCell>الحالة</TableCell>
                <TableCell>تاريخ البدء</TableCell>
                <TableCell>تاريخ الانتهاء</TableCell>
                <TableCell>ملاحظات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {project.phases?.map((phase, idx) => (
                <TableRow key={phase.id}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>{phase.phaseName}</TableCell>
                  <TableCell>
                    <Chip label={getStatusLabel(phase.status)} color={getStatusColor(phase.status)} size='small' />
                  </TableCell>
                  <TableCell>{formatDate(phase.startDate)}</TableCell>
                  <TableCell>{formatDate(phase.endDate)}</TableCell>
                  <TableCell>{phase.notes || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {(!project.phases || project.phases.length === 0) && (
            <Typography color='text.secondary' textAlign='center' py={4}>
              لا توجد مراحل
            </Typography>
          )}
        </TabPanel>

        {/* Materials Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box display='flex' justifyContent='space-between' mb={2}>
            <Typography variant='h6'>المواد المستخدمة</Typography>
            <Button startIcon={<AddIcon />} variant='contained' onClick={() => setMaterialDialogOpen(true)}>
              إضافة مادة
            </Button>
          </Box>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>اسم المادة</TableCell>
                <TableCell>الكمية</TableCell>
                <TableCell>الوحدة</TableCell>
                <TableCell>سعر الوحدة</TableCell>
                <TableCell>الإجمالي</TableCell>
                <TableCell>الحالة</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {project.materials?.map(mat => (
                <TableRow key={mat.id}>
                  <TableCell>{mat.materialName}</TableCell>
                  <TableCell>{mat.quantity}</TableCell>
                  <TableCell>{mat.unit || '-'}</TableCell>
                  <TableCell>{formatCurrency(mat.unitCost)}</TableCell>
                  <TableCell>{formatCurrency(mat.totalCost)}</TableCell>
                  <TableCell>
                    <Chip label={getStatusLabel(mat.status)} color={getStatusColor(mat.status)} size='small' />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {(!project.materials || project.materials.length === 0) && (
            <Typography color='text.secondary' textAlign='center' py={4}>
              لا توجد مواد
            </Typography>
          )}
        </TabPanel>

        {/* Manufacturing Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box display='flex' justifyContent='space-between' mb={2}>
            <Typography variant='h6'>سجل التصنيع</Typography>
            <Button startIcon={<AddIcon />} variant='contained' onClick={() => setManufacturingDialogOpen(true)}>
              تسجيل عملية
            </Button>
          </Box>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>العملية</TableCell>
                <TableCell>النوع</TableCell>
                <TableCell>العامل</TableCell>
                <TableCell>الماكينة</TableCell>
                <TableCell>الحالة</TableCell>
                <TableCell>التاريخ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {project.manufacturing?.map(proc => (
                <TableRow key={proc.id}>
                  <TableCell>{proc.processName}</TableCell>
                  <TableCell>{proc.processType || '-'}</TableCell>
                  <TableCell>{proc.workerName || '-'}</TableCell>
                  <TableCell>{proc.machineUsed || '-'}</TableCell>
                  <TableCell>
                    <Chip label={getStatusLabel(proc.status)} color={getStatusColor(proc.status)} size='small' />
                  </TableCell>
                  <TableCell>{formatDateTime(proc.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {(!project.manufacturing || project.manufacturing.length === 0) && (
            <Typography color='text.secondary' textAlign='center' py={4}>
              لا توجد عمليات تصنيع
            </Typography>
          )}
        </TabPanel>

        {/* Invoices Tab */}
        <TabPanel value={tabValue} index={4}>
          <Box display='flex' justifyContent='space-between' mb={2}>
            <Typography variant='h6'>الفواتير المرتبطة</Typography>
            <Button
              startIcon={<LinkIcon />}
              variant='contained'
              onClick={() => {
                fetchAvailableInvoices()
                setInvoiceLinkDialogOpen(true)
              }}
            >
              ربط فاتورة
            </Button>
          </Box>

          {/* Invoice Cards with Preview */}
          {project.invoices && project.invoices.length > 0 ? (
            <Grid container spacing={2}>
              {project.invoices.map(inv => (
                <Grid item xs={12} md={6} key={inv.id}>
                  <Paper sx={{ p: 2, border: 1, borderColor: 'divider' }}>
                    <Box display='flex' justifyContent='space-between' alignItems='flex-start' mb={2}>
                      <Box>
                        <Typography variant='h6' color='primary'>
                          فاتورة #{inv.number}
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          {inv.client?.name || '-'} • {formatDate(inv.date)}
                        </Typography>
                      </Box>
                      <Chip
                        label={
                          inv.status === 'paid' ? 'مدفوعة' : inv.status === 'partial' ? 'مدفوعة جزئياً' : 'غير مدفوعة'
                        }
                        color={inv.status === 'paid' ? 'success' : inv.status === 'partial' ? 'warning' : 'error'}
                        size='small'
                      />
                    </Box>

                    <Divider sx={{ my: 1.5 }} />

                    <Box display='flex' justifyContent='space-between' mb={1}>
                      <Typography variant='body2' color='text.secondary'>
                        الإجمالي:
                      </Typography>
                      <Typography variant='body1' fontWeight='bold'>
                        {formatCurrency(inv.total)}
                      </Typography>
                    </Box>
                    <Box display='flex' justifyContent='space-between' mb={2}>
                      <Typography variant='body2' color='text.secondary'>
                        المدفوع:
                      </Typography>
                      <Typography variant='body1' color='success.main'>
                        {formatCurrency(inv.paidAmount)}
                      </Typography>
                    </Box>

                    {/* Action Buttons */}
                    <Box display='flex' gap={1} flexWrap='wrap'>
                      <Button
                        size='small'
                        variant='contained'
                        color='primary'
                        startIcon={<ReceiptIcon />}
                        component={Link}
                        href={`/invoices/${inv.id}/preview`}
                      >
                        عرض الفاتورة
                      </Button>
                      <Button size='small' variant='outlined' component={Link} href={`/invoices/${inv.id}/edit`}>
                        تعديل
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <ReceiptIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography color='text.secondary'>لا توجد فواتير مرتبطة بهذا المشروع</Typography>
              <Typography variant='body2' color='text.disabled' mb={2}>
                يمكنك ربط فاتورة موجودة أو سيتم ربطها تلقائياً عند إنشاء فاتورة للعميل
              </Typography>
            </Paper>
          )}

          {/* Price Lists Section */}
          <Box mt={4}>
            <Typography variant='h6' mb={2}>
              قوائم الأسعار المرتبطة
            </Typography>
            {project.priceLists && project.priceLists.length > 0 ? (
              <Grid container spacing={2}>
                {project.priceLists.map(pl => (
                  <Grid item xs={12} md={6} key={pl.id}>
                    <Paper sx={{ p: 2, border: 1, borderColor: 'divider' }}>
                      <Box display='flex' justifyContent='space-between' alignItems='center' mb={1}>
                        <Typography variant='subtitle1' fontWeight='bold'>
                          {pl.name}
                        </Typography>
                        <Chip
                          label={pl.isActive ? 'نشطة' : 'غير نشطة'}
                          color={pl.isActive ? 'success' : 'default'}
                          size='small'
                        />
                      </Box>
                      <Typography variant='body2' color='text.secondary' mb={2}>
                        {formatDate(pl.createdAt)}
                      </Typography>
                      <Button size='small' variant='contained' component={Link} href={`/price-list/${pl.id}`}>
                        عرض قائمة الأسعار
                      </Button>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
                <Typography color='text.secondary'>لا توجد قوائم أسعار مرتبطة</Typography>
              </Paper>
            )}
          </Box>
        </TabPanel>

        {/* Payments Tab */}
        <TabPanel value={tabValue} index={5}>
          <Box display='flex' justifyContent='space-between' mb={2}>
            <Typography variant='h6'>سجل المدفوعات</Typography>
            <Button startIcon={<AddIcon />} variant='contained' onClick={() => setPaymentDialogOpen(true)}>
              تسجيل دفعة
            </Button>
          </Box>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>المبلغ</TableCell>
                <TableCell>النوع</TableCell>
                <TableCell>طريقة الدفع</TableCell>
                <TableCell>المرجع</TableCell>
                <TableCell>التاريخ</TableCell>
                <TableCell>ملاحظات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {project.payments?.map(pay => (
                <TableRow key={pay.id}>
                  <TableCell
                    sx={{ color: pay.paymentType === 'outgoing' ? 'error.main' : 'success.main', fontWeight: 'bold' }}
                  >
                    {pay.paymentType === 'outgoing' ? '-' : '+'}
                    {formatCurrency(pay.amount)}
                  </TableCell>
                  <TableCell>{pay.paymentType === 'outgoing' ? 'صادر' : 'وارد'}</TableCell>
                  <TableCell>{pay.paymentMethod || '-'}</TableCell>
                  <TableCell>{pay.reference || pay.transactionNumber || '-'}</TableCell>
                  <TableCell>{formatDateTime(pay.paidAt)}</TableCell>
                  <TableCell>{pay.notes || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {(!project.payments || project.payments.length === 0) && (
            <Typography color='text.secondary' textAlign='center' py={4}>
              لا توجد مدفوعات
            </Typography>
          )}
        </TabPanel>

        {/* Attachments Tab */}
        <TabPanel value={tabValue} index={6}>
          <Typography variant='h6' mb={2}>
            المرفقات
          </Typography>
          {project.attachments && project.attachments.length > 0 ? (
            <List>
              {project.attachments.map((file, index) => (
                <ListItem key={index} divider>
                  <ListItemIcon>{getFileIcon(file.type)}</ListItemIcon>
                  <ListItemText primary={file.originalName} secondary={`${(file.size / 1024).toFixed(2)} KB`} />
                  <IconButton component='a' href={file.path} target='_blank' download color='primary'>
                    <DownloadIcon />
                  </IconButton>
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography color='text.secondary' textAlign='center' py={4}>
              لا توجد مرفقات
            </Typography>
          )}
        </TabPanel>

        {/* Details Tab */}
        <TabPanel value={tabValue} index={7}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                الموقع
              </Typography>
              <Typography variant='body1' mb={2}>
                {project.location || '-'}
              </Typography>

              <Typography variant='subtitle2' color='text.secondary'>
                تاريخ البدء
              </Typography>
              <Typography variant='body1' mb={2}>
                {formatDate(project.startDate)}
              </Typography>

              <Typography variant='subtitle2' color='text.secondary'>
                تاريخ الانتهاء
              </Typography>
              <Typography variant='body1' mb={2}>
                {formatDate(project.endDate)}
              </Typography>

              <Typography variant='subtitle2' color='text.secondary'>
                تاريخ التسليم المتوقع
              </Typography>
              <Typography variant='body1' mb={2}>
                {formatDate(project.expectedDeliveryDate)}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                التكلفة الإجمالية
              </Typography>
              <Typography variant='body1' mb={2}>
                {formatCurrency(project.totalCost)}
              </Typography>

              <Typography variant='subtitle2' color='text.secondary'>
                إجمالي الإيرادات
              </Typography>
              <Typography variant='body1' mb={2}>
                {formatCurrency(project.totalRevenue)}
              </Typography>

              <Typography variant='subtitle2' color='text.secondary'>
                الوصف
              </Typography>
              <Typography variant='body1' mb={2} style={{ whiteSpace: 'pre-wrap' }}>
                {project.description || '-'}
              </Typography>

              <Typography variant='subtitle2' color='text.secondary'>
                ملاحظات
              </Typography>
              <Typography variant='body1' style={{ whiteSpace: 'pre-wrap' }}>
                {project.notes || '-'}
              </Typography>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

      {/* Progress Dialog */}
      <Dialog open={progressDialogOpen} onClose={() => setProgressDialogOpen(false)}>
        <DialogTitle>تحديث نسبة الإنجاز</DialogTitle>
        <DialogContent sx={{ minWidth: 300 }}>
          <Box sx={{ mt: 2 }}>
            <Slider
              value={newProgress}
              onChange={(e, v) => setNewProgress(v)}
              valueLabelDisplay='on'
              min={0}
              max={100}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProgressDialogOpen(false)}>إلغاء</Button>
          <Button onClick={handleUpdateProgress} variant='contained'>
            حفظ
          </Button>
        </DialogActions>
      </Dialog>

      {/* Activity Dialog */}
      <Dialog open={activityDialogOpen} onClose={() => setActivityDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>إضافة ملاحظة</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label='العنوان'
            value={activityForm.title}
            onChange={e => setActivityForm({ ...activityForm, title: e.target.value })}
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label='التفاصيل'
            value={activityForm.description}
            onChange={e => setActivityForm({ ...activityForm, description: e.target.value })}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActivityDialogOpen(false)}>إلغاء</Button>
          <Button onClick={handleAddActivity} variant='contained'>
            إضافة
          </Button>
        </DialogActions>
      </Dialog>

      {/* Material Dialog */}
      <Dialog open={materialDialogOpen} onClose={() => setMaterialDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>إضافة مادة</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label='اسم المادة'
            value={materialForm.materialName}
            onChange={e => setMaterialForm({ ...materialForm, materialName: e.target.value })}
            sx={{ mt: 2 }}
          />
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type='number'
                label='الكمية'
                value={materialForm.quantity}
                onChange={e => setMaterialForm({ ...materialForm, quantity: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label='الوحدة'
                value={materialForm.unit}
                onChange={e => setMaterialForm({ ...materialForm, unit: e.target.value })}
              />
            </Grid>
          </Grid>
          <TextField
            fullWidth
            type='number'
            label='سعر الوحدة'
            value={materialForm.unitCost}
            onChange={e => setMaterialForm({ ...materialForm, unitCost: e.target.value })}
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={2}
            label='ملاحظات'
            value={materialForm.notes}
            onChange={e => setMaterialForm({ ...materialForm, notes: e.target.value })}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMaterialDialogOpen(false)}>إلغاء</Button>
          <Button onClick={handleAddMaterial} variant='contained'>
            إضافة
          </Button>
        </DialogActions>
      </Dialog>

      {/* Phase Dialog */}
      <Dialog open={phaseDialogOpen} onClose={() => setPhaseDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>إضافة مرحلة</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label='اسم المرحلة'
            value={phaseForm.phaseName}
            onChange={e => setPhaseForm({ ...phaseForm, phaseName: e.target.value })}
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={2}
            label='الوصف'
            value={phaseForm.description}
            onChange={e => setPhaseForm({ ...phaseForm, description: e.target.value })}
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            select
            label='الحالة'
            value={phaseForm.status}
            onChange={e => setPhaseForm({ ...phaseForm, status: e.target.value })}
            sx={{ mt: 2 }}
          >
            <MenuItem value='pending'>معلق</MenuItem>
            <MenuItem value='in-progress'>قيد التنفيذ</MenuItem>
            <MenuItem value='completed'>مكتمل</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPhaseDialogOpen(false)}>إلغاء</Button>
          <Button onClick={handleAddPhase} variant='contained'>
            إضافة
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>تسجيل دفعة</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type='number'
            label='المبلغ'
            value={paymentForm.amount}
            onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            select
            label='النوع'
            value={paymentForm.paymentType}
            onChange={e => setPaymentForm({ ...paymentForm, paymentType: e.target.value })}
            sx={{ mt: 2 }}
          >
            <MenuItem value='incoming'>وارد (من العميل)</MenuItem>
            <MenuItem value='outgoing'>صادر (للمورد)</MenuItem>
          </TextField>
          <TextField
            fullWidth
            label='طريقة الدفع'
            value={paymentForm.paymentMethod}
            onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={2}
            label='ملاحظات'
            value={paymentForm.notes}
            onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)}>إلغاء</Button>
          <Button onClick={handleAddPayment} variant='contained'>
            تسجيل
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manufacturing Dialog */}
      <Dialog open={manufacturingDialogOpen} onClose={() => setManufacturingDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>تسجيل عملية تصنيع</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label='اسم العملية'
            value={manufacturingForm.processName}
            onChange={e => setManufacturingForm({ ...manufacturingForm, processName: e.target.value })}
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            label='نوع العملية'
            value={manufacturingForm.processType}
            onChange={e => setManufacturingForm({ ...manufacturingForm, processType: e.target.value })}
            sx={{ mt: 2 }}
            placeholder='مثال: قص، لحام، تجميع'
          />
          <TextField
            fullWidth
            label='اسم العامل'
            value={manufacturingForm.workerName}
            onChange={e => setManufacturingForm({ ...manufacturingForm, workerName: e.target.value })}
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            select
            label='الحالة'
            value={manufacturingForm.status}
            onChange={e => setManufacturingForm({ ...manufacturingForm, status: e.target.value })}
            sx={{ mt: 2 }}
          >
            <MenuItem value='pending'>معلق</MenuItem>
            <MenuItem value='in-progress'>قيد التنفيذ</MenuItem>
            <MenuItem value='completed'>مكتمل</MenuItem>
          </TextField>
          <TextField
            fullWidth
            multiline
            rows={2}
            label='ملاحظات'
            value={manufacturingForm.notes}
            onChange={e => setManufacturingForm({ ...manufacturingForm, notes: e.target.value })}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManufacturingDialogOpen(false)}>إلغاء</Button>
          <Button onClick={handleAddManufacturing} variant='contained'>
            تسجيل
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invoice Link Dialog */}
      <Dialog open={invoiceLinkDialogOpen} onClose={() => setInvoiceLinkDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>ربط فاتورة بالمشروع</DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            اختر فاتورة لربطها بهذا المشروع:
          </Typography>
          <List>
            {availableInvoices.map(inv => (
              <ListItem key={inv.id} button onClick={() => handleLinkInvoice(inv.id)}>
                <ListItemIcon>
                  <ReceiptIcon />
                </ListItemIcon>
                <ListItemText
                  primary={inv.number}
                  secondary={`${inv.client?.name || '-'} - ${formatCurrency(inv.total)}`}
                />
              </ListItem>
            ))}
            {availableInvoices.length === 0 && (
              <Typography color='text.secondary' textAlign='center' py={2}>
                لا توجد فواتير متاحة للربط
              </Typography>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInvoiceLinkDialogOpen(false)}>إغلاق</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
