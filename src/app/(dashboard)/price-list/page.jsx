'use client'

import { useEffect, useState } from 'react'

import Link from 'next/link'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

export default function PriceListsPage() {
  const [priceLists, setPriceLists] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPriceLists()
  }, [])

  const fetchPriceLists = async () => {
    setLoading(true)

    try {
      const res = await fetch('/api/price-lists', { credentials: 'include' })

      if (res.ok) {
        const data = await res.json()

        setPriceLists(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error('Error fetching price lists:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async id => {
    if (!confirm('هل أنت متأكد من حذف قائمة الأسعار؟')) return

    try {
      const res = await fetch(`/api/price-lists?id=${id}`, { method: 'DELETE', credentials: 'include' })

      if (res.ok) {
        fetchPriceLists()
      }
    } catch (err) {
      console.error('Error deleting price list:', err)
    }
  }

  const formatDate = dateStr => {
    if (!dateStr) return '-'

    return new Date(dateStr).toLocaleDateString('ar-EG')
  }

  const getStatusColor = status => {
    switch (status) {
      case 'active':
        return 'success'
      case 'expired':
        return 'error'
      case 'draft':
      default:
        return 'warning'
    }
  }

  const getStatusLabel = status => {
    switch (status) {
      case 'active':
        return 'نشط'
      case 'expired':
        return 'منتهي'
      case 'draft':
      default:
        return 'مسودة'
    }
  }

  const calculateTotal = priceList => {
    let total = 0
    const items = priceList.items || []
    const manufacturing = priceList.manufacturingItems || []

    items.forEach(item => {
      total += (parseFloat(item.qty) || 0) * (parseFloat(item.price) || 0)
    })

    manufacturing.forEach(item => {
      total += parseFloat(item.total) || 0
    })

    return total.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })
  }

  return (
    <div className='p-6'>
      <div className='flex items-center justify-between mb-6'>
        <div>
          <Typography variant='h4' className='font-bold'>
            📋 قوائم الأسعار
          </Typography>
          <Typography color='text.secondary'>إنشاء وإدارة قوائم الأسعار للعملاء</Typography>
        </div>
        <Link href='/price-list/add'>
          <Button variant='contained' color='primary' startIcon={<i className='tabler-plus' />}>
            قائمة أسعار جديدة
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : priceLists.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <Typography color='text.secondary'>لا توجد قوائم أسعار</Typography>
              <Link href='/price-list/add'>
                <Button variant='outlined' sx={{ mt: 2 }}>
                  إنشاء قائمة أسعار جديدة
                </Button>
              </Link>
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell align='right' sx={{ fontWeight: 'bold' }}>
                      #
                    </TableCell>
                    <TableCell align='right' sx={{ fontWeight: 'bold' }}>
                      اسم المشروع
                    </TableCell>
                    <TableCell align='right' sx={{ fontWeight: 'bold' }}>
                      العميل
                    </TableCell>
                    <TableCell align='right' sx={{ fontWeight: 'bold' }}>
                      الإجمالي
                    </TableCell>
                    <TableCell align='right' sx={{ fontWeight: 'bold' }}>
                      صالحة حتى
                    </TableCell>
                    <TableCell align='right' sx={{ fontWeight: 'bold' }}>
                      الحالة
                    </TableCell>
                    <TableCell align='right' sx={{ fontWeight: 'bold' }}>
                      تاريخ الإنشاء
                    </TableCell>
                    <TableCell align='center' sx={{ fontWeight: 'bold' }}>
                      الإجراءات
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {priceLists.map((pl, idx) => (
                    <TableRow key={pl.id} hover>
                      <TableCell align='right'>{idx + 1}</TableCell>
                      <TableCell align='right'>{pl.projectName || '-'}</TableCell>
                      <TableCell align='right'>{pl.clientName || '-'}</TableCell>
                      <TableCell align='right'>{calculateTotal(pl)}</TableCell>
                      <TableCell align='right'>{formatDate(pl.validUntil)}</TableCell>
                      <TableCell align='right'>
                        <Chip label={getStatusLabel(pl.status)} color={getStatusColor(pl.status)} size='small' />
                      </TableCell>
                      <TableCell align='right'>{formatDate(pl.createdAt)}</TableCell>
                      <TableCell align='center'>
                        <Link href={`/price-list/${pl.id}`}>
                          <IconButton color='primary' size='small' title='عرض'>
                            <i className='tabler-eye' />
                          </IconButton>
                        </Link>
                        <Link href={`/price-list/${pl.id}/edit`}>
                          <IconButton color='info' size='small' title='تعديل'>
                            <i className='tabler-edit' />
                          </IconButton>
                        </Link>
                        <IconButton
                          color='secondary'
                          size='small'
                          title='طباعة'
                          onClick={() => {
                            window.open(`/price-list/${pl.id}?print=true`, '_blank')
                          }}
                        >
                          <i className='tabler-printer' />
                        </IconButton>
                        <IconButton
                          color='success'
                          size='small'
                          title='تحميل PDF'
                          onClick={() => {
                            window.open(`/price-list/${pl.id}?print=true`, '_blank')
                          }}
                        >
                          <i className='tabler-download' />
                        </IconButton>
                        <IconButton color='error' size='small' title='حذف' onClick={() => handleDelete(pl.id)}>
                          <i className='tabler-trash' />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
