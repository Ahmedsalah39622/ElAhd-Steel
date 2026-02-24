'use client'

import { useState, useEffect } from 'react'

import { useRouter } from 'next/navigation'
import Link from 'next/link'

import {
  Card,
  CardContent,
  Button,
  Box,
  CircularProgress,
  Alert,
  TextField,
  Grid,
  Chip,
  Typography,
  Paper,
  Avatar,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Tooltip,
  LinearProgress
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ReceiptIcon from '@mui/icons-material/Receipt'
import InventoryIcon from '@mui/icons-material/Inventory'
import FolderIcon from '@mui/icons-material/Folder'
import PersonIcon from '@mui/icons-material/Person'
import PhoneIcon from '@mui/icons-material/Phone'
import EmailIcon from '@mui/icons-material/Email'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import CloseIcon from '@mui/icons-material/Close'
import DownloadIcon from '@mui/icons-material/Download'
import DeleteIcon from '@mui/icons-material/Delete'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import DescriptionIcon from '@mui/icons-material/Description'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import ImageIcon from '@mui/icons-material/Image'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import ArchiveIcon from '@mui/icons-material/Archive'
import BusinessIcon from '@mui/icons-material/Business'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'

function TabPanel({ children, value, index, ...other }) {
  return (
    <div role='tabpanel' hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  )
}

export default function ArchivePage() {
  const router = useRouter()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Selected client state
  const [selectedClient, setSelectedClient] = useState(null)
  const [clientHistory, setClientHistory] = useState(null)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [tabValue, setTabValue] = useState(0)

  // Attachment upload state
  const [attachmentDialogOpen, setAttachmentDialogOpen] = useState(false)

  const [attachmentForm, setAttachmentForm] = useState({
    title: '',
    description: '',
    category: 'general',
    file: null,
    fileName: ''
  })

  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/clients', { credentials: 'include' })

      if (!response.ok) {
        throw new Error('Failed to fetch clients')
      }

      const data = await response.json()

      setClients(data.data || data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchClientHistory = async clientId => {
    try {
      setLoadingHistory(true)
      const response = await fetch(`/api/clients/${clientId}/history`, { credentials: 'include' })

      if (response.ok) {
        const data = await response.json()

        setClientHistory(data.data)
      }
    } catch (err) {
      console.error('Error fetching client history:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleClientClick = async client => {
    setSelectedClient(client)
    setDetailsOpen(true)
    setTabValue(0)
    await fetchClientHistory(client.id)
  }

  const handleCloseDetails = () => {
    setDetailsOpen(false)
    setSelectedClient(null)
    setClientHistory(null)
  }

  const handleFileChange = e => {
    const file = e.target.files[0]

    if (file) {
      setAttachmentForm({
        ...attachmentForm,
        file: file,
        fileName: file.name
      })
    }
  }

  const handleUploadAttachment = async () => {
    if (!attachmentForm.file || !attachmentForm.title) {
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()

      formData.append('file', attachmentForm.file)
      formData.append('title', attachmentForm.title)
      formData.append('description', attachmentForm.description)
      formData.append('category', attachmentForm.category)
      formData.append('clientId', selectedClient.id)

      const response = await fetch('/api/clients/attachments', {
        method: 'POST',
        credentials: 'include',
        body: formData
      })

      if (response.ok) {
        setAttachmentDialogOpen(false)
        setAttachmentForm({ title: '', description: '', category: 'general', file: null, fileName: '' })

        // Refresh client history
        await fetchClientHistory(selectedClient.id)
      }
    } catch (err) {
      console.error('Error uploading attachment:', err)
    } finally {
      setUploading(false)
    }
  }

  const formatDate = dateStr => {
    if (!dateStr) return '-'

    return new Date(dateStr).toLocaleDateString('ar-EG')
  }

  const formatCurrency = value => {
    if (!value && value !== 0) return '0'

    return new Intl.NumberFormat('ar-EG').format(value)
  }

  const getFileIcon = fileName => {
    if (!fileName) return <InsertDriveFileIcon />

    const ext = fileName.split('.').pop()?.toLowerCase()

    if (['pdf'].includes(ext)) return <PictureAsPdfIcon color='error' />
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <ImageIcon color='primary' />
    if (['doc', 'docx'].includes(ext)) return <DescriptionIcon color='info' />

    return <InsertDriveFileIcon color='action' />
  }

  const filteredClients = clients.filter(
    c =>
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculate stats
  const stats = {
    totalClients: clients.length,
    activeClients: clients.filter(c => c.status === 'active' || !c.status).length
  }

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='400px'>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display='flex' justifyContent='space-between' alignItems='center' mb={3}>
        <Box display='flex' alignItems='center' gap={2}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
            <ArchiveIcon sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant='h4' fontWeight='bold'>
              الأرشيف
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              سجل شامل لجميع العملاء وتعاملاتهم
            </Typography>
          </Box>
        </Box>
        <Button variant='contained' color='primary' startIcon={<AddIcon />} component={Link} href='/clients/add'>
          إضافة عميل
        </Button>
      </Box>

      {error && (
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light' }}>
            <BusinessIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography variant='h4' fontWeight='bold'>
              {stats.totalClients}
            </Typography>
            <Typography variant='body2'>إجمالي العملاء</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
            <PersonIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
            <Typography variant='h4' fontWeight='bold'>
              {stats.activeClients}
            </Typography>
            <Typography variant='body2'>عملاء نشطين</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: 2 }}>
          <TextField
            fullWidth
            size='small'
            label='بحث في الأرشيف'
            placeholder='ابحث باسم العميل، الهاتف، البريد الإلكتروني...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center' }}>
          <ArchiveIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
          <Typography variant='h6' color='text.secondary'>
            لا يوجد عملاء في الأرشيف
          </Typography>
          <Typography variant='body2' color='text.disabled' mb={2}>
            ابدأ بإضافة عميل جديد
          </Typography>
          <Button variant='contained' startIcon={<AddIcon />} component={Link} href='/clients/add'>
            إضافة عميل
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredClients.map(client => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={client.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  height: '100%',
                  '&:hover': {
                    boxShadow: 8,
                    transform: 'translateY(-4px)',
                    borderColor: 'primary.main'
                  }
                }}
                onClick={() => handleClientClick(client)}
              >
                <CardContent>
                  {/* Avatar & Name */}
                  <Box display='flex' flexDirection='column' alignItems='center' mb={2}>
                    <Avatar
                      sx={{
                        bgcolor: 'primary.main',
                        width: 64,
                        height: 64,
                        fontSize: 24,
                        mb: 1.5
                      }}
                    >
                      {client.name?.charAt(0) || 'ع'}
                    </Avatar>
                    <Typography variant='h6' fontWeight='bold' textAlign='center' noWrap sx={{ maxWidth: '100%' }}>
                      {client.name}
                    </Typography>
                    {client.company && (
                      <Typography variant='body2' color='text.secondary' textAlign='center'>
                        {client.company}
                      </Typography>
                    )}
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  {/* Contact Info */}
                  <Box>
                    {client.phone && (
                      <Box display='flex' alignItems='center' gap={1} mb={0.5}>
                        <PhoneIcon fontSize='small' color='action' />
                        <Typography variant='body2' dir='ltr'>
                          {client.phone}
                        </Typography>
                      </Box>
                    )}
                    {client.email && (
                      <Box display='flex' alignItems='center' gap={1} mb={0.5}>
                        <EmailIcon fontSize='small' color='action' />
                        <Typography variant='body2' noWrap sx={{ maxWidth: 150 }}>
                          {client.email}
                        </Typography>
                      </Box>
                    )}
                    {client.address && (
                      <Box display='flex' alignItems='center' gap={1}>
                        <LocationOnIcon fontSize='small' color='action' />
                        <Typography variant='body2' noWrap sx={{ maxWidth: 150 }}>
                          {client.address}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* View Details Hint */}
                  <Box mt={2} pt={1.5} borderTop={1} borderColor='divider' textAlign='center'>
                    <Typography variant='caption' color='primary'>
                      اضغط لعرض التفاصيل والأرشيف
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Client Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={handleCloseDetails}
        maxWidth='lg'
        fullWidth
        PaperProps={{ sx: { minHeight: '80vh' } }}
      >
        {selectedClient && (
          <>
            <DialogTitle sx={{ pb: 0 }}>
              <Box display='flex' justifyContent='space-between' alignItems='flex-start'>
                <Box display='flex' alignItems='center' gap={2}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, fontSize: 24 }}>
                    {selectedClient.name?.charAt(0) || 'ع'}
                  </Avatar>
                  <Box>
                    <Typography variant='h5' fontWeight='bold'>
                      {selectedClient.name}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {selectedClient.company || 'عميل'} • {selectedClient.phone || '-'}
                    </Typography>
                  </Box>
                </Box>
                <IconButton onClick={handleCloseDetails}>
                  <CloseIcon />
                </IconButton>
              </Box>

              {/* Summary Stats */}
              {clientHistory && (
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: 'success.light' }}>
                      <TrendingUpIcon color='success' />
                      <Typography variant='h6' fontWeight='bold'>
                        {formatCurrency(clientHistory.summary?.totalIncoming)} ج
                      </Typography>
                      <Typography variant='caption'>إجمالي الوارد</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: 'error.light' }}>
                      <TrendingDownIcon color='error' />
                      <Typography variant='h6' fontWeight='bold'>
                        {formatCurrency(clientHistory.summary?.totalOutgoing)} ج
                      </Typography>
                      <Typography variant='caption'>إجمالي الصادر</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: 'primary.light' }}>
                      <ReceiptIcon color='primary' />
                      <Typography variant='h6' fontWeight='bold'>
                        {formatCurrency(clientHistory.summary?.totalInvoiced)} ج
                      </Typography>
                      <Typography variant='caption'>إجمالي الفواتير</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper
                      sx={{
                        p: 1.5,
                        textAlign: 'center',
                        bgcolor: clientHistory.summary?.totalDue > 0 ? 'warning.light' : 'grey.100'
                      }}
                    >
                      <AccountBalanceWalletIcon color={clientHistory.summary?.totalDue > 0 ? 'warning' : 'action'} />
                      <Typography variant='h6' fontWeight='bold'>
                        {formatCurrency(clientHistory.summary?.totalDue)} ج
                      </Typography>
                      <Typography variant='caption'>المستحق</Typography>
                    </Paper>
                  </Grid>
                </Grid>
              )}
            </DialogTitle>

            <DialogContent dividers>
              {loadingHistory ? (
                <Box display='flex' justifyContent='center' py={4}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2 }}>
                    <Tab icon={<ReceiptIcon />} label={`الفواتير (${clientHistory?.invoices?.length || 0})`} />
                    <Tab
                      icon={<AccountBalanceWalletIcon />}
                      label={`الخزنة (${clientHistory?.safeEntries?.length || 0})`}
                    />
                    <Tab
                      icon={<InventoryIcon />}
                      label={`المخزون (${clientHistory?.inventoryTransactions?.length || 0})`}
                    />
                    <Tab icon={<AttachFileIcon />} label={`المرفقات (${clientHistory?.attachments?.length || 0})`} />
                  </Tabs>

                  {/* Invoices Tab */}
                  <TabPanel value={tabValue} index={0}>
                    {clientHistory?.invoices?.length > 0 ? (
                      <Grid container spacing={2}>
                        {clientHistory.invoices.map(inv => (
                          <Grid item xs={12} md={6} key={inv.id}>
                            <Paper sx={{ p: 2, border: 1, borderColor: 'divider' }}>
                              <Box display='flex' justifyContent='space-between' alignItems='flex-start' mb={1}>
                                <Box>
                                  <Typography variant='subtitle1' fontWeight='bold' color='primary'>
                                    فاتورة #{inv.number}
                                  </Typography>
                                  <Typography variant='body2' color='text.secondary'>
                                    {formatDate(inv.date)}
                                  </Typography>
                                </Box>
                                <Chip
                                  label={
                                    inv.status === 'paid' ? 'مدفوعة' : inv.status === 'partial' ? 'جزئية' : 'غير مدفوعة'
                                  }
                                  color={
                                    inv.status === 'paid' ? 'success' : inv.status === 'partial' ? 'warning' : 'error'
                                  }
                                  size='small'
                                />
                              </Box>
                              <Divider sx={{ my: 1 }} />
                              <Box display='flex' justifyContent='space-between'>
                                <Typography variant='body2'>الإجمالي:</Typography>
                                <Typography fontWeight='bold'>{formatCurrency(inv.total)} ج</Typography>
                              </Box>
                              <Box display='flex' justifyContent='space-between'>
                                <Typography variant='body2'>المدفوع:</Typography>
                                <Typography color='success.main'>{formatCurrency(inv.paidAmount)} ج</Typography>
                              </Box>
                              <Box mt={2}>
                                <Button
                                  size='small'
                                  variant='contained'
                                  component={Link}
                                  href={`/invoices/${inv.id}/preview`}
                                  startIcon={<ReceiptIcon />}
                                >
                                  عرض الفاتورة
                                </Button>
                              </Box>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    ) : (
                      <Box textAlign='center' py={4}>
                        <ReceiptIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                        <Typography color='text.secondary'>لا توجد فواتير</Typography>
                      </Box>
                    )}
                  </TabPanel>

                  {/* Safe Entries Tab */}
                  <TabPanel value={tabValue} index={1}>
                    {clientHistory?.safeEntries?.length > 0 ? (
                      <Table size='small'>
                        <TableHead>
                          <TableRow>
                            <TableCell>التاريخ</TableCell>
                            <TableCell>الوصف</TableCell>
                            <TableCell>وارد</TableCell>
                            <TableCell>صادر</TableCell>
                            <TableCell>الرصيد</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {clientHistory.safeEntries.map(entry => (
                            <TableRow key={entry.id}>
                              <TableCell>{formatDate(entry.date)}</TableCell>
                              <TableCell>{entry.description || '-'}</TableCell>
                              <TableCell sx={{ color: 'success.main', fontWeight: 'bold' }}>
                                {entry.incoming > 0 ? `+${formatCurrency(entry.incoming)}` : '-'}
                              </TableCell>
                              <TableCell sx={{ color: 'error.main', fontWeight: 'bold' }}>
                                {entry.outgoing > 0 ? `-${formatCurrency(entry.outgoing)}` : '-'}
                              </TableCell>
                              <TableCell fontWeight='bold'>{formatCurrency(entry.balance)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <Box textAlign='center' py={4}>
                        <AccountBalanceWalletIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                        <Typography color='text.secondary'>لا توجد حركات خزنة</Typography>
                      </Box>
                    )}
                  </TabPanel>

                  {/* Inventory Tab */}
                  <TabPanel value={tabValue} index={2}>
                    {clientHistory?.inventoryTransactions?.length > 0 ? (
                      <Table size='small'>
                        <TableHead>
                          <TableRow>
                            <TableCell>التاريخ</TableCell>
                            <TableCell>المادة</TableCell>
                            <TableCell>النوع</TableCell>
                            <TableCell>الكمية</TableCell>
                            <TableCell>ملاحظات</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {clientHistory.inventoryTransactions.map(tx => (
                            <TableRow key={tx.id}>
                              <TableCell>{formatDate(tx.createdAt)}</TableCell>
                              <TableCell>{tx.Material?.name || tx.materialId || '-'}</TableCell>
                              <TableCell>
                                <Chip
                                  label={tx.type === 'in' ? 'وارد' : 'صادر'}
                                  color={tx.type === 'in' ? 'success' : 'error'}
                                  size='small'
                                />
                              </TableCell>
                              <TableCell>{tx.quantity}</TableCell>
                              <TableCell>{tx.note || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <Box textAlign='center' py={4}>
                        <InventoryIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                        <Typography color='text.secondary'>لا توجد حركات مخزون</Typography>
                      </Box>
                    )}
                  </TabPanel>

                  {/* Attachments Tab */}
                  <TabPanel value={tabValue} index={3}>
                    <Box display='flex' justifyContent='flex-end' mb={2}>
                      <Button
                        variant='contained'
                        startIcon={<UploadFileIcon />}
                        onClick={() => setAttachmentDialogOpen(true)}
                      >
                        إضافة مرفق
                      </Button>
                    </Box>

                    {clientHistory?.attachments?.length > 0 ? (
                      <Grid container spacing={2}>
                        {clientHistory.attachments.map(att => (
                          <Grid item xs={12} sm={6} md={4} key={att.id}>
                            <Paper sx={{ p: 2, border: 1, borderColor: 'divider' }}>
                              <Box display='flex' alignItems='flex-start' gap={2}>
                                <Box sx={{ fontSize: 40 }}>{getFileIcon(att.fileName)}</Box>
                                <Box flex={1}>
                                  <Typography variant='subtitle2' fontWeight='bold' noWrap>
                                    {att.title || att.fileName}
                                  </Typography>
                                  <Typography variant='body2' color='text.secondary' noWrap>
                                    {att.description || 'بدون وصف'}
                                  </Typography>
                                  <Chip label={att.category || 'عام'} size='small' sx={{ mt: 0.5 }} />
                                  <Typography variant='caption' display='block' color='text.secondary' mt={0.5}>
                                    {formatDate(att.createdAt)}
                                  </Typography>
                                </Box>
                              </Box>
                              <Box display='flex' gap={1} mt={2}>
                                <Button
                                  size='small'
                                  variant='outlined'
                                  startIcon={<DownloadIcon />}
                                  component='a'
                                  href={att.filePath}
                                  target='_blank'
                                  download
                                >
                                  تحميل
                                </Button>
                              </Box>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    ) : (
                      <Box textAlign='center' py={4}>
                        <AttachFileIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                        <Typography color='text.secondary'>لا توجد مرفقات</Typography>
                        <Typography variant='body2' color='text.disabled'>
                          اضغط على "إضافة مرفق" لرفع ملفات
                        </Typography>
                      </Box>
                    )}
                  </TabPanel>
                </>
              )}
            </DialogContent>

            <DialogActions>
              <Button onClick={handleCloseDetails}>إغلاق</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Attachment Upload Dialog */}
      <Dialog open={attachmentDialogOpen} onClose={() => setAttachmentDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>إضافة مرفق جديد</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label='عنوان المرفق *'
              value={attachmentForm.title}
              onChange={e => setAttachmentForm({ ...attachmentForm, title: e.target.value })}
              sx={{ mb: 2 }}
              placeholder='مثال: عقد العمل، صورة المشروع...'
            />

            <TextField
              fullWidth
              multiline
              rows={2}
              label='وصف المرفق'
              value={attachmentForm.description}
              onChange={e => setAttachmentForm({ ...attachmentForm, description: e.target.value })}
              sx={{ mb: 2 }}
              placeholder='أضف تفاصيل إضافية عن هذا المرفق...'
            />

            <TextField
              fullWidth
              select
              label='التصنيف'
              value={attachmentForm.category}
              onChange={e => setAttachmentForm({ ...attachmentForm, category: e.target.value })}
              sx={{ mb: 2 }}
              SelectProps={{ native: true }}
            >
              <option value='general'>عام</option>
              <option value='contract'>عقد</option>
              <option value='invoice'>فاتورة</option>
              <option value='receipt'>إيصال</option>
              <option value='design'>تصميم</option>
              <option value='photo'>صورة</option>
              <option value='document'>مستند</option>
              <option value='other'>أخرى</option>
            </TextField>

            <Paper
              sx={{
                p: 3,
                border: '2px dashed',
                borderColor: attachmentForm.file ? 'success.main' : 'divider',
                bgcolor: attachmentForm.file ? 'success.light' : 'grey.50',
                textAlign: 'center',
                cursor: 'pointer'
              }}
              onClick={() => document.getElementById('file-upload').click()}
            >
              <input id='file-upload' type='file' hidden onChange={handleFileChange} />
              {attachmentForm.file ? (
                <Box>
                  {getFileIcon(attachmentForm.fileName)}
                  <Typography variant='subtitle1' fontWeight='bold' mt={1}>
                    {attachmentForm.fileName}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    اضغط لتغيير الملف
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <UploadFileIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                  <Typography variant='subtitle1'>اضغط لاختيار ملف</Typography>
                  <Typography variant='body2' color='text.secondary'>
                    أو اسحب الملف وأفلته هنا
                  </Typography>
                </Box>
              )}
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAttachmentDialogOpen(false)}>إلغاء</Button>
          <Button
            variant='contained'
            onClick={handleUploadAttachment}
            disabled={!attachmentForm.file || !attachmentForm.title || uploading}
          >
            {uploading ? <CircularProgress size={20} /> : 'رفع المرفق'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
