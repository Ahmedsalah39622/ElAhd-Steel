'use client'

import { useEffect, useState } from 'react'

import { COMPANY_NAME, COMPANY_ADDRESS, COMPANY_PHONE, COMPANY_LOGO, COMPANY_LOGO_FALLBACK, buildFallbackLogoDataUri } from '@/utils/companyInfo'

import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

import './print.css'

// ترجمة أنواع التصنيع
const typeLabels = {
  laser: 'ليزر',
  plasma: 'بلازما',
  cnc: 'CNC',
  bending: 'ثني',
  welding: 'لحام',
  drilling: 'تخريم',
  cutting: 'قطع',
  painting: 'دهان',
  galvanizing: 'جلفنة',
  other: 'أخرى',
  tanaya: 'ثني'
}

// ترجمة الوحدات
const unitLabels = {
  ton: 'طن',
  minutes: 'دقائق',
  kg: 'كجم',
  meter: 'متر',
  piece: 'قطعة',
  hour: 'ساعة',
  nozla: 'نزلة',
  nozlat: 'نزلات',
  hole: 'ثقب',
  sqm: 'متر مربع',
  unit: 'وحدة',
  item: 'قطعة',
  sheet: 'لوح',
  bar: 'سيخ'
}

const thStyleRight = {
  textAlign: 'right',
  padding: '12px 16px',
  fontSize: 13,
  fontWeight: 700,
  color: '#333',
  fontFamily: "'Cairo', sans-serif"
}

const tdStyle = { padding: '12px 16px', fontSize: 13, color: '#333', fontFamily: "'Cairo', sans-serif" }

function currencyFormat(value) {
  try {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(Number(value || 0))
  } catch (e) {
    return Number(value || 0).toFixed(2) + ' ج.م'
  }
}

