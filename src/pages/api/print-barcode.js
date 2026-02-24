import { initializeDatabase } from '@/utils/db'

export default async function handler(req, res) {
  const { materialId } = req.query

  if (!materialId) {
    return res.status(400).send('Material ID required')
  }

  try {
    const { Material } = await initializeDatabase()
    const material = await Material.findByPk(materialId)

    if (!material) {
      return res.status(404).send('Material not found')
    }

    // Try server-side barcode generation (bwip-js). If bwip-js isn't installed or fails,
    // we'll fall back to client-side JsBarcode rendering.
    let barcodeDataUrl = null

    try {
      const bwipjs = require('bwip-js')
      const code = String(material.sku || material.id || '')
      if (code) {
        const png = await bwipjs.toBuffer({
          bcid: 'code128',
          text: code,
          scale: 3,
          height: 30,
          includetext: true,
          textxalign: 'center'
        })
        barcodeDataUrl = `data:image/png;base64,${png.toString('base64')}`
      }
    } catch (bwErr) {
      // bwip-js not available or failed — client-side fallback will be used
      barcodeDataUrl = null
    }

    const html = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>Barcode - ${material.name}</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background-color: #fff !important; /* Force white background */
            color: #000 !important; /* Force black text */
          }
          .card {
            border: 2px solid #000;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            max-width: 400px;
            width: 100%;
            min-height: 300px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          h1 {
            font-size: 24px;
            margin: 0 0 10px;
            font-weight: bold;
          }
          .meta {
            font-size: 16px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
          }
          .barcode-area {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin: 20px 0 10px 0;
          }
          /* Dark mode override for when viewing in browser with dark theme extension or system pref */
          @media (prefers-color-scheme: dark) {
            body {
              background-color: #fff !important;
              color: #000 !important;
            }
          }

          @media print {
            body { 
                background-color: white !important; 
                -webkit-print-color-adjust: exact; 
                color: black !important;
            }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>${material.name}</h1>
          <div class="meta">
             <span>${material.unit || ''}</span>
             <span>${material.sku || ''}</span>
          </div>
          <div class="barcode-area">
            ${barcodeDataUrl ? `<img id="barcode-img" src="${barcodeDataUrl}" alt="barcode" />` : `<svg id="barcode"></svg>`}
          </div>
          <div style="margin-top: 10px; font-weight: bold;">
             ${material.materialName || ''} ${material.grade || ''}
          </div>
        </div>
        <div class="no-print" style="margin-top: 20px;">
            <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px;">طباعة / Print</button>
        </div>
        <script>
          (function() {
            // client-side fallback: only load JsBarcode if server-side image wasn't generated
            if (!document.getElementById('barcode-img')) {
              var s = document.createElement('script')
              s.src = 'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js'
              s.onload = function() {
                JsBarcode('#barcode', '${material.sku || material.id}', {
                  format: 'CODE128',
                  width: 2,
                  height: 80,
                  displayValue: true
                })
              }
              document.head.appendChild(s)
            }
          })()
        </script>
      </body>
      </html>
    `

    res.setHeader('Content-Type', 'text/html')
    res.send(html)

  } catch (err) {
    console.error('Barcode error:', err)
    res.status(500).send('Server Error')
  }
}
