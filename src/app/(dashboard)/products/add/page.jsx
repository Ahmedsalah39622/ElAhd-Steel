'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'

// Component Imports
import ProductAddHeader from '@views/products/add/ProductAddHeader'
import ProductImage from '@views/products/add/ProductImage'
import ProductInformation from '@views/products/add/ProductInformation'
import ProductPricing from '@views/products/add/ProductPricing'
import ProductInventory from '@views/products/add/ProductInventory'
import ProductOrganize from '@views/products/add/ProductOrganize'
import ProductVariants from '@views/products/add/ProductVariants'

export default function AddProductPage() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    collection: '',
    price: '',
    sku: '',
    quantity: '',
    variants: []
  })

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className='flex flex-col gap-6 p-6'>
      {/* Header */}
      <ProductAddHeader />

      {/* Main Content */}
      <Grid container spacing={6}>
        {/* Left Column */}
        <Grid size={{ xs: 12, md: 8 }}>
          <div className='flex flex-col gap-6'>
            {/* Product Information */}
            <ProductInformation formData={formData} handleFormChange={handleFormChange} />

            {/* Product Image */}

            {/* Product Variants */}
          </div>
        </Grid>

        {/* Right Column */}
        <Grid size={{ xs: 12, md: 4 }}>
          <div className='flex flex-col gap-6'>
            {/* Product Organize */}

            {/* Product Pricing */}
            <ProductPricing />
            {/* Product Inventory */}
          </div>
        </Grid>
      </Grid>
    </div>
  )
}
