'use client'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'

// Third-party Imports
import classnames from 'classnames'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'
import CountUp from '@/components/CountUp'

const SafeStats = ({ entries = [] }) => {
  // Calculate safe statistics
  const calculateStats = () => {
    let totalIncoming = 0
    let totalOutgoing = 0
    let totalCash = 0
    let totalTransfers = 0
    let totalTransactions = 0

    entries.forEach(entry => {
      if (entry.incoming) {
        totalIncoming += parseFloat(entry.incoming) || 0
        totalTransactions++
      }

      if (entry.outgoing) {
        totalOutgoing += parseFloat(entry.outgoing) || 0
        totalTransactions++
      }

      if (entry.incomingMethod === 'cash' || entry.outgoingMethod === 'cash') {
        totalCash += (parseFloat(entry.incoming) || 0) - (parseFloat(entry.outgoing) || 0)
      }

      if (entry.incomingMethod === 'transfer' || entry.outgoingMethod === 'transfer') {
        totalTransfers += (parseFloat(entry.incoming) || 0) - (parseFloat(entry.outgoing) || 0)
      }
    })

    // Manual deposits today
    const today = new Date()

    const isSameDay = d => {
      const dt = new Date(d)

      return (
        dt.getFullYear() === today.getFullYear() &&
        dt.getMonth() === today.getMonth() &&
        dt.getDate() === today.getDate()
      )
    }

    const manualTodayEntries = entries.filter(
      e => e.incomingMethod === 'manual-deposit' && e.incoming && isSameDay(e.date)
    )
    const manualTodayTotal = manualTodayEntries.reduce((sum, e) => sum + (parseFloat(e.incoming) || 0), 0)
    const manualTodayCount = manualTodayEntries.length

    const balance = totalIncoming - totalOutgoing
    const balancePercent = totalIncoming > 0 ? ((balance / totalIncoming) * 100).toFixed(1) : 0

    return {
      totalIncoming: totalIncoming,
      totalOutgoing: totalOutgoing,
      balance: balance,
      totalCash: totalCash,
      totalTransfers: totalTransfers,
      transactions: totalTransactions,
      balancePercent: balancePercent,
      incomingEntries: entries.filter(e => e.incoming).length,
      outgoingEntries: entries.filter(e => e.outgoing).length,
      manualTodayTotal: manualTodayTotal,
      manualTodayCount: manualTodayCount
    }
  }

  const stats = calculateStats()

  const data = [
    {
      title: 'إجمالي الوارد',
      value: stats.totalIncoming,
      icon: 'tabler-arrow-down-circle',
      desc: `${stats.incomingEntries}`,
      change: parseFloat(stats.balancePercent) > 0 ? parseFloat(stats.balancePercent) : 0,
      cardClass: 'stat-card-incoming',
      suffix: ' ج.م',
      decimals: 2
    },
    {
      title: 'إجمالي الصادر',
      value: stats.totalOutgoing,
      icon: 'tabler-arrow-up-circle',
      desc: `${stats.outgoingEntries}`,
      change: 0,
      cardClass: 'stat-card-outgoing',
      suffix: ' ج.م',
      decimals: 2
    },
    {
      title: 'رصيد الخزينة',
      value: stats.balance,
      icon: 'tabler-vault',
      desc: `${stats.transactions}`,
      change: parseFloat(stats.balancePercent),
      cardClass: 'stat-card-balance',
      suffix: ' ج.م',
      decimals: 2
    },
    {
      title: 'النقد المتاح',
      value: stats.totalCash,
      icon: 'tabler-cash',
      desc: 'نقدي',
      change: stats.totalCash !== 0 ? 2.5 : 0,
      cardClass: 'stat-card-cash',
      suffix: ' ج.م',
      decimals: 2
    },
    {
      title: 'ودائع اليوم (يدوي)',
      value: stats.manualTodayTotal,
      icon: 'tabler-calendar-plus',
      desc: `${stats.manualTodayCount}`,
      change: 0,
      cardClass: 'stat-card-manual-today',
      suffix: ' ج.م',
      decimals: 2
    },
    {
      title: 'عدد الودائع اليوم',
      value: stats.manualTodayCount,
      icon: 'tabler-list-check',
      desc: 'ودائع',
      change: 0,
      cardClass: 'stat-card-manual-count',
      suffix: '',
      decimals: 0
    }
  ]

  // Hooks
  const isBelowMdScreen = useMediaQuery(theme => theme.breakpoints.down('md'))
  const isSmallScreen = useMediaQuery(theme => theme.breakpoints.down('sm'))

  return (
    <Card>
      <CardContent>
        <Grid container spacing={6}>
          {data.map((item, index) => (
            <Grid
              size={{ xs: 12, sm: 6, md: 3 }}
              key={index}
              className={classnames({
                '[&:nth-of-type(odd)>div]:pie-6 [&:nth-of-type(odd)>div]:border-ie': isBelowMdScreen && !isSmallScreen,
                '[&:not(:last-child)>div]:pie-6 [&:not(:last-child)>div]:border-ie': !isBelowMdScreen
              })}
            >
              <div className={`flex flex-col gap-1 p-3 rounded-lg ${item.cardClass} card-index-${index + 1}`}>
                <div className='flex justify-between'>
                  <div className='flex flex-col gap-1'>
                    <Typography color='text.secondary'>{item.title}</Typography>
                    <Typography variant='h4' className='stat-value'>
                      <CountUp
                        end={item.value}
                        prefix={item.prefix || ''}
                        suffix={item.suffix || ''}
                        decimals={item.decimals || 0}
                        duration={2000}
                      />
                    </Typography>
                  </div>
                  <CustomAvatar variant='rounded' size={44} className='stat-icon'>
                    <i className={classnames(item.icon, 'text-[28px]')} />
                  </CustomAvatar>
                </div>
                {item.change !== 0 && item.change !== undefined ? (
                  <div className='flex items-center gap-2'>
                    <Typography color='text.secondary'>{`${item.desc} قيد`}</Typography>
                    <Chip
                      variant='tonal'
                      label={`${item.change}%`}
                      size='small'
                      color={item.change > 0 ? 'success' : 'error'}
                    />
                  </div>
                ) : (
                  <Typography color='text.secondary'>{`${item.desc} قيد`}</Typography>
                )}
              </div>
              {isBelowMdScreen && !isSmallScreen && index < data.length - 2 && (
                <Divider
                  className={classnames('mbs-6', {
                    'mie-6': index % 2 === 0
                  })}
                />
              )}
              {isSmallScreen && index < data.length - 1 && <Divider className='mbs-6' />}
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  )
}

export default SafeStats