export default function ViewPriceListPage() {
  const { id } = useParams()
  const searchParams = useSearchParams()
  const [priceList, setPriceList] = useState(null)
  const [loading, setLoading] = useState(true)

  // Auto-print when ?print=true is in URL
  useEffect(() => {
    if (!loading && priceList && searchParams.get('print') === 'true') {
      setTimeout(() => {
        window.print()
      }, 300)
    }
  }, [loading, priceList, searchParams])

  useEffect(() => {
    if (id) {
      fetchPriceList()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const fetchPriceList = async () => {
    setLoading(true)

    try {
      const res = await fetch(`/api/price-lists?id=${id}`, { credentials: 'include' })

      if (res.ok) {
        const contentType = res.headers.get('content-type') || ''

        if (contentType.includes('application/json')) {
          const data = await res.json()

          setPriceList(data)
        } else {
          console.error('API did not return JSON')
        }
      } else {
        console.error('Failed to fetch price list:', res.status)
      }
    } catch (err) {
      console.error('Error fetching price list:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = date => {
    if (!date) return ''

    return new Date(date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
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

  const getStatusStyle = status => {
    switch (status) {
      case 'active':
        return { background: '#e8f5e9', color: '#2e7d32' }
      case 'expired':
        return { background: '#ffebee', color: '#c62828' }
      case 'draft':
      default:
        return { background: '#fff3e0', color: '#f57c00' }
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!priceList) {
    return (
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <Typography variant='h5'>قائمة الأسعار غير موجودة</Typography>
        <Link href='/price-list'>
          <Button variant='contained' sx={{ mt: 2 }}>
            العودة للقوائم
          </Button>
        </Link>
      </Box>
    )
  }

  const items = priceList.items || []
  const manufacturingItems = priceList.manufacturingItems || []

  const itemsTotal = items.reduce((s, it) => s + Number(it.qty || 0) * Number(it.price || 0), 0)
  const manufacturingTotal = manufacturingItems.reduce((s, it) => s + Number(it.total || 0), 0)
  const grandTotal = itemsTotal + manufacturingTotal

  const printStyles = `
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');

@media print {
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  @page {
    size: A4;
    margin: 10mm;
  }
  body {
    background: #fff !important;
    font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif !important;
    -webkit-font-smoothing: antialiased;
    direction: rtl;
  }
  .price-list-root {
    padding: 0 !important;
    margin: 0 !important;
    box-shadow: none !important;
  }
  .price-list-card {
    width: 100% !important;
    margin: 0 !important;
    padding: 5mm !important;
    box-sizing: border-box !important;
    box-shadow: none !important;
  }
  table {
    border-collapse: collapse !important;
    width: 100% !important;
  }
  thead {
    display: table-header-group !important;
  }
  th, td {
    font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif !important;
  }
  .no-print {
    display: none !important;
  }
}

.price-list-card {
  font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif;
}
`

  const fallbackLogo = buildFallbackLogoDataUri(COMPANY_NAME)

  return (
    <div className='p-6'>
      {/* Action Buttons - No Print */}
      <div className='flex items-center justify-between mb-6 no-print'>
        <div>
          <Typography variant='h4' className='font-bold'>
            📋 عرض قائمة الأسعار
          </Typography>
          <Typography color='text.secondary'>{priceList.projectName || 'بدون اسم'}</Typography>
        </div>
        <div className='flex gap-2'>
          <Button variant='outlined' onClick={handlePrint} startIcon={<i className='tabler-printer' />}>
            طباعة
          </Button>
          <Link href={`/price-list/${id}/edit`}>
            <Button variant='outlined' color='info' startIcon={<i className='tabler-edit' />}>
              تعديل
            </Button>
          </Link>
          <Link href='/price-list'>
            <Button variant='outlined' color='secondary'>
              رجوع
            </Button>
          </Link>
        </div>
      </div>

      {/* Price List Card - Invoice Style */}
      <Card className='price-list-root' style={{ background: '#f8f8f8' }}>
        <style dangerouslySetInnerHTML={{ __html: printStyles }} />
        <CardContent
          className='price-list-card'
          style={{ background: '#fff', padding: '24px', fontFamily: "'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif" }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <img
                src={COMPANY_LOGO}
                alt={`${COMPANY_NAME} logo`}
                onError={e => {
                  e.currentTarget.onerror = null
                  if (e.currentTarget.src.includes('company-logo')) {
                    e.currentTarget.src = COMPANY_LOGO_FALLBACK
                  } else {
                    e.currentTarget.src = fallbackLogo
                  }
                }}
                style={{
                  display: 'block',
                  width: 80,
                  height: 80,
                  objectFit: 'contain',
                  borderRadius: 8
                }}
              />
              <div>
                <Typography style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Cairo', sans-serif" }}>
                  {COMPANY_NAME}
                </Typography>
                <div style={{ fontSize: 13, color: '#666', lineHeight: 1.45, fontFamily: "'Cairo', sans-serif" }}>
                  {COMPANY_ADDRESS && <>{COMPANY_ADDRESS}<br /></>}
                  {COMPANY_PHONE}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: 18,
                  color: '#1976d2',
                  marginBottom: 6,
                  fontWeight: 800,
                  fontFamily: "'Cairo', sans-serif"
                }}
              >
                قائمة أسعار
              </div>
              <div
                style={{
                  border: '1px solid #e6e6e6',
                  padding: '10px 14px',
                  background: '#fafafa',
                  display: 'inline-block',
                  fontWeight: 800,
                  fontSize: 16
                }}
              >{`#${priceList.id}`}</div>
              <div style={{ marginTop: 10, fontSize: 13, color: '#666' }}>
                <div>
                  <strong>الحالة:</strong>{' '}
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 12,
                      ...getStatusStyle(priceList.status)
                    }}
                  >
                    {getStatusLabel(priceList.status)}
                  </span>
                </div>
                <div>
                  <strong>تاريخ الإنشاء:</strong> {formatDate(priceList.createdAt)}
                </div>
                <div>
                  <strong>صالحة حتى:</strong> {formatDate(priceList.validUntil)}
                </div>
              </div>
            </div>
          </div>

          <hr style={{ borderColor: '#eee' }} />

          {/* Client / Project Info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, paddingTop: 12, paddingBottom: 12 }}>
            <div>
              <div
                style={{ fontSize: 12, fontWeight: 800, color: '#333', textTransform: 'uppercase', marginBottom: 8 }}
              >
                معلومات العميل
              </div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{priceList.clientName || 'غير محدد'}</div>
            </div>

            <div style={{ textAlign: 'right', minWidth: 200 }}>
              <div
                style={{ fontSize: 12, fontWeight: 800, color: '#333', textTransform: 'uppercase', marginBottom: 8 }}
              >
                معلومات المشروع
              </div>
              <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
                <div>
                  <strong>اسم المشروع:</strong> {priceList.projectName || 'غير محدد'}
                </div>
                {priceList.projectDescription && (
                  <div>
                    <strong>الوصف:</strong> {priceList.projectDescription}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Materials Table */}
          {items.length > 0 && (
            <div style={{ borderRadius: 6, overflow: 'hidden', border: '1px solid #eee', marginTop: 12 }}>
              <div
                style={{
                  background: '#1976d2',
                  color: '#fff',
                  padding: '10px 16px',
                  fontWeight: 700,
                  fontSize: 14
                }}
              >
                🏭 المواد الخام
              </div>
              <table style={{ width: '100%' }}>
                <thead style={{ background: '#fafafa' }}>
                  <tr>
                    <th style={{ ...thStyleRight, fontSize: 13 }}>#</th>
                    <th style={{ ...thStyleRight, fontSize: 13 }}>المادة</th>
                    <th style={{ ...thStyleRight, fontSize: 13 }}>الوصف</th>
                    <th style={{ ...thStyleRight, fontSize: 13 }}>الكمية</th>
                    <th style={{ ...thStyleRight, fontSize: 13 }}>الوحدة</th>
                    <th style={{ ...thStyleRight, fontSize: 13 }}>السعر</th>
                    <th style={{ ...thStyleRight, fontSize: 13 }}>الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => {
                    const lineTotal = Number(item.qty || 0) * Number(item.price || 0)

                    return (
                      <tr key={i} style={{ borderTop: '1px solid #f1f1f1' }}>
                        <td style={{ ...tdStyle, fontSize: 14, textAlign: 'right' }}>{i + 1}</td>
                        <td style={{ ...tdStyle, fontSize: 14, textAlign: 'right' }}>{item.name || item.sku || ''}</td>
                        <td style={{ ...tdStyle, fontSize: 14, textAlign: 'right' }}>
                          {item.description || item.desc || '-'}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontSize: 14 }}>{item.qty}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontSize: 14 }}>
                          {unitLabels[item.unit] || item.unit || '-'}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontSize: 14 }}>{currencyFormat(item.price)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, fontSize: 14 }}>
                          {currencyFormat(lineTotal)}
                        </td>
                      </tr>
                    )
                  })}
                  <tr style={{ background: '#f5f5f5' }}>
                    <td colSpan={6} style={{ ...tdStyle, fontWeight: 700, textAlign: 'right' }}>
                      إجمالي المواد
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 700, textAlign: 'right', color: '#1976d2' }}>
                      {currencyFormat(itemsTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Manufacturing Items */}
          {manufacturingItems.length > 0 && (
            <div style={{ borderRadius: 6, overflow: 'hidden', border: '1px solid #eee', marginTop: 12 }}>
              <div
                style={{
                  background: '#f57c00',
                  color: '#fff',
                  padding: '10px 16px',
                  fontWeight: 700,
                  fontSize: 14
                }}
              >
                ⚙️ التصنيع والتشغيل
              </div>
              <table style={{ width: '100%' }}>
                <thead style={{ background: '#fafafa' }}>
                  <tr>
                    <th style={{ ...thStyleRight, fontSize: 13 }}>#</th>
                    <th style={{ ...thStyleRight, fontSize: 13 }}>النوع</th>
                    <th style={{ ...thStyleRight, fontSize: 13 }}>الوصف</th>
                    <th style={{ ...thStyleRight, fontSize: 13 }}>الكمية</th>
                    <th style={{ ...thStyleRight, fontSize: 13 }}>سعر الوحدة</th>
                    <th style={{ ...thStyleRight, fontSize: 13 }}>الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {manufacturingItems.map((m, i) => {
                    const lineTotal =
                      m && m.total != null ? Number(m.total) : Number(m.quantity || 0) * Number(m.unitCost || 0)

                    return (
                      <tr key={`m-${i}`} style={{ borderTop: '1px solid #f1f1f1' }}>
                        <td style={{ ...tdStyle, fontSize: 14, textAlign: 'right' }}>{i + 1}</td>
                        <td style={{ ...tdStyle, fontSize: 14, textAlign: 'right' }}>
                          {typeLabels[m.type] || m.type || ''}
                        </td>
                        <td style={{ ...tdStyle, fontSize: 14, textAlign: 'right' }}>{m.description || '-'}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontSize: 14 }}>{m.quantity || 0}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontSize: 14 }}>
                          {currencyFormat(Number(m.unitCost || 0))}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, fontSize: 14 }}>
                          {currencyFormat(lineTotal)}
                        </td>
                      </tr>
                    )
                  })}
                  <tr style={{ background: '#f5f5f5' }}>
                    <td colSpan={5} style={{ ...tdStyle, fontWeight: 700, textAlign: 'right' }}>
                      إجمالي التصنيع
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 700, textAlign: 'right', color: '#f57c00' }}>
                      {currencyFormat(manufacturingTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Summary Section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18, alignItems: 'flex-start' }}>
            <div>
              {priceList.notes && (
                <div style={{ marginTop: 12, fontSize: 13, color: '#666' }}>
                  <strong>ملاحظات:</strong> {priceList.notes}
                </div>
              )}
            </div>

            <div style={{ minWidth: 220 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#666' }}>
                <span>إجمالي المواد:</span>
                <span style={{ fontSize: 13 }}>{currencyFormat(itemsTotal)}</span>
              </div>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#666', marginTop: 6 }}
              >
                <span>إجمالي التصنيع:</span>
                <span style={{ fontSize: 13 }}>{currencyFormat(manufacturingTotal)}</span>
              </div>
              <div
                style={{
                  borderTop: '2px solid #1976d2',
                  paddingTop: 8,
                  marginTop: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 900,
                  fontSize: 16
                }}
              >
                <span>الإجمالي الكلي:</span>
                <span style={{ color: '#1976d2' }}>{currencyFormat(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Validity Notice */}
          <div
            style={{
              marginTop: 20,
              padding: 16,
              backgroundColor: '#e3f2fd',
              border: '2px solid #1976d2',
              borderRadius: 8,
              textAlign: 'center',
              fontFamily: "'Cairo', sans-serif"
            }}
          >
            <div style={{ fontSize: 14, color: '#1976d2', fontWeight: 600 }}>
              📋 هذه القائمة صالحة حتى: {formatDate(priceList.validUntil)}
            </div>
          </div>

          {/* Signature and Stamp Section */}
          <div
            style={{
              marginTop: 40,
              display: 'flex',
              justifyContent: 'space-between',
              gap: 40,
              fontFamily: "'Cairo', sans-serif"
            }}
          >
            {/* Customer Signature */}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  marginBottom: 8,
                  color: '#333'
                }}
              >
                توقيع العميل
              </div>
              <div
                style={{
                  borderBottom: '2px solid #333',
                  height: 60,
                  marginBottom: 8
                }}
              ></div>
              <div style={{ fontSize: 12, color: '#666' }}>الاسم: ................................</div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>التاريخ: ................................</div>
            </div>

            {/* Company Stamp */}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  marginBottom: 8,
                  color: '#333'
                }}
              >
                ختم الشركة
              </div>
              <div
                style={{
                  border: '2px dashed #ccc',
                  borderRadius: 8,
                  height: 80,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999',
                  fontSize: 12
                }}
              >
                مكان الختم
              </div>
            </div>

            {/* Authorized Signature */}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  marginBottom: 8,
                  color: '#333'
                }}
              >
                توقيع المسؤول
              </div>
              <div
                style={{
                  borderBottom: '2px solid #333',
                  height: 60,
                  marginBottom: 8
                }}
              ></div>
              <div style={{ fontSize: 12, color: '#666' }}>الاسم: ................................</div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>التاريخ: ................................</div>
            </div>
          </div>

          <div style={{ marginTop: 30, borderTop: '1px solid #eee', paddingTop: 12 }}>
            <div style={{ fontSize: 12, color: '#666', textAlign: 'center', fontFamily: "'Cairo', sans-serif" }}>
              ملاحظة: شكراً لتعاملكم معنا! · هذه قائمة أسعار تقديرية وليست فاتورة رسمية
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
