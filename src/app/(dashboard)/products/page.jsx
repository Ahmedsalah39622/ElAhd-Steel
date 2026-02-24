'use client'

// MUI Imports
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

// Component Imports
import Link from '@components/Link'

export default function ProductsPage() {
  return (
    <div className='p-6'>
      <div className='flex flex-wrap sm:items-center justify-between max-sm:flex-col gap-6 mb-6'>
        <div>
          <Typography variant='h4' className='mbe-1'>
            Products
          </Typography>
          <Typography>Manage your product inventory</Typography>
        </div>
        <Link href='/products/add'>
          <Button variant='contained' startIcon={<i className='tabler-plus' />}>
            Add Product
          </Button>
        </Link>
      </div>

      {/* Products list will go here */}
      <div className='text-center py-12'>
        <Typography color='textSecondary'>No products yet. Click "Add Product" to get started.</Typography>
      </div>
    </div>
  )
}
