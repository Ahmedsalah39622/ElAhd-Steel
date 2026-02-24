'use client'

import { useState, useEffect, useRef } from 'react'

import { useRouter } from 'next/navigation'

import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Box,
  TextField,
  Grid,
  MenuItem,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Divider
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import DeleteIcon from '@mui/icons-material/Delete'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import ImageIcon from '@mui/icons-material/Image'
import PersonIcon from '@mui/icons-material/Person'
import FolderIcon from '@mui/icons-material/Folder'

export default function AddProjectPage() {
  const router = useRouter()
  const fileInputRef = useRef(null)

  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [clients, setClients] = useState([])

  const [formData, setFormData] = useState({
    name: '',
    projectNumber: '',
    clientId: '',
    clientName: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
    expectedDeliveryDate: '',
    status: 'pending',
    priority: 'normal',
    totalCost: '',
    totalRevenue: '',
    notes: '',
    attachments: []
  })

  const steps = ['اختر العميل', 'بيانات المشروع', 'المرفقات']

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients', { credentials: 'include' })

      if (res.ok) {
        const data = await res.json()

        setClients(data.data || [])
      }
    } catch (err) {
      console.error('Error fetching clients:', err)
    }
  }

  const handleChange = e => {
    const { name, value } = e.target

    setFormData(prev => ({ ...prev, [name]: value }))

    if (name === 'clientId' && value) {
      const client = clients.find(c => c.id === parseInt(value))

      if (client) {
        setFormData(prev => ({ ...prev, clientId: value, clientName: client.name }))
      }
    }
  }

  const handleFileUpload = async e => {
    const files = e.target.files

    if (!files || files.length === 0) return

    setUploading(true)
    setError('')

    try {
      const uploadFormData = new FormData()

      for (let i = 0; i < files.length; i++) {
        uploadFormData.append('files', files[i])
      }

      const res = await fetch('/api/projects/upload', {
        method: 'POST',
        credentials: 'include',
        body: uploadFormData
      })

      if (!res.ok) throw new Error('Failed to upload files')

      const data = await res.json()

      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...data.files]
      }))
    } catch (err) {
      setError('فشل في رفع الملفات: ' + err.message)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemoveAttachment = index => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }))
  }

  const getFileIcon = type => {
    if (type?.includes('pdf')) return <PictureAsPdfIcon color='error' />
    if (type?.includes('image')) return <ImageIcon color='primary' />

    return <InsertDriveFileIcon color='action' />
  }

  const handleNext = () => {
    if (activeStep === 0 && !formData.clientId) {
      setError('يرجى اختيار العميل أولاً')

      return
    }

    if (activeStep === 1 && !formData.name) {
      setError('يرجى إدخال اسم المشروع')

      return
    }

    setError('')
    setActiveStep(prev => prev + 1)
  }

  const handleBack = () => {
    setError('')
    setActiveStep(prev => prev - 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        const data = await res.json()

        throw new Error(data.message || 'Failed to create project')
      }

      setSuccess('تم إنشاء المشروع بنجاح')
      setTimeout(() => router.push('/projects'), 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const selectedClient = clients.find(c => c.id === parseInt(formData.clientId))

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardHeader
          title='إضافة مشروع جديد'
          action={
            <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/projects')}>
              العودة للقائمة
            </Button>
          }
        />
        <CardContent>
          {error && (
            <Alert severity='error' sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity='success' sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map(label => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Step 1: Select Client */}
          {activeStep === 0 && (
            <Box>
              <Typography variant='h6' gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon /> اختر العميل
              </Typography>
              <TextField
                fullWidth
                select
                label='العميل'
                name='clientId'
                value={formData.clientId}
                onChange={handleChange}
                sx={{ mt: 2 }}
              >
                <MenuItem value=''>-- اختر عميل --</MenuItem>
                {clients.map(client => (
                  <MenuItem key={client.id} value={client.id}>
                    {client.name} {client.phone && `(${client.phone})`}
                  </MenuItem>
                ))}
              </TextField>

              {selectedClient && (
                <Paper sx={{ p: 2, mt: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                  <Typography variant='h6'>{selectedClient.name}</Typography>
                  <Typography variant='body2'>الهاتف: {selectedClient.phone || '-'}</Typography>
                  <Typography variant='body2'>البريد: {selectedClient.email || '-'}</Typography>
                  <Typography variant='body2'>العنوان: {selectedClient.address || '-'}</Typography>
                </Paper>
              )}
            </Box>
          )}

          {/* Step 2: Project Data */}
          {activeStep === 1 && (
            <Box>
              <Typography variant='h6' gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FolderIcon /> بيانات المشروع
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    label='اسم المشروع'
                    name='name'
                    value={formData.name}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label='رقم المشروع'
                    name='projectNumber'
                    value={formData.projectNumber}
                    onChange={handleChange}
                    placeholder='سيتم إنشاؤه تلقائياً'
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label='الموقع'
                    name='location'
                    value={formData.location}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    label='الأولوية'
                    name='priority'
                    value={formData.priority}
                    onChange={handleChange}
                  >
                    <MenuItem value='high'>عالية</MenuItem>
                    <MenuItem value='normal'>عادية</MenuItem>
                    <MenuItem value='low'>منخفضة</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    label='الحالة'
                    name='status'
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <MenuItem value='pending'>معلق</MenuItem>
                    <MenuItem value='in-progress'>قيد التنفيذ</MenuItem>
                    <MenuItem value='completed'>مكتمل</MenuItem>
                    <MenuItem value='cancelled'>ملغي</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type='date'
                    label='تاريخ التسليم المتوقع'
                    name='expectedDeliveryDate'
                    value={formData.expectedDeliveryDate}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label='وصف المشروع'
                    name='description'
                    value={formData.description}
                    onChange={handleChange}
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Step 3: Attachments */}
          {activeStep === 2 && (
            <Box>
              <Typography variant='h6' gutterBottom>
                المرفقات (PDF, CAD, صور)
              </Typography>

              <input
                type='file'
                multiple
                ref={fileInputRef}
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                accept='.pdf,.dwg,.dxf,.png,.jpg,.jpeg,.gif,.doc,.docx,.xls,.xlsx,.zip,.rar'
              />

              <Button
                variant='outlined'
                startIcon={uploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                sx={{ mb: 2 }}
              >
                {uploading ? 'جاري الرفع...' : 'رفع ملفات'}
              </Button>

              {formData.attachments.length > 0 ? (
                <List>
                  {formData.attachments.map((file, index) => (
                    <ListItem key={index} divider>
                      <ListItemIcon>{getFileIcon(file.type)}</ListItemIcon>
                      <ListItemText primary={file.originalName} secondary={`${(file.size / 1024).toFixed(2)} KB`} />
                      <ListItemSecondaryAction>
                        <IconButton edge='end' onClick={() => handleRemoveAttachment(index)} color='error'>
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color='text.secondary' sx={{ mt: 2 }}>
                  لم يتم إضافة مرفقات بعد (اختياري)
                </Typography>
              )}

              <Divider sx={{ my: 3 }} />

              <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
                <Typography variant='subtitle2' gutterBottom>
                  ملخص المشروع
                </Typography>
                <Typography variant='body2'>
                  <strong>العميل:</strong> {formData.clientName}
                </Typography>
                <Typography variant='body2'>
                  <strong>المشروع:</strong> {formData.name}
                </Typography>
                <Typography variant='body2'>
                  <strong>الموقع:</strong> {formData.location || '-'}
                </Typography>
                <Typography variant='body2'>
                  <strong>المرفقات:</strong> {formData.attachments.length} ملف
                </Typography>
              </Paper>
            </Box>
          )}

          {/* Navigation Buttons */}
          <Box display='flex' justifyContent='space-between' mt={4}>
            <Button disabled={activeStep === 0} onClick={handleBack} startIcon={<ArrowForwardIcon />}>
              السابق
            </Button>

            {activeStep < steps.length - 1 ? (
              <Button variant='contained' onClick={handleNext} endIcon={<ArrowBackIcon />}>
                التالي
              </Button>
            ) : (
              <Button
                variant='contained'
                color='success'
                onClick={handleSubmit}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color='inherit' /> : <SaveIcon />}
              >
                {loading ? 'جاري الحفظ...' : 'حفظ المشروع'}
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
