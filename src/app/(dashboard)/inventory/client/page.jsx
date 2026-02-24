'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@core/contexts/authContext'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MaterialReportDialog from '@views/inventory/MaterialReportDialog'
import { useInventoryClient } from '@views/inventory/useInventoryClient'

export default function InventoryClientPage() {
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportTxs, setReportTxs] = useState([])
  const [newName, setNewName] = useState('')
  const [newSku, setNewSku] = useState('')
  const [newUnit, setNewUnit] = useState('pcs')

  const { user } = useAuth()
  const client = useInventoryClient()
  const [suppliers, setSuppliers] = useState([])
  const [clients, setClients] = useState([])
  const [txDialog, setTxDialog] = useState({ open: false, materialId: null, action: 'add' })
  const [txQty, setTxQty] = useState('')
  const [txSupplierId, setTxSupplierId] = useState('')
  const [txClientId, setTxClientId] = useState('')
  const [txNote, setTxNote] = useState('')
  useEffect(() => {
    let mounted = true
    client
      .fetchMaterials()
      .then(data => {
        if (!mounted) return
        const arr = Array.isArray(data) ? data : []
        setMaterials(arr.filter(m => m.type === 'client' || m.materialType === 'client'))
      })
      .catch(() => setMaterials([]))
      .finally(() => mounted && setLoading(false))

    return () => (mounted = false)
    // intentionally omit `client` from deps to avoid unstable refetch loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const sRes = await fetch('/api/suppliers', { credentials: 'include' })
        if (!mounted) return
        const sJson = sRes.ok ? await sRes.json() : null
        if (sJson && sJson.data) setSuppliers(sJson.data)
      } catch (e) {
        console.error('Failed to fetch suppliers', e)
      }
      try {
        const cRes = await fetch('/api/clients', { credentials: 'include' })
        if (!mounted) return
        const cJson = cRes.ok ? await cRes.json() : null
        if (cJson && cJson.data) setClients(cJson.data)
      } catch (e) {
        console.error('Failed to fetch clients', e)
      }
    })()
    return () => (mounted = false)
  }, [])

  const refresh = async () => {
    setLoading(true)
    try {
      const data = await client.fetchMaterials()
      setMaterials((Array.isArray(data) ? data : []).filter(m => m.type === 'client' || m.materialType === 'client'))
    } catch (err) {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newName) return alert('الاسم مطلوب')
    try {
      await client.createMaterial({
        name: newName,
        sku: newSku,
        unit: newUnit,
        materialType: 'client',
        createdBy: user?.email || user?.name || 'unknown'
      })
      setNewName('')
      setNewSku('')
      await refresh()
    } catch (err) {
      alert(err.message || 'فشل في الإنشاء')
    }
  }

  const handleAdjust = async (materialId, action) => {
    setTxQty('')
    setTxSupplierId('')
    setTxClientId('')
    setTxNote('')
    setTxDialog({ open: true, materialId, action })
  }

  const handleTxSubmit = async ({ materialId, action, amount, supplierId, clientId, note }) => {
    if (!amount || Number(amount) <= 0) return alert('الكمية مطلوبة')
    const userId = user?.email || user?.name || 'unknown'
    // Both add and remove actions use client as source
    const source = 'client'
    const reference = String(clientId || '')
    try {
      // if material currently shows no stock, block and inform user
      const mat = materials.find(m => m.id === materialId)
      if (mat && Number(mat.stock) <= 0) return alert('المخزون نفذ — لا يمكن السحب حتى تعبئة المخزون')

      await client.transact({ materialId, amount, action, user: userId, source, reference, note })
      setTxDialog({ open: false, materialId: null, action: 'add' })
      await refresh()
    } catch (err) {
      if (err && err.code === 'NEGATIVE_STOCK') {
        const ok = confirm(err.message + '\n\nForce consume and allow negative stock?')
        if (ok) {
          try {
            await client.transact({ materialId, amount, action, user: userId, source, reference, note, allowNegative: true })
            setTxDialog({ open: false, materialId: null, action: 'add' })
            await refresh()
            return
          } catch (err2) {
            alert(err2.message || 'فشل في العملية')
            return
          }
        }
      }

      alert(err.message || 'فشل في العملية')
    }
  }

  const openReport = async materialId => {
    try {
      const txs = await client.fetchTransactions(materialId)
      setReportTxs(txs || [])
      setReportOpen(true)
    } catch (err) {
      alert('فشل في تحميل التقرير')
    }
  }

  return (
    <div className='p-6' dir='rtl'>
      <h1 className='text-2xl font-semibold mb-4'>مواد العملاء</h1>

      <div className='flex items-center gap-4 mb-4'>
        <TextField label='الاسم' size='small' value={newName} onChange={e => setNewName(e.target.value)} />
        <TextField label='رمز المادة' size='small' value={newSku} onChange={e => setNewSku(e.target.value)} />
        <TextField label='الوحدة' size='small' value={newUnit} onChange={e => setNewUnit(e.target.value)} />
        <Button variant='contained' onClick={handleCreate}>
          إضافة مادة
        </Button>
      </div>

      {loading ? (
        <div>جاري التحميل...</div>
      ) : (
        <div className='overflow-auto'>
          {materials.length === 0 ? (
            <p>لم يتم العثور على مواد للعملاء.</p>
          ) : (
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                border: '1px solid rgb(var(--mui-palette-text-primaryChannel, 0 0 0) / 0.06)'
              }}
            >
              <thead>
                <tr style={{ background: 'rgb(var(--mui-palette-background-paperChannel) / 0.18)' }}>
                  <th
                    style={{
                      border: '1px solid rgb(var(--mui-palette-text-primaryChannel, 0 0 0) / 0.06)',
                      padding: '0.5rem',
                      textAlign: 'right',
                      color: 'var(--mui-palette-text-primary)',
                      fontWeight: 600
                    }}
                  >
                    الاسم
                  </th>
                  <th
                    style={{
                      border: '1px solid rgb(var(--mui-palette-text-primaryChannel, 0 0 0) / 0.06)',
                      padding: '0.5rem',
                      textAlign: 'right',
                      color: 'var(--mui-palette-text-primary)',
                      fontWeight: 600
                    }}
                  >
                    رمز المادة
                  </th>
                  <th
                    style={{
                      border: '1px solid rgb(var(--mui-palette-text-primaryChannel, 0 0 0) / 0.06)',
                      padding: '0.5rem',
                      textAlign: 'right',
                      color: 'var(--mui-palette-text-primary)',
                      fontWeight: 600
                    }}
                  >
                    المخزون
                  </th>
                  <th
                    style={{
                      border: '1px solid rgb(var(--mui-palette-text-primaryChannel, 0 0 0) / 0.06)',
                      padding: '0.5rem',
                      textAlign: 'right',
                      color: 'var(--mui-palette-text-primary)',
                      fontWeight: 600
                    }}
                  >
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {materials.map((m, idx) => (
                  <tr
                    key={m.id}
                    style={{
                      background:
                        idx % 2 === 0 ? 'transparent' : 'rgb(var(--mui-palette-background-paperChannel) / 0.04)'
                    }}
                  >
                    <td
                      style={{
                        border: '1px solid rgb(var(--mui-palette-text-primaryChannel, 0 0 0) / 0.04)',
                        padding: '0.5rem'
                      }}
                    >
                      {m.name}
                    </td>
                    <td
                      style={{
                        border: '1px solid rgb(var(--mui-palette-text-primaryChannel, 0 0 0) / 0.04)',
                        padding: '0.5rem'
                      }}
                    >
                      {m.sku}
                    </td>
                    <td
                      style={{
                        border: '1px solid rgb(var(--mui-palette-text-primaryChannel, 0 0 0) / 0.04)',
                        padding: '0.5rem',
                        textAlign: 'right'
                      }}
                    >
                      {m.stock ?? 0}
                    </td>
                    <td
                      style={{
                        border: '1px solid rgb(var(--mui-palette-text-primaryChannel, 0 0 0) / 0.04)',
                        padding: '0.5rem',
                        width: 220
                      }}
                    >
                      <div className='flex items-center justify-end gap-2'>
                        <Button size='small' variant='outlined' onClick={() => handleAdjust(m.id, 'remove')}>
                          -
                        </Button>
                        <Button size='small' variant='contained' onClick={() => handleAdjust(m.id, 'add')}>
                          +
                        </Button>
                        <Button size='small' onClick={() => openReport(m.id)}>
                          تقرير
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <MaterialReportDialog open={reportOpen} onClose={() => setReportOpen(false)} transactions={reportTxs} />
      {/* Transaction Dialog */}
      {txDialog.open && (
        <div role='dialog' aria-modal='true'>
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)' }}
            onClick={() => setTxDialog({ open: false, materialId: null, action: 'add' })}
          />
          <div
            style={{
              position: 'fixed',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%,-50%)',
              background: '#fff',
              padding: 20,
              width: 480,
              borderRadius: 8
            }}
          >
            <h3>{txDialog.action === 'add' ? 'إضافة مخزون' : 'سحب مخزون'}</h3>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <TextField label='الكمية' type='number' value={txQty} onChange={e => setTxQty(e.target.value)} />
              <TextField
                select
                SelectProps={{ native: true }}
                label='العميل'
                value={txClientId}
                onChange={e => setTxClientId(e.target.value)}
              >
                <option value=''> </option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </TextField>
            </div>
            <div style={{ marginTop: 12 }}>
              <TextField label='ملاحظة' value={txNote} onChange={e => setTxNote(e.target.value)} fullWidth />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <Button onClick={() => setTxDialog({ open: false, materialId: null, action: 'add' })}>إلغاء</Button>
              <Button
                variant='contained'
                onClick={() =>
                  handleTxSubmit({
                    materialId: txDialog.materialId,
                    action: txDialog.action,
                    amount: Number(txQty),
                    supplierId: txSupplierId || '',
                    clientId: txClientId || '',
                    note: txNote || ''
                  })
                }
              >
                تأكيد
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
