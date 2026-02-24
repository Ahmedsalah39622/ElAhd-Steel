'use client'

import { useEffect, useState } from 'react'

import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'

export default function MissingPiecesPanel({ className, refreshTrigger = 0 }) {
  const [pieces, setPieces] = useState([])
  const [loading, setLoading] = useState(false)
  const [lastError, setLastError] = useState(null)
  const [filter, setFilter] = useState({
    q: '',
    materialId: '',
    minLength: '',
    maxLength: '',
    minWidth: '',
    maxWidth: '',
    isLeftover: '',
    status: ''
  })
  const [cutDialogOpen, setCutDialogOpen] = useState(false)
  const [selectedPiece, setSelectedPiece] = useState(null)
  const [cutLength, setCutLength] = useState('')
  const [cutWidth, setCutWidth] = useState('')
  const [cutQty, setCutQty] = useState(1)
  const [cutMode, setCutMode] = useState('cut') // 'cut' or 'leftover'
  const [cutResult, setCutResult] = useState(null)
  const [clients, setClients] = useState([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [materialsMap, setMaterialsMap] = useState({})
  const [materialsList, setMaterialsList] = useState([])
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewPiece, setViewPiece] = useState(null)
  const [permitDialogOpen, setPermitDialogOpen] = useState(false)
  const [permitPiece, setPermitPiece] = useState(null)
  const [permitQty, setPermitQty] = useState(1)
  const [permitNote, setPermitNote] = useState('')
  // Dialog-level selected material when opened from toolbar (no specific piece)
  const [dialogMaterialId, setDialogMaterialId] = useState(null)

  // Subcomponent for viewing piece details (fetches siblings left from same parent)
  function ViewPieceDetails({ piece, materialsMap }) {
    const [siblings, setSiblings] = useState([])
    useEffect(() => {
      let mounted = true
      ;(async () => {
        try {
          if (!piece) return
          const parentId = piece.parentPieceId || null
          if (parentId) {
            const res = await fetch('/api/material-pieces?parentPieceId=' + encodeURIComponent(parentId), { credentials: 'include' })
            if (!mounted) return
            const j = res.ok ? await res.json() : []
            setSiblings(Array.isArray(j) ? j.filter(p => p && p.id !== piece.id) : [])
          } else {
            setSiblings([])
          }
        } catch (e) {
          console.error('Failed to fetch siblings', e)
        }
      })()
      return () => (mounted = false)
    }, [piece])

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div>المادة: {materialsMap[String(piece.materialId)] || piece.materialId}</div>
        <div>الطول: {piece.length ?? '-'}</div>
        <div>العرض: {piece.width ?? '-'}</div>
        <div>الكمية: {piece.quantity ?? 1}</div>
        <div>العميل: {(piece.client && (typeof piece.client === 'string' ? piece.client : piece.client.name)) || '-'}</div>

        {piece.parentPieceId ? (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontWeight: 600 }}>البقايا المتبقية من القطعة الأساسية #{piece.parentPieceId}:</div>
            {siblings.length === 0 ? (
              <div>لا توجد بقايا متبقية</div>
            ) : (
              <ul>
                {siblings.map(s => (
                  <li key={s.id}>#{s.id} — {s.length} × {s.width} — {s.status === 'available' ? 'متاح' : s.status}</li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>
    )
  }

  useEffect(() => {
    fetchPieces()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger])

  useEffect(() => {
    let mounted = true

    ;(async () => {
      try {
        const res = await fetch('/api/clients', { credentials: 'include' })

        if (!mounted) return
        const j = res.ok ? await res.json() : null

        if (j && Array.isArray(j.data)) setClients(j.data)
      } catch (e) {
        console.error('Failed to load clients', e)
      }
    })()

    return () => (mounted = false)
  }, [])

  // fetch materials map and list for display / dialog
  useEffect(() => {
    let mounted = true

    ;(async () => {
      try {
        const res = await fetch('/api/inventory', { credentials: 'include' })
        if (!mounted) return
        const json = res.ok ? await res.json() : null
        const arr = Array.isArray(json) ? json : []
        const mmap = {}
        arr.forEach(m => {
          if (!m) return
          mmap[String(m.id)] = m.name || m.materialName || String(m.id)
        })
        if (mounted) {
          setMaterialsMap(mmap)
          // Only show materials belonging to the factory (or with no explicit type)
          const factoryOnly = arr.filter(m => m && (m.type === 'factory' || m.materialType === 'factory' || (!m.type && !m.materialType)))
          setMaterialsList(factoryOnly)
        }
      } catch (e) {
        console.error('Failed to load materials', e)
      }
    })()

    return () => (mounted = false)
  }, [])

  async function fetchPieces() {
    setLoading(true)

    try {
      const params = new URLSearchParams()

      if (filter.q) params.set('q', filter.q)
      if (filter.materialId) params.set('materialId', filter.materialId)
      if (filter.minLength) params.set('minLength', filter.minLength)
      if (filter.maxLength) params.set('maxLength', filter.maxLength)
      if (filter.minWidth) params.set('minWidth', filter.minWidth)
      if (filter.maxWidth) params.set('maxWidth', filter.maxWidth)
      if (filter.isLeftover !== '') params.set('isLeftover', filter.isLeftover)
      if (filter.status) params.set('status', filter.status)

      const url = '/api/material-pieces' + (params.toString() ? '?' + params.toString() : '')
      const res = await fetch(url, { credentials: 'include' })
      const txt = await res.text()

      if (!res.ok) {
        setLastError(`Status ${res.status}: ${txt}`)
        setPieces([])

        return
      }

      let data

      try {
        data = JSON.parse(txt)
      } catch (e) {
        data = txt
      }

      setLastError(null)
      setPieces(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to fetch pieces', err)
      setLastError(err.message || String(err))
      setPieces([])
    } finally {
      setLoading(false)
    }
  }

  async function handleDeletePiece(id) {
    if (!confirm('هل تريد سحب هذه القطعة؟')) return

    try {
      const qs = new URLSearchParams({ id })

      if (selectedClientId) qs.set('clientId', selectedClientId)
      const res = await fetch('/api/material-pieces?' + qs.toString(), { method: 'DELETE', credentials: 'include' })

      if (!res.ok) {
        const text = await res.text()

        if (text && text.includes('negative stock')) {
          if (confirm('هذه العملية ستؤدي إلى رصيد سالب. هل تريد المتابعة بالسماح بالرصيد السالب؟')) {
            qs.set('allowNegative', 'true')
            const r2 = await fetch('/api/material-pieces?' + qs.toString(), {
              method: 'DELETE',
              credentials: 'include'
            })

            if (!r2.ok) throw new Error(await r2.text())
          } else {
            throw new Error(text)
          }
        } else {
          throw new Error(text)
        }
      }

      await fetchPieces()
    } catch (err) {
      alert(err.message || 'فشل السحب')
    }
  }

  function openCutDialog(piece) {
    setSelectedPiece(piece)
    setDialogMaterialId(piece ? piece.materialId : null)
    setCutLength('')
    setCutWidth('')
    setCutQty(1)
    setCutDialogOpen(true)
  }

  async function submitCut() {
    // when opened from toolbar selectedPiece may be null; use dialogMaterialId
    const materialId = selectedPiece ? selectedPiece.materialId : dialogMaterialId
    if (!materialId) return alert('اختر مادة أولاً')
    if (!cutLength || !cutWidth) return alert('الطول والعرض مطلوبان')

    try {
      if (cutMode === 'leftover') {
        const body = {
          type: 'create-leftover',
          materialId,
          length: Number(cutLength),
          width: Number(cutWidth),
          qty: Number(cutQty),
          client: selectedClientId || null,
          userNote: permitNote || ''
        }

        if (selectedPiece) body.parentPieceId = selectedPiece.parentPieceId || selectedPiece.id

        const res = await fetch('/api/material-pieces', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })

        if (!res.ok) throw new Error(await res.text())

        const j = await res.json()
        setCutResult({ mode: 'leftover', created: j.created || j.created || [] })
        await fetchPieces()
        setCutDialogOpen(false)
        return
      }

      // cut mode: perform server-side cut which may decrement stock and return leftovers
      const body = {
        type: 'cut',
        materialId,
        length: Number(cutLength),
        width: Number(cutWidth),
        qty: Number(cutQty),
        client: selectedClientId || null
      }

      const res = await fetch('/api/material-pieces', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!res.ok) {
        const text = await res.text()

        if (text && text.includes('نفذ المخزون')) {
          if (confirm('المخزون نفد. هل تريد المتابعة مع السماح بالرصيد السالب؟')) {
            body.allowNegative = true
            const r2 = await fetch('/api/material-pieces', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
            })

            if (!r2.ok) throw new Error(await r2.text())
            const j2 = await r2.json()
            setCutResult({ mode: 'cut', results: j2.results || [] })
            await fetchPieces()
            setCutDialogOpen(false)
            return
          } else {
            throw new Error(text)
          }
        }

        if (text && text.includes('negative stock')) {
          if (confirm('هذه العملية ستؤدي إلى رصيد سالب. هل تريد المتابعة بالسماح بالرصيد السالب؟')) {
            body.allowNegative = true
            const r2 = await fetch('/api/material-pieces', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
            })

            if (!r2.ok) throw new Error(await r2.text())
            const j2 = await r2.json()
            setCutResult({ mode: 'cut', results: j2.results || [] })
            await fetchPieces()
            setCutDialogOpen(false)
            return
          } else {
            throw new Error(text)
          }
        }

        throw new Error(text)
      }

      const j = await res.json()
      setCutResult({ mode: 'cut', results: j.results || [] })
      await fetchPieces()
      setCutDialogOpen(false)
    } catch (err) {
      alert(err.message || 'فشل في عملية القص')
    }
  }

  const onFilterChange = (k, v) => setFilter(prev => ({ ...prev, [k]: v }))

  // Only show available or reserved pieces in the UI (exclude used)
  const visiblePieces = (pieces || []).filter(p => p && (p.status === 'available' || p.status === 'reserved'))

  return (
    <div className={className} style={{ marginTop: 20 }}>

      <h2 className='text-lg font-semibold mb-2'>القطع الباقية</h2>
      <div style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
        <Button size='small' variant='outlined' onClick={() => { setFilter(prev => ({ ...prev, isLeftover: 'true' })); setTimeout(fetchPieces, 0) }}>
          عرض البقايا فقط
        </Button>
        <Button size='small' variant='text' onClick={() => { setFilter({ q: '', materialId: '', minLength: '', maxLength: '', minWidth: '', maxWidth: '', isLeftover: '', status: '' }); setTimeout(fetchPieces, 0) }}>
          إظهار الكل
        </Button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <TextField
          size='small'
          label='بحث (معرّف أو مادة)'
          value={filter.q}
          onChange={e => onFilterChange('q', e.target.value)}
        />
        <TextField
          size='small'
          label='معرّف المادة'
          value={filter.materialId}
          onChange={e => onFilterChange('materialId', e.target.value)}
        />
        <TextField
          size='small'
          label='طول أدنى'
          type='number'
          value={filter.minLength}
          onChange={e => onFilterChange('minLength', e.target.value)}
        />
        <TextField
          size='small'
          label='طول أقصى'
          type='number'
          value={filter.maxLength}
          onChange={e => onFilterChange('maxLength', e.target.value)}
        />
        <TextField
          size='small'
          label='عرض أدنى'
          type='number'
          value={filter.minWidth}
          onChange={e => onFilterChange('minWidth', e.target.value)}
        />
        <TextField
          size='small'
          label='عرض أقصى'
          type='number'
          value={filter.maxWidth}
          onChange={e => onFilterChange('maxWidth', e.target.value)}
        />
        <TextField
          size='small'
          select
          SelectProps={{ native: true }}
          label='بقايا؟'
          value={filter.isLeftover}
          onChange={e => onFilterChange('isLeftover', e.target.value)}
        >
          <option value=''>الكل</option>
          <option value='true'>نعم</option>
          <option value='false'>لا</option>
        </TextField>
        <TextField
          size='small'
          select
          SelectProps={{ native: true }}
          label='الحالة'
          value={filter.status}
          onChange={e => onFilterChange('status', e.target.value)}
        >
          <option value=''>الكل</option>
          <option value='available'>available</option>
          <option value='used'>used</option>
          <option value='reserved'>reserved</option>
        </TextField>
        <Button variant='outlined' onClick={fetchPieces}>
          تصفية
        </Button>
        <Button
          variant='contained'
          onClick={() => {
            setFilter({
              q: '',
              materialId: '',
              minLength: '',
              maxLength: '',
              minWidth: '',
              maxWidth: '',
              isLeftover: '',
              status: ''
            })
            setTimeout(fetchPieces, 0)
          }}
        >
          إعادة تعيين
        </Button>

        {/* Toolbar actions that apply globally (not per-row) */}
        <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
          <Button
            size='small'
            variant='outlined'
            onClick={() => {
              // Open global 'add leftover' dialog; allow selecting material
              setSelectedPiece(null)
              setDialogMaterialId(filter.materialId || (materialsList[0] && materialsList[0].id) || null)
              setCutMode('leftover')
              setCutLength('')
              setCutWidth('')
              setCutQty(1)
              setCutDialogOpen(true)
            }}
          >
            أضف كبقايا
          </Button>

          <Button
            size='small'
            variant='outlined'
            onClick={() => {
              // Open global 'cut from material' dialog; user must pick material
              setSelectedPiece(null)
              setDialogMaterialId(filter.materialId || (materialsList[0] && materialsList[0].id) || null)
              setCutMode('cut')
              setCutLength('')
              setCutWidth('')
              setCutQty(1)
              setCutDialogOpen(true)
            }}
          >
            قص من المادة
          </Button>

          <Button
            size='small'
            variant='outlined'
            onClick={async () => {
              if (!confirm('هل تريد إصلاح سجلات البقايا (تحويل القطع المرتبطة إلى بقايا متاحة)؟')) return
              try {
                const res = await fetch('/api/material-pieces', {
                  method: 'POST',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ type: 'fix-leftovers' })
                })
                if (!res.ok) throw new Error(await res.text())
                const j = await res.json()
                alert('تم الإصلاح: ' + JSON.stringify(j.result || j))
                await fetchPieces()
              } catch (e) {
                alert('فشل إصلاح البقايا: ' + (e.message || String(e)))
              }
            }}
          >
            إصلاح البقايا
          </Button>
        </div>
      </div>

      {loading ? (
        <div>جاري التحميل...</div>
      ) : (
        <div style={{ overflow: 'auto' }}>
          <div style={{ marginBottom: 8 }}>
            {lastError ? (
              <div style={{ color: 'salmon' }}>خطأ: {lastError}</div>
            ) : (
              <div>عدد النتائج: {visiblePieces.length}</div>
            )}
          </div>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>معرّف</TableCell>
                <TableCell>معرّف المادة</TableCell>
                <TableCell>الطول</TableCell>
                <TableCell>العرض</TableCell>
                <TableCell>الكمية</TableCell>
                <TableCell>بقايا</TableCell>
                <TableCell>الحالة</TableCell>
                <TableCell>العميل</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visiblePieces.map(p => (
                <TableRow key={p.id}>
                  <TableCell>{p.id}</TableCell>
                  <TableCell>{materialsMap[String(p.materialId)] || p.materialId}</TableCell>
                  <TableCell>{p.length ?? '-'}</TableCell>
                  <TableCell>{p.width ?? '-'}</TableCell>
                  <TableCell>{p.quantity}</TableCell>
                  <TableCell>{p.isLeftover ? 'نعم' : 'لا'}</TableCell>
                  <TableCell>
                    {p.status === 'available'
                      ? 'متاح'
                      : p.status === 'used'
                        ? 'مستخدم'
                        : p.status === 'reserved'
                          ? 'محجوز'
                          : p.status || '-'}
                  </TableCell>
                  <TableCell>
                    {p.clientName || (p.client && p.client.name) || '-'}
                  </TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <Button size='small' variant='outlined' onClick={() => { setViewPiece(p); setViewDialogOpen(true) }}>
                        عرض
                      </Button>
                      <Button size='small' variant='outlined' onClick={() => { setPermitPiece(p); setPermitQty(Number(p.quantity || 1)); setPermitNote(''); setPermitDialogOpen(true) }}>
                        أذن صرف
                      </Button>
                      {p.status === 'available' && (
                        <Button size='small' variant='contained' color='error' onClick={() => handleDeletePiece(p.id)}>
                          سحب
                        </Button>
                      )}


                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Dialog open={cutDialogOpen} onClose={() => setCutDialogOpen(false)}>
        <DialogTitle>قص / سحب قطعة</DialogTitle>
        <DialogContent>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <TextField select size='small' SelectProps={{ native: true }} label='الوضع' value={cutMode} onChange={e => setCutMode(e.target.value)}>
              <option value='cut'>قص (استهلاك من المخزون إذا لم توجد بقايا)</option>
              <option value='leftover'>بقايا (أضف كقطعة بقايا، لا تخصم من المخزون)</option>
            </TextField>

            <TextField
              label='الطول المطلوب'
              type='number'
              size='small'
              value={cutLength}
              onChange={e => setCutLength(e.target.value)}
            />
            <TextField
              label='العرض المطلوب'
              type='number'
              size='small'
              value={cutWidth}
              onChange={e => setCutWidth(e.target.value)}
            />
            <TextField
              label='الكمية'
              type='number'
              size='small'
              value={cutQty}
              onChange={e => setCutQty(e.target.value)}
            />
          </div>
          <div style={{ marginTop: 8 }}>
            <div>المادة: {selectedPiece ? (materialsMap[String(selectedPiece.materialId)] || selectedPiece.materialId) : (dialogMaterialId ? (materialsMap[String(dialogMaterialId)] || dialogMaterialId) : '-')}</div>
            <div>القطعة: {selectedPiece ? selectedPiece.id : '-'}</div>
          </div>

          {!selectedPiece && (
            <div style={{ marginTop: 8 }}>
              <TextField
                select
                SelectProps={{ native: true }}
                label='المادة'
                size='small'
                value={dialogMaterialId || ''}
                onChange={e => setDialogMaterialId(e.target.value)}
              >
                <option value=''>اختر مادة...</option>
                {materialsList.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name || m.materialName || m.id} — الرصيد: {Number(m.stock || 0)}
                  </option>
                ))}
              </TextField>
            </div>
          )}

          <div style={{ marginTop: 8 }}>
            <TextField label='ملاحظة' size='small' value={permitNote} onChange={e => setPermitNote(e.target.value)} fullWidth />
            <div style={{ marginTop: 8, color: 'var(--mui-palette-text-secondary)' }}>
              ملاحظة: عند اختيار "بقايا" لن يتغير رصيد المادة، وعند اختيار "قص" سيُستخدم المخزون إن لم توجد بقايا مناسبة.
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCutDialogOpen(false)}>إلغاء</Button>
          <Button variant='contained' onClick={submitCut}>
            تنفيذ
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cut result dialog */}
      <Dialog open={!!cutResult} onClose={() => setCutResult(null)} maxWidth='sm' fullWidth>
        <DialogTitle>نتيجة القص / الإضافة</DialogTitle>
        <DialogContent>
          {cutResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cutResult.mode === 'leftover' ? (
                <div>
                  <div>تم إضافة القطع كبقايا:</div>
                  <ul>
                    {(cutResult.created || []).map(p => (
                      <li key={p.id}>#{p.id} — {p.length} × {p.width}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div>
                  <div>نتائج القص:</div>
                  {(cutResult.results || []).map((r, idx) => (
                    <div key={idx} style={{ borderTop: '1px solid #eee', paddingTop: 8 }}>
                      <div>القطعة المقطوعة: {r.consumedPiece && (r.consumedPiece.id || r.consumedPiece.materialId || '-')}</div>
                    {r.consumedPiece && r.consumedPiece.createdAt ? (
                      <div>تاريخ الإنشاء: {new Date(r.consumedPiece.createdAt).toLocaleString()}</div>
                    ) : null}
                      <div>
                        البقايا الناتجة:
                        <ul>
                          {(r.leftovers || []).map(l => (
                            <li key={l.id}>#{l.id} — {l.length} × {l.width}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>لا توجد نتائج</div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCutResult(null)}>إغلاق</Button>
        </DialogActions>
      </Dialog>

      {/* View dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>تفاصيل القطعة</DialogTitle>
        <DialogContent>
          {viewPiece ? (
            <ViewPieceDetails piece={viewPiece} materialsMap={materialsMap} />
          ) : (
            <div>لا توجد بيانات</div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>إغلاق</Button>
          <Button variant='contained' onClick={() => { if (viewPiece) { setPermitPiece(viewPiece); setPermitQty(Number(viewPiece.quantity || 1)); setPermitNote(''); setPermitDialogOpen(true); setViewDialogOpen(false) } }}>
            أذن صرف
          </Button>
        </DialogActions>
      </Dialog>

      {/* Permit dialog */}
      <Dialog open={permitDialogOpen} onClose={() => setPermitDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>إنشاء أذن صرف</DialogTitle>
        <DialogContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            <div>المادة: {permitPiece ? (materialsMap[String(permitPiece.materialId)] || permitPiece.materialId) : '-'}</div>
            <div>القطعة: {permitPiece ? permitPiece.id : '-'}</div>
            <TextField label='الكمية' type='number' size='small' value={permitQty} onChange={e => setPermitQty(e.target.value)} />
            <TextField select SelectProps={{ native: true }} label='العميل' size='small' value={selectedClientId || ''} onChange={e => setSelectedClientId(e.target.value)}>
              <option value=''> </option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </TextField>
            <TextField label='ملاحظة' size='small' value={permitNote} onChange={e => setPermitNote(e.target.value)} />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPermitDialogOpen(false)}>إلغاء</Button>
          <Button variant='contained' onClick={async () => {
            if (!permitPiece) return
            try {
              const body = { type: 'permit', pieceId: permitPiece.id, qty: Number(permitQty || 1), note: permitNote }
              if (selectedClientId) body.client = selectedClientId
              const res = await fetch('/api/material-pieces', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
              if (!res.ok) throw new Error(await res.text())
              const data = await res.json()
              alert('أذن الصرف مُنشأ: ' + (data.permit || ''))
              setPermitDialogOpen(false)
              await fetchPieces()
            } catch (err) {
              alert(err.message || 'فشل في إنشاء أذن الصرف')
            }
          }}>إنشاء</Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
