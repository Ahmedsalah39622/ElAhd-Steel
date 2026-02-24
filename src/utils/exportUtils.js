// Export utilities for Excel and PDF
import { COMPANY_NAME, COMPANY_LOGO, COMPANY_LOGO_FALLBACK } from '@/utils/companyInfo'

/**
 * Export data to CSV (Excel compatible)
 */
export const exportToCSV = (data, columns, filename) => {
  if (!data || data.length === 0) {
    alert('No data to export')

    return
  }

  const escape = v => {
    if (v === null || v === undefined) return ''
    const s = String(v)

    if (s.includes(',') || s.includes('\n') || s.includes('"')) {
      return '"' + s.replace(/"/g, '""') + '"'
    }

    return s
  }

  // Headers
  const headers = columns.map(col => escape(col.header))
  const lines = [headers.join(',')]

  // Data rows
  for (const row of data) {
    const line = columns.map(col => {
      let value = row[col.key]

      if (col.format) {
        value = col.format(value, row)
      }

      return escape(value)
    })

    lines.push(line.join(','))
  }

  const csv = '\ufeff' + lines.join('\r\n') // BOM for Excel UTF-8
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')

  a.href = url
  a.setAttribute('download', `${filename}-${new Date().toISOString().slice(0, 10)}.csv`)
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Export data to PDF using browser print
 */
export const exportToPDF = (data, columns, title, filename) => {
  if (!data || data.length === 0) {
    alert('No data to export')

    return
  }

  // Create print-friendly HTML
  const printWindow = window.open('', '_blank')

  const tableRows = data
    .map((row, idx) => {
      const rowNum = `<td class="row-num">${idx + 1}</td>`
      const cells = columns
        .map(col => {
          let value = row[col.key]

          if (col.format) {
            value = col.format(value, row)
          }

          return `<td>${value ?? ''}</td>`
        })
        .join('')

      return `<tr class="${idx % 2 === 0 ? 'even' : 'odd'}">${rowNum}${cells}</tr>`
    })
    .join('')

  const tableHeaders = `<th class="row-num">#</th>` + columns.map(col => `<th>${col.header}</th>`).join('')

  const html = `
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        @page { 
          size: A4 portrait !important; 
          margin: 10mm; 
        }
        @media print {
          @page { 
            size: A4 portrait !important; 
            margin: 10mm; 
          }
          html, body {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body {
            padding: 0 !important;
          }
        }
        * { 
          margin: 0; 
          padding: 0; 
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        html {
          width: 100%;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 10mm;
          font-size: 11px;
          line-height: 1.4;
          color: #333;
          width: 100%;
          max-width: 100%;
          overflow: hidden;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 3px solid #1976d2;
          padding-bottom: 15px;
          margin-bottom: 15px;
        }
        .logo-section {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .logo {
          max-height: 60px;
          max-width: 80px;
        }
        .company-info {
          text-align: right;
        }
        .company-name {
          font-size: 16px;
          font-weight: bold;
          color: #1976d2;
          margin-bottom: 3px;
        }
        .company-subtitle {
          font-size: 11px;
          color: #666;
        }
        .report-info {
          text-align: left;
        }
        .report-title {
          font-size: 20px;
          font-weight: bold;
          color: #333;
          margin-bottom: 5px;
        }
        .report-date {
          font-size: 12px;
          color: #666;
        }
        .stats-bar {
          display: flex;
          gap: 20px;
          margin-bottom: 15px;
          padding: 10px 15px;
          background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
          border-radius: 8px;
          border: 1px solid #ddd;
        }
        .stat-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .stat-label {
          font-size: 11px;
          color: #666;
        }
        .stat-value {
          font-size: 14px;
          font-weight: bold;
          color: #1976d2;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          font-size: 10px;
          table-layout: fixed;
        }
        th {
          background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
          color: white;
          padding: 10px 6px;
          text-align: center;
          font-weight: 600;
          border: 1px solid #1565c0;
          overflow: hidden;
          text-overflow: ellipsis;
          word-wrap: break-word;
        }
        td {
          border: 1px solid #ddd;
          padding: 8px 6px;
          text-align: center;
          vertical-align: middle;
          overflow: hidden;
          text-overflow: ellipsis;
          word-wrap: break-word;
        }
        tr.even {
          background-color: #ffffff;
        }
        tr.odd {
          background-color: #f8f9fa;
        }
        tr:hover {
          background-color: #e3f2fd !important;
        }
        .row-num {
          width: 30px;
          font-weight: bold;
          color: #666;
          background-color: #f5f5f5;
        }
        th.row-num {
          background: linear-gradient(135deg, #455a64 0%, #37474f 100%);
          color: white;
          width: 30px;
        }
        .footer {
          margin-top: 20px;
          padding-top: 15px;
          border-top: 2px solid #1976d2;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10px;
          color: #666;
        }
        .footer-left {
          display: flex;
          gap: 20px;
        }
        .page-number {
          text-align: left;
        }
        @media print {
          body {
            padding: 0 !important;
          }
          tr {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo-section">
          <img src="${COMPANY_LOGO}" alt="${COMPANY_NAME} Logo" class="logo" onerror="this.onerror=null; this.src='${COMPANY_LOGO_FALLBACK}'" />
          <div class="company-info">
            <div class="company-name">${COMPANY_NAME}</div>
            <div class="company-subtitle"></div>
          </div>
        </div>
        <div class="report-info">
          <div class="report-title">${title}</div>
          <div class="report-date">تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}</div>
        </div>
      </div>
      
      <div class="stats-bar">
        <div class="stat-item">
          <span class="stat-label">إجمالي السجلات:</span>
          <span class="stat-value">${data.length.toLocaleString('ar-EG')}</span>
        </div>
      </div>

      <table>
        <thead>
          <tr>${tableHeaders}</tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      <div class="footer">
        <div class="footer-left">
          <span>تم إنشاء التقرير بواسطة نظام ${COMPANY_NAME}</span>
          <span>|</span>
          <span>${new Date().toLocaleString('ar-EG')}</span>
        </div>
        <div class="page-number"></div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        }
      </script>
    </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
}

/**
 * Format currency
 */
export const formatCurrency = value => {
  if (value === null || value === undefined || value === '') return '-'
  const num = parseFloat(value)

  if (isNaN(num)) return '-'

  return num.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/**
 * Format date
 */
export const formatDate = value => {
  if (!value) return '-'

  try {
    return new Date(value).toLocaleDateString('ar-EG')
  } catch {
    return value
  }
}

/**
 * Format number
 */
export const formatNumber = value => {
  if (value === null || value === undefined || value === '') return '-'
  const num = parseFloat(value)

  if (isNaN(num)) return '-'

  return num.toLocaleString('ar-EG')
}
