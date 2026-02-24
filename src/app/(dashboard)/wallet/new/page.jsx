"use client"
import React, { useState } from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'

export default function NewWalletPage() {
  const [form, setForm] = useState({ name: 'Personal Wallet', allowMain: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleCreate() {
    try {
      setLoading(true); setError(null)
      const res = await fetch('/api/wallets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ name: form.name, allowMainSafeWithdraw: form.allowMain }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create wallet')
      // after creating, go back to /wallet where it will be displayed
      window.location.href = '/wallet'
    } catch (e) {
      setError(e.message)
    } finally { setLoading(false) }
  }

  return (
    <div className='p-6'>
      <Typography variant='h4' className='mb-4'>إجراءات إنشاء المحفظة</Typography>
      <Card className='mb-4'>
        <CardContent>
          <Typography className='mb-3'>تأكد من بيانات المحفظة، واختر ما إذا كنت تسمح للخزنة الرئيسية بسحب الأموال من هذه المحفظة.</Typography>
          <TextField fullWidth label='اسم المحفظة' value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} className='mb-3' />
          <FormControlLabel control={<Checkbox checked={form.allowMain} onChange={e => setForm(prev => ({ ...prev, allowMain: e.target.checked }))} />} label='السماح للخزنة الرئيسية بسحب الأموال' />
          {error && <div className='text-red-500 mt-2'>{error}</div>}
          <div className='flex gap-3 mt-3'>
            <Button variant='contained' onClick={handleCreate} disabled={loading}>إنشاء وحفظ</Button>
            <Button variant='outlined' onClick={() => { window.location.href = '/wallet' }}>إلغاء</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant='h6'>إجراءات موصى بها</Typography>
          <ul className='list-disc ml-6 mt-2'>
            <li>تأكد من اختيار اسم واضح للمحفظة.</li>
            <li>إذا اخترت السماح للخزنة الرئيسية بالسحب، فستتمكن من تحويل الأموال مباشرةً إلى الخزنة الرئيسية.</li>
            <li>بعد الإنشاء، يمكنك الإيداع والتحويل ورؤية سجل المعاملات في صفحة المحفظة.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
