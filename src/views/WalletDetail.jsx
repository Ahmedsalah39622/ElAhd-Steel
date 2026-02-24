'use client'
import React, { useEffect, useState } from 'react'

import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'

// removed password dialog imports — using simple open flow

export default function WalletDetailClient({ id }) {
  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [depositForm, setDepositForm] = useState({ amount: '', description: '', password: '' })
  const [updatingAllow, setUpdatingAllow] = useState(false)

  // removed password modal state

  async function loadWallet() {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    try {
      setLoading(true)
      setError(null)

      // fetch single wallet by id using original endpoint
      const res = await fetch(`/api/wallets/${id}`, { credentials: 'include', signal: controller.signal })

      clearTimeout(timeout)
      let data

      try {
        data = await res.json()
      } catch (e) {
        data = null
      }
      if (res.status === 401) return setError('غير مصدق: الرجاء تسجيل الدخول')
      if (res.status === 403) return setError('ليس لديك صلاحية الوصول إلى هذه المحفظة')
      if (res.status === 404) return setError('المحفظة غير موجودة. يمكنك إنشاء محفظة جديدة من صفحة المحفظة.')
      if (!res.ok) throw new Error(data?.error || 'فشل تحميل المحفظة')
      setWallet(data)
      await loadTxs()
    } catch (e) {
      if (e.name === 'AbortError') setError('انتهى وقت الاتصال بالخادم — حاول إعادة التحميل')
      else setError(e.message)
    } finally {
      clearTimeout(timeout)
      setLoading(false)
    }
  }

  async function loadTxs() {
    const wid = arguments[0] || id

    if (!wid) return
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    try {
      const tr = await fetch(`/api/wallets/${wid}/transactions`, { credentials: 'include', signal: controller.signal })

      clearTimeout(timeout)
      const tdata = await tr.json()

      if (!tr.ok) throw new Error(tdata.error || 'فشل تحميل المعاملات')
      setTransactions(tdata)
    } catch (e) {
      if (e.name === 'AbortError') setError('انتهى وقت الاتصال بتحميل المعاملات — حاول إعادة التحميل')
      else setError(e.message)
    } finally {
      clearTimeout(timeout)
    }
  }

  useEffect(() => {
    if (!id) {
      // guard: if id is not provided, stop loading and show helpful message
      setLoading(false)
      setError('معرف المحفظة غير موجود — تأكد من الرابط أو أعد المحاولة بعد تسجيل الدخول')

      return
    }

    loadWallet()
  }, [id])

  async function doDeposit() {
    try {
      setError(null)
      setSuccess(null)
      const res = await fetch('/api/wallets/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ walletId: id, amount: depositForm.amount, description: depositForm.description })
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Deposit failed')
      setSuccess('Deposit successful')
      await loadWallet()
      await loadTxs()
    } catch (e) {
      setError(e.message)
    }
  }

  async function doTransferToMain() {
    try {
      setError(null)
      setSuccess(null)
      const sres = await fetch('/api/safes', { credentials: 'include' })
      const safes = await sres.json()

      if (!sres.ok) throw new Error(safes.error || 'Failed to load safes')
      const main = Array.isArray(safes) ? safes.find(s => s.isDefault) : null

      if (!main) throw new Error('Main safe not found')

      const amt = parseFloat(window.prompt('المبلغ للتحويل إلى الخزنة الرئيسية:', '0'))

      if (!amt || amt <= 0) return
      if (amt > Number(wallet.balance || 0)) throw new Error('Insufficient funds')
      const pass = window.prompt('كلمة المرور لتأكيد التحويل:')

      if (!pass) return

      const tres = await fetch('/api/wallets/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ fromWalletId: id, toSafeId: main.id, amount: amt, description: `Transfer to main safe` })
      })
      const tdata = await tres.json()

      if (!tres.ok) throw new Error(tdata.error || 'Transfer failed')
      setSuccess('Transfer to main safe successful')
      await loadWallet()
      await loadTxs()
    } catch (e) {
      setError(e.message)
    }
  }

  async function toggleAllow(val) {
    try {
      setUpdatingAllow(true)
      setError(null)
      const res = await fetch(`/api/wallets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ allowMainSafeWithdraw: !!val })
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Update failed')
      setWallet(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setUpdatingAllow(false)
    }
  }

  return (
    <div className='p-6'>
      <Typography variant='h4' className='mb-4'>
        تفاصيل المحفظة
      </Typography>

      {loading && <div>Loading...</div>}
      {error && <div className='text-red-500'>{error}</div>}
      {success && <div className='text-green-500'>{success}</div>}

      {!wallet && !loading && (
        <div>
          <div>المحفظة غير موجودة أو ليس لك صلاحية الوصول.</div>
          <div className='flex gap-3 mt-3'>
            <Button
              variant='contained'
              onClick={() => {
                window.location.href = '/wallet'
              }}
            >
              العودة للمحافظ
            </Button>
            <Button
              variant='outlined'
              onClick={() => {
                window.location.href = '/wallet/new'
              }}
            >
              إنشاء محفظة
            </Button>
          </div>
        </div>
      )}

      {wallet && (
        <div>
          <Card className='mb-4'>
            <CardContent>
              <Typography variant='h6'>{wallet.name}</Typography>
              <Typography>الرصيد: {wallet.balance || 0} ج.م</Typography>
              <FormControlLabel
                control={
                  <Checkbox checked={!!wallet.allowMainSafeWithdraw} onChange={e => toggleAllow(e.target.checked)} />
                }
                label='السماح للخزنة الرئيسية بسحب الأموال'
              />
            </CardContent>
          </Card>

          <Card className='mb-4'>
            <CardContent>
              <Typography variant='h6'>إيداع</Typography>
              <TextField
                fullWidth
                label='المبلغ'
                value={depositForm.amount}
                onChange={e => setDepositForm(prev => ({ ...prev, amount: e.target.value }))}
                className='mb-3'
              />
              <TextField
                fullWidth
                label='الوصف'
                value={depositForm.description}
                onChange={e => setDepositForm(prev => ({ ...prev, description: e.target.value }))}
                className='mb-3'
              />
              {/* Password removed — no re-auth required */}
              <div className='flex gap-3'>
                <Button variant='contained' onClick={doDeposit}>
                  إيداع
                </Button>
                <Button variant='outlined' onClick={doTransferToMain}>
                  تحويل للخزنة الرئيسية
                </Button>
              </div>
            </CardContent>
          </Card>

          <div>
            <Typography variant='h6' className='mb-2'>
              سجل المعاملات
            </Typography>
            {transactions.length === 0 && <div>لا توجد معاملات</div>}
            {transactions.map(tx => (
              <Card key={tx.id} className='mb-2'>
                <CardContent>
                  <Typography>
                    <strong>{tx.entryType || (parseFloat(tx.incoming) > 0 ? 'incoming' : 'outgoing')}</strong> —{' '}
                    {Number(tx.incoming || tx.outgoing || 0)} ج.م
                  </Typography>
                  <Typography>{tx.description || '-'}</Typography>
                  <Typography variant='caption' className='block'>
                    {new Date(tx.date || tx.createdAt).toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      {/* removed password dialog */}
    </div>
  )
}
