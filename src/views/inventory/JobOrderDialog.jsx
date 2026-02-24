'use client'

import { useState, useEffect } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import Divider from '@mui/material/Divider'

import DrawingCanvas from '@/components/shared/DrawingCanvas'

export default function JobOrderDialog({ open, onClose, onSubmit, initialData }) {
  const [tab, setTab] = useState('1')
  
  // Job Info
  const [clientName, setClientName] = useState('')
  const [projectCode, setProjectCode] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
  
  // Drawing State
  const [drawing, setDrawing] = useState(null)
  const [openDrawing, setOpenDrawing] = useState(false)

  // Specifications
  const [specs, setSpecs] = useState({
      diameter: '',
      hardness: '',
      totalLength: '',
      threadLength: '',
      bending: 'لا يوجد',
      galvanization: 'اسود',
      quantity: '',
      nutsPerRod: '',
      washersPerRod: ''
  })
  
  // Calculations
  const [calcs, setCalcs] = useState({
      rodsInfo: '', // "عدد الجوايط في العود الواحد"
      rodsRequired: '', // "عدد الأسياخ المطلوبة"
      wasteLength: '',
      requiredWeight: '',
      itemWeight: ''
  })
  
  // Accessories
  const [accessories, setAccessories] = useState({
      nutsCount: '',
      nutsWeight: '',
      washersCount: '',
      washersWeight: ''
  })

  // Issued Materials (From initialData)
  const issuedMaterials = initialData?.items || []
  const totalIssuedWeight = issuedMaterials.reduce((sum, item) => {
      // Parse weight from note if possible, or use some other field
      const match = item.note ? item.note.match(/Weight:\s?([\d.]+)/) : null
      return sum + (match ? parseFloat(match[1]) : 0)
  }, 0)

  // Initialize from existing job order if passing one, or reset
  useEffect(() => {
    if (open) {
        if (initialData?.jobOrder) {
            // Edit mode
            const jo = initialData.jobOrder
            setOrderNumber(jo.orderNumber)
            setClientName(jo.clientName || '')
            setProjectCode(jo.projectCode || '')
            setSpecs(jo.specifications || {})
            setCalcs(jo.calculations || {})
            setAccessories(jo.accessories || {})
            setDrawing(jo.engineeringDrawing || null)
        } else {
            // Create mode
            setOrderNumber(`JO-${Date.now()}`) // Temp ID
            // Reset fields
            setClientName('')
            setSpecs({
                diameter: '', hardness: '52', totalLength: '', threadLength: '',
                bending: 'لا يوجد', galvanization: 'اسود',
                quantity: initialData?.jobCard?.expectedCount || '',
                nutsPerRod: '2', washersPerRod: '1'
            })
             setCalcs({
                rodsInfo: '', rodsRequired: '', wasteLength: '', 
                requiredWeight: initialData?.jobCard?.expectedWeight || '', 
                itemWeight: ''
            })
            setAccessories({ nutsCount: '', nutsWeight: '', washersCount: '', washersWeight: '' })
            setDrawing(null)
        }
    }
  }, [open, initialData])

  const handleSubmit = () => {
      const data = {
          orderNumber,
          clientName,
          projectCode,
          specifications: specs,
          calculations: calcs,
          accessories: accessories,
          engineeringDrawing: drawing,
          transactionIds: issuedMaterials.map(i => i.id)
      }
      onSubmit(data)
  }

  // Helper for text field
  const SpecField = ({ label, field, type='text' }) => (
      <Grid item xs={6} sm={4}>
          <TextField 
              label={label}
              fullWidth 
              size="small"
              type={type}
              value={specs[field]} 
              onChange={e => setSpecs({...specs, [field]: e.target.value})} 
          />
      </Grid>
  )
  const CalcField = ({ label, field, type='text' }) => (
      <Grid item xs={12} sm={6}>
          <TextField 
              label={label}
              fullWidth 
              size="small"
              type={type}
              value={calcs[field]} 
              onChange={e => setCalcs({...calcs, [field]: e.target.value})} 
          />
      </Grid>
  )
   const AccField = ({ label, field, type='number' }) => (
      <Grid item xs={12} sm={6}>
          <TextField 
              label={label}
              fullWidth 
              size="small"
              type={type}
              value={accessories[field]} 
              onChange={e => setAccessories({...accessories, [field]: e.target.value})} 
          />
      </Grid>
  )


  // Print View (HTML based print)
  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>Job Order ${orderNumber}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 14px; }
            th, td { border: 1px solid #333; padding: 6px; text-align: center; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .section-title { background: #f0f0f0; font-weight: bold; padding: 8px; border: 1px solid #333; margin-top: 15px; text-align: right; }
            .logo { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
            .subtitle { font-size: 18px; margin-bottom: 5px; }
            .drawing-container { text-align: center; margin: 20px 0; border: 1px solid #333; padding: 10px; }
            .drawing-img { max-width: 100%; max-height: 400px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">الوطنية للمقاولات العمومية والتوريدات الهندسية (ويسكو)</div>
            <div class="subtitle">أمر تشغيل رقم (${orderNumber})</div>
            <div>التاريخ: ${new Date().toLocaleDateString('ar-EG')}</div>
          </div>
          
          <table style="margin-bottom: 20px;">
             <tr>
                <td style="background:#eee; font-weight:bold; width: 150px;">اسم العميل</td>
                <td>${clientName}</td>
                <td style="background:#eee; font-weight:bold; width: 150px;">كود أمر التوريد</td>
                <td>${projectCode}</td>
             </tr>
          </table>

          <div class="section-title">* المواصفات والشكل الهندسي</div>
          <table>
            <tr><td style="width: 50px;">1</td><td>القطر (مم)</td><td>${specs.diameter}</td></tr>
            <tr><td>2</td><td>الصلابة</td><td>${specs.hardness}</td></tr>
            <tr><td>3</td><td>الطول الإجمالي (م)</td><td>${specs.totalLength}</td></tr>
            <tr><td>4</td><td>طول القلاووظ (سم)</td><td>${specs.threadLength}</td></tr>
            <tr><td>5</td><td>التكسيح</td><td>${specs.bending}</td></tr>
            <tr><td>6</td><td>الجلفنة</td><td>${specs.galvanization}</td></tr>
            <tr><td>7</td><td>الكمية المطلوب تصنيعها</td><td>${specs.quantity}</td></tr>
            <tr><td>8</td><td>عدد الصواميل لكل جاويط</td><td>${specs.nutsPerRod}</td></tr>
            <tr><td>9</td><td>عدد الورد لكل جاويط</td><td>${specs.washersPerRod}</td></tr>
          </table>

          ${drawing ? `
          <div class="section-title">* الرسم الهندسي</div>
          <div class="drawing-container">
             <img src="${drawing}" class="drawing-img" alt="Engineering Drawing" />
          </div>
          ` : ''}

          <div class="section-title">* حساب كمية الخامات المطلوبة</div>
          <table>
             <tr><td>عدد الجوايط في العود الواحد (طول 6 م)</td><td>${calcs.rodsInfo}</td></tr>
             <tr><td>عدد الأسياخ المطلوبة من الخامات (طول 6 م)</td><td>${calcs.rodsRequired}</td></tr>
             <tr><td>طول الفضلة</td><td>${calcs.wasteLength}</td></tr>
             <tr><td>الوزن التقريبي للخامات المطلوبة</td><td>${calcs.requiredWeight}</td></tr>
             <tr><td>نصيب الجاويط الواحد من الوزن الاجمالي</td><td>${calcs.itemWeight}</td></tr>
          </table>

          <div class="section-title">* الاكسسوارات</div>
          <table>
             <tr>
                <td>اجمالي عدد الصواميل</td><td>${accessories.nutsCount}</td>
                <td>اجمالي وزن الصواميل</td><td>${accessories.nutsWeight}</td>
             </tr>
             <tr>
                <td>اجمالي عدد الورد</td><td>${accessories.washersCount}</td>
                <td>اجمالي وزن الورد</td><td>${accessories.washersWeight}</td>
             </tr>
          </table>
          
          <div style="margin-top: 40px; border-top: 1px dashed #ccc; padding-top: 20px;">
            <table style="border: none;">
                <tr style="border: none;">
                    <td style="border: none;"><strong>يعتمد،،</strong></td>
                    <td style="border: none;"><strong>الفني</strong></td>
                    <td style="border: none;"><strong>إعداد</strong></td>
                </tr>
                 <tr style="border: none; height: 50px;">
                    <td style="border: none;"></td>
                    <td style="border: none;"></td>
                    <td style="border: none;"></td>
                </tr>
            </table>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    // Wait for content to load then print
    setTimeout(() => {
        printWindow.print()
    }, 500)
  }

  return (
    <>
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
          أمر تشغيل مفصل
          <Typography variant="caption" display="block">{orderNumber}</Typography>
      </DialogTitle>
      
      <DialogContent dividers>
        <TabContext value={tab}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <TabList onChange={(e, v) => setTab(v)} aria-label="job order tabs">
                    <Tab label="المواصفات" value="1" />
                    <Tab label="الحسابات" value="2" />
                    <Tab label="الاكسسوارات" value="3" />
                </TabList>
            </Box>

            {/* Tab 1: Specs */}
            <TabPanel value="1">
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextField label="اسم العميل" fullWidth value={clientName} onChange={e => setClientName(e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                         <TextField label="كود المشروع / التوريد" fullWidth value={projectCode} onChange={e => setProjectCode(e.target.value)} />
                    </Grid>
                    <Grid item xs={12}><Divider sx={{my:1}} /></Grid>
                    
                    <SpecField label="القطر (مم)" field="diameter" type="number" />
                    <SpecField label="الصلابة" field="hardness" />
                    <SpecField label="الطول الإجمالي (م)" field="totalLength" type="number" />
                    <SpecField label="طول القلاووظ (سم)" field="threadLength" />
                    <SpecField label="التكسيح" field="bending" />
                    <SpecField label="الجلفنة" field="galvanization" />
                    <SpecField label="الكمية" field="quantity" type="number" />
                    <SpecField label="عدد الصواميل / جاويط" field="nutsPerRod" type="number" />
                    <SpecField label="عدد الورد / جاويط" field="washersPerRod" type="number" />
                    
                    <Grid item xs={12}>
                        <Divider sx={{my:2}} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle2" fontWeight={600}>الرسم الهندسي</Typography>
                            <Button variant="outlined" startIcon={<i className="tabler-pencil" />} onClick={() => setOpenDrawing(true)}>
                                {drawing ? 'تعديل الرسم' : 'إضافة رسم'}
                            </Button>
                        </Box>
                        {drawing && (
                            <Box sx={{ mt: 2, border: '1px dashed #ccc', p: 1, display: 'flex', justifyContent: 'center' }}>
                                <img src={drawing} alt="Drawing" style={{ maxWidth: '100%', maxHeight: 200 }} />
                            </Box>
                        )}
                    </Grid>

                </Grid>
            </TabPanel>

            {/* Tab 2: Calculations */}
            <TabPanel value="2">
                 <Grid container spacing={2}>
                     <Grid item xs={12}>
                         <Typography variant="subtitle2" color={parseFloat(calcs.requiredWeight) > totalIssuedWeight ? 'error' : 'success'}>
                             الوزن المصروف فعلياً: {totalIssuedWeight.toFixed(2)} كجم
                             {parseFloat(calcs.requiredWeight) > totalIssuedWeight && 
                                <span style={{display:'block', color:'red'}}>⚠️ تنبيه: الكمية المصروفة أقل من المطلوب!</span>
                             }
                         </Typography>
                     </Grid>
                     <CalcField label="عدد الجوايط في العود (6م)" field="rodsInfo" />
                     <CalcField label="عدد الأسياخ المطلوبة (6م)" field="rodsRequired" />
                     <CalcField label="طول الفضلة" field="wasteLength" />
                     <CalcField label="الوزن التقريبي للخامات المطلوبة" field="requiredWeight" />
                     <CalcField label="نصيب الجاويط الواحد من الوزن" field="itemWeight" />
                 </Grid>
            </TabPanel>

             {/* Tab 3: Accessories */}
            <TabPanel value="3">
                 <Grid container spacing={2}>
                     <AccField label="اجمالي عدد الصواميل" field="nutsCount" />
                     <AccField label="اجمالي وزن الصواميل" field="nutsWeight" />
                     <AccField label="اجمالي عدد الورد" field="washersCount" />
                     <AccField label="اجمالي وزن الورد" field="washersWeight" />
                 </Grid>
            </TabPanel>
        </TabContext>
      </DialogContent>
      
      <DialogActions>
          <Button onClick={onClose}>إغلاق</Button>
          <Button onClick={handlePrint} color="secondary" variant="outlined">طباعة</Button>
          <Button onClick={handleSubmit} variant="contained">حفظ الأمر</Button>
      </DialogActions>
    </Dialog>

    {/* Drawing Dialog */}
    <Dialog open={openDrawing} onClose={() => setOpenDrawing(false)} maxWidth="md">
        <DialogTitle>الرسم الهندسي</DialogTitle>
        <DialogContent>
            <DrawingCanvas 
                initialData={drawing}
                onSave={(dataUrl) => {
                    setDrawing(dataUrl)
                    setOpenDrawing(false)
                }}
                onClose={() => setOpenDrawing(false)}
            />
        </DialogContent>
    </Dialog>
    </>
  )
}
