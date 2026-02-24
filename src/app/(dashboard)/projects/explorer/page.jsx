'use client'

import { useState, useEffect } from 'react'

import Link from 'next/link'

import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Grid,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Tabs,
  Tab
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import PersonIcon from '@mui/icons-material/Person'
import FolderIcon from '@mui/icons-material/Folder'
import ReceiptIcon from '@mui/icons-material/Receipt'
import InventoryIcon from '@mui/icons-material/Inventory'
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing'
import PaymentIcon from '@mui/icons-material/Payment'
import TimelineIcon from '@mui/icons-material/Timeline'
import HistoryIcon from '@mui/icons-material/History'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import DownloadIcon from '@mui/icons-material/Download'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'

export default function ProjectExplorerPage() {
  const [clients, setClients] = useState([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [clientHistory, setClientHistory] = useState(null)
  const [clientProjects, setClientProjects] = useState([])
  const [expandedProject, setExpandedProject] = useState(null)
  const [projectDetails, setProjectDetails] = useState({})
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [mainTab, setMainTab] = useState(0)

  useEffect(() => {
    fetchClients()
  }, [])

  useEffect(() => {
    if (selectedClientId) {
      fetchClientData(selectedClientId)
    } else {
      setClientProjects([])
      setClientHistory(null)
    }
  }, [selectedClientId])

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients', { credentials: 'include' })

      if (res.ok) {
        const data = await res.json()

        setClients(data.data || [])
      }
    } catch (err) {
      console.error('Error fetching clients:', err)
    }
  }

  const fetchClientData = async clientId => {
    setLoading(true)
    setLoadingHistory(true)

    try {
      // Fetch projects
      const projRes = await fetch(`/api/projects?clientId=${clientId}`, { credentials: 'include' })

      if (projRes.ok) {
        const projData = await projRes.json()

        setClientProjects(projData.data || [])
      }

      // Fetch client history (safe entries, invoices, inventory)
      const histRes = await fetch(`/api/clients/${clientId}/history`, { credentials: 'include' })

      if (histRes.ok) {
        const histData = await histRes.json()

        setClientHistory(histData.data)
      }
    } catch (err) {
      console.error('Error fetching client data:', err)
    } finally {
      setLoading(false)
      setLoadingHistory(false)
    }
  }

  const fetchProjectDetails = async projectId => {
    if (projectDetails[projectId]) return

    setLoadingDetails(true)

    try {
      const res = await fetch(`/api/projects/${projectId}`, { credentials: 'include' })

      if (res.ok) {
        const data = await res.json()

        setProjectDetails(prev => ({ ...prev, [projectId]: data.data }))
      }
    } catch (err) {
      console.error('Error fetching project details:', err)
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleProjectExpand = projectId => {
    if (expandedProject === projectId) {
      setExpandedProject(null)
    } else {
      setExpandedProject(projectId)
      fetchProjectDetails(projectId)
      setActiveTab(0)
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

  const formatDate = dateStr => {
    if (!dateStr) return '-'

    return new Date(dateStr).toLocaleDateString('ar-EG')
  }

  const formatDateTime = dateStr => {
    if (!dateStr) return '-'

    return new Date(dateStr).toLocaleString('ar-EG')
  }

  const formatCurrency = value => {
    if (!value && value !== 0) return '-'

    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(value)
  }

  const selectedClient = clients.find(c => c.id === parseInt(selectedClientId))

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant='h4' gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <FolderIcon color='primary' />
        مستكشف المشاريع والعملاء
      </Typography>

      {/* Client Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems='center'>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label='اختر العميل'
                value={selectedClientId}
                onChange={e => setSelectedClientId(e.target.value)}
                InputProps={{
                  startAdornment: <PersonIcon sx={{ mr: 1, color: 'action.active' }} />
                }}
              >
                <MenuItem value=''>-- اختر عميل لعرض بياناته --</MenuItem>
                {clients.map(client => (
                  <MenuItem key={client.id} value={client.id}>
                    {client.name} {client.phone && `(${client.phone})`}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            {selectedClient && (
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                  <Typography variant='body2'>العميل المختار</Typography>
                  <Typography variant='h6'>{selectedClient.name}</Typography>
                  <Typography variant='body2'>
                    {selectedClient.phone} | {selectedClient.email}
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <Box display='flex' justifyContent='center' py={4}>
          <CircularProgress />
        </Box>
      )}

      {/* No Client Selected */}
      {!selectedClientId && !loading && (
        <Alert severity='info' sx={{ mt: 2 }}>
          اختر عميل من القائمة أعلاه لعرض جميع بياناته (المشاريع، الفواتير، الخزينة، المواد)
        </Alert>
      )}

      {/* Client Data */}
      {selectedClientId && !loading && clientHistory && (
        <Box>
          {/* Summary Stats */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} md={2}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
                <Typography variant='h6'>{formatCurrency(clientHistory.summary?.totalIncoming)}</Typography>
                <Typography variant='caption'>إجمالي الوارد</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={2}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light' }}>
                <Typography variant='h6'>{formatCurrency(clientHistory.summary?.totalOutgoing)}</Typography>
                <Typography variant='caption'>إجمالي الصادر</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={2}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light' }}>
                <Typography variant='h6'>{formatCurrency(clientHistory.summary?.totalInvoiced)}</Typography>
                <Typography variant='caption'>إجمالي الفواتير</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={2}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light' }}>
                <Typography variant='h6'>{formatCurrency(clientHistory.summary?.totalPaid)}</Typography>
                <Typography variant='caption'>المدفوع</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={2}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light' }}>
                <Typography variant='h6'>{formatCurrency(clientHistory.summary?.totalDue)}</Typography>
                <Typography variant='caption'>المستحق</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={2}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.light' }}>
                <Typography variant='h6'>{clientProjects.length}</Typography>
                <Typography variant='caption'>المشاريع</Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Main Tabs */}
          <Card>
            <Tabs value={mainTab} onChange={(e, v) => setMainTab(v)} variant='scrollable' scrollButtons='auto'>
              <Tab icon={<FolderIcon />} label={`المشاريع (${clientProjects.length})`} />
              <Tab icon={<AccountBalanceWalletIcon />} label={`الخزينة (${clientHistory.safeEntries?.length || 0})`} />
              <Tab icon={<ReceiptIcon />} label={`الفواتير (${clientHistory.invoices?.length || 0})`} />
              <Tab icon={<InventoryIcon />} label={`المواد (${clientHistory.inventoryTransactions?.length || 0})`} />
            </Tabs>

            <CardContent>
              {/* Projects Tab */}
              {mainTab === 0 && (
                <Box>
                  {clientProjects.length === 0 ? (
                    <Alert severity='info'>لا توجد مشاريع لهذا العميل</Alert>
                  ) : (
                    clientProjects.map(project => (
                      <Accordion
                        key={project.id}
                        expanded={expandedProject === project.id}
                        onChange={() => handleProjectExpand(project.id)}
                        sx={{ mb: 1 }}
                      >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Box display='flex' alignItems='center' gap={2} width='100%' flexWrap='wrap'>
                            <FolderIcon color='primary' />
                            <Box flex={1}>
                              <Typography fontWeight='bold'>{project.name}</Typography>
                              <Typography variant='caption' color='text.secondary'>
                                {project.projectNumber || '-'} | {project.location || '-'}
                              </Typography>
                            </Box>
                            <Chip
                              label={getStatusLabel(project.status)}
                              color={getStatusColor(project.status)}
                              size='small'
                            />
                            <Box sx={{ minWidth: 100 }}>
                              <LinearProgress
                                variant='determinate'
                                value={project.progressPercent || 0}
                                sx={{ height: 8, borderRadius: 4 }}
                              />
                              <Typography variant='caption' textAlign='center' display='block'>
                                {project.progressPercent || 0}%
                              </Typography>
                            </Box>
                          </Box>
                        </AccordionSummary>

                        <AccordionDetails>
                          {loadingDetails && expandedProject === project.id && !projectDetails[project.id] ? (
                            <Box display='flex' justifyContent='center' py={3}>
                              <CircularProgress size={30} />
                            </Box>
                          ) : projectDetails[project.id] ? (
                            <Box>
                              <Grid container spacing={2} sx={{ mb: 2 }}>
                                <Grid item xs={6} md={3}>
                                  <Paper sx={{ p: 1.5, textAlign: 'center' }}>
                                    <Typography variant='h6'>
                                      {formatCurrency(projectDetails[project.id].totalPaid)}
                                    </Typography>
                                    <Typography variant='caption'>المدفوع</Typography>
                                  </Paper>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                  <Paper sx={{ p: 1.5, textAlign: 'center' }}>
                                    <Typography variant='h6'>
                                      {formatCurrency(projectDetails[project.id].totalInvoiced)}
                                    </Typography>
                                    <Typography variant='caption'>الفواتير</Typography>
                                  </Paper>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                  <Paper sx={{ p: 1.5, textAlign: 'center' }}>
                                    <Typography variant='h6'>
                                      {projectDetails[project.id].manufacturing?.length || 0}
                                    </Typography>
                                    <Typography variant='caption'>عمليات التصنيع</Typography>
                                  </Paper>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                  <Button
                                    variant='contained'
                                    fullWidth
                                    component={Link}
                                    href={`/projects/${project.id}`}
                                  >
                                    فتح الملف الكامل
                                  </Button>
                                </Grid>
                              </Grid>

                              <Tabs
                                value={activeTab}
                                onChange={(e, v) => setActiveTab(v)}
                                variant='scrollable'
                                size='small'
                              >
                                <Tab label='سجل الأحداث' />
                                <Tab label='التصنيع' />
                                <Tab label='المراحل' />
                              </Tabs>

                              {activeTab === 0 && (
                                <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                                  {projectDetails[project.id].activities?.slice(0, 10).map(activity => (
                                    <ListItem key={activity.id} divider>
                                      <ListItemIcon>
                                        <HistoryIcon fontSize='small' />
                                      </ListItemIcon>
                                      <ListItemText
                                        primary={activity.title}
                                        secondary={formatDateTime(activity.createdAt)}
                                      />
                                    </ListItem>
                                  ))}
                                  {!projectDetails[project.id].activities?.length && (
                                    <Typography color='text.secondary' textAlign='center' py={2}>
                                      لا توجد أحداث
                                    </Typography>
                                  )}
                                </List>
                              )}

                              {activeTab === 1 && (
                                <Table size='small' sx={{ maxHeight: 200 }}>
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>العملية</TableCell>
                                      <TableCell>العامل</TableCell>
                                      <TableCell>الحالة</TableCell>
                                      <TableCell>التاريخ</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {projectDetails[project.id].manufacturing?.map(proc => (
                                      <TableRow key={proc.id}>
                                        <TableCell>{proc.processName}</TableCell>
                                        <TableCell>{proc.workerName || '-'}</TableCell>
                                        <TableCell>
                                          <Chip label={getStatusLabel(proc.status)} size='small' />
                                        </TableCell>
                                        <TableCell>{formatDateTime(proc.createdAt)}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              )}

                              {activeTab === 2 && (
                                <Table size='small'>
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>المرحلة</TableCell>
                                      <TableCell>الحالة</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {projectDetails[project.id].phases?.map(phase => (
                                      <TableRow key={phase.id}>
                                        <TableCell>{phase.phaseName}</TableCell>
                                        <TableCell>
                                          <Chip label={getStatusLabel(phase.status)} size='small' />
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              )}
                            </Box>
                          ) : null}
                        </AccordionDetails>
                      </Accordion>
                    ))
                  )}
                </Box>
              )}

              {/* Safe Entries Tab */}
              {mainTab === 1 && (
                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                  <Typography variant='h6' gutterBottom>
                    سجل الخزينة للعميل
                  </Typography>
                  {clientHistory.safeEntries?.length > 0 ? (
                    <Table size='small'>
                      <TableHead>
                        <TableRow>
                          <TableCell>التاريخ</TableCell>
                          <TableCell>الوصف</TableCell>
                          <TableCell>المشروع</TableCell>
                          <TableCell sx={{ color: 'success.main' }}>وارد</TableCell>
                          <TableCell sx={{ color: 'error.main' }}>صادر</TableCell>
                          <TableCell>طريقة الدفع</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {clientHistory.safeEntries.map(entry => (
                          <TableRow key={entry.id}>
                            <TableCell>{formatDate(entry.date)}</TableCell>
                            <TableCell>{entry.description || '-'}</TableCell>
                            <TableCell>{entry.project || '-'}</TableCell>
                            <TableCell sx={{ color: 'success.main', fontWeight: 'bold' }}>
                              {entry.incoming ? formatCurrency(entry.incoming) : '-'}
                            </TableCell>
                            <TableCell sx={{ color: 'error.main', fontWeight: 'bold' }}>
                              {entry.outgoing ? formatCurrency(entry.outgoing) : '-'}
                            </TableCell>
                            <TableCell>{entry.incomingMethod || entry.outgoingMethod || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <Alert severity='info'>لا توجد حركات في الخزينة لهذا العميل</Alert>
                  )}
                </Box>
              )}

              {/* Invoices Tab */}
              {mainTab === 2 && (
                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                  <Typography variant='h6' gutterBottom>
                    فواتير العميل
                  </Typography>
                  {clientHistory.invoices?.length > 0 ? (
                    <Table size='small'>
                      <TableHead>
                        <TableRow>
                          <TableCell>رقم الفاتورة</TableCell>
                          <TableCell>التاريخ</TableCell>
                          <TableCell>الإجمالي</TableCell>
                          <TableCell>المدفوع</TableCell>
                          <TableCell>المستحق</TableCell>
                          <TableCell>الحالة</TableCell>
                          <TableCell>إجراءات</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {clientHistory.invoices.map(inv => (
                          <TableRow key={inv.id}>
                            <TableCell>{inv.number}</TableCell>
                            <TableCell>{formatDate(inv.date)}</TableCell>
                            <TableCell>{formatCurrency(inv.total)}</TableCell>
                            <TableCell sx={{ color: 'success.main' }}>{formatCurrency(inv.paidAmount)}</TableCell>
                            <TableCell sx={{ color: 'error.main' }}>
                              {formatCurrency((inv.total || 0) - (inv.paidAmount || 0))}
                            </TableCell>
                            <TableCell>
                              <Chip label={inv.status} size='small' />
                            </TableCell>
                            <TableCell>
                              <Button size='small' component={Link} href={`/invoices/${inv.id}`}>
                                عرض
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <Alert severity='info'>لا توجد فواتير لهذا العميل</Alert>
                  )}
                </Box>
              )}

              {/* Inventory Tab */}
              {mainTab === 3 && (
                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                  <Typography variant='h6' gutterBottom>
                    حركات المواد للعميل
                  </Typography>
                  {clientHistory.inventoryTransactions?.length > 0 ? (
                    <Table size='small'>
                      <TableHead>
                        <TableRow>
                          <TableCell>التاريخ</TableCell>
                          <TableCell>المادة</TableCell>
                          <TableCell>الكمية</TableCell>
                          <TableCell>النوع</TableCell>
                          <TableCell>المرجع</TableCell>
                          <TableCell>ملاحظات</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {clientHistory.inventoryTransactions.map(tx => (
                          <TableRow key={tx.id}>
                            <TableCell>{formatDateTime(tx.createdAt)}</TableCell>
                            <TableCell>{tx.Material?.name || '-'}</TableCell>
                            <TableCell sx={{ color: tx.action === 'add' ? 'success.main' : 'error.main' }}>
                              {tx.action === 'add' ? '+' : '-'}
                              {tx.change}
                            </TableCell>
                            <TableCell>{tx.action === 'add' ? 'إضافة' : 'سحب'}</TableCell>
                            <TableCell>{tx.reference || '-'}</TableCell>
                            <TableCell>{tx.note || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <Alert severity='info'>لا توجد حركات مواد لهذا العميل</Alert>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  )
}
