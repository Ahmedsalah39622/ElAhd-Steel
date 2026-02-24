'use client'

import { useEffect, useState } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'

export default function ManagePiecesModal({ open, onClose, materialId, refreshParent, clientId }) {
  const [pieces, setPieces] = useState([])
  const [loading, setLoading] = useState(false)
  const [length, setLength] = useState('')
  const [width, setWidth] = useState('')
  const [qty, setQty] = useState(1)
  const [isLeftover, setIsLeftover] = useState(false)
  const [cutLength, setCutLength] = useState('')
  const [cutWidth, setCutWidth] = useState('')
  const [cutQty, setCutQty] = useState(1)
  const [permitDialogOpen, setPermitDialogOpen] = useState(false)
  const [permitPieceId, setPermitPieceId] = useState(null)
  const [permitQty, setPermitQty] = useState(1)
  const [permitNote, setPermitNote] = useState('')
  const [permitClientId, setPermitClientId] = useState(clientId || '')
  const [clients, setClients] = useState([])
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    if (!open) return
    fetchPieces()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // refetch when showAll changes so listing updates (leftovers vs all)
  useEffect(() => {
    if (!open) return
    fetchPieces()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAll])

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
  }, [open])

  async function fetchPieces() {
    if (!materialId) return
    setLoading(true)

    try {
      const qs = new URLSearchParams({ materialId })
      if (!showAll) qs.set('isLeftover', 'true')
      const res = await fetch('/api/material-pieces?' + qs.toString(), { credentials: 'include' })
      const data = await res.json()

      setPieces(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      setPieces([])
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd() {
    if (!length || !width) return alert('الطول والعرض مطلوبان')

    try {
      const res = await fetch('/api/material-pieces', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialId,
          length: Number(length),
          width: Number(width),
          quantity: Number(qty),
          isLeftover
        })
      })

      if (!res.ok) throw new Error(await res.text())
      await fetchPieces()
      if (typeof refreshParent === 'function') refreshParent()
      setLength('')
      setWidth('')
      setQty(1)
      setIsLeftover(false)
    } catch (err) {
      alert(err.message || 'Failed')
    }
  }

  async function handleDelete(id) {
    if (!confirm('هل تريد حذف هذه القطعة؟')) return

    try {
      const qs = new URLSearchParams({ id })

      if (clientId) qs.set('clientId', clientId)
      const res = await fetch('/api/material-pieces?' + qs.toString(), { method: 'DELETE', credentials: 'include' })

      if (!res.ok) {
        const text = await res.text()

        // negative stock error: allow retry with override
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
      if (typeof refreshParent === 'function') refreshParent()
    } catch (err) {
      alert(err.message || 'Failed')
    }
  }

  async function handleCut() {
    if (!cutLength || !cutWidth) return alert('الطول والعرض مطلوبان')

    try {
      const body = { type: 'cut', materialId, length: Number(cutLength), width: Number(cutWidth), qty: Number(cutQty) }

      if (clientId) body.client = clientId

      const res = await fetch('/api/material-pieces', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!res.ok) {
        const text = await res.text()

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
          } else {
            throw new Error(text)
          }
        } else {
          throw new Error(text)
        }
      } else {
        const data = await res.json()
      }

      await fetchPieces()
      if (typeof refreshParent === 'function') refreshParent()
      alert('تمّ القص')
    } catch (err) {
      alert(err.message || 'Failed')
    }
  }

  async function handleCreatePermit(pieceId) {
    // open permit dialog in this modal
    setPermitPieceId(pieceId)
    setPermitQty(1)
    setPermitNote('')
    setPermitDialogOpen(true)
  }

  async function confirmCreatePermit() {
    const reqLength = Number(cutLength) || 0
    const reqWidth = Number(cutWidth) || 0
    const reqQty = Number(permitQty || 1)

    if (!reqLength || !reqWidth || !reqQty) return alert('الطول والعرض والكمية مطلوبة')

    try {
      const body = {
        materialId,
        reqLength: reqLength,
        reqWidth: reqWidth,
        qty: reqQty,
        client: permitClientId || null,
        note: permitNote || ''
      }

      const res = await fetch('/api/inventory/withdraw-pieces', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!res.ok) {
        const text = await res.text()

        if (text && text.includes('negative stock')) {
          if (confirm('هذه العملية ستؤدي إلى رصيد سالب. هل تريد المتابعة بالسماح بالرصيد السالب؟')) {
            body.allowNegative = true
            const r2 = await fetch('/api/inventory/withdraw-pieces', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
            })

            if (!r2.ok) throw new Error(await r2.text())
          } else {
            throw new Error(text)
          }
        } else {
          throw new Error(text || 'Failed')
        }
      }

      const data = await res.json()

      setPermitDialogOpen(false)
      await fetchPieces()
      if (typeof refreshParent === 'function') refreshParent()
      alert('تم تنفيذ السحب بنجاح')
    } catch (err) {
      alert(err.message || 'Failed')
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle>إدارة القطع</DialogTitle>
      <DialogContent>
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <TextField label='الطول' type='number' value={length} onChange={e => setLength(e.target.value)} />
            <TextField label='العرض' type='number' value={width} onChange={e => setWidth(e.target.value)} />
            <TextField label='الكمية' type='number' value={qty} onChange={e => setQty(e.target.value)} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type='checkbox' checked={isLeftover} onChange={e => setIsLeftover(e.target.checked)} /> بقايا
            </label>
            <Button variant='contained' onClick={handleAdd}>
              إضافة قطعة
            </Button>

            <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
              <input type='checkbox' checked={showAll} onChange={e => setShowAll(e.target.checked)} /> عرض الكل
            </label>
          </div>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>معرّف</TableCell>
                <TableCell>الطول</TableCell>
                <TableCell>العرض</TableCell>
                <TableCell>كمية</TableCell>
                <TableCell>بقايا</TableCell>
                <TableCell>الحالة</TableCell>
                <TableCell>إجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/** Show only leftovers and original raw pieces (parentPieceId === null) **/}
              {(() => {
                const list = showAll ? pieces : pieces.filter(p => p.isLeftover === true && p.status === 'available')

                if (!loading && list.length === 0) {
                  return (
                    <TableRow>
                      <TableCell colSpan={7} style={{ textAlign: 'center', padding: '24px 0' }}>
                        لا توجد بقايا لعرضها
                      </TableCell>
                    </TableRow>
                  )
                }

                return list.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>{p.id}</TableCell>
                    <TableCell>{p.length}</TableCell>
                    <TableCell>{p.width}</TableCell>
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
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                        <Button
                          size='small'
                          onClick={() => handleDelete(p.id)}
                          disabled={p.status !== 'available' || p.quantity <= 0}
                          title={
                            p.status !== 'available' || p.quantity <= 0
                              ? 'لا يمكن حذف إلا القطع المتاحة وبكمية أكبر من صفر'
                              : ''
                          }
                        >
                          حذف
                        </Button>
                        {p.status === 'available' && (
                          <Button size='small' onClick={() => handleCreatePermit(p.id)}>
                            أذن صرف
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              })()}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
      <Dialog open={permitDialogOpen} onClose={() => setPermitDialogOpen(false)}>
        <DialogTitle>أذن صرف</DialogTitle>
        <DialogContent>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexDirection: 'column' }}>
            <div>المادة: {materialId || '-'}</div>
            <div>القطعة: {permitPieceId || '-'}</div>
            <TextField
              label='الكمية'
              type='number'
              size='small'
              value={permitQty}
              onChange={e => setPermitQty(e.target.value)}
            />
            <TextField
              select
              SelectProps={{ native: true }}
              label='العميل'
              size='small'
              value={permitClientId}
              onChange={e => setPermitClientId(e.target.value)}
            >
              <option value=''> </option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </TextField>
            <TextField label='ملاحظة' size='small' value={permitNote} onChange={e => setPermitNote(e.target.value)} />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPermitDialogOpen(false)}>إلغاء</Button>
          <Button variant='contained' onClick={confirmCreatePermit}>
            إنشاء أذن
          </Button>
        </DialogActions>
      </Dialog>
      <DialogActions>
        <Button onClick={onClose}>إغلاق</Button>
      </DialogActions>
    </Dialog>
  )
}
