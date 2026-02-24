// React Imports
import React from 'react'

import { COMPANY_NAME, COMPANY_ADDRESS, COMPANY_PHONE, COMPANY_LOGO, COMPANY_LOGO_FALLBACK, buildFallbackLogoDataUri } from '@/utils/companyInfo'

// MUI Imports (kept for typography and structure)
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

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
  item: 'قطعة'
}

const PreviewCard = ({ invoiceData }) => {
  if (!invoiceData) return <div>Loading...</div>

  const items = typeof invoiceData.items === 'string' ? JSON.parse(invoiceData.items) : invoiceData.items || []

  const manufacturingItems =
    typeof invoiceData.manufacturing === 'string'
      ? JSON.parse(invoiceData.manufacturing)
      : invoiceData.manufacturing || []

  const itemsSubtotal = items.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.price || 0), 0)

  const manufacturingTotal = manufacturingItems.reduce((sum, m) => {
    // prefer explicit total, otherwise compute from quantity * unitCost
    const lineTotal = m && m.total != null ? Number(m.total) : Number(m.quantity || 0) * Number(m.unitCost || 0)

    return sum + (isNaN(lineTotal) ? 0 : lineTotal)
  }, 0)

  const subtotal = itemsSubtotal + manufacturingTotal
  const discountAmount = Number(invoiceData.discount || 0)
  const taxPercent = Number(invoiceData.taxPercent || 0)
  const taxAmount = +((subtotal * taxPercent) / 100).toFixed(2)
  const total = +(subtotal - discountAmount + taxAmount).toFixed(2)

  const formatDate = date => {
    if (!date) return ''

    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

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
  .invoice-root {
    padding: 0 !important;
    margin: 0 !important;
    box-shadow: none !important;
  }
  .invoice-card {
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

.invoice-card {
  font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif;
}
`

  const fallbackLogo = buildFallbackLogoDataUri(COMPANY_NAME)

  return (
    <Card className='invoice-root' style={{ background: '#f8f8f8' }}>
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />
      <CardContent
        className='invoice-card'
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
                // Try legacy logo first, then SVG fallback
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
                color: '#666',
                marginBottom: 6,
                fontWeight: 800,
                fontFamily: "'Cairo', sans-serif"
              }}
            >
              فاتورة
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
            >{`#${invoiceData.number}`}</div>
            <div style={{ marginTop: 10, fontSize: 13, color: '#666' }}>
              <div>
                <strong>الحالة:</strong>{' '}
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 12,
                    background:
                      invoiceData.status === 'paid'
                        ? '#e8f5e9'
                        : invoiceData.status === 'draft'
                          ? '#fff3e0'
                          : invoiceData.status === 'partial'
                            ? '#fce4ec'
                            : invoiceData.status === 'overdue'
                              ? '#ffebee'
                              : '#e3f2fd',
                    color:
                      invoiceData.status === 'paid'
                        ? '#2e7d32'
                        : invoiceData.status === 'draft'
                          ? '#f57c00'
                          : invoiceData.status === 'partial'
                            ? '#c2185b'
                            : invoiceData.status === 'overdue'
                              ? '#c62828'
                              : '#1565c0'
                  }}
                >
                  {invoiceData.status === 'draft'
                    ? 'مسودة'
                    : invoiceData.status === 'sent'
                      ? 'مرسلة'
                      : invoiceData.status === 'paid'
                        ? 'مدفوعة'
                        : invoiceData.status === 'partial'
                          ? 'مدفوعة جزئياً'
                          : invoiceData.status === 'overdue'
                            ? 'متأخرة'
                            : invoiceData.status === 'cancelled'
                              ? 'ملغاة'
                              : invoiceData.status || 'مسودة'}
                </span>
              </div>
              {/* Show partial payment details */}
              {invoiceData.status === 'partial' && Number(invoiceData.paidAmount) > 0 && <></>}
              <div>
                <strong>التاريخ:</strong> {formatDate(invoiceData.date)}
              </div>
              <div>
                <strong>الاستحقاق:</strong> {formatDate(invoiceData.dueDate)}
              </div>
              {invoiceData.paymentMethod && (
                <div>
                  <strong>طريقة الدفع:</strong>{' '}
                  {invoiceData.paymentMethod === 'bank' || invoiceData.paymentMethod === 'تحويل بنكي'
                    ? 'تحويل بنكي'
                    : invoiceData.paymentMethod === 'cash' || invoiceData.paymentMethod === 'نقدي'
                      ? 'نقدي'
                      : invoiceData.paymentMethod === 'check' || invoiceData.paymentMethod === 'شيك'
                        ? 'شيك'
                        : invoiceData.paymentMethod}
                </div>
              )}
              {/* Show bank name when payment method is bank transfer */}
              {(invoiceData.paymentMethod === 'bank' || invoiceData.paymentMethod === 'تحويل بنكي') &&
                invoiceData.bankName && (
                  <div>
                    <strong>اسم البنك:</strong> {invoiceData.bankName}
                  </div>
                )}
            </div>
          </div>
        </div>

        <hr style={{ borderColor: '#eee' }} />

        {/* To / Bill */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, paddingTop: 12, paddingBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#333', textTransform: 'uppercase', marginBottom: 8 }}>
              فاتورة إلى
            </div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{invoiceData.client?.name || 'غير محدد'}</div>
            <div style={{ fontSize: 13, color: '#666' }}>{invoiceData.client?.company || ''}</div>
            <div style={{ fontSize: 13, color: '#666' }}>{invoiceData.client?.address || ''}</div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 6 }}>
              {invoiceData.client?.phone && <span>📞 {invoiceData.client.phone}</span>}
              {invoiceData.client?.phone && invoiceData.client?.email && <span style={{ margin: '0 8px' }}>|</span>}
              {invoiceData.client?.email && <span>✉️ {invoiceData.client.email}</span>}
            </div>
          </div>

          {/* ملخص الفاتورة */}
          <div
            style={{
              flex: 1,
              background: '#f8f9fa',
              borderRadius: 8,
              padding: '12px 16px',
              border: '1px solid #e9ecef'
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 800, color: '#333', textTransform: 'uppercase', marginBottom: 10 }}>
              ملخص الفاتورة
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: 13 }}>
              <div style={{ color: '#666' }}>عدد الأصناف:</div>
              <div style={{ fontWeight: 600, textAlign: 'left' }}>{items.length}</div>

              <div style={{ color: '#666' }}>خدمات التصنيع:</div>
              <div style={{ fontWeight: 600, textAlign: 'left' }}>{manufacturingItems.length}</div>

              <div style={{ color: '#666' }}>المجموع الفرعي:</div>
              <div style={{ fontWeight: 600, textAlign: 'left' }}>{currencyFormat(subtotal)}</div>

              {discountAmount > 0 && (
                <>
                  <div style={{ color: '#c62828' }}>الخصم:</div>
                  <div style={{ fontWeight: 600, textAlign: 'left', color: '#c62828' }}>
                    -{currencyFormat(discountAmount)}
                  </div>
                </>
              )}

              {taxAmount > 0 && (
                <>
                  <div style={{ color: '#666' }}>الضريبة ({invoiceData.taxPercent}%):</div>
                  <div style={{ fontWeight: 600, textAlign: 'left' }}>+{currencyFormat(taxAmount)}</div>
                </>
              )}
            </div>
          </div>

          <div style={{ textAlign: 'right', minWidth: 200 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#333', textTransform: 'uppercase', marginBottom: 8 }}>
              معلومات الدفع
            </div>
            <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
              <div>
                <strong>الإجمالي المستحق:</strong>{' '}
                <span style={{ fontWeight: 700, color: '#000' }}>{currencyFormat(total)}</span>
              </div>
              {/* Show client deposit */}
              
              {/* Show paid and remaining amounts */}
              {Number(invoiceData.paidAmount) > 0 && (
                <>
                  <div style={{ marginTop: 4 }}>
                    <strong>تم دفع:</strong>{' '}
                    <span style={{ fontWeight: 700, color: '#2e7d32' }}>{currencyFormat(invoiceData.paidAmount)}</span>
                  </div>
                  <div>
                    {invoiceData.client && Number(invoiceData.client.budget || 0) > 0 && (
                <div style={{ marginTop: 4 }}>
                  <strong>الباقى من العربون:</strong>{' '}
                  <span style={{ fontWeight: 700, color: '#1976d2' }}>{currencyFormat(invoiceData.client.budget)}</span>
                </div>
              )}
                    <strong>المتبقي:</strong>{' '}
                    <span style={{ fontWeight: 700, color: '#c62828' }}>
                      {currencyFormat(Number(total) - Number(invoiceData.paidAmount || 0))}
                    </span>
                  </div>
                </>
              )}
              {/* Show bank name when payment method is bank transfer */}
              {(invoiceData.paymentMethod === 'bank' || invoiceData.paymentMethod === 'تحويل بنكي') &&
                invoiceData.bankName && (
                  <div>
                    <strong>البنك:</strong> {invoiceData.bankName}
                  </div>
                )}
              {(invoiceData.paymentMethod === 'bank' || invoiceData.paymentMethod === 'تحويل بنكي') &&
                invoiceData.transactionNumber && (
                  <div>
                    <strong>رقم المعاملة:</strong> {invoiceData.transactionNumber}
                  </div>
                )}
            </div>
          </div>
        </div>

        <div style={{ borderRadius: 6, overflow: 'hidden', border: '1px solid #eee', marginTop: 12 }}>
          <table style={{ width: '100%' }}>
            <thead style={{ background: '#fafafa' }}>
              <tr>
                <th style={{ ...thStyleRight, fontSize: 13 }}>الصنف</th>
                <th style={{ ...thStyleRight, fontSize: 13 }}>الوصف</th>
                <th style={{ ...thStyleRight, fontSize: 13 }}>السعر</th>
                <th style={{ ...thStyleRight, fontSize: 13 }}>الكمية</th>
                <th style={{ ...thStyleRight, fontSize: 13 }}>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 16, textAlign: 'center', color: '#999' }}>
                    لا توجد عناصر
                  </td>
                </tr>
              )}

              {items.map((item, i) => {
                const lineTotal = Number(item.qty || 0) * Number(item.price || 0)

                return (
                  <tr key={i} style={{ borderTop: '1px solid #f1f1f1' }}>
                    <td style={{ ...tdStyle, fontSize: 14, textAlign: 'right' }}>{item.sku || ''}</td>
                    <td style={{ ...tdStyle, fontSize: 14, textAlign: 'right' }}>{item.desc || ''}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontSize: 14 }}>
                      {currencyFormat(Number(item.price || 0))}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontSize: 14 }}>{item.qty}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, fontSize: 14 }}>
                      {currencyFormat(lineTotal)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Manufacturing Items */}
        <div style={{ borderRadius: 6, overflow: 'hidden', border: '1px solid #eee', marginTop: 12 }}>
          <table style={{ width: '100%' }}>
            <thead style={{ background: '#fafafa' }}>
              <tr>
                <th style={{ ...thStyleRight, fontSize: 13 }}>النوع</th>
                <th style={{ ...thStyleRight, fontSize: 13 }}>الوحدة</th>
                <th style={{ ...thStyleRight, fontSize: 13 }}>سعر الوحدة</th>
                <th style={{ ...thStyleRight, fontSize: 13 }}>الكمية</th>
                <th style={{ ...thStyleRight, fontSize: 13 }}>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {manufacturingItems.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 16, textAlign: 'center', color: '#999' }}>
                    لا توجد عناصر تصنيع
                  </td>
                </tr>
              )}

              {manufacturingItems.map((m, i) => {
                const lineTotal =
                  m && m.total != null ? Number(m.total) : Number(m.quantity || 0) * Number(m.unitCost || 0)

                return (
                  <tr key={`m-${i}`} style={{ borderTop: '1px solid #f1f1f1' }}>
                    <td style={{ ...tdStyle, fontSize: 14, textAlign: 'right' }}>
                      {typeLabels[m.type] || m.type || ''}
                    </td>
                    <td style={{ ...tdStyle, fontSize: 14, textAlign: 'right' }}>
                      {unitLabels[m.subtype] || unitLabels[m.unit] || m.subtype || m.unit || ''}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontSize: 14 }}>
                      {currencyFormat(Number(m.unitCost || 0))}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontSize: 14 }}>{m.quantity || 0}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, fontSize: 14 }}>
                      {currencyFormat(lineTotal)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18, alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 13, color: '#666' }}>
              <strong>المندوب:</strong> {COMPANY_NAME}
            </div>
            {invoiceData.notes && <div style={{ marginTop: 12, fontSize: 13, color: '#666' }}>{invoiceData.notes}</div>}
          </div>

          <div style={{ minWidth: 220 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#666' }}>
              <span>الإجمالي الفرعي:</span>
              <span style={{ fontSize: 13 }}>{currencyFormat(subtotal)}</span>
            </div>
            <div
              style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#666', marginTop: 6 }}
            >
              <span>الخصم:</span>
              <span style={{ fontSize: 13 }}>-{currencyFormat(discountAmount)}</span>
            </div>
            <div
              style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#666', marginTop: 6 }}
            >
              <span>الضريبة ({taxPercent}%):</span>
              <span style={{ fontSize: 13 }}>{currencyFormat(taxAmount)}</span>
            </div>
            <div
              style={{
                borderTop: '1px solid #e6e6e6',
                paddingTop: 8,
                marginTop: 8,
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 900,
                fontSize: 15
              }}
            >
              <span>الإجمالي:</span>
              <span style={{ color: '#1976d2' }}>{currencyFormat(total)}</span>
            </div>
            {/* Show client deposit (العربون) */}
           
            {/* Show paid amount and remaining */}
            {Number(invoiceData.paidAmount) > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 6 }}>
                  <span style={{ color: '#2e7d32' }}>المبلغ المدفوع:</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#2e7d32' }}>
                    {currencyFormat(invoiceData.paidAmount)}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 15,
                    fontWeight: 900,
                    marginTop: 6,
                    padding: '8px 0',
                    borderTop: '2px dashed #c62828',
                    color: '#c62828'
                  }}
                >
                  <span>المتبقي:</span>
                  <span>{currencyFormat(Number(total) - Number(invoiceData.paidAmount || 0))}</span>
                </div>
              </>
            )} {invoiceData.client && Number(invoiceData.client.budget || 0) > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 6 }}>
                  <span style={{ color: '#1976d2' }}>المتبقى من العربون :</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1976d2' }}>
                    {currencyFormat(invoiceData.client.budget)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Prominent Remaining Amount Alert for Partial Payments */}
        {invoiceData.status === 'partial' && Number(invoiceData.paidAmount) > 0 && (
          <div
            style={{
              marginTop: 20,
              padding: 16,
              backgroundColor: '#ffebee',
              border: '3px solid #c62828',
              borderRadius: 8,
              textAlign: 'center',
              fontFamily: "'Cairo', sans-serif"
            }}
          >
            <div style={{ fontSize: 14, color: '#c62828', marginBottom: 8, fontWeight: 600 }}>
              ⚠️ تنبيه: هذه الفاتورة مدفوعة جزئياً
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 12, color: '#666' }}>المبلغ الإجمالي</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#333' }}>{currencyFormat(total)}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#2e7d32' }}>تم الدفع</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#2e7d32' }}>
                  {currencyFormat(invoiceData.paidAmount)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#c62828' }}>المبلغ المتبقي</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#c62828' }}>
                  {currencyFormat(Number(total) - Number(invoiceData.paidAmount || 0))}
                </div>
              </div>
            </div>
          </div>
        )}

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
            ملاحظة: شكراً لتعاملكم معنا! · هذه الفاتورة صالحة بدون ختم أو توقيع إلكتروني
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function currencyFormat(value) {
  try {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(Number(value || 0))
  } catch (e) {
    return Number(value || 0).toFixed(2) + ' ج.م'
  }
}

const thStyleLeft = {
  textAlign: 'left',
  padding: '12px 16px',
  fontSize: 13,
  fontWeight: 700,
  color: '#333',
  fontFamily: "'Cairo', sans-serif"
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

export default PreviewCard
