"use client"
import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'

export default function ClientWalletPage() {
  const params = useParams()
  const customer = decodeURIComponent(params?.customer || '')
  const [password, setPassword] = useState('')
  const [transactions, setTransactions] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [authed, setAuthed] = useState(false)

  async function loadTxs() {
    try {
      // defensive checks and diagnostics
      if (!customer) {
        setError('Missing customer parameter')
        return
      }

      setLoading(true)
      setError(null)
      try {
        console.log('Loading client transactions for:', customer)
        const res = await fetch(`/api/wallets/clients/${encodeURIComponent(customer)}/transactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ password })
        })

        const data = await res.json().catch(() => null)

        if (!res.ok) {
          const msg = (data && (data.error || data.message)) || `Request failed with status ${res.status}`
          setError(msg)
          return
        }

        setTransactions(data || [])
        setAuthed(true)
      } catch (e) {
        console.error('loadTxs error:', e)
        setError(e.message || String(e))
      } finally {
        setLoading(false)
      }
    } catch (e) {
      setError(e.message)
    } finally { setLoading(false) }
  }

  return (
    <div className='p-6'>
      <Typography variant='h5' className='mb-4'>محفظة العميل: {customer}</Typography>

      {!authed && (
        <Card>
          <CardContent>
            <Typography>أدخل كلمة المرور لتأكيد الدخول وعرض أرصدة العميل والمعاملات</Typography>
            <TextField fullWidth type='password' label='كلمة المرور' value={password} onChange={e => setPassword(e.target.value)} className='my-3' />
            <div className='flex gap-3'>
              <Button variant='contained' onClick={loadTxs} disabled={loading}>عرض المعاملات</Button>
            </div>
            {error && <div className='text-red-500 mt-3'>{error}</div>}
          </CardContent>
        </Card>
      )}

      {authed && (
        <div>
          <Typography variant='h6' className='mb-2'>المعاملات</Typography>
          {transactions.length === 0 && <div>لا توجد معاملات</div>}
          {transactions.map(tx => (
            <Card key={tx.id} className='mb-2'>
              <CardContent>
                <Typography><strong>{tx.entryType || (parseFloat(tx.incoming) > 0 ? 'incoming' : 'outgoing')}</strong> — {Number(tx.incoming || tx.outgoing || 0)} ج.م</Typography>
                <Typography>{tx.description || '-'}</Typography>
                <Typography variant='caption' className='block'>{new Date(tx.date || tx.createdAt).toLocaleString()}</Typography>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
