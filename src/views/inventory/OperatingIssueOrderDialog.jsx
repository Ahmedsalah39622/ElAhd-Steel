'use client'

import { useState, useEffect, useMemo } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Card from '@mui/material/Card'
import Collapse from '@mui/material/Collapse'

/**
 * إذن صادر التشغيل - Operating Issue Order Dialog
 * Shows all raw materials in inventory with count/weight
 * Allows selecting materials and specifying deduction by count or weight
 */
export default function OperatingIssueOrderDialog({ open, onClose, onSubmit, materials = [] }) {
  const [selectedItems, setSelectedItems] = useState([])
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [remnantsByMaterial, setRemnantsByMaterial] = useState({})
  const [selectedRemnantsByMaterial, setSelectedRemnantsByMaterial] = useState({})
  const [expectedName, setExpectedName] = useState('')
  const [expectedType, setExpectedType] = useState('')
  const [expectedCount, setExpectedCount] = useState('')
  const [expectedWeight, setExpectedWeight] = useState('')

  // Helper function to calculate expected weight based on dimensions
  // Note: Requires density field in material (if not available, returns null)
  const getExpectedWeight = (materialId, length, width) => {
    const material = materials.find(m => m.id === materialId)
    if (!material || !length || !width) return null

    const l = Number(length)
    const w = Number(width)
    const thickness = Number(material.thickness || 0)

    // Without density, we can't calculate weight
    // Just return dimensions-based area estimate if thickness available
    if (l > 0 && w > 0 && thickness > 0) {
      // Return area × thickness as a rough estimate
      const volumeCm3 = l * w * thickness
      return `~${(volumeCm3 / 1000).toFixed(2)}`
    }

    return null
  }

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedItems([])
      setDescription('')
      setRemnantsByMaterial({})
      setSelectedRemnantsByMaterial({})
      setExpectedName('')
      setExpectedType('')
      setExpectedCount('')
      setExpectedWeight('')
    }
  }, [open])

  // Toggle material selection
  const handleToggle = material => {
    setSelectedItems(prev => {
      const exists = prev.find(item => item.id === material.id)
      if (exists) {
        return prev.filter(item => item.id !== material.id)
      } else {
        return [
          ...prev,
          {
            id: material.id,
            name: material.name,
            currentCount: Number(material.count || 0),
            currentWeight: Number(material.weight || 0),
            deductMode: 'count',
            deductCount: 1,
            deductWeight: '',
            length: '',
            width: '',
            dimensionType: material.dimensionType || 'rectangular'
          }
        ]
      }
    })
  }

  // Update deduction value for selected item
  const handleDeductChange = (materialId, field, value) => {
    setSelectedItems(prev =>
      prev.map(item => {
        if (item.id === materialId) {
          return { ...item, [field]: value }
        }
        return item
      })
    )
  }

  // Fetch remnants when dimensions are entered
  const dimensionsKey = useMemo(
    () => selectedItems.map(i => `${i.id}-${i.length || ''}-${i.width || ''}`).join(','),
    [selectedItems]
  )

  useEffect(() => {
    if (selectedItems.length === 0) {
      setRemnantsByMaterial({})
      return
    }

    const fetchRemnants = async () => {
      for (const item of selectedItems) {
        if (item.length && item.width && Number(item.length) > 0 && Number(item.width) > 0) {
          try {
            // Only fetch AVAILABLE pieces (not reserved or used)
            const res = await fetch(`/api/material-pieces?materialId=${item.id}&status=available`, {
              credentials: 'include'
            })
            if (!res.ok) {
              console.warn('Failed to fetch pieces:', res.status)
              setRemnantsByMaterial(prev => ({ ...prev, [item.id]: [] }))
              continue
            }
            const json = await res.json()
            const list = Array.isArray(json) ? json : []
            const compatible = list.filter(p => {
              const pL = Number(p.length)
              const pW = Number(p.width)
              const reqL = Number(item.length)
              const reqW = Number(item.width)
              const fitsNormal = pL >= reqL && pW >= reqW
              const fitsRotated = pL >= reqW && pW >= reqL
              return fitsNormal || fitsRotated
            })
            compatible.sort((a, b) => a.length * a.width - b.length * b.width)
            setRemnantsByMaterial(prev => ({ ...prev, [item.id]: compatible }))
          } catch (err) {
            console.error('Failed to fetch remnants for material', item.id, err)
            setRemnantsByMaterial(prev => ({ ...prev, [item.id]: [] }))
          }
        } else {
          // Clear remnants if dimensions are removed
          setRemnantsByMaterial(prev => {
            const newState = { ...prev }
            delete newState[item.id]
            return newState
          })
        }
      }
    }

    const timer = setTimeout(fetchRemnants, 300)
    return () => clearTimeout(timer)
  }, [dimensionsKey])

  // Toggle remnant selection
  const toggleRemnantSelection = (materialId, remnantId) => {
    setSelectedRemnantsByMaterial(prev => {
      const current = prev[materialId] || []
      const exists = current.includes(remnantId)
      if (exists) {
        return { ...prev, [materialId]: current.filter(id => id !== remnantId) }
      } else {
        return { ...prev, [materialId]: [...current, remnantId] }
      }
    })
  }

  const handleSubmit = async () => {
    if (!description.trim()) {
      alert('الوصف مطلوب')
      return
    }
    if (selectedItems.length === 0) {
      alert('اختر مادة واحدة على الأقل')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        description,
        expectedName: expectedName || '',
        expectedType: expectedType || '',
        expectedCount: expectedCount ? Number(expectedCount) : null,
        expectedWeight: expectedWeight ? Number(expectedWeight) : null,
        items: selectedItems.map(item => {
          const cleanLength =
            item.length && item.length !== '' && !isNaN(Number(item.length)) ? Number(item.length) : null
          const cleanWidth = item.width && item.width !== '' && !isNaN(Number(item.width)) ? Number(item.width) : null

          return {
            materialId: Number(item.id),
            name: item.name,
            mode: item.deductMode || 'count',
            countToDeduct: item.deductMode === 'count' ? Number(item.deductCount) || 1 : null,
            weightToDeduct: item.deductMode === 'weight' ? Number(item.deductWeight) || null : null,
            length: cleanLength,
            width: cleanWidth,
            selectedRemnantIds: selectedRemnantsByMaterial[item.id] || []
          }
        })
      })
      onClose()
    } catch (err) {
      alert(err.message || 'فشل في إنشاء الإذن')
    } finally {
      setSubmitting(false)
    }
  }

  // Show all materials from factory (don't filter by count/weight)
  const filteredMaterials = materials

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='lg'
      fullWidth
      PaperProps={{
        sx: { bgcolor: 'background.paper', backgroundImage: 'none' }
      }}
    >
      <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant='h6' component='span' fontWeight={700}>
          إذن صادر تشغيل
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          اختر المواد الخام المطلوبة للتصنيع وحدد الكمية
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 3, minHeight: 400 }}>
        {/* Description Field */}
        <TextField
          fullWidth
          label='وصف إذن التشغيل'
          placeholder='مثال: إنتاج دفعة مسامير 50 قطعة للعميل X'
          value={description}
          onChange={e => setDescription(e.target.value)}
          sx={{ mb: 3 }}
          multiline
          rows={2}
        />

        {/* Job Card - Expected Product Details */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'action.hover' }}>
          <Typography variant='subtitle2' gutterBottom sx={{ mb: 2 }}>
            بيانات المنتج المتوقع
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='اسم المنتج المتوقع'
                placeholder='مثال: مسامير 10 ملم'
                value={expectedName}
                onChange={e => setExpectedName(e.target.value)}
                size='small'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='نوع المنتج المتوقع'
                placeholder='مثال: مسامير'
                value={expectedType}
                onChange={e => setExpectedType(e.target.value)}
                size='small'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='العدد المتوقع'
                type='number'
                placeholder='عدد القطع المتوقع إنتاجها'
                value={expectedCount}
                onChange={e => setExpectedCount(e.target.value)}
                size='small'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='الوزن المتوقع (كجم)'
                type='number'
                placeholder='الوزن المتوقع للإنتاج'
                value={expectedWeight}
                onChange={e => setExpectedWeight(e.target.value)}
                size='small'
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Materials Table - Grouped by Type */}
        {filteredMaterials.length === 0 ? (
          <Alert severity='info'>لا توجد مواد خام متاحة (بعدد أو وزن)</Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              {
                key: 'raw',
                label: 'المواد الخام',
                items: filteredMaterials.filter(m =>
                  ['factory', 'material'].includes((m.type || m.materialType || '').toLowerCase())
                )
              },
              {
                key: 'accessory',
                label: 'الإكسسوارات',
                items: filteredMaterials.filter(m => (m.type || m.materialType || '').toLowerCase() === 'accessory')
              },
              {
                key: 'product',
                label: 'منتجات لإعادة التصنيع',
                items: filteredMaterials.filter(m => (m.type || m.materialType || '').toLowerCase() === 'product')
              }
            ].map(group => {
              if (group.items.length === 0) return null
              return (
                <Box key={group.key}>
                  <Typography
                    variant='subtitle1'
                    color='primary.main'
                    fontWeight='bold'
                    sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    {group.key === 'raw' && <i className='tabler-box' />}
                    {group.key === 'accessory' && <i className='tabler-tool' />}
                    {group.key === 'product' && <i className='tabler-package' />}
                    {group.label} ({group.items.length})
                  </Typography>
                  <TableContainer component={Paper} variant='outlined' sx={{ bgcolor: 'background.default' }}>
                    <Table size='small'>
                      <TableHead>
                        <TableRow>
                          <TableCell padding='checkbox'></TableCell>
                          <TableCell>المادة</TableCell>
                          <TableCell align='center'>العدد الحالي</TableCell>
                          <TableCell align='center'>الوزن الحالي (كجم)</TableCell>
                          <TableCell align='center'>نوع الخصم</TableCell>
                          <TableCell align='center'>الكمية المطلوبة</TableCell>
                          <TableCell align='center'>الأبعاد المطلوبة</TableCell>
                          <TableCell align='center'>الوزن المتوقع (كجم)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {group.items.map(material => {
                          const selected = selectedItems.find(item => item.id === material.id)
                          return (
                            <TableRow
                              key={material.id}
                              onClick={() => handleToggle(material)}
                              sx={{
                                cursor: 'pointer',
                                bgcolor: selected ? 'action.selected' : 'inherit',
                                '&:hover': { bgcolor: 'action.hover' }
                              }}
                            >
                              <TableCell padding='checkbox'>
                                <Checkbox checked={!!selected} />
                              </TableCell>
                              <TableCell>
                                <Typography fontWeight={500}>{material.name}</Typography>
                                <Typography variant='caption' color='text.secondary'>
                                  {material.sku}
                                </Typography>
                              </TableCell>
                              <TableCell align='center'>
                                <Chip
                                  label={Number(material.count || 0).toLocaleString()}
                                  size='small'
                                  color='primary'
                                  variant='outlined'
                                />
                              </TableCell>
                              <TableCell align='center'>
                                <Chip
                                  label={`${Number(material.weight || 0).toFixed(2)} كجم`}
                                  size='small'
                                  color='secondary'
                                  variant='outlined'
                                />
                              </TableCell>
                              <TableCell align='center' onClick={e => e.stopPropagation()}>
                                {selected && (
                                  <TextField
                                    select
                                    size='small'
                                    value={selected.deductMode || 'count'}
                                    onChange={e => handleDeductChange(material.id, 'deductMode', e.target.value)}
                                    sx={{ width: 100 }}
                                    SelectProps={{ native: true }}
                                  >
                                    <option value='count'>بالعدد</option>
                                    <option value='weight'>بالوزن</option>
                                  </TextField>
                                )}
                              </TableCell>
                              <TableCell align='center' onClick={e => e.stopPropagation()}>
                                {selected && (
                                  <TextField
                                    type='number'
                                    size='small'
                                    placeholder={selected.deductMode === 'count' ? 'العدد' : 'الوزن (كجم)'}
                                    value={
                                      selected.deductMode === 'count' ? selected.deductCount : selected.deductWeight
                                    }
                                    onChange={e =>
                                      handleDeductChange(
                                        material.id,
                                        selected.deductMode === 'count' ? 'deductCount' : 'deductWeight',
                                        e.target.value
                                      )
                                    }
                                    sx={{ width: 100 }}
                                    inputProps={{ min: 0, step: selected.deductMode === 'weight' ? '0.01' : '1' }}
                                  />
                                )}
                              </TableCell>
                              <TableCell align='center' onClick={e => e.stopPropagation()}>
                                {selected && (
                                  <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column', alignItems: 'center' }}>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                      <TextField
                                        type='number'
                                        size='small'
                                        placeholder='الطول'
                                        value={selected.length}
                                        onChange={e => handleDeductChange(material.id, 'length', e.target.value)}
                                        sx={{ width: 80 }}
                                        inputProps={{ min: 0 }}
                                      />
                                      <TextField
                                        type='number'
                                        size='small'
                                        placeholder={selected.dimensionType === 'circular' ? 'القطر' : 'العرض'}
                                        value={selected.width}
                                        onChange={e => handleDeductChange(material.id, 'width', e.target.value)}
                                        sx={{ width: 80 }}
                                        inputProps={{ min: 0 }}
                                      />
                                    </Box>
                                    {remnantsByMaterial[material.id]?.length > 0 && (
                                      <Card
                                        variant='outlined'
                                        sx={{ p: 1, bgcolor: 'action.hover', width: '100%', maxWidth: 200 }}
                                      >
                                        <Typography
                                          variant='caption'
                                          fontWeight='bold'
                                          color='primary'
                                          display='flex'
                                          alignItems='center'
                                          gap={0.5}
                                          sx={{ mb: 0.5 }}
                                        >
                                          <i className='tabler-bulb' style={{ fontSize: 12 }} />
                                          بواقي متاحة ({remnantsByMaterial[material.id].length})
                                        </Typography>
                                        <Box
                                          sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 0.5,
                                            maxHeight: 100,
                                            overflowY: 'auto'
                                          }}
                                        >
                                          {remnantsByMaterial[material.id].map(rem => (
                                            <Box
                                              key={rem.id}
                                              onClick={() => toggleRemnantSelection(material.id, rem.id)}
                                              sx={{
                                                p: 0.5,
                                                border: 1,
                                                borderRadius: 1,
                                                cursor: 'pointer',
                                                fontSize: '0.7rem',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                bgcolor: selectedRemnantsByMaterial[material.id]?.includes(rem.id)
                                                  ? 'primary.main'
                                                  : 'background.paper',
                                                color: selectedRemnantsByMaterial[material.id]?.includes(rem.id)
                                                  ? 'primary.contrastText'
                                                  : 'text.primary',
                                                borderColor: selectedRemnantsByMaterial[material.id]?.includes(rem.id)
                                                  ? 'primary.main'
                                                  : 'divider',
                                                '&:hover': {
                                                  bgcolor: selectedRemnantsByMaterial[material.id]?.includes(rem.id)
                                                    ? 'primary.dark'
                                                    : 'action.hover'
                                                }
                                              }}
                                            >
                                              <span>
                                                #{rem.id} | {Number(rem.length)}×{Number(rem.width)}
                                              </span>
                                            </Box>
                                          ))}
                                        </Box>
                                        {selectedRemnantsByMaterial[material.id]?.length > 0 && (
                                          <Typography
                                            variant='caption'
                                            sx={{
                                              display: 'block',
                                              mt: 0.5,
                                              color: 'success.dark',
                                              fontWeight: 'bold',
                                              fontSize: '0.65rem'
                                            }}
                                          >
                                            ✅ {selectedRemnantsByMaterial[material.id].length} قطعة مختارة
                                          </Typography>
                                        )}
                                      </Card>
                                    )}
                                  </Box>
                                )}
                              </TableCell>
                              <TableCell align='center'>
                                {selected && selected.length && selected.width && (
                                  <Chip
                                    label={`${getExpectedWeight(material.id, selected.length, selected.width) || 'N/A'} كجم`}
                                    size='small'
                                    color='info'
                                    variant='outlined'
                                  />
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )
            })}
          </Box>
        )}

        {/* Selected Items Summary */}
        {selectedItems.length > 0 && (
          <Alert severity='success' sx={{ mt: 2 }}>
            تم اختيار {selectedItems.length} مادة للتشغيل
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={onClose} disabled={submitting}>
          إلغاء
        </Button>
        <Button
          variant='contained'
          onClick={handleSubmit}
          disabled={submitting || selectedItems.length === 0}
          startIcon={submitting && <CircularProgress size={16} />}
        >
          {submitting ? 'جاري الإنشاء...' : 'إنشاء إذن التشغيل'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
