'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Box,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import DownloadIcon from '@mui/icons-material/Download'

function TabPanel(props) {
  const { children, value, index, ...other } = props

  return (
    <div role='tabpanel' hidden={value !== index} id={`tabpanel-${index}`} aria-labelledby={`tab-${index}`} {...other}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  )
}

export default function HRPage() {
  const [tabValue, setTabValue] = useState(0)
  const [workers, setWorkers] = useState([])
  const [attendance, setAttendance] = useState([])
  const [dailySalaries, setDailySalaries] = useState([])
  const [weeklySalaries, setWeeklySalaries] = useState({ workers: [], summary: {} })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Worker Dialog
  const [workerDialogOpen, setWorkerDialogOpen] = useState(false)
  const [workerFormData, setWorkerFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    baseSalary: '',
    hireDate: '',
    status: 'active'
  })
  const [editingWorkerId, setEditingWorkerId] = useState(null)

  // Attendance Dialog
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false)
  const [attendanceFormData, setAttendanceFormData] = useState({
    workerId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    checkInTime: '',
    checkOutTime: '',
    checkInDevice: '',
    checkOutDevice: '',
    notes: ''
  })

  // Salary Dialog
  const [salaryDialogOpen, setSalaryDialogOpen] = useState(false)
  const [salaryFormData, setSalaryFormData] = useState({
    workerId: '',
    date: new Date().toISOString().split('T')[0],
    dailyAmount: '',
    bonus: 0,
    deduction: 0,
    notes: ''
  })

  // Filters
  const [attendanceStartDate, setAttendanceStartDate] = useState('')
  const [attendanceEndDate, setAttendanceEndDate] = useState('')
  const [attendanceDevice, setAttendanceDevice] = useState('')

  const [salaryStartDate, setSalaryStartDate] = useState('')
  const [salaryEndDate, setSalaryEndDate] = useState('')

  // Monthly summary defaults
  const getMonthDates = () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }
  }
  const monthDates = getMonthDates()
  const [monthlyStartDate, setMonthlyStartDate] = useState(monthDates.start)
  const [monthlyEndDate, setMonthlyEndDate] = useState(monthDates.end)
  const [monthlySalaries, setMonthlySalaries] = useState({ workers: [], summary: {} })

  // Weekly salary filters - default to current week
  const getWeekDates = () => {
    const today = new Date()
    const startOfWeek = new Date(today)

    startOfWeek.setDate(today.getDate() - today.getDay())

    const endOfWeek = new Date(startOfWeek)

    endOfWeek.setDate(startOfWeek.getDate() + 6)

    return {
      start: startOfWeek.toISOString().split('T')[0],
      end: endOfWeek.toISOString().split('T')[0]
    }
  }

  const weekDates = getWeekDates()
  const [weeklyStartDate, setWeeklyStartDate] = useState(weekDates.start)
  const [weeklyEndDate, setWeeklyEndDate] = useState(weekDates.end)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    fetchWeeklySalaries()
  }, [weeklyStartDate, weeklyEndDate])

  const fetchData = async () => {
    try {
      setLoading(true)

      const [workersRes, attendanceRes, salariesRes, weeklyRes] = await Promise.all([
        fetch('/api/workers', { credentials: 'include' }),
        fetch('/api/attendance', { credentials: 'include' }),
        fetch('/api/daily-salaries', { credentials: 'include' }),
        fetch(`/api/weekly-salaries?startDate=${weeklyStartDate}&endDate=${weeklyEndDate}`, { credentials: 'include' })
      ])

      if (workersRes.ok) setWorkers((await workersRes.json()).data || [])
      if (attendanceRes.ok) setAttendance((await attendanceRes.json()).data || [])
      if (salariesRes.ok) setDailySalaries((await salariesRes.json()).data || [])
      if (weeklyRes.ok) setWeeklySalaries((await weeklyRes.json()).data || { workers: [], summary: {} })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchWeeklySalaries = async () => {
    try {
      const res = await fetch(`/api/weekly-salaries?startDate=${weeklyStartDate}&endDate=${weeklyEndDate}`, {
        credentials: 'include'
      })

      if (res.ok) {
        const data = await res.json()

        setWeeklySalaries(data.data || { workers: [], summary: {} })
      }
    } catch (err) {
      console.error('Failed to fetch weekly salaries:', err)
    }
  }

  const fetchAttendanceFiltered = async () => {
    try {
      let url = '/api/attendance?'
      const params = []
      if (attendanceStartDate) params.push(`startDate=${attendanceStartDate}`)
      if (attendanceEndDate) params.push(`endDate=${attendanceEndDate}`)
      if (attendanceDevice) params.push(`device=${encodeURIComponent(attendanceDevice)}`)
      url += params.join('&')

      const res = await fetch(url, { credentials: 'include' })
      if (res.ok) {
        const result = await res.json()
        setAttendance(result.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch filtered attendance:', err)
    }
  }

  const fetchMonthlySalaries = async () => {
    try {
      const res = await fetch(`/api/monthly-salaries?startDate=${monthlyStartDate}&endDate=${monthlyEndDate}`, {
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        setMonthlySalaries(data.data || { workers: [], summary: {} })
      }
    } catch (err) {
      console.error('Failed to fetch monthly salaries:', err)
    }
  }

  useEffect(() => {
    fetchMonthlySalaries()
  }, [monthlyStartDate, monthlyEndDate])

  const handleExportWeeklySalaries = () => {
    const dataToExport = weeklySalaries.workers.map(w => ({
      'Worker Name': w.workerName,
      Position: w.position || 'N/A',
      Department: w.department || 'N/A',
      'Daily Rate': w.dailyRate,
      'Days Worked': w.daysWorked,
      'Weekly Salary': w.weeklySalary,
      'Week Start': w.weekStart,
      'Week End': w.weekEnd
    }))

    exportToExcel(dataToExport, `weekly-salaries-${weeklyStartDate}-to-${weeklyEndDate}.csv`)
  }

  const handleExportMonthlySalaries = () => {
    const dataToExport = monthlySalaries.workers.map(w => ({
      'Worker Name': w.workerName,
      Position: w.position || 'N/A',
      Department: w.department || 'N/A',
      'Daily Rate': w.dailyRate,
      'Days Worked': w.daysWorked,
      'Monthly Salary': w.monthlySalary,
      'Month Start': w.monthStart,
      'Month End': w.monthEnd
    }))
    exportToExcel(dataToExport, `monthly-salaries-${monthlyStartDate}-to-${monthlyEndDate}.csv`)
  }

  // Worker handlers
  const handleAddWorker = () => {
    setEditingWorkerId(null)
    setWorkerFormData({
      name: '',
      email: '',
      phone: '',
      position: '',
      department: '',
      baseSalary: '',
      hireDate: '',
      status: 'active'
    })
    setWorkerDialogOpen(true)
  }

  const handleEditWorker = worker => {
    setEditingWorkerId(worker.id)
    setWorkerFormData(worker)
    setWorkerDialogOpen(true)
  }

  const handleSaveWorker = async () => {
    if (!workerFormData.name.trim()) {
      setError('اسم العامل مطلوب')
      return
    }

    try {
      const method = editingWorkerId ? 'PUT' : 'POST'
      const url = editingWorkerId ? `/api/workers/${editingWorkerId}` : '/api/workers'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(workerFormData)
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || 'Failed to save worker')
      }

      setWorkerDialogOpen(false)
      setError('')
      await fetchData()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeleteWorker = async id => {
    if (!confirm('هل أنت متأكد من حذف هذا العامل؟')) return

    try {
      const response = await fetch(`/api/workers/${id}`, { method: 'DELETE', credentials: 'include' })
      if (!response.ok) throw new Error('Failed to delete worker')
      setError('')
      await fetchData()
    } catch (err) {
      setError(err.message)
    }
  }

  // Attendance handlers
  const handleSaveAttendance = async () => {
    if (!attendanceFormData.workerId || !attendanceFormData.date) {
      setError('العامل والتاريخ مطلوبان')
      return
    }

    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(attendanceFormData)
      })

      if (!response.ok) throw new Error('Failed to save attendance')

      setAttendanceDialogOpen(false)
      setError('')
      await fetchData()
    } catch (err) {
      setError(err.message)
    }
  }

  // Salary handlers
  const handleSaveSalary = async () => {
    if (!salaryFormData.workerId || !salaryFormData.date || !salaryFormData.dailyAmount) {
      setError('العامل والتاريخ والمبلغ اليومي مطلوبين')
      return
    }

    try {
      const response = await fetch('/api/daily-salaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(salaryFormData)
      })

      if (!response.ok) throw new Error('Failed to save salary')

      setSalaryDialogOpen(false)
      setError('')
      await fetchData()
    } catch (err) {
      setError(err.message)
    }
  }

  // Excel Export
  const exportToExcel = (data, filename) => {
    const headers = Object.keys(data[0] || {})
    const csv = [
      headers.join(','),
      ...data.map(row =>
        headers
          .map(header => {
            const value = row[header]
            return typeof value === 'string' && value.includes(',') ? `"${value}"` : value
          })
          .join(',')
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportAttendance = () => {
    const dataToExport = attendance.map(rec => ({
      'Worker Name': rec.Worker?.name || 'N/A',
      Date: rec.date,
      Status: rec.status,
      'Check In': rec.checkInTime || 'N/A',
      'Check In Device': rec.checkInDevice || 'N/A',
      'Check Out': rec.checkOutTime || 'N/A',
      'Check Out Device': rec.checkOutDevice || 'N/A',
      Notes: rec.notes || ''
    }))
    exportToExcel(dataToExport, 'attendance.csv')
  }

  const handleExportSalaries = () => {
    const dataToExport = dailySalaries.map(sal => ({
      'Worker Name': sal.Worker?.name || 'N/A',
      Position: sal.Worker?.position || 'N/A',
      Date: sal.date,
      'Daily Amount': sal.dailyAmount,
      Bonus: sal.bonus,
      Deduction: sal.deduction,
      'Total Amount': sal.totalAmount,
      Notes: sal.notes || ''
    }))
    exportToExcel(dataToExport, 'daily-salaries.csv')
  }

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='400px'>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <div className='p-6' dir='rtl'>
      <h1 className='text-2xl font-semibold mb-6'>إدارة الموارد البشرية</h1>

      {error && (
        <Alert severity='error' onClose={() => setError('')} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label='العمال' />
          <Tab label='الحضور' />
          <Tab label='الراتب اليومي' />
          <Tab label='الملخص الأسبوعي' />
          <Tab label='الملخص الشهري' />
        </Tabs>

        {/* Workers Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 3, p: 2 }}>
            <Button variant='contained' color='primary' startIcon={<AddIcon />} onClick={handleAddWorker}>
              إضافة عامل
            </Button>
          </Box>

          {workers.length === 0 ? (
            <Alert severity='info' sx={{ m: 2 }}>
              لم يتم العثور على عمال. أضف واحداً للبدء.
            </Alert>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'var(--mui-palette-action-hover)' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>الاسم</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>البريد الإلكتروني</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>الهاتف</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>المنصب</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>القسم</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>الراتب الأساسي</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>الحالة</TableCell>
                    <TableCell align='center' sx={{ fontWeight: 'bold' }}>
                      الإجراءات
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {workers.map(worker => (
                    <TableRow key={worker.id} hover sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}>
                      <TableCell sx={{ fontWeight: '500' }}>{worker.name}</TableCell>
                      <TableCell>{worker.email || '-'}</TableCell>
                      <TableCell>{worker.phone || '-'}</TableCell>
                      <TableCell>{worker.position || '-'}</TableCell>
                      <TableCell>{worker.department || '-'}</TableCell>
                      <TableCell>{parseFloat(worker.baseSalary || 0).toFixed(2)} ج.م</TableCell>
                      <TableCell>
                        <span
                          style={{
                            padding: '6px 12px',
                            borderRadius: '16px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: worker.status === 'active' ? '#e8f5e9' : '#ffebee',
                            color: worker.status === 'active' ? '#2e7d32' : '#c62828'
                          }}
                        >
                          {worker.status === 'active' ? 'نشط' : worker.status === 'inactive' ? 'غير نشط' : 'في إجازة'}
                        </span>
                      </TableCell>
                      <TableCell align='center'>
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <IconButton size='small' color='primary' onClick={() => handleEditWorker(worker)}>
                            <EditIcon fontSize='small' />
                          </IconButton>
                          <IconButton size='small' color='error' onClick={() => handleDeleteWorker(worker.id)}>
                            <DeleteIcon fontSize='small' />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </TabPanel>

        {/* Attendance Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3, p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              type='date'
              label='من تاريخ'
              InputLabelProps={{ shrink: true }}
              value={attendanceStartDate}
              onChange={e => setAttendanceStartDate(e.target.value)}
              size='small'
            />
            <TextField
              type='date'
              label='إلى تاريخ'
              InputLabelProps={{ shrink: true }}
              value={attendanceEndDate}
              onChange={e => setAttendanceEndDate(e.target.value)}
              size='small'
            />
            <TextField
              label='جهاز'
              value={attendanceDevice}
              onChange={e => setAttendanceDevice(e.target.value)}
              size='small'
            />
            <Button variant='contained' color='primary' onClick={fetchAttendanceFiltered}>
              بحث
            </Button>
            <Button
              variant='contained'
              color='primary'
              startIcon={<AddIcon />}
              onClick={() => setAttendanceDialogOpen(true)}
            >
              تسجيل الحضور
            </Button>
            <Button variant='outlined' startIcon={<DownloadIcon />} onClick={handleExportAttendance}>
              تصدير CSV
            </Button>
          </Box>

          {attendance.length === 0 ? (
            <Alert severity='info' sx={{ m: 2 }}>
              لم يتم العثور على سجلات حضور.
            </Alert>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'var(--mui-palette-action-hover)' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>العامل</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>التاريخ</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>الحالة</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>وقت الحضور</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>جهاز حضور</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>وقت الانصراف</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>جهاز انصراف</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>ملاحظات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attendance.map(rec => (
                    <TableRow key={rec.id} hover sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}>
                      <TableCell sx={{ fontWeight: '500' }}>{rec.Worker?.name || 'غير متاح'}</TableCell>
                      <TableCell>{new Date(rec.date).toLocaleDateString('ar-EG')}</TableCell>
                      <TableCell>
                        <span
                          style={{
                            padding: '6px 12px',
                            borderRadius: '16px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: rec.status === 'present' ? '#e8f5e9' : '#ffebee',
                            color: rec.status === 'present' ? '#2e7d32' : '#c62828'
                          }}
                        >
                          {rec.status === 'present'
                            ? 'حاضر'
                            : rec.status === 'absent'
                              ? 'غائب'
                              : rec.status === 'half-day'
                                ? 'نصف يوم'
                                : 'إجازة'}
                        </span>
                      </TableCell>
                      <TableCell>{rec.checkInTime || '-'}</TableCell>
                      <TableCell>{rec.checkInDevice || '-'}</TableCell>
                      <TableCell>{rec.checkOutTime || '-'}</TableCell>
                      <TableCell>{rec.checkOutDevice || '-'}</TableCell>
                      <TableCell>{rec.notes || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </TabPanel>

        {/* Daily Salary Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 3, p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              type='date'
              label='من تاريخ'
              InputLabelProps={{ shrink: true }}
              value={salaryStartDate}
              onChange={e => setSalaryStartDate(e.target.value)}
              size='small'
            />
            <TextField
              type='date'
              label='إلى تاريخ'
              InputLabelProps={{ shrink: true }}
              value={salaryEndDate}
              onChange={e => setSalaryEndDate(e.target.value)}
              size='small'
            />
            <Button
              variant='contained'
              color='primary'
              startIcon={<AddIcon />}
              onClick={() => setSalaryDialogOpen(true)}
            >
              إضافة راتب يومي
            </Button>
            <Button variant='outlined' startIcon={<DownloadIcon />} onClick={handleExportSalaries}>
              تصدير CSV
            </Button>
          </Box>

          {dailySalaries.length === 0 ? (
            <Alert severity='info' sx={{ m: 2 }}>
              لم يتم العثور على سجلات رواتب.
            </Alert>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'var(--mui-palette-action-hover)' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>العامل</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>المنصب</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>التاريخ</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>المبلغ اليومي</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>مكافأة</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>خصم</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>الإجمالي</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>ملاحظات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dailySalaries.map(sal => (
                    <TableRow key={sal.id} hover sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}>
                      <TableCell sx={{ fontWeight: '500' }}>{sal.Worker?.name || 'غير متاح'}</TableCell>
                      <TableCell>{sal.Worker?.position || '-'}</TableCell>
                      <TableCell>{new Date(sal.date).toLocaleDateString('ar-EG')}</TableCell>
                      <TableCell>{parseFloat(sal.dailyAmount).toFixed(2)} ج.م</TableCell>
                      <TableCell>{parseFloat(sal.bonus || 0).toFixed(2)} ج.م</TableCell>
                      <TableCell>{parseFloat(sal.deduction || 0).toFixed(2)} ج.م</TableCell>
                      <TableCell sx={{ fontWeight: '600', color: '#2e7d32' }}>
                        {parseFloat(sal.totalAmount).toFixed(2)} ج.م
                      </TableCell>
                      <TableCell>{sal.notes || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </TabPanel>

        {/* Weekly Summary Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ mb: 3, p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              type='date'
              label='بداية الأسبوع'
              InputLabelProps={{ shrink: true }}
              value={weeklyStartDate}
              onChange={e => setWeeklyStartDate(e.target.value)}
              size='small'
            />
            <TextField
              type='date'
              label='نهاية الأسبوع'
              InputLabelProps={{ shrink: true }}
              value={weeklyEndDate}
              onChange={e => setWeeklyEndDate(e.target.value)}
              size='small'
            />
            <Button variant='outlined' startIcon={<DownloadIcon />} onClick={handleExportWeeklySalaries}>
              تصدير CSV
            </Button>
          </Box>

          {/* Summary Cards */}
          <Box sx={{ mb: 3, p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Paper sx={{ p: 2, minWidth: 150, textAlign: 'center', backgroundColor: '#e3f2fd' }}>
              <Box sx={{ fontSize: '0.875rem', color: '#1565c0' }}>إجمالي العمال</Box>
              <Box sx={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1565c0' }}>
                {weeklySalaries.summary?.totalWorkers || 0}
              </Box>
            </Paper>
            <Paper sx={{ p: 2, minWidth: 150, textAlign: 'center', backgroundColor: '#fff3e0' }}>
              <Box sx={{ fontSize: '0.875rem', color: '#e65100' }}>إجمالي أيام العمل</Box>
              <Box sx={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#e65100' }}>
                {weeklySalaries.summary?.totalDaysWorked || 0}
              </Box>
            </Paper>
            <Paper sx={{ p: 2, minWidth: 150, textAlign: 'center', backgroundColor: '#e8f5e9' }}>
              <Box sx={{ fontSize: '0.875rem', color: '#2e7d32' }}>إجمالي الراتب الأسبوعي</Box>
              <Box sx={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2e7d32' }}>
                {(weeklySalaries.summary?.totalWeeklySalary || 0).toFixed(2)} ج.م
              </Box>
            </Paper>
          </Box>

          {weeklySalaries.workers?.length === 0 ? (
            <Alert severity='info' sx={{ m: 2 }}>
              لم يتم العثور على سجلات حضور لهذا الأسبوع. أضف الحضور أولاً.
            </Alert>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'var(--mui-palette-action-hover)' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>العامل</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>المنصب</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>القسم</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>الأجر اليومي</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>أيام العمل</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>الراتب الأسبوعي</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {weeklySalaries.workers?.map(w => (
                    <TableRow key={w.workerId} hover sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}>
                      <TableCell sx={{ fontWeight: '500' }}>{w.workerName}</TableCell>
                      <TableCell>{w.position || '-'}</TableCell>
                      <TableCell>{w.department || '-'}</TableCell>
                      <TableCell>{parseFloat(w.dailyRate || 0).toFixed(2)} ج.م</TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            display: 'inline-block',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            backgroundColor: w.daysWorked > 0 ? '#e8f5e9' : '#ffebee',
                            color: w.daysWorked > 0 ? '#2e7d32' : '#c62828',
                            fontWeight: '600'
                          }}
                        >
                          {w.daysWorked} {w.daysWorked === 1 ? 'يوم' : 'أيام'}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontWeight: '600', color: '#2e7d32', fontSize: '1rem' }}>
                        {parseFloat(w.weeklySalary || 0).toFixed(2)} ج.م
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </TabPanel>

        {/* Monthly Summary Tab */}
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ mb: 3, p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              type='date'
              label='بداية الشهر'
              InputLabelProps={{ shrink: true }}
              value={monthlyStartDate}
              onChange={e => setMonthlyStartDate(e.target.value)}
              size='small'
            />
            <TextField
              type='date'
              label='نهاية الشهر'
              InputLabelProps={{ shrink: true }}
              value={monthlyEndDate}
              onChange={e => setMonthlyEndDate(e.target.value)}
              size='small'
            />
            <Button variant='outlined' startIcon={<DownloadIcon />} onClick={handleExportMonthlySalaries}>
              تصدير CSV
            </Button>
          </Box>

          {/* Summary Cards */}
          <Box sx={{ mb: 3, p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Paper sx={{ p: 2, minWidth: 150, textAlign: 'center', backgroundColor: '#e3f2fd' }}>
              <Box sx={{ fontSize: '0.875rem', color: '#1565c0' }}>إجمالي العمال</Box>
              <Box sx={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1565c0' }}>
                {monthlySalaries.summary?.totalWorkers || 0}
              </Box>
            </Paper>
            <Paper sx={{ p: 2, minWidth: 150, textAlign: 'center', backgroundColor: '#fff3e0' }}>
              <Box sx={{ fontSize: '0.875rem', color: '#e65100' }}>إجمالي أيام العمل</Box>
              <Box sx={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#e65100' }}>
                {monthlySalaries.summary?.totalDaysWorked || 0}
              </Box>
            </Paper>
            <Paper sx={{ p: 2, minWidth: 150, textAlign: 'center', backgroundColor: '#e8f5e9' }}>
              <Box sx={{ fontSize: '0.875rem', color: '#2e7d32' }}>إجمالي الراتب الشهري</Box>
              <Box sx={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2e7d32' }}>
                {(monthlySalaries.summary?.totalMonthlySalary || 0).toFixed(2)} ج.م
              </Box>
            </Paper>
          </Box>

          {monthlySalaries.workers?.length === 0 ? (
            <Alert severity='info' sx={{ m: 2 }}>
              لم يتم العثور على سجلات حضور لهذا الشهر. أضف الحضور أولاً.
            </Alert>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'var(--mui-palette-action-hover)' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>العامل</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>المنصب</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>القسم</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>الأجر اليومي</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>أيام العمل</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>الراتب الشهري</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {monthlySalaries.workers?.map(w => (
                    <TableRow key={w.workerId} hover sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}>
                      <TableCell sx={{ fontWeight: '500' }}>{w.workerName}</TableCell>
                      <TableCell>{w.position || '-'}</TableCell>
                      <TableCell>{w.department || '-'}</TableCell>
                      <TableCell>{parseFloat(w.dailyRate || 0).toFixed(2)} ج.م</TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            display: 'inline-block',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            backgroundColor: w.daysWorked > 0 ? '#e8f5e9' : '#ffebee',
                            color: w.daysWorked > 0 ? '#2e7d32' : '#c62828',
                            fontWeight: '600'
                          }}
                        >
                          {w.daysWorked} {w.daysWorked === 1 ? 'يوم' : 'أيام'}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontWeight: '600', color: '#2e7d32', fontSize: '1rem' }}>
                        {parseFloat(w.monthlySalary || 0).toFixed(2)} ج.م
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </TabPanel>
      </Paper>

      {/* Worker Dialog */}
      <Dialog open={workerDialogOpen} onClose={() => setWorkerDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>{editingWorkerId ? 'تعديل العامل' : 'إضافة عامل جديد'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='الاسم *'
                value={workerFormData.name}
                onChange={e => setWorkerFormData({ ...workerFormData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='البريد الإلكتروني'
                type='email'
                value={workerFormData.email}
                onChange={e => setWorkerFormData({ ...workerFormData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='الهاتف'
                value={workerFormData.phone}
                onChange={e => setWorkerFormData({ ...workerFormData, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='المنصب'
                value={workerFormData.position}
                onChange={e => setWorkerFormData({ ...workerFormData, position: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='القسم'
                value={workerFormData.department}
                onChange={e => setWorkerFormData({ ...workerFormData, department: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='الراتب الأساسي'
                type='number'
                inputProps={{ step: '0.01' }}
                value={workerFormData.baseSalary}
                onChange={e => setWorkerFormData({ ...workerFormData, baseSalary: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='تاريخ التعيين'
                type='date'
                InputLabelProps={{ shrink: true }}
                value={workerFormData.hireDate}
                onChange={e => setWorkerFormData({ ...workerFormData, hireDate: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>الحالة</InputLabel>
                <Select
                  value={workerFormData.status}
                  label='الحالة'
                  onChange={e => setWorkerFormData({ ...workerFormData, status: e.target.value })}
                >
                  <MenuItem value='active'>نشط</MenuItem>
                  <MenuItem value='inactive'>غير نشط</MenuItem>
                  <MenuItem value='on-leave'>في إجازة</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setWorkerDialogOpen(false)}>إلغاء</Button>
          <Button onClick={handleSaveWorker} variant='contained' color='primary'>
            حفظ العامل
          </Button>
        </DialogActions>
      </Dialog>

      {/* Attendance Dialog */}
      <Dialog open={attendanceDialogOpen} onClose={() => setAttendanceDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>تسجيل الحضور</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>العامل *</InputLabel>
                <Select
                  value={attendanceFormData.workerId}
                  label='العامل *'
                  onChange={e => setAttendanceFormData({ ...attendanceFormData, workerId: e.target.value })}
                >
                  {workers.map(w => (
                    <MenuItem key={w.id} value={w.id}>
                      {w.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='التاريخ *'
                type='date'
                InputLabelProps={{ shrink: true }}
                value={attendanceFormData.date}
                onChange={e => setAttendanceFormData({ ...attendanceFormData, date: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>الحالة</InputLabel>
                <Select
                  value={attendanceFormData.status}
                  label='الحالة'
                  onChange={e => setAttendanceFormData({ ...attendanceFormData, status: e.target.value })}
                >
                  <MenuItem value='present'>حاضر</MenuItem>
                  <MenuItem value='absent'>غائب</MenuItem>
                  <MenuItem value='half-day'>نصف يوم</MenuItem>
                  <MenuItem value='leave'>إجازة</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='وقت الحضور'
                type='time'
                InputLabelProps={{ shrink: true }}
                value={attendanceFormData.checkInTime}
                onChange={e => setAttendanceFormData({ ...attendanceFormData, checkInTime: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='وقت الانصراف'
                type='time'
                InputLabelProps={{ shrink: true }}
                value={attendanceFormData.checkOutTime}
                onChange={e => setAttendanceFormData({ ...attendanceFormData, checkOutTime: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='جهاز الحضور'
                value={attendanceFormData.checkInDevice}
                onChange={e => setAttendanceFormData({ ...attendanceFormData, checkInDevice: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='جهاز الانصراف'
                value={attendanceFormData.checkOutDevice}
                onChange={e => setAttendanceFormData({ ...attendanceFormData, checkOutDevice: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label='ملاحظات'
                value={attendanceFormData.notes}
                onChange={e => setAttendanceFormData({ ...attendanceFormData, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAttendanceDialogOpen(false)}>إلغاء</Button>
          <Button onClick={handleSaveAttendance} variant='contained' color='primary'>
            حفظ الحضور
          </Button>
        </DialogActions>
      </Dialog>

      {/* Salary Dialog */}
      <Dialog open={salaryDialogOpen} onClose={() => setSalaryDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>إضافة راتب يومي</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>العامل *</InputLabel>
                <Select
                  value={salaryFormData.workerId}
                  label='العامل *'
                  onChange={e => setSalaryFormData({ ...salaryFormData, workerId: e.target.value })}
                >
                  {workers.map(w => (
                    <MenuItem key={w.id} value={w.id}>
                      {w.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='التاريخ *'
                type='date'
                InputLabelProps={{ shrink: true }}
                value={salaryFormData.date}
                onChange={e => setSalaryFormData({ ...salaryFormData, date: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='المبلغ اليومي *'
                type='number'
                inputProps={{ step: '0.01' }}
                value={salaryFormData.dailyAmount}
                onChange={e => setSalaryFormData({ ...salaryFormData, dailyAmount: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='مكافأة'
                type='number'
                inputProps={{ step: '0.01' }}
                value={salaryFormData.bonus}
                onChange={e => setSalaryFormData({ ...salaryFormData, bonus: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='خصم'
                type='number'
                inputProps={{ step: '0.01' }}
                value={salaryFormData.deduction}
                onChange={e => setSalaryFormData({ ...salaryFormData, deduction: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label='ملاحظات'
                value={salaryFormData.notes}
                onChange={e => setSalaryFormData({ ...salaryFormData, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSalaryDialogOpen(false)}>إلغاء</Button>
          <Button onClick={handleSaveSalary} variant='contained' color='primary'>
            حفظ الراتب
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
