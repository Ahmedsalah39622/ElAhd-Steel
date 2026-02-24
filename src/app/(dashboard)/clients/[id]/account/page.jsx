'use client'

import { useState, useEffect, Fragment } from 'react'
import { useParams, useRouter } from 'next/navigation'

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
  Typography,
  Chip,
  Divider,
  Grid,
  Paper,
  Collapse,
  IconButton,
  List,
  ListItem,
  ListItemText
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ReceiptIcon from '@mui/icons-material/Receipt'
import PaymentIcon from '@mui/icons-material/Payment'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'

export default function ClientAccountPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)
  const [expandedInvoice, setExpandedInvoice] = useState(null)

  useEffect(() => {
    if (clientId) {
      fetchTransactions()
    }
  }, [clientId])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/clients/${clientId}/transactions`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch transactions')
      }

      const result = await response.json()
      console.log('Client transactions data:', result) // Debug log
      setData(result.data)
    } catch (err) {
      setError(err.message)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = date => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = amount => {
    if (amount === undefined || amount === null) {
      console.log('formatCurrency: amount is undefined/null')
      return '- جنيه'
    }
    const num = Number(amount)
    if (isNaN(num)) {
      console.log('formatCurrency: amount is NaN:', amount)
      return '- جنيه'
    }
    return num.toLocaleString('ar-EG') + ' جنيه'
  }

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='400px'>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <div className='p-6' dir='rtl'>
        <Alert severity='error'>{error}</Alert>
        <Button onClick={() => router.back()} startIcon={<ArrowBackIcon />} sx={{ mt: 2 }}>
          العودة
        </Button>
      </div>
    )
  }

  return (
    <div className='p-6' dir='rtl'>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Button onClick={() => router.back()} startIcon={<ArrowBackIcon />} variant='outlined'>
          العودة
        </Button>
        <Typography variant='h4' component='h1'>
          حساب العميل: {data?.client?.name}
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <Typography variant='h6'>إجمالي الفواتير</Typography>
            <Typography variant='h4'>{formatCurrency(data?.summary?.totalInvoices)}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'success.light', color: 'success.contrastText' }}>
            <Typography variant='h6'>إجمالي المدفوع</Typography>
            <Typography variant='h4'>{formatCurrency(data?.summary?.totalPaid)}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper
            sx={{
              p: 3,
              textAlign: 'center',
              bgcolor: data?.summary?.balance > 0 ? 'error.light' : 'success.light',
              color: data?.summary?.balance > 0 ? 'error.contrastText' : 'success.contrastText'
            }}
          >
            <Typography variant='h6'>المتبقي</Typography>
            <Typography variant='h4'>{formatCurrency(data?.summary?.balance)}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'info.light', color: 'info.contrastText' }}>
            <Typography variant='h6'>الميزانية المتاحة</Typography>
            <Typography variant='h4'>{formatCurrency(data?.client?.budget || 0)}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* All Transactions Timeline */}
      <Card sx={{ mb: 4 }}>
        <CardHeader title='جميع المعاملات' />
        <CardContent>
          {data?.transactions?.length === 0 ? (
            <Alert severity='info'>لا توجد معاملات</Alert>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'var(--mui-palette-action-hover)' }}>
                    <TableCell>
                      <strong>التاريخ</strong>
                    </TableCell>
                    <TableCell>
                      <strong>النوع</strong>
                    </TableCell>
                    <TableCell>
                      <strong>الوصف</strong>
                    </TableCell>
                    <TableCell>
                      <strong>المبلغ</strong>
                    </TableCell>
                    <TableCell>
                      <strong>الحالة</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data?.transactions?.map(tx => (
                    <TableRow key={tx.id} hover>
                      <TableCell>{formatDate(tx.date)}</TableCell>
                      <TableCell>
                        <Chip
                          icon={tx.type === 'invoice' ? <ReceiptIcon /> : <PaymentIcon />}
                          label={tx.typeLabel}
                          color={tx.type === 'invoice' ? 'primary' : 'success'}
                          size='small'
                        />
                      </TableCell>
                      <TableCell>{tx.description}</TableCell>
                      <TableCell
                        sx={{ fontWeight: 'bold', color: tx.type === 'invoice' ? 'error.main' : 'success.main' }}
                      >
                        {tx.type === 'invoice' ? '+' : '-'} {formatCurrency(tx.amount)}
                      </TableCell>
                      <TableCell>
                        {tx.type === 'invoice' && (
                          <Chip
                            label={tx.status === 'paid' ? 'مدفوعة' : tx.status === 'partial' ? 'جزئي' : 'آجل'}
                            color={tx.status === 'paid' ? 'success' : tx.status === 'partial' ? 'warning' : 'error'}
                            size='small'
                          />
                        )}
                        {tx.type === 'payment' && <Chip label='تم الدفع' color='success' size='small' />}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card sx={{ mb: 4 }}>
        <CardHeader title='الفواتير' />
        <CardContent>
          {data?.invoices?.length === 0 ? (
            <Alert severity='info'>لا توجد فواتير</Alert>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell width={50}></TableCell>
                    <TableCell>
                      <strong>رقم الفاتورة</strong>
                    </TableCell>
                    <TableCell>
                      <strong>التاريخ</strong>
                    </TableCell>
                    <TableCell>
                      <strong>الإجمالي</strong>
                    </TableCell>
                    <TableCell>
                      <strong>المدفوع</strong>
                    </TableCell>
                    <TableCell>
                      <strong>المتبقي</strong>
                    </TableCell>
                    <TableCell>
                      <strong>الحالة</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data?.invoices?.map(inv => {
                    const items = typeof inv.items === 'string' ? JSON.parse(inv.items || '[]') : inv.items || []
                    const isExpanded = expandedInvoice === inv.id

                    return (
                      <Fragment key={inv.id}>
                        <TableRow hover>
                          <TableCell>
                            <IconButton size='small' onClick={() => setExpandedInvoice(isExpanded ? null : inv.id)}>
                              {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                            </IconButton>
                          </TableCell>
                          <TableCell>{inv.number || `#${inv.id}`}</TableCell>
                          <TableCell>{formatDate(inv.date || inv.createdAt)}</TableCell>
                          <TableCell>{formatCurrency(inv.total)}</TableCell>
                          <TableCell>{formatCurrency(inv.paidAmount)}</TableCell>
                          <TableCell sx={{ color: 'error.main', fontWeight: 'bold' }}>
                            {formatCurrency(Number(inv.total || 0) - Number(inv.paidAmount || 0))}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={inv.status === 'paid' ? 'مدفوعة' : inv.status === 'partial' ? 'جزئي' : 'آجل'}
                              color={inv.status === 'paid' ? 'success' : inv.status === 'partial' ? 'warning' : 'error'}
                              size='small'
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                            <Collapse in={isExpanded} timeout='auto' unmountOnExit>
                              <Box sx={{ margin: 2, bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
                                <Typography variant='h6' gutterBottom component='div' sx={{ mb: 2 }}>
                                  📦 الأصناف المباعة
                                </Typography>
                                {items.length === 0 ? (
                                  <Alert severity='info' sx={{ mb: 2 }}>
                                    لا توجد أصناف
                                  </Alert>
                                ) : (
                                  <Table size='small'>
                                    <TableHead>
                                      <TableRow>
                                        <TableCell>
                                          <strong>الصنف</strong>
                                        </TableCell>
                                        <TableCell align='center'>
                                          <strong>الكمية</strong>
                                        </TableCell>
                                        <TableCell align='center'>
                                          <strong>سعر الوحدة</strong>
                                        </TableCell>
                                        <TableCell align='right'>
                                          <strong>الإجمالي</strong>
                                        </TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {items.map((item, idx) => (
                                        <TableRow key={idx}>
                                          <TableCell>{item.name || item.description || '-'}</TableCell>
                                          <TableCell align='center'>{item.quantity || item.qty || '-'}</TableCell>
                                          <TableCell align='center'>
                                            {item.price || item.unitPrice
                                              ? `${Number(item.price || item.unitPrice).toLocaleString('ar-EG')} ج.م`
                                              : '-'}
                                          </TableCell>
                                          <TableCell align='right' sx={{ fontWeight: 'bold' }}>
                                            {item.total || item.quantity * (item.price || item.unitPrice)
                                              ? `${Number(item.total || item.quantity * (item.price || item.unitPrice)).toLocaleString('ar-EG')} ج.م`
                                              : '-'}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                )}
                                {inv.notes && (
                                  <Box sx={{ mt: 2 }}>
                                    <Typography variant='body2' color='text.secondary'>
                                      <strong>ملاحظات:</strong> {inv.notes}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </Fragment>
                    )
                  })}
                </TableBody>
              </Table>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader title='الدفعات' />
        <CardContent>
          {data?.payments?.length === 0 ? (
            <Alert severity='info'>لا توجد دفعات</Alert>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>التاريخ</strong>
                    </TableCell>
                    <TableCell>
                      <strong>الوصف</strong>
                    </TableCell>
                    <TableCell>
                      <strong>المبلغ</strong>
                    </TableCell>
                    <TableCell>
                      <strong>طريقة الدفع</strong>
                    </TableCell>
                    <TableCell>
                      <strong>رقم المعاملة</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data?.payments?.map(pay => (
                    <TableRow key={pay.id} hover>
                      <TableCell>{formatDate(pay.date || pay.createdAt)}</TableCell>
                      <TableCell>{pay.description || '-'}</TableCell>
                      <TableCell sx={{ color: 'success.main', fontWeight: 'bold' }}>
                        {formatCurrency(pay.incoming)}
                      </TableCell>
                      <TableCell>{pay.incomingMethod || '-'}</TableCell>
                      <TableCell>{pay.incomingTxn || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
