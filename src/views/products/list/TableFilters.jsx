// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import CardContent from '@mui/material/CardContent'
import MenuItem from '@mui/material/MenuItem'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

// Vars
const productStockObj = {
  'In Stock': true,
  'Out of Stock': false
}

const TableFilters = ({ setData, productData }) => {
  // States
  const [category, setCategory] = useState('')
  const [stock, setStock] = useState('')
  const [status, setStatus] = useState('')

  useEffect(
    () => {
      const filteredData = productData?.filter(product => {
        if (category && product.category !== category) return false
        if (stock && product.stock !== productStockObj[stock]) return false
        if (status && product.status !== status) return false

        return true
      })

      setData(filteredData ?? [])
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [category, stock, status, productData]
  )

  return (
    <CardContent>
      <Grid container spacing={6}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <CustomTextField
            select
            fullWidth
            id='select-status'
            value={status}
            onChange={e => setStatus(e.target.value)}
            slotProps={{
              select: { displayEmpty: true }
            }}
          >
            <MenuItem value=''>اختر الحالة</MenuItem>
            <MenuItem value='Scheduled'>مجدول</MenuItem>
            <MenuItem value='Published'>منشور</MenuItem>
            <MenuItem value='Inactive'>غير نشط</MenuItem>
          </CustomTextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <CustomTextField
            select
            fullWidth
            id='select-category'
            value={category}
            onChange={e => setCategory(e.target.value)}
            slotProps={{
              select: { displayEmpty: true }
            }}
          >
            <MenuItem value=''>اختر الفئة</MenuItem>
          </CustomTextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <CustomTextField
            select
            fullWidth
            id='select-stock'
            value={stock}
            onChange={e => setStock(e.target.value)}
            slotProps={{
              select: { displayEmpty: true }
            }}
          >
            <MenuItem value=''>اختر حالة المخزون</MenuItem>
            <MenuItem value='In Stock'>متوفر</MenuItem>
            <MenuItem value='Out of Stock'>نفذ</MenuItem>
          </CustomTextField>
        </Grid>
      </Grid>
    </CardContent>
  )
}

export default TableFilters
