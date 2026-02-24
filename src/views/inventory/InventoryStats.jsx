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

const InventoryStats = ({ materials = [] }) => {
  // Calculate inventory statistics
  const calculateStats = () => {
    let totalItems = 0
    let totalStock = 0
    let lowStockCount = 0
    let outOfStockCount = 0
    let materialTypes = new Set()

    materials.forEach(material => {
      totalItems++
      const stock = parseFloat(material.qty) || 0

      totalStock += stock

      if (stock === 0) {
        outOfStockCount++
      } else if (stock < 10) {
        lowStockCount++
      }

      if (material.category) {
        materialTypes.add(material.category)
      }
    })

    const inStockCount = totalItems - outOfStockCount
    const inStockPercent = totalItems > 0 ? ((inStockCount / totalItems) * 100).toFixed(1) : 0

    return {
      totalItems: totalItems,
      totalStock: totalStock,
      inStock: inStockCount,
      outOfStock: outOfStockCount,
      lowStock: lowStockCount,
      inStockPercent: inStockPercent,
      materialTypes: materialTypes.size
    }
  }

  const stats = calculateStats()

  const data = [
    {
      title: 'إجمالي المواد',
      value: stats.totalItems,
      icon: 'tabler-package',
      desc: stats.materialTypes,
      change: 0,
      cardClass: 'stat-card-primary',
      decimals: 0,
      descSuffix: ' أنواع'
    },
    {
      title: 'إجمالي المخزون',
      value: stats.totalStock,
      icon: 'tabler-stack-2',
      desc: 'قطعة',
      change: parseFloat(stats.inStockPercent),
      cardClass: 'stat-card-stock',
      decimals: 0
    },
    {
      title: 'متوفر',
      value: stats.inStock,
      icon: 'tabler-thumb-up',
      desc: stats.outOfStock,
      change: parseFloat(stats.inStockPercent),
      cardClass: 'stat-card-success',
      decimals: 0,
      descSuffix: ' نفذ'
    },
    {
      title: 'منخفض / نفذ',
      value: stats.lowStock + stats.outOfStock,
      icon: 'tabler-alert-circle',
      desc: `منخفض: ${stats.lowStock}`,
      change: stats.outOfStock > 0 ? -5.2 : 0,
      cardClass: 'stat-card-warning',
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
                    <Typography color='text.secondary'>{`${item.desc}`}</Typography>
                    <Chip
                      variant='tonal'
                      label={`${item.change}%`}
                      size='small'
                      color={item.change > 0 ? 'success' : 'error'}
                    />
                  </div>
                ) : (
                  <Typography color='text.secondary'>{`${item.desc}${item.descSuffix || ''}`}</Typography>
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

export default InventoryStats
