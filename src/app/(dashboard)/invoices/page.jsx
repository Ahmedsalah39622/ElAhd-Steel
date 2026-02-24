'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'

export default function InvoicesListDashboard() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [paidAmount, setPaidAmount] = useState('')
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null)

  const statusLabels = {
    draft: 'مسودة',
    sent: 'مرسلة',
    paid: 'مدفوعة',
    partial: 'مدفوعة جزئياً',
    overdue: 'متأخرة',
    cancelled: 'ملغاة'
  }

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/invoices', {
        credentials: 'include'
      })
      if (!res.ok) {
        const text = await res.text().catch(() => null)
        console.error('Failed to fetch /api/invoices', res.status, text)
        throw new Error(`Fetch failed: ${res.status}`)
      }
      const data = await res.json()
      setInvoices(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching invoices:', err)
      setSnackbar({ open: true, message: 'فشل في تحميل الفواتير', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [])

  // Menu handlers
  const handleMenuOpen = (event, invoice) => {
    setAnchorEl(event.currentTarget)
    setSelectedInvoice(invoice)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  // Delete invoice
  const handleDeleteClick = () => {
    handleMenuClose()
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedInvoice) return

    try {
      const res = await fetch(`/api/invoices?id=${selectedInvoice.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (res.ok) {
        setInvoices(invoices.filter(inv => inv.id !== selectedInvoice.id))
        setSnackbar({ open: true, message: 'تم حذف الفاتورة بنجاح', severity: 'success' })
      } else {
        throw new Error('Failed to delete')
      }
    } catch (err) {
      console.error('Error deleting invoice:', err)
      setSnackbar({ open: true, message: 'فشل في حذف الفاتورة', severity: 'error' })
    } finally {
      setDeleteDialogOpen(false)
      setSelectedInvoice(null)
    }
  }

  // Change status
  const handleStatusClick = () => {
    handleMenuClose()
    setNewStatus(selectedInvoice?.status || 'draft')
    setPaidAmount(selectedInvoice?.paidAmount || '')
    setStatusDialogOpen(true)
  }

  const handleStatusConfirm = async () => {
    if (!selectedInvoice) return

    try {
      const updateData = { status: newStatus }

      // If partial payment, include the paid amount
      if (newStatus === 'partial') {
        updateData.paidAmount = parseFloat(paidAmount) || 0
      } else if (newStatus === 'paid') {
        // If fully paid, set paid amount to total
        updateData.paidAmount = parseFloat(selectedInvoice.total) || 0
      }

      const res = await fetch(`/api/invoices?id=${selectedInvoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updateData)
      })

      if (res.ok) {
        setInvoices(
          invoices.map(inv =>
            inv.id === selectedInvoice.id ? { ...inv, status: newStatus, paidAmount: updateData.paidAmount } : inv
          )
        )
        setSnackbar({ open: true, message: 'تم تحديث حالة الفاتورة', severity: 'success' })
      } else {
        throw new Error('Failed to update status')
      }
    } catch (err) {
      console.error('Error updating status:', err)
      setSnackbar({ open: true, message: 'فشل في تحديث الحالة', severity: 'error' })
    } finally {
      setStatusDialogOpen(false)
      setSelectedInvoice(null)
      setPaidAmount('')
    }
  }

  // Print invoice
  const handlePrint = () => {
    handleMenuClose()
    if (selectedInvoice) {
      window.open(`/invoices/${selectedInvoice.id}/preview`, '_blank')
    }
  }

  // Send invoice
  const handleSend = () => {
    handleMenuClose()
    setSnackbar({ open: true, message: 'ميزة إرسال الفاتورة قيد التطوير', severity: 'info' })
  }

  // Duplicate invoice
  const handleDuplicate = () => {
    handleMenuClose()
    if (selectedInvoice) {
      const params = new URLSearchParams({ duplicate: selectedInvoice.id })
      window.location.href = `/invoices/add?${params.toString()}`
    }
  }

  // Filter invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch =
      !searchTerm ||
      (inv.number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.invoiceNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.client?.name || inv.clientName || '').toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Export functions
  const exportToCSV = () => {
    setExportMenuAnchor(null)
    const headers = ['رقم الفاتورة', 'العميل', 'الحالة', 'التاريخ', 'الإجمالي']

    const csvData = filteredInvoices.map(inv => [
      inv.number || inv.invoiceNumber || '-',
      inv.client?.name || inv.clientName || '-',
      statusLabels[inv.status] || inv.status,
      inv.date ? new Date(inv.date).toLocaleDateString('ar-EG') : '-',
      Number(inv.total || 0).toLocaleString('ar-EG')
    ])

    const csvContent = '\uFEFF' + [headers.join(','), ...csvData.map(row => row.join(','))].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `invoices_${new Date().toISOString().split('T')[0]}.csv`
    link.click()

    setSnackbar({ open: true, message: 'تم تصدير الفواتير بنجاح', severity: 'success' })
  }

  const exportToJSON = () => {
    setExportMenuAnchor(null)
    const dataStr = JSON.stringify(filteredInvoices, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `invoices_${new Date().toISOString().split('T')[0]}.json`
    link.click()

    setSnackbar({ open: true, message: 'تم تصدير الفواتير بنجاح', severity: 'success' })
  }

  const printAllInvoices = () => {
    setExportMenuAnchor(null)
    const printWindow = window.open('', '', 'height=600,width=800')
    if (!printWindow) return

    const tableRows = filteredInvoices
      .map(
        (inv, index) => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${index + 1}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${inv.number || inv.invoiceNumber || '-'}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${inv.client?.name || inv.clientName || '-'}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${statusLabels[inv.status] || inv.status}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${inv.date ? new Date(inv.date).toLocaleDateString('ar-EG') : '-'}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: left;" dir="ltr">${Number(inv.total || 0).toLocaleString('ar-EG')} ج.م</td>
      </tr>
    `
      )
      .join('')

    printWindow.document.write(`
      <html>
        <head>
          <title>قائمة الفواتير</title>
          <style>
            body { font-family: Arial, sans-serif; direction: rtl; padding: 20px; }
            h1 { text-align: center; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th { background-color: #f5f5f5; border: 1px solid #ddd; padding: 10px; }
          </style>
        </head>
        <body>
          <h1>قائمة الفواتير</h1>
          <p style="text-align: center; color: #666;">تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG')}</p>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>رقم الفاتورة</th>
                <th>العميل</th>
                <th>الحالة</th>
                <th>التاريخ</th>
                <th>الإجمالي</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
          <p style="text-align: center; margin-top: 20px; color: #666;">
            إجمالي عدد الفواتير: ${filteredInvoices.length}
          </p>
        </body>
      </html>
    `)
    printWindow.document.close()
    setTimeout(() => printWindow.print(), 250)
  }

  return (
    <div className='p-6' dir='rtl'>
      <div className='flex items-center justify-between mb-4'>
        <h1 className='text-2xl font-semibold'>الفواتير</h1>
        <div className='flex gap-2'>
          {/* Export Button */}
          <Button
            variant='outlined'
            startIcon={<i className='tabler-download' />}
            onClick={e => setExportMenuAnchor(e.currentTarget)}
          >
            تصدير
          </Button>
          <Menu anchorEl={exportMenuAnchor} open={Boolean(exportMenuAnchor)} onClose={() => setExportMenuAnchor(null)}>
            <MenuItem onClick={exportToCSV}>
              <i className='tabler-file-spreadsheet ml-2' />
              تصدير CSV
            </MenuItem>
            <MenuItem onClick={exportToJSON}>
              <i className='tabler-file-code ml-2' />
              تصدير JSON
            </MenuItem>
            <MenuItem onClick={printAllInvoices}>
              <i className='tabler-printer ml-2' />
              طباعة الكل
            </MenuItem>
          </Menu>

          <Link href='/invoices/add'>
            <Button variant='contained' color='success' startIcon={<i className='tabler-plus' />}>
              إضافة فاتورة
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filter */}
      <div className='flex gap-4 mb-4'>
        <TextField
          size='small'
          placeholder='بحث...'
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <i className='tabler-search ml-2' />
          }}
          sx={{ minWidth: 200 }}
        />
        <TextField
          select
          size='small'
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value='all'>كل الحالات</MenuItem>
          <MenuItem value='draft'>مسودة</MenuItem>
          <MenuItem value='sent'>مرسلة</MenuItem>
          <MenuItem value='paid'>مدفوعة</MenuItem>
          <MenuItem value='partial'>مدفوعة جزئياً</MenuItem>
          <MenuItem value='overdue'>متأخرة</MenuItem>
          <MenuItem value='cancelled'>ملغاة</MenuItem>
        </TextField>
      </div>

      {loading ? (
        <div className='text-center py-8'>جاري التحميل...</div>
      ) : filteredInvoices.length === 0 ? (
        <div className='text-center py-8 text-gray-500'>لا توجد فواتير</div>
      ) : (
        <div className='overflow-auto'>
          <table className='w-full border' style={{ direction: 'rtl' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--mui-palette-action-hover)' }}>
                <th className='p-2 text-center' style={{ width: '60px' }}>
                  #
                </th>
                <th className='p-2 text-right'>رقم الفاتورة</th>
                <th className='p-2 text-right'>العميل</th>
                <th className='p-2 text-center'>الحالة</th>
                <th className='p-2 text-center'>التاريخ</th>
                <th className='p-2 text-left'>الإجمالي</th>
                <th className='p-2 text-center'>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv, index) => (
                <tr key={inv.id} style={{ borderTop: '1px solid var(--mui-palette-divider)' }}>
                  <td className='p-2 text-center'>{index + 1}</td>
                  <td className='p-2'>{inv.number || inv.invoiceNumber || '-'}</td>
                  <td className='p-2'>{inv.client?.name || inv.clientName || '-'}</td>
                  <td className='p-2 text-center'>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <Chip
                        size='small'
                        label={statusLabels[inv.status] || 'مسودة'}
                        sx={{
                          backgroundColor:
                            inv.status === 'paid'
                              ? '#e8f5e9'
                              : inv.status === 'draft'
                                ? '#fff3e0'
                                : inv.status === 'sent'
                                  ? '#e3f2fd'
                                  : inv.status === 'partial'
                                    ? '#fce4ec'
                                    : inv.status === 'overdue'
                                      ? '#ffebee'
                                      : inv.status === 'cancelled'
                                        ? '#f5f5f5'
                                        : '#fff3e0',
                          color:
                            inv.status === 'paid'
                              ? '#2e7d32'
                              : inv.status === 'draft'
                                ? '#f57c00'
                                : inv.status === 'sent'
                                  ? '#1565c0'
                                  : inv.status === 'partial'
                                    ? '#c2185b'
                                    : inv.status === 'overdue'
                                      ? '#c62828'
                                      : inv.status === 'cancelled'
                                        ? '#616161'
                                        : '#f57c00',
                          fontWeight: 600,
                          fontSize: '12px'
                        }}
                      />
                      {inv.status === 'partial' && inv.paidAmount > 0 && (
                        <Chip
                          size='small'
                          label={`متبقي: ${(Number(inv.total || 0) - Number(inv.paidAmount || 0)).toLocaleString('ar-EG')} ج.م`}
                          sx={{
                            backgroundColor: '#fff3e0',
                            color: '#e65100',
                            fontWeight: 500,
                            fontSize: '10px',
                            height: '20px',
                            '& .MuiChip-label': {
                              padding: '0 8px'
                            }
                          }}
                        />
                      )}
                    </div>
                  </td>
                  <td className='p-2 text-center'>
                    {inv.date
                      ? new Date(inv.date).toLocaleDateString('ar-EG')
                      : inv.dateIssued
                        ? new Date(inv.dateIssued).toLocaleDateString('ar-EG')
                        : '-'}
                  </td>
                  <td className='p-2 text-left' dir='ltr'>
                    {Number(inv.total || 0).toLocaleString('ar-EG')} ج.م
                  </td>
                  <td className='p-2 text-center'>
                    <div className='flex justify-center items-center gap-1'>
                      <Link href={`/invoices/${inv.id}/preview`}>
                        <IconButton size='small' title='معاينة'>
                          <i className='tabler-eye text-lg' />
                        </IconButton>
                      </Link>
                      <Link href={`/invoices/${inv.id}/edit`}>
                        <IconButton size='small' title='تعديل'>
                          <i className='tabler-edit text-lg text-blue-600' />
                        </IconButton>
                      </Link>
                      <IconButton size='small' title='المزيد' onClick={e => handleMenuOpen(e, inv)}>
                        <i className='tabler-dots-vertical text-lg' />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handlePrint}>
          <i className='tabler-printer ml-2' />
          طباعة
        </MenuItem>
        <MenuItem onClick={handleSend}>
          <i className='tabler-send ml-2' />
          إرسال
        </MenuItem>
        <MenuItem onClick={handleStatusClick}>
          <i className='tabler-status-change ml-2' />
          تغيير الحالة
        </MenuItem>
        <MenuItem onClick={handleDuplicate}>
          <i className='tabler-copy ml-2' />
          نسخ
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <i className='tabler-trash ml-2' />
          حذف
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>تأكيد الحذف</DialogTitle>
        <DialogContent>
          <DialogContentText>
            هل أنت متأكد من حذف الفاتورة رقم {selectedInvoice?.number || selectedInvoice?.invoiceNumber}؟ هذا الإجراء لا
            يمكن التراجع عنه.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>إلغاء</Button>
          <Button onClick={handleDeleteConfirm} color='error' variant='contained'>
            حذف
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
        <DialogTitle>تغيير حالة الفاتورة</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label='الحالة'
            value={newStatus}
            onChange={e => setNewStatus(e.target.value)}
            sx={{ mt: 2 }}
          >
            <MenuItem value='draft'>مسودة</MenuItem>
            <MenuItem value='sent'>مرسلة</MenuItem>
            <MenuItem value='paid'>مدفوعة</MenuItem>
            <MenuItem value='partial'>مدفوعة جزئياً</MenuItem>
            <MenuItem value='overdue'>متأخرة</MenuItem>
            <MenuItem value='cancelled'>ملغاة</MenuItem>
          </TextField>

          {/* Show paid amount field when partial is selected */}
          {newStatus === 'partial' && (
            <TextField
              fullWidth
              type='number'
              label='المبلغ المدفوع'
              value={paidAmount}
              onChange={e => setPaidAmount(e.target.value)}
              sx={{ mt: 2 }}
              InputProps={{
                endAdornment: <span style={{ marginLeft: 8 }}>ج.م</span>,
                inputProps: { min: 0, step: 0.01 }
              }}
              helperText={
                selectedInvoice
                  ? `إجمالي الفاتورة: ${Number(selectedInvoice.total || 0).toLocaleString('ar-EG')} ج.م | المتبقي: ${(Number(selectedInvoice.total || 0) - (parseFloat(paidAmount) || 0)).toLocaleString('ar-EG')} ج.م`
                  : ''
              }
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>إلغاء</Button>
          <Button onClick={handleStatusConfirm} variant='contained'>
            تحديث
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  )
}
