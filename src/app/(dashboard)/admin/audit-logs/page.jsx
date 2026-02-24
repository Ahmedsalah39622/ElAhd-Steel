'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Alert,
  CircularProgress,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Pagination,
  Grid,
  IconButton,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  KeyboardArrowDown as ExpandMoreIcon,
  KeyboardArrowUp as ExpandLessIcon,
  Info as InfoIcon
} from '@mui/icons-material'

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalLogs: 0,
    logsPerPage: 50
  })
  const [filters, setFilters] = useState({
    userId: '',
    action: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 50
  })
  const [expandedRow, setExpandedRow] = useState(null)
  const [selectedLog, setSelectedLog] = useState(null)
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false)

  useEffect(() => {
    fetchLogs()
    fetchUsers()
  }, [filters.page])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (filters.userId) params.append('userId', filters.userId)
      if (filters.action) params.append('action', filters.action)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      params.append('page', filters.page)
      params.append('limit', filters.limit)

      const response = await fetch(`/api/admin/audit-logs?${params}`)
      const data = await response.json()

      if (data.success) {
        setLogs(data.logs)
        setPagination(data.pagination)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('فشل في تحميل السجلات')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      const data = await response.json()
      if (data.success) {
        setUsers(data.users)
      }
    } catch (err) {
      console.error('Failed to fetch users:', err)
    }
  }

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1 // Reset to first page when filtering
    }))
  }

  const handleApplyFilters = () => {
    fetchLogs()
  }

  const handleClearFilters = () => {
    setFilters({
      userId: '',
      action: '',
      startDate: '',
      endDate: '',
      page: 1,
      limit: 50
    })
    setTimeout(fetchLogs, 100)
  }

  const handlePageChange = (event, value) => {
    setFilters(prev => ({ ...prev, page: value }))
  }

  const handleRowClick = logId => {
    setExpandedRow(expandedRow === logId ? null : logId)
  }

  const handleViewDetails = log => {
    setSelectedLog(log)
    setOpenDetailsDialog(true)
  }

  const getActionColor = action => {
    const actionColors = {
      USER_LOGIN: 'success',
      USER_LOGOUT: 'info',
      USER_CREATED: 'primary',
      USER_UPDATED: 'warning',
      USER_DELETED: 'error',
      ROLE_CREATED: 'primary',
      ROLE_UPDATED: 'warning',
      ROLE_DELETED: 'error',
      INVOICE_CREATED: 'primary',
      INVOICE_UPDATED: 'warning',
      PAYMENT_RECEIVED: 'success',
      DEFAULT: 'default'
    }
    return actionColors[action] || actionColors['DEFAULT']
  }

  const getActionLabel = action => {
    const actionLabels = {
      USER_LOGIN: 'تسجيل دخول',
      USER_LOGOUT: 'تسجيل خروج',
      USER_CREATED: 'إنشاء مستخدم',
      USER_UPDATED: 'تحديث مستخدم',
      USER_DELETED: 'حذف مستخدم',
      ROLE_CREATED: 'إنشاء دور',
      ROLE_UPDATED: 'تحديث دور',
      ROLE_DELETED: 'حذف دور',
      INVOICE_CREATED: 'إنشاء فاتورة',
      INVOICE_UPDATED: 'تحديث فاتورة',
      PAYMENT_RECEIVED: 'استلام دفعة'
    }
    return actionLabels[action] || action
  }

  if (loading && logs.length === 0) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='400px'>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Card>
      <CardContent>
        <Box display='flex' justifyContent='space-between' alignItems='center' mb={3}>
          <Typography variant='h4'>سجل الأنشطة (Audit Logs)</Typography>
          <Button variant='outlined' startIcon={<RefreshIcon />} onClick={fetchLogs} disabled={loading}>
            تحديث
          </Button>
        </Box>

        {error && (
          <Alert severity='error' onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant='h6' gutterBottom>
            <FilterIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
            الفلاتر
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size='small'>
                <InputLabel>المستخدم</InputLabel>
                <Select
                  value={filters.userId}
                  label='المستخدم'
                  onChange={e => handleFilterChange('userId', e.target.value)}
                >
                  <MenuItem value=''>الكل</MenuItem>
                  {users.map(user => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size='small'>
                <InputLabel>نوع الإجراء</InputLabel>
                <Select
                  value={filters.action}
                  label='نوع الإجراء'
                  onChange={e => handleFilterChange('action', e.target.value)}
                >
                  <MenuItem value=''>الكل</MenuItem>
                  <MenuItem value='USER_LOGIN'>تسجيل دخول</MenuItem>
                  <MenuItem value='USER_LOGOUT'>تسجيل خروج</MenuItem>
                  <MenuItem value='USER_CREATED'>إنشاء مستخدم</MenuItem>
                  <MenuItem value='USER_UPDATED'>تحديث مستخدم</MenuItem>
                  <MenuItem value='USER_DELETED'>حذف مستخدم</MenuItem>
                  <MenuItem value='ROLE_CREATED'>إنشاء دور</MenuItem>
                  <MenuItem value='ROLE_UPDATED'>تحديث دور</MenuItem>
                  <MenuItem value='ROLE_DELETED'>حذف دور</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size='small'
                label='من تاريخ'
                type='date'
                value={filters.startDate}
                onChange={e => handleFilterChange('startDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size='small'
                label='إلى تاريخ'
                type='date'
                value={filters.endDate}
                onChange={e => handleFilterChange('endDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={12} md={2}>
              <Box display='flex' gap={1}>
                <Button fullWidth variant='contained' startIcon={<SearchIcon />} onClick={handleApplyFilters}>
                  بحث
                </Button>
                <Button variant='outlined' onClick={handleClearFilters}>
                  مسح
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Stats */}
        <Box mb={2}>
          <Typography variant='body2' color='text.secondary'>
            إجمالي السجلات: <strong>{pagination.totalLogs}</strong> | الصفحة: <strong>{pagination.currentPage}</strong>{' '}
            من <strong>{pagination.totalPages}</strong>
          </Typography>
        </Box>

        {/* Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width='50'></TableCell>
                <TableCell>المستخدم</TableCell>
                <TableCell>الإجراء</TableCell>
                <TableCell>التفاصيل</TableCell>
                <TableCell>التاريخ والوقت</TableCell>
                <TableCell>عنوان IP</TableCell>
                <TableCell align='center'>التفاصيل</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map(log => (
                <>
                  <TableRow key={log.id} hover sx={{ cursor: 'pointer' }}>
                    <TableCell>
                      <IconButton size='small' onClick={() => handleRowClick(log.id)}>
                        {expandedRow === log.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant='body2' fontWeight='bold'>
                          {log.user?.name || 'غير معروف'}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {log.user?.email || '-'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={getActionLabel(log.action)} color={getActionColor(log.action)} size='small' />
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' noWrap sx={{ maxWidth: 250 }}>
                        {log.details || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>{new Date(log.createdAt).toLocaleDateString('ar-EG')}</Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {new Date(log.createdAt).toLocaleTimeString('ar-EG')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='caption' sx={{ fontFamily: 'monospace' }}>
                        {log.ipAddress || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align='center'>
                      <IconButton size='small' onClick={() => handleViewDetails(log)}>
                        <InfoIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={7} sx={{ py: 0, border: 0 }}>
                      <Collapse in={expandedRow === log.id} timeout='auto' unmountOnExit>
                        <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                          <Typography variant='subtitle2' gutterBottom>
                            معلومات إضافية:
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                              <Typography variant='body2'>
                                <strong>User Agent:</strong>
                              </Typography>
                              <Typography variant='caption' sx={{ wordBreak: 'break-all' }}>
                                {log.userAgent || '-'}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <Typography variant='body2'>
                                <strong>التفاصيل الكاملة:</strong>
                              </Typography>
                              <Typography variant='caption'>{log.details || '-'}</Typography>
                            </Grid>
                          </Grid>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <Box display='flex' justifyContent='center' mt={3}>
          <Pagination
            count={pagination.totalPages}
            page={pagination.currentPage}
            onChange={handlePageChange}
            color='primary'
            size='large'
          />
        </Box>

        {/* Details Dialog */}
        <Dialog open={openDetailsDialog} onClose={() => setOpenDetailsDialog(false)} maxWidth='md' fullWidth>
          <DialogTitle>تفاصيل السجل</DialogTitle>
          <DialogContent>
            {selectedLog && (
              <Box sx={{ pt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant='body2' color='text.secondary'>
                      المستخدم
                    </Typography>
                    <Typography variant='body1'>
                      {selectedLog.user?.name} ({selectedLog.user?.email})
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant='body2' color='text.secondary'>
                      الإجراء
                    </Typography>
                    <Chip
                      label={getActionLabel(selectedLog.action)}
                      color={getActionColor(selectedLog.action)}
                      size='small'
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant='body2' color='text.secondary'>
                      التاريخ والوقت
                    </Typography>
                    <Typography variant='body1'>{new Date(selectedLog.createdAt).toLocaleString('ar-EG')}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant='body2' color='text.secondary'>
                      التفاصيل
                    </Typography>
                    <Typography variant='body1'>{selectedLog.details || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant='body2' color='text.secondary'>
                      عنوان IP
                    </Typography>
                    <Typography variant='body1' sx={{ fontFamily: 'monospace' }}>
                      {selectedLog.ipAddress || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant='body2' color='text.secondary'>
                      User Agent
                    </Typography>
                    <Typography variant='caption' sx={{ wordBreak: 'break-all' }}>
                      {selectedLog.userAgent || '-'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDetailsDialog(false)}>إغلاق</Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  )
}
