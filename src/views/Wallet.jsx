'use client'
import { useEffect, useState } from 'react'

import Button from '@mui/material/Button'
import InputAdornment from '@mui/material/InputAdornment'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'

export default function WalletView() {
  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ amount: '', password: '', description: '' })
  const [createForm, setCreateForm] = useState({ name: 'Personal Wallet', allowMain: false })
  const [transactions, setTransactions] = useState([])
  const [clients, setClients] = useState([])
  const [creatingClientsWallets, setCreatingClientsWallets] = useState(false)
  const [lastTx, setLastTx] = useState(null)
  const [updatingAllow, setUpdatingAllow] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // removed password dialog — simplified single-wallet flow
  const createWallet = async () => {
    try {
      setError(null)
      setSuccess(null)

      const res = await fetch('/api/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: createForm.name, allowMainSafeWithdraw: createForm.allowMain })
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Failed to create wallet')
      setWallet(data)
      setSuccess('Wallet created')

      // load transactions for the new wallet
      await loadTransactions(data.id)
      setError(null)
    } catch (err) {
      setError(err.message)
    }
  }

  // helper to load transactions (component scope)
  const loadTransactions = async id => {
    if (!id) return

    try {
      const tr = await fetch(`/api/wallets/${id}/transactions`, { credentials: 'include' })
      const tdata = await tr.json()

      if (!tr.ok) throw new Error(tdata.error || 'Failed to load transactions')
      setTransactions(tdata)
    } catch (e) {
      setError(e.message)
    }
  }

  // helper to fetch clients pool
  const fetchClientsPool = async () => {
    try {
      setError(null)
      const cres = await fetch('/api/wallets/clients-pool', { credentials: 'include' })
      const data = await cres.json()

      if (!cres.ok) throw new Error(data.error || 'Failed to fetch clients pool')
      setClients(data)

      return data
    } catch (err) {
      setError(err.message)
      setClients([])

      return []
    }
  }

  // create wallets for clients that have non-zero balance and don't already have a wallet
  const createWalletsForClients = async () => {
    try {
      setError(null)
      setSuccess(null)
      setCreatingClientsWallets(true)

      const res = await fetch('/api/wallets/create-for-clients', { method: 'POST', credentials: 'include' })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Failed to create client wallets')

      setSuccess(`${data.createdCount || 0} محفظة/محافظ أنشئت بنجاح`)

      // refresh wallet and clients list
      try {
        await fetchClientsPool()
      } catch (e) {}

      try {
        const r = await fetch('/api/wallets', { credentials: 'include' })
        const arr = await r.json()

        setWallet(arr[0] || wallet)
      } catch (e) {}
    } catch (err) {
      setError(err.message)
    } finally {
      setCreatingClientsWallets(false)
    }
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true)

      try {
        const res = await fetch('/api/wallets', { credentials: 'include' })
        const walletsArr = await res.json()

        if (!res.ok) throw new Error(walletsArr.error || 'Failed to fetch wallets')

        // pick first wallet; if none exists, create a default personal wallet automatically
        let w = walletsArr[0] || null

        if (!w) {
          try {
            const createRes = await fetch('/api/wallets', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ name: 'Personal Wallet', allowMainSafeWithdraw: false })
            })
            const created = await createRes.json()

            if (createRes.ok) {
              w = created
            } else {
              // creation failed, surface error but continue
              setError(created.error || 'Failed to create default wallet')
            }
          } catch (e) {
            setError(e.message)
          }
        }

        setWallet(w)
        setError(null)
        if (w) await loadTransactions(w.id)

        // load clients pooled balances
        await fetchClientsPool()

        // If clients-pool returned nothing, try to derive client wallets from the user's wallets
        // This covers the case where wallets were created directly in DB or by the create-for-clients endpoint
        try {
          // walletsArr is the full list we fetched above
          const clientWallets = (walletsArr || []).filter(
            x => typeof x.name === 'string' && x.name.trim().startsWith('محفظة')
          )

          if (clientWallets.length > 0) {
            const mapped = clientWallets.map(wi => ({
              customer: wi.name.replace(/^محفظة\s*/i, '').trim(),
              balance: wi.balance || 0,
              walletId: wi.id
            }))

            // Only set clients if clients-pool did not return any entries
            setClients(prev => (prev && prev.length > 0 ? prev : mapped))
          }
        } catch (e) {
          // ignore
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const doDeposit = async () => {
    try {
      setError(null)
      setSuccess(null)
      if (!wallet) throw new Error('No wallet')

      const res = await fetch('/api/wallets/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          walletId: wallet.id,
          amount: form.amount,
          description: form.description,
          password: form.password
        })
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Deposit failed')
      setSuccess('Deposit successful')

      // refresh wallet and transactions
      const refreshRes = await fetch('/api/wallets', { credentials: 'include' })
      const wallets = await refreshRes.json()
      const w = wallets[0] || null

      setWallet(w)
      await loadTransactions(w?.id)
      setLastTx(data.tx || null)
      setError(null)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className='p-6'>
      <Typography variant='h4' className='mb-6'>
        المحفظة الشخصية
      </Typography>

      {loading && <div>Loading...</div>}
      {error && <div className='text-red-500'>{error}</div>}
      {success && <div className='text-green-500'>{success}</div>}

      {wallet && (
        <>
          <Card>
            <CardHeader title={wallet.name} subheader={`الرصيد: ${wallet.balance || 0} ج.م`} />
            <CardContent>
              <Typography className='mb-3'>اضغط "فتح المحفظة" لعرض العمليات والإيداعات والتحويلات</Typography>
              <div className='flex gap-3'>
                <Button
                  variant='contained'
                  color='primary'
                  onClick={() => {
                    window.location.href = `/wallet/${wallet.id}`
                  }}
                >
                  فتح المحفظة
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Clients pool */}
      {wallet && (
        <div className='mb-6'>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Typography variant='h6' className='mb-2'>
              رصيد العملاء (محفظة العملاء)
            </Typography>
            <Button
              size='small'
              variant='outlined'
              onClick={() => createWalletsForClients()}
              disabled={creatingClientsWallets || !clients || clients.length === 0}
            >
              {creatingClientsWallets ? 'جارٍ الإنشاء...' : 'إنشاء محافظ للعملاء (ميزانية > 0)'}
            </Button>
          </div>

          {loading ? (
            <div>Loading clients...</div>
          ) : error ? (
            <div className='text-red-500'>
              خطأ: {error}{' '}
              <button className='ml-2 underline' onClick={() => fetchClientsPool()}>
                إعادة تحميل
              </button>
            </div>
          ) : clients && clients.length > 0 ? (
            <div className='grid grid-cols-3 gap-3'>
              {clients.map(c => (
                <Card
                  key={c.customer}
                  className='p-3 cursor-pointer'
                  onClick={() => {
                    // navigate to client wallet page
                    const url = `/wallet/client/${encodeURIComponent(c.customer)}`

                    window.location.href = url
                  }}
                >
                  <CardContent>
                    <Typography variant='subtitle1' className='truncate'>
                      <strong>{c.customer}</strong>
                    </Typography>
                    <Typography>الرصيد: {c.balance} ج.م</Typography>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className='flex items-center gap-3'>
              <div>لا توجد أرصدة لعرضها</div>
              <Button variant='outlined' onClick={() => fetchClientsPool()}>
                إعادة تحميل
              </Button>
            </div>
          )}
        </div>
      )}

      {!wallet && !loading && (
        <Card>
          <CardHeader title='إنشاء محفظة شخصية' subheader='اضغط الزر لفتح صفحة الإجراءات وإنشاء المحفظة' />
          <CardContent>
            <div className='flex gap-3 mt-3'>
              <Button
                variant='contained'
                color='primary'
                onClick={() => {
                  window.location.href = '/wallet/new'
                }}
              >
                إنشاء محفظة جديدة
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
