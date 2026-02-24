'use client'

import { useState, useEffect, useRef } from 'react'

import { useParams, useRouter } from 'next/navigation'

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
  Paper
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import DeleteIcon from '@mui/icons-material/Delete'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import ImageIcon from '@mui/icons-material/Image'

export default function EditProjectPage() {
  const params = useParams()
  const router = useRouter()
  const fileInputRef = useRef(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [clients, setClients] = useState([])

  const [formData, setFormData] = useState({
    name: '',
    clientId: '',
    clientName: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
    status: 'completed',
    totalCost: '',
    totalRevenue: '',
    notes: '',
    attachments: []
  })

  useEffect(() => {
    fetchClients()

    if (params.id) {
      fetchProject()
    }
  }, [params.id])

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

  const fetchProject = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/projects/${params.id}`, { credentials: 'include' })

      if (!res.ok) {
        throw new Error('Failed to fetch project')
      }

      const data = await res.json()
      const project = data.data

      setFormData({
        name: project.name || '',
        clientId: project.clientId || '',
        clientName: project.clientName || '',
        description: project.description || '',
        location: project.location || '',
        startDate: project.startDate ? project.startDate.split('T')[0] : '',
        endDate: project.endDate ? project.endDate.split('T')[0] : '',
        status: project.status || 'completed',
        totalCost: project.totalCost || '',
        totalRevenue: project.totalRevenue || '',
        notes: project.notes || '',
        attachments: project.attachments || []
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = e => {
    const { name, value } = e.target

    setFormData(prev => ({ ...prev, [name]: value }))

    // If client is selected, update clientName
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

      if (!res.ok) {
        throw new Error('Failed to upload files')
      }

      const data = await res.json()

      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...data.files]
      }))
    } catch (err) {
      setError('فشل في رفع الملفات: ' + err.message)
    } finally {
      setUploading(false)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
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

  const handleSubmit = async e => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch(`/api/projects/${params.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        const data = await res.json()

        throw new Error(data.message || 'Failed to update project')
      }

      setSuccess('تم تحديث المشروع بنجاح')
      setTimeout(() => router.push(`/projects/${params.id}`), 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='400px'>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardHeader
          title='تعديل المشروع'
          action={
            <Button startIcon={<ArrowBackIcon />} onClick={() => router.push(`/projects/${params.id}`)}>
              العودة للتفاصيل
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

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Project Name */}
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

              {/* Client */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label='العميل'
                  name='clientId'
                  value={formData.clientId}
                  onChange={handleChange}
                >
                  <MenuItem value=''>اختر عميل</MenuItem>
                  {clients.map(client => (
                    <MenuItem key={client.id} value={client.id}>
                      {client.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Location */}
              <Grid item xs={12} md={6}>
                <TextField fullWidth label='الموقع' name='location' value={formData.location} onChange={handleChange} />
              </Grid>

              {/* Status */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label='الحالة'
                  name='status'
                  value={formData.status}
                  onChange={handleChange}
                >
                  <MenuItem value='completed'>مكتمل</MenuItem>
                  <MenuItem value='in-progress'>قيد التنفيذ</MenuItem>
                  <MenuItem value='pending'>معلق</MenuItem>
                  <MenuItem value='cancelled'>ملغي</MenuItem>
                </TextField>
              </Grid>

              {/* Start Date */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type='date'
                  label='تاريخ البدء'
                  name='startDate'
                  value={formData.startDate}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* End Date */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type='date'
                  label='تاريخ الانتهاء'
                  name='endDate'
                  value={formData.endDate}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* Total Cost */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type='number'
                  label='التكلفة الإجمالية'
                  name='totalCost'
                  value={formData.totalCost}
                  onChange={handleChange}
                />
              </Grid>

              {/* Total Revenue */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type='number'
                  label='إجمالي الإيرادات'
                  name='totalRevenue'
                  value={formData.totalRevenue}
                  onChange={handleChange}
                />
              </Grid>

              {/* Description */}
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

              {/* Notes */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label='ملاحظات'
                  name='notes'
                  value={formData.notes}
                  onChange={handleChange}
                />
              </Grid>

              {/* File Attachments */}
              <Grid item xs={12}>
                <Paper variant='outlined' sx={{ p: 2 }}>
                  <Typography variant='h6' gutterBottom>
                    المرفقات (PDF, CAD, صور، ملفات أخرى)
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

                  {formData.attachments.length > 0 && (
                    <List>
                      {formData.attachments.map((file, index) => (
                        <ListItem key={index} divider>
                          <ListItemIcon>{getFileIcon(file.type)}</ListItemIcon>
                          <ListItemText
                            primary={file.originalName}
                            secondary={file.size ? `${(file.size / 1024).toFixed(2)} KB` : ''}
                          />
                          <ListItemSecondaryAction>
                            <IconButton edge='end' onClick={() => handleRemoveAttachment(index)} color='error'>
                              <DeleteIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Paper>
              </Grid>

              {/* Submit Button */}
              <Grid item xs={12}>
                <Box display='flex' justifyContent='flex-end' gap={2}>
                  <Button variant='outlined' onClick={() => router.push(`/projects/${params.id}`)}>
                    إلغاء
                  </Button>
                  <Button
                    type='submit'
                    variant='contained'
                    startIcon={saving ? <CircularProgress size={20} color='inherit' /> : <SaveIcon />}
                    disabled={saving}
                  >
                    {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  )
}
