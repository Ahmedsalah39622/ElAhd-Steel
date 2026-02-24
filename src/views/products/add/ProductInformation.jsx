'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

const ProductInformation = ({ formData = {}, handleFormChange = () => {} }) => {
  const [description, setDescription] = useState(formData?.description || '')

  return (
    <Card>
      <CardHeader title='Product Information' />
      <CardContent>
        <Grid container spacing={6} className='mbe-6'>
          <Grid size={{ xs: 12 }}>
            <CustomTextField
              fullWidth
              label='Product Name'
              placeholder='iPhone 14'
              value={formData?.name || ''}
              onChange={e => handleFormChange('name', e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              label='SKU'
              placeholder='FXSK123U'
              value={formData?.sku || ''}
              onChange={e => handleFormChange('sku', e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              label='Barcode'
              placeholder='0123-4567'
              value={formData?.barcode || ''}
              onChange={e => handleFormChange('barcode', e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography className='mbe-2'>Description (Optional)</Typography>
            <Box
              component='textarea'
              placeholder='Enter product description...'
              value={description}
              onChange={e => setDescription(e.target.value)}
              sx={{
                width: '100%',
                padding: 2,
                borderRadius: 1,
                border: '1px solid #ccc',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                minHeight: '150px',
                '&:focus': {
                  outline: 'none',
                  borderColor: 'primary.main',
                  boxShadow: '0 0 0 2px rgba(0, 0, 0, 0.05)'
                }
              }}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default ProductInformation
