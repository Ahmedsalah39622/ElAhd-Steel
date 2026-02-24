'use client'

import React, { useEffect, useState } from 'react'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

import Grid from '@mui/material/Grid'

import PreviewActions from './PreviewActions'
import PreviewCard from './PreviewCard'
import './print.css'

export default function PreviewInvoiceDashboard() {
  const { id } = useParams() || {}
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [invoice, setInvoice] = useState(null)
  const [status, setStatus] = useState('draft')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetch(`/api/invoices?id=${id}`, { credentials: 'include' })
      .then(r => {
        if (!r.ok) throw new Error('Failed to load invoice')

        return r.json()
      })
      .then(d => {
        setInvoice(d)
        setStatus(d.status || 'draft')
      })
      .catch(err => {
        console.error('Error loading invoice:', err)
      })
      .finally(() => setLoading(false))
  }, [id])

  const handlePrint = () => {
    // Open printable content in a separate window to avoid dashboard chrome
    handleDownload()
  }

  const handleDownload = () => {
    const element = document.querySelector('.invoice-card')
    const printWindow = window.open('', '', 'height=900,width=800')

    if (printWindow && element) {
      const printCSS = `
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');

        @page {
          size: A4 portrait;
          margin: 10mm;
        }

        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        html, body {
          margin: 0;
          padding: 0;
          width: 100%;
          font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif;
          direction: rtl;
          background: #fff;
          color: #333;
          -webkit-font-smoothing: antialiased;
        }

        .invoice-card {
          width: 100%;
          padding: 5mm;
          box-sizing: border-box;
          font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        thead {
          display: table-header-group;
        }

        tr {
          page-break-inside: avoid;
        }

        img {
          max-width: 100%;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          html, body {
            width: 100%;
            margin: 0;
            padding: 0;
          }
          .invoice-card {
            width: 100% !important;
            margin: 0 !important;
            padding: 5mm !important;
            box-shadow: none !important;
          }
        }
      `

      printWindow.document.write('<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>Invoice</title>')
      printWindow.document.write('<style>' + printCSS + '</style>')
      printWindow.document.write('</head><body>')
      printWindow.document.write('<div class="invoice-card">' + element.innerHTML + '</div>')
      printWindow.document.write('</body></html>')
      printWindow.document.close()
      setTimeout(() => {
        printWindow.print()
      }, 500)
    }
  }

  const handleSend = () => {
    alert('Send invoice feature coming soon!')
  }

  const handleStatusChange = newStatus => {
    setStatus(newStatus)

    // Update status in database
    fetch(`/api/invoices?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...invoice, status: newStatus })
    })
      .then(r => r.json())
      .then(() => {
        setInvoice({ ...invoice, status: newStatus })
      })
      .catch(err => console.error('Error updating status:', err))
  }

  if (loading) {
    return (
      <div className='p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h1 className='text-3xl font-semibold'>جاري تحميل الفاتورة...</h1>
        </div>
        <p>يرجى الانتظار أثناء تحميل الفاتورة.</p>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className='p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h1 className='text-3xl font-semibold'>الفاتورة غير موجودة</h1>
          <Link href='/invoices'>
            <button className='bg-gray-200 px-4 py-2 rounded hover:bg-gray-300'>رجوع</button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className='p-6' dir='rtl'>
      <div className='flex items-center justify-between mb-6 no-print'>
        <h1 className='text-3xl font-semibold'>معاينة الفاتورة #{invoice.number}</h1>
        <Link href='/invoices'>
          <button className='bg-gray-200 px-4 py-2 rounded hover:bg-gray-300'>رجوع للقائمة</button>
        </Link>
      </div>

      <Grid container spacing={6}>
        <Grid size={{ xs: 12, md: 9 }}>
          <PreviewCard invoiceData={invoice} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }} className='no-print'>
          <PreviewActions
            id={invoice.number}
            onButtonClick={handlePrint}
            invoiceStatus={status}
            onStatusChange={handleStatusChange}
            onDownload={handleDownload}
            onSend={handleSend}
          />
        </Grid>
      </Grid>

      {/* Edit Button */}
      <div className='flex gap-2 mt-6 no-print'>
        <Link href={`/invoices/${id}/edit`}>
          <button className='bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-medium'>
            تعديل الفاتورة
          </button>
        </Link>
      </div>
    </div>
  )
}
