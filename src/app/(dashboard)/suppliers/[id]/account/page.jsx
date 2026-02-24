'use client'

import { useState, useEffect } from 'react'
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
  Grid,
  Paper
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import PaymentIcon from '@mui/icons-material/Payment'

export default function SupplierAccountPage() {
  const params = useParams()
  const router = useRouter()
  const supplierId = params.id

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)

  useEffect(() => {
    if (supplierId) {
      fetchTransactions()
    }
  }, [supplierId])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/suppliers/${supplierId}/transactions`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch transactions')
      }

      const result = await response.json()
      console.log('Supplier transactions data:', result) // Debug log
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
          حساب المورد: {data?.supplier?.name}
        </Typography>
      </Box>

      {/* Supplier Info */}
      {data?.supplier && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Typography variant='body2' color='text.secondary'>
                  الهاتف
                </Typography>
                <Typography variant='body1'>{data.supplier.phone || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant='body2' color='text.secondary'>
                  البريد الإلكتروني
                </Typography>
                <Typography variant='body1'>{data.supplier.email || '-'}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <Typography variant='h6'>إجمالي المشتريات</Typography>
            <Typography variant='h4'>{formatCurrency(data?.summary?.totalPurchases)}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'success.light', color: 'success.contrastText' }}>
            <Typography variant='h6'>إجمالي المدفوع</Typography>
            <Typography variant='h4'>{formatCurrency(data?.summary?.totalPaid)}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              textAlign: 'center',
              bgcolor: data?.summary?.balance > 0 ? 'error.light' : 'success.light',
              color: data?.summary?.balance > 0 ? 'error.contrastText' : 'success.contrastText'
            }}
          >
            <Typography variant='h6'>المستحق للمورد</Typography>
            <Typography variant='h4'>{formatCurrency(data?.summary?.balance)}</Typography>
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
                          icon={tx.type === 'purchase' ? <ShoppingCartIcon /> : <PaymentIcon />}
                          label={tx.typeLabel}
                          color={tx.type === 'purchase' ? 'primary' : 'success'}
                          size='small'
                        />
                      </TableCell>
                      <TableCell>{tx.description}</TableCell>
                      <TableCell
                        sx={{ fontWeight: 'bold', color: tx.type === 'purchase' ? 'error.main' : 'success.main' }}
                      >
                        {tx.type === 'purchase' ? '+' : '-'} {formatCurrency(tx.amount)}
                      </TableCell>
                      <TableCell>
                        {tx.type === 'purchase' && (
                          <Chip
                            label={
                              tx.paymentStatus === 'paid' ? 'مدفوع' : tx.paymentStatus === 'partial' ? 'جزئي' : 'آجل'
                            }
                            color={
                              tx.paymentStatus === 'paid'
                                ? 'success'
                                : tx.paymentStatus === 'partial'
                                  ? 'warning'
                                  : 'error'
                            }
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

      {/* Purchase Orders Table */}
      <Card sx={{ mb: 4 }}>
        <CardHeader title='أوامر الشراء' />
        <CardContent>
          {data?.purchaseOrders?.length === 0 ? (
            <Alert severity='info'>لا توجد أوامر شراء</Alert>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>رقم الأمر</strong>
                    </TableCell>
                    <TableCell>
                      <strong>التاريخ</strong>
                    </TableCell>
                    <TableCell>
                      <strong>المادة</strong>
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
                  {data?.purchaseOrders?.map(po => (
                    <TableRow key={po.id} hover>
                      <TableCell>{po.orderNumber}</TableCell>
                      <TableCell>{formatDate(po.createdAt)}</TableCell>
                      <TableCell>{po.material?.name || po.material?.materialName || '-'}</TableCell>
                      <TableCell>{formatCurrency(po.totalAmount)}</TableCell>
                      <TableCell>{formatCurrency(po.paidAmount)}</TableCell>
                      <TableCell sx={{ color: 'error.main', fontWeight: 'bold' }}>
                        {formatCurrency(Number(po.totalAmount || 0) - Number(po.paidAmount || 0))}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            po.paymentStatus === 'paid'
                              ? 'مدفوع'
                              : po.paymentStatus === 'partial'
                                ? 'جزئي'
                                : po.paymentStatus === 'credit'
                                  ? 'آجل'
                                  : 'مدفوع'
                          }
                          color={
                            po.paymentStatus === 'paid'
                              ? 'success'
                              : po.paymentStatus === 'partial'
                                ? 'warning'
                                : 'error'
                          }
                          size='small'
                        />
                      </TableCell>
                    </TableRow>
                  ))}
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
                        {formatCurrency(pay.outgoing)}
                      </TableCell>
                      <TableCell>{pay.outgoingMethod || '-'}</TableCell>
                      <TableCell>{pay.outgoingTxn || '-'}</TableCell>
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
