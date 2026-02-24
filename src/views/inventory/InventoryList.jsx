'use client'

import { useEffect, useState } from 'react'

import { useInventoryClient } from '@views/inventory/useInventoryClient'
import InventoryStats from './InventoryStats'
import ProductListTable from '../../views/products/list/ProductListTable'

export default function InventoryList() {
  const [materials, setMaterials] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [loading, setLoading] = useState(true)
  const client = useInventoryClient()

  useEffect(() => {
    let mounted = true

    setLoading(true)
    client
      .fetchMaterials()
      .then(data => {
        if (!mounted) return
        const arr = Array.isArray(data) ? data : []

        const products = arr.map(m => ({
          id: m.id,
          productName: m.name || 'Unnamed',
          productBrand: m.sku || '',
          image: m.image || '',
          category: m.type || m.materialType || 'Inventory',
          stock: Boolean(Number(m.stock) > 0),
          sku: m.sku || '',
          price: m.price || '',
          qty: m.stock || 0,
          length: m.length || null,
          width: m.width || null,
          status: 'Published'
        }))

        setMaterials(products)
        setFilteredData(products)
      })
      .catch(() => {
        if (!mounted) return
        setMaterials([])
        setFilteredData([])
      })
      .finally(() => mounted && setLoading(false))

    return () => (mounted = false)

    // intentionally omit client to avoid refetch loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className='p-6'>
      <h1 className='text-2xl font-semibold mb-6'>المخزون</h1>

      {/* Inventory Statistics */}
      <div className='mb-6'>
        <InventoryStats materials={materials} />
      </div>

      {loading ? <div>جاري التحميل...</div> : <ProductListTable productData={filteredData} />}
    </div>
  )
}
