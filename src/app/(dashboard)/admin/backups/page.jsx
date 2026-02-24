'use client'

import { useState, useEffect } from 'react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Alert from '@mui/material/Alert'
import Tooltip from '@mui/material/Tooltip'
import LinearProgress from '@mui/material/LinearProgress'

export default function BackupsPage() {
  const [backups, setBackups] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [selectedBackup, setSelectedBackup] = useState(null)
  const [restoreDialog, setRestoreDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [alert, setAlert] = useState(null)

  // Fetch backups list
  const fetchBackups = async () => {
    try {
      const res = await fetch('/api/backups', { credentials: 'include' })

      if (res.ok) {
        const data = await res.json()

        setBackups(data.backups || [])
      }
    } catch (error) {
      console.error('Error fetching backups:', error)
    }
  }

  // Fetch backup statistics
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/backups?action=stats', { credentials: 'include' })

      if (res.ok) {
        const data = await res.json()

        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchBackups(), fetchStats()])
      setLoading(false)
    }

    loadData()
  }, [])

  // Create new backup
  const handleCreateBackup = async () => {
    setCreating(true)
    setAlert(null)

    try {
      const res = await fetch('/api/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ compress: true })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setAlert({ type: 'success', message: `تم إنشاء النسخة الاحتياطية: ${data.filename}` })
        await Promise.all([fetchBackups(), fetchStats()])
      } else {
        setAlert({ type: 'error', message: data.error || 'فشل في إنشاء النسخة الاحتياطية' })
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'حدث خطأ في الاتصال' })
    } finally {
      setCreating(false)
    }
  }

  // Restore backup
  const handleRestore = async () => {
    if (!selectedBackup) return

    setRestoring(true)
    setRestoreDialog(false)

    try {
      const res = await fetch('/api/backups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ filename: selectedBackup.filename })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setAlert({ type: 'success', message: 'تم استعادة قاعدة البيانات بنجاح' })
      } else {
        setAlert({ type: 'error', message: data.error || 'فشل في استعادة النسخة الاحتياطية' })
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'حدث خطأ في الاتصال' })
    } finally {
      setRestoring(false)
      setSelectedBackup(null)
    }
  }

  // Delete backup
  const handleDelete = async () => {
    if (!selectedBackup) return

    try {
      const res = await fetch(`/api/backups?filename=${encodeURIComponent(selectedBackup.filename)}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setAlert({ type: 'success', message: 'تم حذف النسخة الاحتياطية' })
        await Promise.all([fetchBackups(), fetchStats()])
      } else {
        setAlert({ type: 'error', message: data.error || 'فشل في الحذف' })
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'حدث خطأ في الاتصال' })
    } finally {
      setDeleteDialog(false)
      setSelectedBackup(null)
    }
  }

  // Download backup
  const handleDownload = backup => {
    window.open(`/api/backups?action=download&filename=${encodeURIComponent(backup.filename)}`, '_blank')
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Grid container spacing={4}>
      {/* Header */}
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant='h4'>
            <i className='ri-database-2-line' style={{ marginLeft: 8 }} />
            إدارة النسخ الاحتياطية
          </Typography>
          <Button
            variant='contained'
            color='primary'
            onClick={handleCreateBackup}
            disabled={creating}
            startIcon={creating ? <CircularProgress size={20} color='inherit' /> : <i className='ri-add-line' />}
          >
            {creating ? 'جاري الإنشاء...' : 'إنشاء نسخة احتياطية'}
          </Button>
        </Box>
      </Grid>

      {/* Alert */}
      {alert && (
        <Grid item xs={12}>
          <Alert severity={alert.type} onClose={() => setAlert(null)}>
            {alert.message}
          </Alert>
        </Grid>
      )}

      {/* Restoring Progress */}
      {restoring && (
        <Grid item xs={12}>
          <Alert severity='info' icon={<CircularProgress size={20} />}>
            جاري استعادة قاعدة البيانات... يرجى الانتظار
          </Alert>
          <LinearProgress sx={{ mt: 1 }} />
        </Grid>
      )}

      {/* Statistics Cards */}
      {stats && (
        <Grid item xs={12}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <i className='ri-file-copy-2-line' style={{ fontSize: 40, color: '#1976d2' }} />
                  <Typography variant='h4' sx={{ mt: 1 }}>
                    {stats.totalBackups}
                  </Typography>
                  <Typography color='textSecondary'>إجمالي النسخ</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <i className='ri-hard-drive-2-line' style={{ fontSize: 40, color: '#2e7d32' }} />
                  <Typography variant='h4' sx={{ mt: 1 }}>
                    {stats.totalSizeFormatted}
                  </Typography>
                  <Typography color='textSecondary'>الحجم الإجمالي</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <i className='ri-time-line' style={{ fontSize: 40, color: '#f57c00' }} />
                  <Typography variant='h6' sx={{ mt: 1 }}>
                    {stats.newestBackup?.createdFormatted || 'لا يوجد'}
                  </Typography>
                  <Typography color='textSecondary'>آخر نسخة</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <i className='ri-calendar-line' style={{ fontSize: 40, color: '#7b1fa2' }} />
                  <Typography variant='h4' sx={{ mt: 1 }}>
                    {stats.retentionDays}
                  </Typography>
                  <Typography color='textSecondary'>أيام الاحتفاظ</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      )}

      {/* Backups Table */}
      <Grid item xs={12}>
        <Card>
          <CardHeader title='قائمة النسخ الاحتياطية' />
          <CardContent>
            {backups.length === 0 ? (
              <Alert severity='info'>لا توجد نسخ احتياطية حالياً. قم بإنشاء نسخة جديدة.</Alert>
            ) : (
              <TableContainer component={Paper} variant='outlined'>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>اسم الملف</TableCell>
                      <TableCell>الحجم</TableCell>
                      <TableCell>تاريخ الإنشاء</TableCell>
                      <TableCell>الصيغة</TableCell>
                      <TableCell>النوع</TableCell>
                      <TableCell align='center'>الإجراءات</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {backups.map((backup, index) => (
                      <TableRow key={backup.filename}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <Typography variant='body2' sx={{ fontFamily: 'monospace' }}>
                            {backup.filename}
                          </Typography>
                        </TableCell>
                        <TableCell>{backup.sizeFormatted}</TableCell>
                        <TableCell>{backup.createdFormatted}</TableCell>
                        <TableCell>
                          <Chip label={backup.format || 'JSON'} color='info' size='small' />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={backup.isCompressed ? 'مضغوط' : 'عادي'}
                            color={backup.isCompressed ? 'success' : 'default'}
                            size='small'
                          />
                        </TableCell>
                        <TableCell align='center'>
                          <Tooltip title='تحميل'>
                            <IconButton color='primary' onClick={() => handleDownload(backup)}>
                              <i className='ri-download-2-line' />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title='استعادة'>
                            <IconButton
                              color='warning'
                              onClick={() => {
                                setSelectedBackup(backup)
                                setRestoreDialog(true)
                              }}
                            >
                              <i className='ri-refresh-line' />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title='حذف'>
                            <IconButton
                              color='error'
                              onClick={() => {
                                setSelectedBackup(backup)
                                setDeleteDialog(true)
                              }}
                            >
                              <i className='ri-delete-bin-line' />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Restore Confirmation Dialog */}
      <Dialog open={restoreDialog} onClose={() => setRestoreDialog(false)}>
        <DialogTitle>
          <i className='ri-alert-line' style={{ color: '#f57c00', marginLeft: 8 }} />
          تأكيد الاستعادة
        </DialogTitle>
        <DialogContent>
          <Typography>
            هل أنت متأكد من استعادة قاعدة البيانات من هذه النسخة؟
            <br />
            <strong style={{ color: '#c62828' }}>تحذير: سيتم استبدال جميع البيانات الحالية!</strong>
          </Typography>
          {selectedBackup && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant='body2'>
                <strong>الملف:</strong> {selectedBackup.filename}
              </Typography>
              <Typography variant='body2'>
                <strong>الحجم:</strong> {selectedBackup.sizeFormatted}
              </Typography>
              <Typography variant='body2'>
                <strong>التاريخ:</strong> {selectedBackup.createdFormatted}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialog(false)}>إلغاء</Button>
          <Button onClick={handleRestore} color='warning' variant='contained'>
            استعادة
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>
          <i className='ri-delete-bin-line' style={{ color: '#c62828', marginLeft: 8 }} />
          تأكيد الحذف
        </DialogTitle>
        <DialogContent>
          <Typography>هل أنت متأكد من حذف هذه النسخة الاحتياطية؟</Typography>
          {selectedBackup && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#ffebee', borderRadius: 1 }}>
              <Typography variant='body2'>
                <strong>الملف:</strong> {selectedBackup.filename}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>إلغاء</Button>
          <Button onClick={handleDelete} color='error' variant='contained'>
            حذف
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  )
}
