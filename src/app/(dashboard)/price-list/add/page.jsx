'use client'

import { useEffect, useState, useRef } from 'react'

import { COMPANY_NAME, COMPANY_ADDRESS, COMPANY_PHONE } from '@/utils/companyInfo'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Divider from '@mui/material/Divider'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import Collapse from '@mui/material/Collapse'

import './print.css'

export default function AddPriceListPage() {
  const router = useRouter()
  const printRef = useRef(null)

  const [clients, setClients] = useState([])
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    clientId: '',
    clientName: '',
    projectName: '',
    projectDescription: '',
    validUntil: '',
    notes: '',
    status: 'draft'
  })

  const [items, setItems] = useState([{ name: '', description: '', qty: 1, unit: 'kg', price: 0 }])

  const [manufacturingItems, setManufacturingItems] = useState([])

  const [settings, setSettings] = useState({
    showLogo: true,
    showCompanyInfo: true,
    showClientInfo: true,
    showProjectInfo: true,
    showMaterials: true,
    showManufacturing: true,
    showTotals: true,
    showNotes: true,
    showFooter: true,
    showPrices: true,
    showQuantities: true,
    currency: 'EGP',
    taxRate: 0,
    discountRate: 0
  })

  const [showSettings, setShowSettings] = useState(false)

  const manufacturingTypes = [
    { value: 'laser', label: 'ليزر' },
    { value: 'plasma', label: 'بلازما' },
    { value: 'cnc', label: 'CNC' },
    { value: 'bending', label: 'ثني' },
    { value: 'welding', label: 'لحام' },
    { value: 'drilling', label: 'تخريم' },
    { value: 'cutting', label: 'قطع' },
    { value: 'painting', label: 'دهان' },
    { value: 'galvanizing', label: 'جلفنة' },
    { value: 'other', label: 'أخرى' }
  ]

  const manufacturingUnits = {
    laser: [
      { value: 'ton', label: 'طن' },
      { value: 'minutes', label: 'دقائق' },
      { value: 'kg', label: 'كجم' },
      { value: 'meter', label: 'متر' }
    ],
    plasma: [
      { value: 'ton', label: 'طن' },
      { value: 'minutes', label: 'دقائق' },
      { value: 'kg', label: 'كجم' },
      { value: 'meter', label: 'متر' }
    ],
    cnc: [
      { value: 'piece', label: 'قطعة' },
      { value: 'hour', label: 'ساعة' },
      { value: 'meter', label: 'متر' }
    ],
    bending: [
      { value: 'nozla', label: 'نزلة' },
      { value: 'piece', label: 'قطعة' },
      { value: 'meter', label: 'متر' }
    ],
    welding: [
      { value: 'meter', label: 'متر' },
      { value: 'piece', label: 'قطعة' },
      { value: 'hour', label: 'ساعة' }
    ],
    drilling: [
      { value: 'hole', label: 'ثقب' },
      { value: 'piece', label: 'قطعة' }
    ],
    cutting: [
      { value: 'meter', label: 'متر' },
      { value: 'piece', label: 'قطعة' }
    ],
    painting: [
      { value: 'sqm', label: 'متر مربع' },
      { value: 'piece', label: 'قطعة' }
    ],
    galvanizing: [
      { value: 'kg', label: 'كجم' },
      { value: 'ton', label: 'طن' },
      { value: 'piece', label: 'قطعة' }
    ],
    other: [
      { value: 'piece', label: 'قطعة' },
      { value: 'unit', label: 'وحدة' },
      { value: 'hour', label: 'ساعة' }
    ]
  }

  const units = [
    { value: 'kg', label: 'كجم' },
    { value: 'ton', label: 'طن' },
    { value: 'meter', label: 'متر' },
    { value: 'piece', label: 'قطعة' },
    { value: 'sheet', label: 'لوح' },
    { value: 'bar', label: 'سيخ' }
  ]

  useEffect(() => {
    // Fetch clients
    fetch('/api/clients', { credentials: 'include' })
      .then(r => {
        if (!r.ok) throw new Error('Failed to fetch clients')

        return r.json()
      })
      .then(d => {
        const arr = Array.isArray(d) ? d : d?.data || []

        setClients(arr)
      })
      .catch(err => console.error('Error fetching clients:', err))

    // Fetch materials
    fetch('/api/inventory', { credentials: 'include' })
      .then(r => {
        if (!r.ok) throw new Error('Failed to fetch materials')

        return r.json()
      })
      .then(d => {
        const arr = Array.isArray(d) ? d : d?.data || []

        setMaterials(arr)
      })
      .catch(err => console.error('Error fetching materials:', err))
  }, [])

  const handleClientChange = clientId => {
    const client = clients.find(c => c.id == clientId)

    setForm({
      ...form,
      clientId,
      clientName: client?.name || ''
    })
  }

  // Items handlers
  const handleItemChange = (idx, key, value) => {
    const copy = [...items]

    copy[idx][key] = key === 'qty' || key === 'price' ? Number(value) : value
    setItems(copy)
  }

  const addItem = () => {
    setItems([...items, { name: '', description: '', qty: 1, unit: 'kg', price: 0 }])
  }

  const removeItem = idx => {
    setItems(items.filter((_, i) => i !== idx))
  }

  const selectMaterial = (idx, materialId) => {
    const material = materials.find(m => m.id == materialId)

    if (material) {
      const copy = [...items]

      copy[idx] = {
        ...copy[idx],
        name: material.name,
        materialId: material.id,
        sku: material.sku,
        price: material.price || 0
      }
      setItems(copy)
    }
  }

  // Manufacturing handlers
  const handleManufacturingChange = (idx, key, value) => {
    const copy = [...manufacturingItems]

    if (!copy[idx]) copy[idx] = {}
    copy[idx][key] = key === 'quantity' || key === 'unitCost' ? Number(value) : value

    const line = copy[idx]
    const qty = Number(line.quantity || 0)
    const unit = Number(line.unitCost || 0)

    line.total = +(qty * unit).toFixed(2)
    setManufacturingItems(copy)
  }

  const addManufacturing = () => {
    setManufacturingItems([
      ...manufacturingItems,
      { type: 'laser', unit: 'ton', description: '', quantity: 0, unitCost: 0, total: 0 }
    ])
  }

  const removeManufacturing = idx => {
    setManufacturingItems(manufacturingItems.filter((_, i) => i !== idx))
  }

  // Calculations
  const itemsTotal = items.reduce((s, it) => s + Number(it.qty || 0) * Number(it.price || 0), 0)
  const manufacturingTotal = manufacturingItems.reduce((s, it) => s + Number(it.total || 0), 0)
  const grandTotal = itemsTotal + manufacturingTotal

  const formatCurrency = value => {
    return Number(value || 0).toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...form,
        items,
        manufacturingItems
      }

      const res = await fetch('/api/price-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        router.push('/price-list')
      } else {
        const txt = await res.text()

        alert('خطأ: ' + txt)
      }
    } catch (err) {
      console.error('Error saving price list:', err)
      alert('حدث خطأ أثناء الحفظ')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    // Get the print area content
    const printContent = printRef.current

    if (!printContent) return

    // Calculate totals for print
    const itemsTotal = items.reduce((sum, item) => sum + item.qty * item.price, 0)
    const manufacturingTotal = manufacturingItems.reduce((sum, item) => sum + (item.total || 0), 0)
    const grandTotal = itemsTotal + manufacturingTotal

    // Open new window
    const printWindow = window.open('', '_blank', 'width=800,height=600')

    if (!printWindow) {
      alert('يرجى السماح بالنوافذ المنبثقة للطباعة')

      return
    }

    // Build print HTML
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>قائمة الأسعار - ${form.clientName || 'عميل'}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Cairo', sans-serif;
            direction: rtl;
            padding: 30px;
            background: white;
            color: #333;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #1e88e5;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #1e88e5;
            font-size: 28px;
            margin-bottom: 5px;
          }
          .header p {
            color: #666;
            font-size: 16px;
          }
          .info-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            gap: 30px;
          }
          .info-box {
            flex: 1;
            background: #f5f5f5;
            padding: 15px;
            border-radius: 8px;
          }
          .info-box h3 {
            color: #1e88e5;
            font-size: 14px;
            margin-bottom: 10px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
          }
          .info-box p {
            margin: 5px 0;
            font-size: 13px;
          }
          .info-box strong {
            display: inline-block;
            width: 100px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: right;
          }
          th {
            background: #1e88e5;
            color: white;
            font-weight: 600;
          }
          tr:nth-child(even) {
            background: #f9f9f9;
          }
          .section-title {
            background: #e3f2fd;
            padding: 10px 15px;
            border-radius: 6px;
            margin: 25px 0 15px;
            color: #1565c0;
            font-weight: 600;
          }
          .totals {
            background: linear-gradient(135deg, #e3f2fd, #bbdefb);
            padding: 20px;
            border-radius: 10px;
            margin-top: 30px;
          }
          .totals h3 {
            text-align: center;
            margin-bottom: 15px;
            color: #1565c0;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid rgba(0,0,0,0.1);
          }
          .total-row:last-child {
            border-bottom: none;
            font-size: 18px;
            font-weight: 700;
            color: #1e88e5;
            padding-top: 15px;
            margin-top: 10px;
            border-top: 2px solid #1e88e5;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 12px;
          }
          .notes {
            background: #fff3e0;
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
            border-right: 4px solid #ff9800;
          }
          .notes h4 {
            color: #e65100;
            margin-bottom: 8px;
          }
          .print-btn {
            position: fixed;
            top: 20px;
            left: 20px;
            background: #1e88e5;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-family: 'Cairo', sans-serif;
            font-size: 14px;
          }
          .print-btn:hover {
            background: #1565c0;
          }
          @media print {
            .print-btn {
              display: none;
            }
            body {
              padding: 15px;
            }
          }
        </style>
      </head>
      <body>
        <button class="print-btn" onclick="window.print()">🖨️ طباعة</button>

        <div class="header">
          <h1>📋 قائمة الأسعار</h1>
          <p>${COMPANY_NAME}</p>
        </div>

        <div class="info-section">
          <div class="info-box">
            <h3>معلومات العميل</h3>
            <p><strong>الاسم:</strong> ${form.clientName || '-'}</p>
            <p><strong>المشروع:</strong> ${form.projectName || '-'}</p>
            <p><strong>الوصف:</strong> ${form.projectDescription || '-'}</p>
          </div>
          <div class="info-box">
            <h3>معلومات القائمة</h3>
            <p><strong>التاريخ:</strong> ${new Date().toLocaleDateString('ar-EG')}</p>
            <p><strong>صالحة حتى:</strong> ${form.validUntil ? new Date(form.validUntil).toLocaleDateString('ar-EG') : '-'}</p>
            <p><strong>الحالة:</strong> ${form.status === 'draft' ? 'مسودة' : form.status === 'sent' ? 'مرسلة' : form.status === 'approved' ? 'معتمدة' : 'ملغية'}</p>
          </div>
        </div>

        ${
          items.length > 0 && items.some(i => i.name)
            ? `
          <div class="section-title">📦 المواد والخامات</div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>المادة</th>
                <th>الوصف</th>
                <th>الكمية</th>
                <th>الوحدة</th>
                <th>السعر</th>
                <th>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              ${items
                .filter(i => i.name)
                .map(
                  (item, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${item.name}</td>
                  <td>${item.description || '-'}</td>
                  <td>${item.qty}</td>
                  <td>${units.find(u => u.value === item.unit)?.label || item.unit}</td>
                  <td>${Number(item.price).toLocaleString('ar-EG')} ج.م</td>
                  <td>${(item.qty * item.price).toLocaleString('ar-EG')} ج.م</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        `
            : ''
        }

        ${
          manufacturingItems.length > 0 && manufacturingItems.some(i => i.type)
            ? `
          <div class="section-title">⚙️ خدمات التصنيع</div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>نوع التصنيع</th>
                <th>الوصف</th>
                <th>الكمية</th>
                <th>تكلفة الوحدة</th>
                <th>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              ${manufacturingItems
                .filter(i => i.type)
                .map(
                  (item, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${manufacturingTypes.find(t => t.value === item.type)?.label || item.type}</td>
                  <td>${item.description || '-'}</td>
                  <td>${item.quantity || 0}</td>
                  <td>${Number(item.unitCost || 0).toLocaleString('ar-EG')} ج.م</td>
                  <td>${Number(item.total || 0).toLocaleString('ar-EG')} ج.م</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        `
            : ''
        }

        <div class="totals">
          <h3>💰 ملخص الأسعار</h3>
          <div class="total-row">
            <span>إجمالي المواد:</span>
            <span>${itemsTotal.toLocaleString('ar-EG')} ج.م</span>
          </div>
          <div class="total-row">
            <span>إجمالي التصنيع:</span>
            <span>${manufacturingTotal.toLocaleString('ar-EG')} ج.م</span>
          </div>
          <div class="total-row">
            <span>الإجمالي الكلي:</span>
            <span>${grandTotal.toLocaleString('ar-EG')} ج.م</span>
          </div>
        </div>

        ${
          form.notes
            ? `
          <div class="notes">
            <h4>📝 ملاحظات</h4>
            <p>${form.notes}</p>
          </div>
        `
            : ''
        }

        <div class="footer">
          <p>شكراً لتعاملكم معنا</p>
          <p>${COMPANY_NAME} - جميع الحقوق محفوظة © ${new Date().getFullYear()}</p>
        </div>
      </body>
      </html>
    `)

    printWindow.document.close()
  }

  return (
    <div className='p-6'>
      <div className='flex items-center justify-between mb-6 no-print'>
        <div>
          <Typography variant='h4' className='font-bold'>
            📋 قائمة أسعار جديدة
          </Typography>
          <Typography color='text.secondary'>إنشاء قائمة أسعار للعميل</Typography>
        </div>
        <div className='flex gap-2'>
          <Button
            variant={showSettings ? 'contained' : 'outlined'}
            color='info'
            onClick={() => setShowSettings(!showSettings)}
            startIcon={<i className='tabler-settings' />}
          >
            الإعدادات
          </Button>

          <Link href='/price-list'>
            <Button variant='outlined' color='secondary'>
              رجوع
            </Button>
          </Link>
        </div>
      </div>

      {/* Settings Panel */}
      <Collapse in={showSettings}>
        <Card className='mb-6 no-print'>
          <CardHeader
            title={
              <div className='flex items-center gap-2'>
                <i className='tabler-settings text-xl' />
                <span>إعدادات قائمة الأسعار</span>
              </div>
            }
            action={
              <IconButton onClick={() => setShowSettings(false)}>
                <i className='tabler-x' />
              </IconButton>
            }
          />
          <CardContent>
            <Grid container spacing={4}>
              {/* Display Settings */}
              <Grid item xs={12} md={4}>
                <Typography variant='subtitle2' className='font-semibold mb-3 text-primary'>
                  إعدادات العرض
                </Typography>
                <div className='flex flex-col gap-1'>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.showLogo}
                        onChange={e => setSettings({ ...settings, showLogo: e.target.checked })}
                        size='small'
                      />
                    }
                    label='عرض الشعار'
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.showCompanyInfo}
                        onChange={e => setSettings({ ...settings, showCompanyInfo: e.target.checked })}
                        size='small'
                      />
                    }
                    label='عرض معلومات الشركة'
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.showClientInfo}
                        onChange={e => setSettings({ ...settings, showClientInfo: e.target.checked })}
                        size='small'
                      />
                    }
                    label='عرض معلومات العميل'
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.showProjectInfo}
                        onChange={e => setSettings({ ...settings, showProjectInfo: e.target.checked })}
                        size='small'
                      />
                    }
                    label='عرض معلومات المشروع'
                  />
                </div>
              </Grid>

              {/* Content Settings */}
              <Grid item xs={12} md={4}>
                <Typography variant='subtitle2' className='font-semibold mb-3 text-primary'>
                  إعدادات المحتوى
                </Typography>
                <div className='flex flex-col gap-1'>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.showMaterials}
                        onChange={e => setSettings({ ...settings, showMaterials: e.target.checked })}
                        size='small'
                      />
                    }
                    label='عرض المواد'
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.showManufacturing}
                        onChange={e => setSettings({ ...settings, showManufacturing: e.target.checked })}
                        size='small'
                      />
                    }
                    label='عرض التصنيع'
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.showPrices}
                        onChange={e => setSettings({ ...settings, showPrices: e.target.checked })}
                        size='small'
                      />
                    }
                    label='عرض الأسعار'
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.showQuantities}
                        onChange={e => setSettings({ ...settings, showQuantities: e.target.checked })}
                        size='small'
                      />
                    }
                    label='عرض الكميات'
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.showTotals}
                        onChange={e => setSettings({ ...settings, showTotals: e.target.checked })}
                        size='small'
                      />
                    }
                    label='عرض الإجماليات'
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.showNotes}
                        onChange={e => setSettings({ ...settings, showNotes: e.target.checked })}
                        size='small'
                      />
                    }
                    label='عرض الملاحظات'
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.showFooter}
                        onChange={e => setSettings({ ...settings, showFooter: e.target.checked })}
                        size='small'
                      />
                    }
                    label='عرض التذييل'
                  />
                </div>
              </Grid>

              {/* Financial Settings */}
              <Grid item xs={12} md={4}>
                <Typography variant='subtitle2' className='font-semibold mb-3 text-primary'>
                  الإعدادات المالية
                </Typography>
                <FormControl fullWidth size='small' className='mb-3'>
                  <InputLabel>العملة</InputLabel>
                  <Select
                    value={settings.currency}
                    label='العملة'
                    onChange={e => setSettings({ ...settings, currency: e.target.value })}
                  >
                    <MenuItem value='EGP'>جنيه مصري (ج.م)</MenuItem>
                    <MenuItem value='USD'>دولار أمريكي ($)</MenuItem>
                    <MenuItem value='SAR'>ريال سعودي (ر.س)</MenuItem>
                    <MenuItem value='AED'>درهم إماراتي (د.إ)</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  size='small'
                  type='number'
                  label='نسبة الضريبة (%)'
                  value={settings.taxRate}
                  onChange={e => setSettings({ ...settings, taxRate: Number(e.target.value) })}
                  className='mb-3'
                  inputProps={{ min: 0, max: 100 }}
                />
                <TextField
                  fullWidth
                  size='small'
                  type='number'
                  label='نسبة الخصم (%)'
                  value={settings.discountRate}
                  onChange={e => setSettings({ ...settings, discountRate: Number(e.target.value) })}
                  inputProps={{ min: 0, max: 100 }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Collapse>

      <form onSubmit={handleSubmit}>
        <div ref={printRef} className='print-area'>
          {/* Header */}
          <Card className='mb-6'>
            <CardContent>
              <div className='print-header text-center mb-6'>
                <Typography variant='h3' className='font-bold text-primary'>
                  قائمة الأسعار
                </Typography>
                <Typography variant='h6' color='text.secondary'>
                  {COMPANY_NAME}
                </Typography>
              </div>

              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <Typography variant='subtitle2' className='font-semibold mb-2'>
                    معلومات العميل
                  </Typography>
                  <FormControl fullWidth size='small' className='mb-3 no-print'>
                    <InputLabel>اختر العميل</InputLabel>
                    <Select
                      value={form.clientId}
                      label='اختر العميل'
                      onChange={e => handleClientChange(e.target.value)}
                    >
                      <MenuItem value=''>
                        <em>بدون عميل</em>
                      </MenuItem>
                      {clients.map(c => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    fullWidth
                    size='small'
                    label='اسم العميل'
                    value={form.clientName}
                    onChange={e => setForm({ ...form, clientName: e.target.value })}
                    className='mb-3'
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant='subtitle2' className='font-semibold mb-2'>
                    معلومات المشروع
                  </Typography>
                  <TextField
                    fullWidth
                    size='small'
                    label='اسم المشروع'
                    value={form.projectName}
                    onChange={e => setForm({ ...form, projectName: e.target.value })}
                    className='mb-3'
                  />
                  <TextField
                    fullWidth
                    size='small'
                    label='وصف المشروع'
                    multiline
                    rows={2}
                    value={form.projectDescription}
                    onChange={e => setForm({ ...form, projectDescription: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    size='small'
                    type='date'
                    label='صالحة حتى'
                    InputLabelProps={{ shrink: true }}
                    value={form.validUntil}
                    onChange={e => setForm({ ...form, validUntil: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth size='small'>
                    <InputLabel>الحالة</InputLabel>
                    <Select
                      value={form.status}
                      label='الحالة'
                      onChange={e => setForm({ ...form, status: e.target.value })}
                    >
                      <MenuItem value='draft'>مسودة</MenuItem>
                      <MenuItem value='active'>نشط</MenuItem>
                      <MenuItem value='expired'>منتهي</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Materials Section */}
          <Card className='mb-6'>
            <CardContent>
              <div className='flex justify-between items-center mb-4'>
                <Typography variant='h6' className='font-semibold'>
                  🏭 المواد الخام
                </Typography>
                <Button
                  variant='outlined'
                  size='small'
                  onClick={addItem}
                  startIcon={<i className='tabler-plus' />}
                  className='no-print'
                >
                  إضافة مادة
                </Button>
              </div>

              <div className='space-y-4'>
                {items.map((item, idx) => (
                  <div key={idx} className='border rounded p-4 bg-gray-50 dark:bg-gray-800'>
                    <Grid container spacing={2} alignItems='center'>
                      <Grid item xs={12} md={3}>
                        <FormControl fullWidth size='small' className='no-print'>
                          <InputLabel>اختر من المخزون</InputLabel>
                          <Select
                            value={item.materialId || ''}
                            label='اختر من المخزون'
                            onChange={e => selectMaterial(idx, e.target.value)}
                          >
                            <MenuItem value=''>
                              <em>إدخال يدوي</em>
                            </MenuItem>
                            {materials.map(m => (
                              <MenuItem key={m.id} value={m.id}>
                                {m.name} - {m.sku}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <TextField
                          fullWidth
                          size='small'
                          label='اسم المادة'
                          value={item.name}
                          onChange={e => handleItemChange(idx, 'name', e.target.value)}
                          className='mt-2'
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          size='small'
                          label='الوصف'
                          value={item.description}
                          onChange={e => handleItemChange(idx, 'description', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={6} md={1.5}>
                        <TextField
                          fullWidth
                          size='small'
                          type='number'
                          label='الكمية'
                          value={item.qty}
                          onChange={e => handleItemChange(idx, 'qty', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={6} md={1.5}>
                        <FormControl fullWidth size='small'>
                          <InputLabel>الوحدة</InputLabel>
                          <Select
                            value={item.unit}
                            label='الوحدة'
                            onChange={e => handleItemChange(idx, 'unit', e.target.value)}
                          >
                            {units.map(u => (
                              <MenuItem key={u.value} value={u.value}>
                                {u.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={6} md={1.5}>
                        <TextField
                          fullWidth
                          size='small'
                          type='number'
                          label='السعر'
                          value={item.price}
                          onChange={e => handleItemChange(idx, 'price', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={6} md={1.5}>
                        <Box>
                          <Typography variant='body2' color='text.secondary'>
                            الإجمالي
                          </Typography>
                          <Typography variant='h6' color='primary'>
                            {formatCurrency(item.qty * item.price)}
                          </Typography>
                        </Box>
                      </Grid>
                      {items.length > 1 && (
                        <Grid item xs={12} md={0.5} className='no-print'>
                          <IconButton color='error' onClick={() => removeItem(idx)}>
                            <i className='tabler-trash' />
                          </IconButton>
                        </Grid>
                      )}
                    </Grid>
                  </div>
                ))}
              </div>

              <Divider className='my-4' />
              <Box className='text-left'>
                <Typography variant='subtitle1'>
                  إجمالي المواد: <strong>{formatCurrency(itemsTotal)}</strong>
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Manufacturing Section */}
          <Card className='mb-6'>
            <CardContent>
              <div className='flex justify-between items-center mb-4'>
                <Typography variant='h6' className='font-semibold'>
                  ⚙️ التصنيع والتشغيل
                </Typography>
                <Button
                  variant='outlined'
                  size='small'
                  onClick={addManufacturing}
                  startIcon={<i className='tabler-plus' />}
                  className='no-print'
                >
                  إضافة خدمة
                </Button>
              </div>

              {manufacturingItems.length === 0 ? (
                <Typography color='text.secondary' className='text-center py-4'>
                  لا توجد خدمات تصنيع مضافة
                </Typography>
              ) : (
                <div className='space-y-4'>
                  {manufacturingItems.map((item, idx) => (
                    <div key={idx} className='border rounded p-4 bg-blue-50 dark:bg-blue-900/20'>
                      <Grid container spacing={2} alignItems='center'>
                        <Grid item xs={12} md={2}>
                          <FormControl fullWidth size='small'>
                            <InputLabel>النوع</InputLabel>
                            <Select
                              value={item.type}
                              label='النوع'
                              onChange={e => {
                                handleManufacturingChange(idx, 'type', e.target.value)

                                // Reset unit when type changes
                                const defaultUnit = manufacturingUnits[e.target.value]?.[0]?.value || 'piece'

                                handleManufacturingChange(idx, 'unit', defaultUnit)
                              }}
                            >
                              {manufacturingTypes.map(t => (
                                <MenuItem key={t.value} value={t.value}>
                                  {t.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <FormControl fullWidth size='small'>
                            <InputLabel>الوحدة</InputLabel>
                            <Select
                              value={item.unit || manufacturingUnits[item.type]?.[0]?.value || 'piece'}
                              label='الوحدة'
                              onChange={e => handleManufacturingChange(idx, 'unit', e.target.value)}
                            >
                              {(manufacturingUnits[item.type] || manufacturingUnits.other).map(u => (
                                <MenuItem key={u.value} value={u.value}>
                                  {u.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={2.5}>
                          <TextField
                            fullWidth
                            size='small'
                            label='الوصف'
                            value={item.description}
                            onChange={e => handleManufacturingChange(idx, 'description', e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={6} md={1.5}>
                          <TextField
                            fullWidth
                            size='small'
                            type='number'
                            label='الكمية'
                            value={item.quantity}
                            onChange={e => handleManufacturingChange(idx, 'quantity', e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={6} md={1.5}>
                          <TextField
                            fullWidth
                            size='small'
                            type='number'
                            label='سعر الوحدة'
                            value={item.unitCost}
                            onChange={e => handleManufacturingChange(idx, 'unitCost', e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={6} md={2}>
                          <Box>
                            <Typography variant='body2' color='text.secondary'>
                              الإجمالي
                            </Typography>
                            <Typography variant='h6' color='primary'>
                              {formatCurrency(item.total)}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} md={0.5} className='no-print'>
                          <IconButton color='error' onClick={() => removeManufacturing(idx)}>
                            <i className='tabler-trash' />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </div>
                  ))}
                </div>
              )}

              {manufacturingItems.length > 0 && (
                <>
                  <Divider className='my-4' />
                  <Box className='text-left'>
                    <Typography variant='subtitle1'>
                      إجمالي التصنيع: <strong>{formatCurrency(manufacturingTotal)}</strong>
                    </Typography>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className='mb-6'>
            <CardContent>
              <Typography variant='h6' className='font-semibold mb-4'>
                📊 الملخص
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                  <TextField
                    fullWidth
                    size='small'
                    label='ملاحظات'
                    multiline
                    rows={3}
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card variant='outlined' className='bg-gradient-to-br from-blue-50 to-blue-100'>
                    <CardContent>
                      <div className='space-y-2'>
                        <div className='flex justify-between'>
                          <Typography>إجمالي المواد:</Typography>
                          <Typography>{formatCurrency(itemsTotal)}</Typography>
                        </div>
                        <div className='flex justify-between'>
                          <Typography>إجمالي التصنيع:</Typography>
                          <Typography>{formatCurrency(manufacturingTotal)}</Typography>
                        </div>
                        <Divider />
                        <div className='flex justify-between'>
                          <Typography variant='h6' className='font-bold'>
                            الإجمالي الكلي:
                          </Typography>
                          <Typography variant='h5' color='primary' className='font-bold'>
                            {formatCurrency(grandTotal)}
                          </Typography>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Print Footer */}
          <div className='print-footer text-center mt-8 print-only'>
            <Divider className='mb-4' />
            <Typography variant='body2' color='text.secondary'>
              {COMPANY_NAME}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {COMPANY_ADDRESS && <>{COMPANY_ADDRESS} | </>}الهاتف: {COMPANY_PHONE || '...'}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              هذه القائمة صالحة حتى: {form.validUntil || 'غير محدد'}
            </Typography>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex justify-end gap-3 mt-6 no-print'>
          <Button variant='outlined' color='secondary' onClick={() => router.push('/price-list')}>
            إلغاء
          </Button>
          <Button type='submit' variant='contained' color='primary' disabled={loading}>
            {loading ? 'جاري الحفظ...' : 'حفظ قائمة الأسعار'}
          </Button>
        </div>
      </form>
    </div>
  )
}
