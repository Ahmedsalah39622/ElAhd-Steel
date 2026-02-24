'use client'

import React, { useEffect, useState } from 'react'

import Link from 'next/link'

import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Grid from '@mui/material/Grid'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import MenuItem from '@mui/material/MenuItem'

export default function DepositsPage() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState(0)
  const [safeId, setSafeId] = useState('')
  const [description, setDescription] = useState('رصيد إضافي')
  const [incomingFrom, setIncomingFrom] = useState('')
  const [safes, setSafes] = useState([])
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Filters
  const [filterSafeId, setFilterSafeId] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterQ, setFilterQ] = useState('')
  const [filterMin, setFilterMin] = useState('')
  const [filterMax, setFilterMax] = useState('')
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)

      try {
        const r = await fetch('/api/safes')
        const s = await r.json()

        setSafes(Array.isArray(s) ? s : [])

        const res = await fetch('/api/safe', { credentials: 'include' })
        const data = await res.json()

        const arr = Array.isArray(data)
          ? data
          : data && Array.isArray(data.rows)
            ? data.rows
            : data && Array.isArray(data.data)
              ? data.data
              : []

        // compute running balances (oldest -> newest), then reverse to newest-first
        const computeRunningBalances = entries => {
          const months = [
            'يناير',
            'فبراير',
            'مارس',
            'أبريل',
            'مايو',
            'يونيو',
            'يوليو',
            'أغسطس',
            'سبتمبر',
            'أكتوبر',
            'نوفمبر',
            'ديسمبر'
          ]
          const copy = (entries || []).slice()

          copy.sort((a, b) => new Date(a.date || a.createdAt || 0) - new Date(b.date || b.createdAt || 0))
          let running = 0

          const withBal = copy.map(e => {
            const inNum = parseFloat(e.incoming) || 0
            const outNum = parseFloat(e.outgoing) || 0

            running += inNum - outNum
            const dt = new Date(e.date || e.createdAt || Date.now())
            const monthName = e.month || months[dt.getMonth()] || ''

            return { ...e, balance: running, month: monthName }
          })

          return withBal.reverse()
        }

        const computed = computeRunningBalances(arr)

        // filter manual deposits (incoming with incomingMethod manual-deposit)
        const manual = computed.filter(
          e =>
            e.entryType === 'incoming' &&
            (e.incomingMethod === 'manual-deposit' || (e.description || '').includes('رصيد'))
        )

        setEntries(manual)
      } catch (e) {
        console.error(e)
        setError('فشل في جلب السجلات')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const handleSubmit = async () => {
    setError(null)
    setSuccess(null)
    if (!amount || Number(amount) <= 0) return setError('المبلغ مطلوب')

    try {
      const payload = {
        safeId: safeId || null,
        amount: Number(amount),
        description,
        incomingFrom: incomingFrom || null
      }

      const res = await fetch('/api/safes/manual-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Failed')

      setSuccess('تمت الإضافة')

      // prepend (prefer server-provided incomingFrom)
      const returned = data.entry || {}

      if (!returned.incomingFrom) returned.incomingFrom = incomingFrom || null
      setEntries(prev => [returned, ...prev])
      setAmount(0)
      setDescription('رصيد إضافي')
      setIncomingFrom('')
    } catch (e) {
      console.error(e)
      setError(e.message || 'فشل في الإضافة')
    }
  }

  // prepare filtered rows for the table
  const rows = (() => {
    const filtered = (entries || []).filter(e => {
      // filter by safe
      if (filterSafeId) {
        const sid = String(filterSafeId)

        if (String(e.safeId || '') !== sid && String(e.safeName || '') !== sid) return false
      }

      // filter incomingFrom
      if (filterFrom) {
        const fromVal =
          (e.incomingFrom || '').toString().toLowerCase() ||
          (() => {
            try {
              const d = e.description || ''
              const parts = d.split('—')

              if (parts.length > 1) return parts[0].trim()
              const parts2 = d.split('-')

              return parts2.length > 1 ? parts2[0].trim() : ''
            } catch (_) {
              return ''
            }
          })()

        if (!fromVal.toString().toLowerCase().includes(filterFrom.toString().toLowerCase())) return false
      }

      // free text search on description
      if (filterQ) {
        const d = (e.description || '').toString().toLowerCase()

        if (!d.includes(filterQ.toString().toLowerCase())) return false
      }

      // min/max amount
      const amt = Number(e.incoming || 0)

      if (filterMin && amt < Number(filterMin)) return false
      if (filterMax && amt > Number(filterMax)) return false

      // date range
      if (filterStartDate) {
        const d = new Date(e.date || e.createdAt)
        const start = new Date(filterStartDate)

        if (d < start) return false
      }

      if (filterEndDate) {
        const d = new Date(e.date || e.createdAt)
        const end = new Date(filterEndDate)

        // include full day
        end.setHours(23, 59, 59, 999)
        if (d > end) return false
      }

      return true
    })

    return filtered.map(e => {
      // derive incomingFrom either from returned property or from description prefix
      const from =
        e.incomingFrom ||
        (() => {
          try {
            const d = e.description || ''

            if (!d) return null
            const parts = d.split('—')

            if (parts.length > 1) return parts[0].trim()
            const parts2 = d.split('-')

            return parts2.length > 1 ? parts2[0].trim() : null
          } catch (_) {
            return null
          }
        })()

      return (
        <TableRow key={e.id}>
          <TableCell>{new Date(e.date || e.createdAt).toLocaleString()}</TableCell>
          <TableCell>{e.safeName || e.safeId || '-'}</TableCell>
          <TableCell>{from || '-'}</TableCell>
          <TableCell>{e.description || '-'}</TableCell>
          <TableCell>{Number(e.incoming || 0).toFixed(2)} ج.م</TableCell>
        </TableRow>
      )
    })
  })()

  return (
    <div className='p-6' dir='rtl'>
      <div className='flex items-center justify-between mb-6'>
        <div>
          <Typography variant='h4' className='font-bold'>
            إضافة رصيد إضافي
          </Typography>
          <Typography color='text.secondary'>أضف أرصدة نقدية يدوياً واستعرض السجلات السابقة</Typography>
        </div>
        <div>
          <Link href='/the-safe'>
            <Button variant='outlined'>رجوع</Button>
          </Link>
        </div>
      </div>

      <Card className='mb-6'>
        <CardContent>
          <Grid container spacing={2} alignItems='center'>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label='المبلغ'
                type='number'
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth label='البيان' value={description} onChange={e => setDescription(e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label='وارد من'
                value={incomingFrom}
                onChange={e => setIncomingFrom(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField select fullWidth label='اختر الخزنة' value={safeId} onChange={e => setSafeId(e.target.value)}>
                <MenuItem value=''>الخزنة الافتراضية</MenuItem>
                {safes.map(s => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button variant='contained' color='success' onClick={handleSubmit}>
                إضافة
              </Button>
            </Grid>
          </Grid>
          {error && <div className='text-red-500 mt-3'>{error}</div>}
          {success && <div className='text-green-600 mt-3'>{success}</div>}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className='mb-6'>
        <CardContent>
          <Grid container spacing={2} alignItems='center'>
            <Grid item xs={12} sm={3}>
              <TextField
                select
                fullWidth
                label='فلتر الخزنة'
                value={filterSafeId}
                onChange={e => setFilterSafeId(e.target.value)}
              >
                <MenuItem value=''>الكل</MenuItem>
                {safes.map(s => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth label='وارد من' value={filterFrom} onChange={e => setFilterFrom(e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth label='بحث (البيان)' value={filterQ} onChange={e => setFilterQ(e.target.value)} />
            </Grid>
            <Grid item xs={6} sm={1}>
              <TextField
                fullWidth
                label='الحد الأدنى'
                type='number'
                value={filterMin}
                onChange={e => setFilterMin(e.target.value)}
              />
            </Grid>
            <Grid item xs={6} sm={1}>
              <TextField
                fullWidth
                label='الحد الأقصى'
                type='number'
                value={filterMax}
                onChange={e => setFilterMax(e.target.value)}
              />
            </Grid>
            <Grid item xs={6} sm={1}>
              <TextField
                fullWidth
                type='date'
                label='من تاريخ'
                InputLabelProps={{ shrink: true }}
                value={filterStartDate}
                onChange={e => setFilterStartDate(e.target.value)}
              />
            </Grid>
            <Grid item xs={6} sm={1}>
              <TextField
                fullWidth
                type='date'
                label='إلى تاريخ'
                InputLabelProps={{ shrink: true }}
                value={filterEndDate}
                onChange={e => setFilterEndDate(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={2} sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant='outlined'
                onClick={() => {
                  // reset filters
                  setFilterSafeId('')
                  setFilterFrom('')
                  setFilterQ('')
                  setFilterMin('')
                  setFilterMax('')
                  setFilterStartDate('')
                  setFilterEndDate('')
                }}
              >
                إعادة تعيين
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant='h6' className='mb-3'>
            سجل الإضافات
          </Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>التاريخ</TableCell>
                <TableCell>الخزنة</TableCell>
                <TableCell>وارد من</TableCell>
                <TableCell>البيان</TableCell>
                <TableCell>الوارد</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>{rows}</TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
