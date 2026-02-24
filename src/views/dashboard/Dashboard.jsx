'use client'

import { useEffect, useState } from 'react'

import Link from 'next/link'
import Image from 'next/image'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import LinearProgress from '@mui/material/LinearProgress'
import Skeleton from '@mui/material/Skeleton'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Collapse from '@mui/material/Collapse'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'

// Third-party Imports
import classnames from 'classnames'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'
import CountUp from '@/components/CountUp'
import { useAuth } from '@/@core/contexts/authContext'

// Table Styles
import tableStyles from '@core/styles/table.module.css'

const Dashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showLowStockAlert, setShowLowStockAlert] = useState(true)
  const [showOutOfStockAlert, setShowOutOfStockAlert] = useState(true)
  const { user } = useAuth()

  const isAllowed = (cardId) => {
    // الأدمن يرى كل الكروت
    if (user?.isAdmin) return true
    // المستخدمين الجدد بدون allowedDashboardCards لا يرون شيء حتى يحددها الأدمن
    if (!user?.allowedDashboardCards || !Array.isArray(user.allowedDashboardCards) || user.allowedDashboardCards.length === 0) return false
    return user.allowedDashboardCards.includes(cardId)
  }

  // التحقق إذا كان المستخدم ليس لديه أي كروت مسموح بها
  const hasNoCards = !user?.isAdmin && (!user?.allowedDashboardCards || !Array.isArray(user.allowedDashboardCards) || user.allowedDashboardCards.length === 0)

  // تنبيهات المخزون تظهر فقط للأدمن أو مدير المخزون
  const canSeeStockAlerts = user?.isAdmin || user?.roles?.some(r => r.name === 'inventory_manager')

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/dashboard-stats', { credentials: 'include' })
        const data = await res.json()

        if (data.success) {
          setStats(data.data)
        } else {
          setError(data.error || 'Failed to load stats')
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  // Status mapping for transactions
  const statusObj = {
    cash: { text: 'نقدي', color: 'success' },
    bank: { text: 'بنكي', color: 'primary' },
    check: { text: 'شيك', color: 'warning' },
    pending: { text: 'معلق', color: 'secondary' }
  }

  if (loading) {
    return (
      <div className='p-6'>
        <Typography variant='h4' className='mb-6'>
          لوحة التحكم
        </Typography>
        <Grid container spacing={6}>
          {[1, 2, 3, 4].map(i => (
            <Grid key={i} size={{ xs: 12, sm: 6, lg: 3 }}>
              <Card>
                <CardContent>
                  <Skeleton variant='text' width='60%' height={30} />
                  <Skeleton variant='text' width='80%' height={50} />
                  <Skeleton variant='text' width='40%' height={20} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </div>
    )
  }

  if (error) {
    return (
      <div className='p-6'>
        <Card className='stat-card-error'>
          <CardContent>
            <Typography color='error'>خطأ في تحميل لوحة التحكم: {error}</Typography>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { safe, invoices, clients, workers, inventory, manufacturing, trends, recentTransactions, recentInvoices } = stats || {}

  // Main overview cards
  const overviewCards = [
    {
      id: 'balance',
      title: 'رصيد الخزينة',
      value: safe?.balance || 0,
      icon: 'tabler-vault',
      cardClass: 'stat-card-balance',
      suffix: ' ج.م',
      decimals: 2,
      subtitle: 'الرصيد الحالي',
      trend: parseFloat(trends?.incomingTrend) || 0
    },
    {
      id: 'invoices',
      title: 'إجمالي الفواتير',
      value: invoices?.totalAmount || 0,
      icon: 'tabler-file-invoice',
      cardClass: 'stat-card-primary',
      suffix: ' ج.م',
      decimals: 2,
      subtitle: `${invoices?.totalInvoices || 0} فاتورة`,
      trend: parseFloat(trends?.invoiceTrend) || 0
    },
    {
      id: 'clients',
      title: 'العملاء النشطون',
      value: clients?.totalClients || 0,
      icon: 'tabler-users',
      cardClass: 'stat-card-success',
      suffix: '',
      decimals: 0,
      subtitle: `${clients?.newThisMonth || 0} جديد هذا الشهر`,
      trend: clients?.newThisMonth > 0 ? 8.5 : 0
    },
    {
      id: 'workers',
      title: 'إجمالي العمال',
      value: workers?.totalWorkers || 0,
      icon: 'tabler-user-check',
      cardClass: 'stat-card-info',
      suffix: '',
      decimals: 0,
      subtitle: `${workers?.activeWorkers || 0} نشط`,
      trend: 0
    }
  ].filter(card => isAllowed(card.id))

  return (
    <div className='p-6'>
      {/* Welcome Header with Logo */}
      <div className='mb-6 flex items-center gap-4'>
        <div>
          <Typography variant='h4' className='font-bold animate-fadeIn'>
            نظرة عامة على لوحة التحكم
          </Typography>
          <Typography color='text.secondary' className='animate-fadeIn'>
            أهلاً بعودتك! إليك ما يحدث في عملك اليوم.
          </Typography>
        </div>
      </div>

      {/* Low Stock Alerts - للأدمن ومدير المخزون فقط */}
      {canSeeStockAlerts && inventory?.outOfStockItems?.length > 0 && (
        <Collapse in={showOutOfStockAlert} className='mb-4'>
          <Alert
            severity='error'
            variant='filled'
            icon={<i className='tabler-package-off text-xl' />}
            action={
              <IconButton color='inherit' size='small' onClick={() => setShowOutOfStockAlert(false)}>
                <i className='tabler-x text-lg' />
              </IconButton>
            }
            sx={{
              '& .MuiAlert-message': { width: '100%' },
              animation: 'pulse 2s infinite'
            }}
          >
            <AlertTitle className='font-bold mb-2'>
              <i className='tabler-alert-triangle ml-2' />
              تنبيه! مواد نفذت من المخزون ({inventory.outOfStockItems.length})
            </AlertTitle>
            <Box className='flex flex-wrap gap-2'>
              {inventory.outOfStockItems.slice(0, 5).map((item, idx) => (
                <Chip
                  key={idx}
                  label={`${item.name} (${item.sku || 'N/A'})`}
                  size='small'
                  color='error'
                  variant='outlined'
                  sx={{ backgroundColor: 'rgba(255,255,255,0.9)', fontWeight: 'bold' }}
                />
              ))}
              {inventory.outOfStockItems.length > 5 && (
                <Link href='/inventory/factory'>
                  <Chip
                    label={`+${inventory.outOfStockItems.length - 5} المزيد`}
                    size='small'
                    color='error'
                    variant='outlined'
                    clickable
                    sx={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
                  />
                </Link>
              )}
            </Box>
          </Alert>
        </Collapse>
      )}

      {canSeeStockAlerts && inventory?.lowStockItems?.length > 0 && (
        <Collapse in={showLowStockAlert} className='mb-4'>
          <Alert
            severity='warning'
            variant='filled'
            icon={<i className='tabler-alert-circle text-xl' />}
            action={
              <IconButton color='inherit' size='small' onClick={() => setShowLowStockAlert(false)}>
                <i className='tabler-x text-lg' />
              </IconButton>
            }
            sx={{ '& .MuiAlert-message': { width: '100%' } }}
          >
            <AlertTitle className='font-bold mb-2'>
              <i className='tabler-trending-down ml-2' />
              تحذير! مواد على وشك النفاذ ({inventory.lowStockItems.length})
            </AlertTitle>
            <Box className='flex flex-wrap gap-2'>
              {inventory.lowStockItems.slice(0, 8).map((item, idx) => (
                <Chip
                  key={idx}
                  label={`${item.name}: ${item.stock} ${item.unit} (الحد الأدنى: ${item.minStock})`}
                  size='small'
                  color='warning'
                  variant='outlined'
                  sx={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
                />
              ))}
              {inventory.lowStockItems.length > 8 && (
                <Link href='/inventory/factory'>
                  <Chip
                    label={`+${inventory.lowStockItems.length - 8} المزيد`}
                    size='small'
                    color='warning'
                    variant='outlined'
                    clickable
                    sx={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
                  />
                </Link>
              )}
            </Box>
          </Alert>
        </Collapse>
      )}

      {/* رسالة ترحيب للمستخدمين الجدد بدون صلاحيات */}
      {hasNoCards && (
        <Card sx={{ mb: 4, textAlign: 'center', py: 6 }}>
          <CardContent>
            <Typography variant='h4' sx={{ mb: 2, fontWeight: 'bold' }}>
              أهلاً بك {user?.name || ''} 👋
            </Typography>
            <Typography variant='h6' color='text.secondary' sx={{ mb: 2 }}>
              تم تسجيل حسابك بنجاح
            </Typography>
            <Typography color='text.secondary'>
              يرجى الانتظار حتى يقوم المسؤول بتفعيل صلاحياتك وتحديد الأقسام المتاحة لك.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Main Overview Cards */}
      <Grid container spacing={6} className='mb-6'>
        {overviewCards.map((card, index) => (
          <Grid key={index} size={{ xs: 12, sm: 6, lg: 3 }}>
            <Card className={`${card.cardClass} animate-fadeInUp card-index-${index + 1}`}>
              <CardContent>
                <div className='flex justify-between items-start mb-4'>
                  <div>
                    <Typography color='text.secondary' className='mb-1'>
                      {card.title}
                    </Typography>
                    <Typography variant='h4' className='stat-value font-bold'>
                      <CountUp end={card.value} suffix={card.suffix} decimals={card.decimals} duration={2500} />
                    </Typography>
                  </div>
                  <CustomAvatar variant='rounded' size={48} className='stat-icon'>
                    <i className={classnames(card.icon, 'text-[26px]')} />
                  </CustomAvatar>
                </div>
                <div className='flex items-center gap-2'>
                  <Typography variant='body2' color='text.secondary'>
                    {card.subtitle}
                  </Typography>
                  {card.trend !== 0 && (
                    <Chip
                      variant='tonal'
                      size='small'
                      color={card.trend > 0 ? 'success' : 'error'}
                      label={`${card.trend > 0 ? '+' : ''}${card.trend}%`}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Finance Summary Row */}
      <Grid container spacing={6} className='mb-6'>
        {/* Revenue Growth Card */}
        {/* Revenue Growth Card */}
        {isAllowed('income_summary') && (
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <Card className='animate-fadeInUp h-full stat-card-incoming'>
            <CardContent>
              <div className='flex items-center gap-4 mb-4'>
                <CustomAvatar skin='light' variant='rounded' color='success' size={56}>
                  <i className='tabler-trending-up text-[28px]' />
                </CustomAvatar>
                <div>
                  <Typography variant='h5'>نمو الإيرادات</Typography>
                  <Typography color='text.secondary'>آخر 6 أشهر</Typography>
                </div>
              </div>
              <div className='flex items-center justify-between'>
                <Typography variant='h3' className='font-bold'>
                  <CountUp end={safe?.monthlyIncoming || 0} suffix=' ج.م' decimals={0} duration={2000} />
                </Typography>
                <Chip
                  variant='tonal'
                  size='small'
                  color='success'
                  label={`+${parseFloat(trends?.incomingTrend) || 0}%`}
                />
              </div>
            </CardContent>
          </Card>
        </Grid>
        )}

        {/* Monthly Sales Card */}
        {isAllowed('sales_summary') && (
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <Card className='animate-fadeInUp h-full stat-card-primary'>
            <CardContent>
              <div className='flex items-center gap-4 mb-4'>
                <CustomAvatar skin='light' variant='rounded' color='primary' size={56}>
                  <i className='tabler-file-invoice text-[28px]' />
                </CustomAvatar>
                <div>
                  <Typography variant='h5'>المبيعات الشهرية</Typography>
                  <Typography color='text.secondary'>إيرادات الفواتير</Typography>
                </div>
              </div>
              <div className='flex items-center justify-between'>
                <Typography variant='h3' className='font-bold'>
                  <CountUp end={invoices?.totalAmount || 0} suffix=' ج.م' decimals={0} duration={2000} />
                </Typography>
                <Typography
                  variant='body2'
                  color={parseFloat(trends?.invoiceTrend) >= 0 ? 'success.main' : 'error.main'}
                >
                  {parseFloat(trends?.invoiceTrend) >= 0 ? '+' : ''}
                  {parseFloat(trends?.invoiceTrend) || 0}%
                </Typography>
              </div>
            </CardContent>
          </Card>
        </Grid>
        )}

        {/* Income vs Expense Card */}
        {isAllowed('income_expense') && (
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <Card className='animate-fadeInUp h-full'>
            <CardContent>
              <Typography variant='h5' className='mb-4'>
                الإيرادات مقابل المصروفات
              </Typography>
              <div className='flex flex-col gap-3'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <CustomAvatar skin='light' variant='rounded' color='success' size={32}>
                      <i className='tabler-arrow-down text-[16px]' />
                    </CustomAvatar>
                    <Typography>إجمالي الإيرادات</Typography>
                  </div>
                  <Typography variant='h6' color='success.main' className='font-bold'>
                    <CountUp end={safe?.totalIncoming || 0} suffix=' ج.م' decimals={0} duration={2000} />
                  </Typography>
                </div>
                <Divider />
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <CustomAvatar skin='light' variant='rounded' color='error' size={32}>
                      <i className='tabler-arrow-up text-[16px]' />
                    </CustomAvatar>
                    <Typography>إجمالي المصروفات</Typography>
                  </div>
                  <Typography variant='h6' color='error.main' className='font-bold'>
                    <CountUp end={safe?.totalOutgoing || 0} suffix=' ج.م' decimals={0} duration={2000} />
                  </Typography>
                </div>
                <Divider />
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <CustomAvatar skin='light' variant='rounded' color='primary' size={32}>
                      <i className='tabler-wallet text-[16px]' />
                    </CustomAvatar>
                    <Typography className='font-medium'>صافي الرصيد</Typography>
                  </div>
                  <Typography variant='h6' color='primary.main' className='font-bold'>
                    <CountUp end={safe?.balance || 0} suffix=' ج.م' decimals={0} duration={2000} />
                  </Typography>
                </div>
              </div>
            </CardContent>
          </Card>
        </Grid>
        )}
      </Grid>

      {/* Manufacturing Summary Row */}
      <Grid container spacing={6} className='mb-6'>
        {/* WIP Card */}
        {isAllowed('manufacturing_wip') && (
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <Link href='/inventory/factory'>
            <Card className='animate-fadeInUp h-full hover:shadow-lg transition-shadow cursor-pointer'>
              <CardContent>
                <div className='flex items-center gap-4 mb-4'>
                  <CustomAvatar skin='light' variant='rounded' color='warning' size={56}>
                    <i className='tabler-settings text-[28px]' />
                  </CustomAvatar>
                  <div>
                    <Typography variant='h5'>تحت التشغيل</Typography>
                    <Typography color='text.secondary'>أوامر تشغيل معلقة</Typography>
                  </div>
                </div>
                <Typography variant='h3' className='font-bold mb-2'>
                  <CountUp end={manufacturing?.wipCount || 0} duration={2000} />
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  مواد خام تم صرفها للتشغيل
                </Typography>
              </CardContent>
            </Card>
          </Link>
        </Grid>
        )}

        {/* Finished Goods Card */}
        {isAllowed('manufacturing_finished') && (
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
           <Link href='/inventory/operating-stock'>
            <Card className='animate-fadeInUp h-full hover:shadow-lg transition-shadow cursor-pointer'>
              <CardContent>
                <div className='flex items-center gap-4 mb-4'>
                  <CustomAvatar skin='light' variant='rounded' color='success' size={56}>
                    <i className='tabler-package text-[28px]' />
                  </CustomAvatar>
                  <div>
                    <Typography variant='h5'>منتجات تامة</Typography>
                    <Typography color='text.secondary'>جاهزة للتسليم</Typography>
                  </div>
                </div>
                <div className='flex items-center justify-between'>
                   <Typography variant='h3' className='font-bold mb-2'>
                    <CountUp end={manufacturing?.finishedStock || 0} duration={2000} />
                  </Typography>
                  <Typography variant='h4' color='success.main'>
                    ( {manufacturing?.finishedCount || 0} نوع )
                  </Typography>
                </div>
                 <Typography variant='body2' color='text.secondary'>
                  مخزون المنتجات النهائية
                </Typography>
              </CardContent>
            </Card>
          </Link>
        </Grid>
        )}
                
        {/* Quick Action Issue Order */}
        {isAllowed('manufacturing_issue') && (
         <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
            <Card className='animate-fadeInUp h-full bg-primary text-white'>
              <CardContent className='flex flex-col items-center justify-center text-center h-full gap-2'>
                 <CustomAvatar skin='filled' variant='rounded' color='common.white' size={64} sx={{ color: 'primary.main' }}>
                    <i className='tabler-hammer text-[32px]' />
                  </CustomAvatar>
                  <Typography variant='h5' className='text-white mt-2'>أمر تشغيل جديد</Typography>
                  <Typography variant='body2' className='text-white/80 mb-4'>
                      صرف مواد خام لإنتاج منتج جديد
                  </Typography>
                  <Link href='/manufacturing?action=issue_order'>
                    <Chip label='ابدأ الآن' sx={{ bgcolor: 'white', color: 'primary.main', fontWeight: 'bold' }} clickable />
                  </Link>
              </CardContent>
            </Card>
         </Grid>
         )}
      </Grid>

      {/* Two Column Layout - Tables */}
      <Grid container spacing={6} className='mb-6'>
        {/* Recent Transactions Table */}
        {isAllowed('recent_transactions') && (
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card className='animate-fadeInLeft h-full'>
            <CardHeader
              title='آخر المعاملات'
              action={
                <Link href='/the-safe'>
                  <Chip label='عرض الكل' color='primary' variant='outlined' clickable />
                </Link>
              }
            />
            <div className='overflow-x-auto'>
              <table className={tableStyles.table}>
                <thead className='uppercase'>
                  <tr className='border-be'>
                    <th className='leading-6 plb-4 pis-6 pli-2'>الوصف</th>
                    <th className='leading-6 plb-4 pli-2'>التاريخ</th>
                    <th className='leading-6 plb-4 pli-2'>الحالة</th>
                    <th className='leading-6 plb-4 pie-6 pli-2 text-left'>المبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  {(recentTransactions || []).length > 0 ? (
                    recentTransactions.map((row, index) => (
                      <tr key={index} className='border-0'>
                        <td className='pis-6 pli-2 plb-3'>
                          <div className='flex items-center gap-3'>
                            <CustomAvatar
                              skin='light'
                              variant='rounded'
                              color={row.type === 'incoming' ? 'success' : 'error'}
                              size={38}
                            >
                              <i className={row.type === 'incoming' ? 'tabler-arrow-down' : 'tabler-arrow-up'} />
                            </CustomAvatar>
                            <div className='flex flex-col'>
                              <Typography color='text.primary' className='font-medium'>
                                {row.description?.substring(0, 20) || 'معاملة'}
                              </Typography>
                              <Typography variant='body2' color='text.disabled'>
                                {row.customer || row.type}
                              </Typography>
                            </div>
                          </div>
                        </td>
                        <td className='pli-2 plb-3'>
                          <Typography variant='body2' color='text.secondary'>
                            {new Date(row.date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                          </Typography>
                        </td>
                        <td className='pli-2 plb-3'>
                          <Chip
                            variant='tonal'
                            size='small'
                            label={statusObj[row.status]?.text || row.status}
                            color={statusObj[row.status]?.color || 'secondary'}
                          />
                        </td>
                        <td className='pli-2 plb-3 pie-6 text-left'>
                          <Typography
                            color={row.type === 'incoming' ? 'success.main' : 'error.main'}
                            className='font-medium'
                          >
                            {row.type === 'incoming' ? '+' : '-'}
                            {row.amount?.toLocaleString() || 0} ج.م
                          </Typography>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className='text-center p-6'>
                        <Typography color='text.secondary'>لا توجد معاملات حديثة</Typography>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </Grid>
        )}

        {/* Recent Invoices Table */}
        {isAllowed('recent_invoices') && (
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card className='animate-fadeInRight h-full'>
            <CardHeader
              title='آخر الفواتير'
              action={
                <Link href='/invoices'>
                  <Chip label='عرض الكل' color='primary' variant='outlined' clickable />
                </Link>
              }
            />
            <div className='overflow-x-auto'>
              <table className={tableStyles.table}>
                <thead className='uppercase'>
                  <tr className='border-be'>
                    <th className='leading-6 plb-4 pis-6 pli-2'>الفاتورة</th>
                    <th className='leading-6 plb-4 pli-2'>العميل</th>
                    <th className='leading-6 plb-4 pli-2'>الحالة</th>
                    <th className='leading-6 plb-4 pie-6 pli-2 text-left'>المبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  {(recentInvoices || []).length > 0 ? (
                    recentInvoices.map((inv, index) => (
                      <tr key={index} className='border-0'>
                        <td className='pis-6 pli-2 plb-3'>
                          <div className='flex items-center gap-3'>
                            <CustomAvatar skin='light' variant='rounded' color='primary' size={38}>
                              <i className='tabler-file-invoice' />
                            </CustomAvatar>
                            <div className='flex flex-col'>
                              <Typography color='text.primary' className='font-medium'>
                                {inv.invoiceNumber}
                              </Typography>
                              <Typography variant='body2' color='text.disabled'>
                                {new Date(inv.date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                              </Typography>
                            </div>
                          </div>
                        </td>
                        <td className='pli-2 plb-3'>
                          <Typography color='text.primary'>{inv.client?.substring(0, 15) || 'غير معروف'}</Typography>
                        </td>
                        <td className='pli-2 plb-3'>
                          <Chip
                            variant='tonal'
                            size='small'
                            label={inv.status === 'paid' ? 'مدفوع' : inv.status === 'pending' ? 'معلق' : inv.status}
                            color={inv.status === 'paid' ? 'success' : inv.status === 'pending' ? 'warning' : 'error'}
                          />
                        </td>
                        <td className='pli-2 plb-3 pie-6 text-left'>
                          <Typography color='text.primary' className='font-medium'>
                            {inv.amount?.toLocaleString() || 0} ج.م
                          </Typography>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className='text-center p-6'>
                        <Typography color='text.secondary'>لا توجد فواتير حديثة</Typography>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </Grid>
        )}
      </Grid>

      {/* Active Projects / Inventory Status with Progress Bars */}
      <Grid container spacing={6} className='mb-6'>
        {/* Inventory Status with Progress */}
        {isAllowed('inventory_status') && (
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card className='animate-fadeInUp h-full'>
            <CardHeader
              title='حالة المخزون'
              subheader={`${inventory?.categories || 0} فئة`}
              action={
                <Link href='/inventory/factory'>
                  <Chip label='عرض المخزون' color='primary' variant='outlined' clickable />
                </Link>
              }
            />
            <CardContent className='flex flex-col gap-4'>
              {[
                {
                  title: 'إجمالي المواد',
                  subtitle: `${inventory?.totalMaterials || 0} عنصر`,
                  progress: 100,
                  color: 'primary',
                  icon: 'tabler-package'
                },
                {
                  title: 'متوفر',
                  subtitle: `${(inventory?.totalMaterials || 0) - (inventory?.outOfStockCount || 0)} متاح`,
                  progress: inventory?.totalMaterials
                    ? ((inventory.totalMaterials - inventory.outOfStockCount) / inventory.totalMaterials) * 100
                    : 100,
                  color: 'success',
                  icon: 'tabler-check'
                },
                {
                  title: 'مخزون منخفض',
                  subtitle: `${inventory?.lowStockCount || 0} عنصر يحتاج إعادة طلب`,
                  progress: inventory?.totalMaterials ? (inventory.lowStockCount / inventory.totalMaterials) * 100 : 0,
                  color: 'warning',
                  icon: 'tabler-alert-circle'
                },
                {
                  title: 'نفذ من المخزون',
                  subtitle: `${inventory?.outOfStockCount || 0} عنصر غير متوفر`,
                  progress: inventory?.totalMaterials
                    ? (inventory.outOfStockCount / inventory.totalMaterials) * 100
                    : 0,
                  color: 'error',
                  icon: 'tabler-package-off'
                }
              ].map((item, index) => (
                <div key={index} className='flex items-center gap-4'>
                  <CustomAvatar skin='light' variant='rounded' color={item.color} size={38}>
                    <i className={classnames(item.icon, 'text-[20px]')} />
                  </CustomAvatar>
                  <div className='flex flex-wrap justify-between items-center gap-x-4 gap-y-1 is-full'>
                    <div className='flex flex-col'>
                      <Typography className='font-medium' color='text.primary'>
                        {item.title}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        {item.subtitle}
                      </Typography>
                    </div>
                    <div className='flex justify-between items-center is-32'>
                      <LinearProgress
                        value={item.progress}
                        variant='determinate'
                        color={item.color}
                        className='min-bs-2 is-20'
                      />
                      <Typography color='text.disabled'>{`${Math.round(item.progress)}%`}</Typography>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </Grid>
        )}

        {/* Team & HR Section */}
        {isAllowed('team_overview') && (
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card className='animate-fadeInUp h-full'>
            <CardHeader
              title='نظرة عامة على الفريق'
              subheader={`${workers?.presentToday || 0} حاضر اليوم`}
              action={
                <Link href='/hr'>
                  <Chip label='إدارة الفريق' color='primary' variant='outlined' clickable />
                </Link>
              }
            />
            <CardContent className='flex flex-col gap-4'>
              {[
                {
                  title: 'إجمالي العمال',
                  value: workers?.totalWorkers || 0,
                  icon: 'tabler-users',
                  color: 'primary',
                  subtitle: 'جميع الموظفين'
                },
                {
                  title: 'العمال النشطون',
                  value: workers?.activeWorkers || 0,
                  icon: 'tabler-user-check',
                  color: 'success',
                  subtitle: 'نشط حالياً'
                },
                {
                  title: 'الحاضرون اليوم',
                  value: workers?.presentToday || 0,
                  icon: 'tabler-calendar-check',
                  color: 'info',
                  subtitle: 'سجلوا الحضور'
                },
                {
                  title: 'إجمالي المرتبات',
                  value: workers?.totalSalary || 0,
                  icon: 'tabler-cash',
                  color: 'warning',
                  subtitle: 'الرواتب الشهرية',
                  suffix: ' ج.م'
                }
              ].map((item, index) => (
                <div key={index} className='flex items-center gap-4'>
                  <CustomAvatar skin='light' variant='rounded' color={item.color} size={38}>
                    <i className={classnames(item.icon, 'text-[20px]')} />
                  </CustomAvatar>
                  <div className='flex justify-between items-center is-full'>
                    <div className='flex flex-col'>
                      <Typography className='font-medium' color='text.primary'>
                        {item.title}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        {item.subtitle}
                      </Typography>
                    </div>
                    <Typography variant='h5' className='font-bold'>
                      <CountUp end={item.value} duration={1500} />
                      {item.suffix || ''}
                    </Typography>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </Grid>
        )}
      </Grid>

      {/* Quick Actions */}
      {isAllowed('quick_actions') && (
      <Card className='animate-fadeInUp'>
        <CardHeader title='إجراءات سريعة' subheader='المهام والاختصارات الشائعة' />
        <CardContent>
          <Grid container spacing={4}>
            {[
              { href: '/invoices/add', icon: 'tabler-file-plus', label: 'فاتورة جديدة', color: 'primary' },
              { href: '/the-safe', icon: 'tabler-plus', label: 'إضافة قيد', color: 'success' },
              { href: '/clients', icon: 'tabler-user-plus', label: 'إضافة عميل', color: 'info' },
              { href: '/inventory/factory', icon: 'tabler-package', label: 'المخزون', color: 'warning' },
              { href: '/hr/attendance', icon: 'tabler-calendar', label: 'الحضور', color: 'error' },
              { href: '/reports', icon: 'tabler-report-analytics', label: 'التقارير', color: 'secondary' }
            ].map((action, index) => (
              <Grid key={index} size={{ xs: 6, sm: 4, md: 2 }}>
                <Link href={action.href}>
                  <div
                    className={`flex flex-col items-center p-4 rounded-lg bg-${action.color}/10 hover:bg-${action.color}/20 transition-all cursor-pointer`}
                  >
                    <i className={`${action.icon} text-[32px] text-${action.color} mb-2`} />
                    <Typography variant='body2' className='text-center'>
                      {action.label}
                    </Typography>
                  </div>
                </Link>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
      )}
    </div>
  )
}

export default Dashboard
