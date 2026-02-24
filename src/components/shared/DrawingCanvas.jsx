'use client'

import { useRef, useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'

// Simple icons for tools
const SquareIcon = () => (
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
</svg>
)
const CircleIcon = () => (
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <circle cx="12" cy="12" r="10" />
</svg>
)
const PencilIcon = () => (
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <path d="M12 19l7-7 3 3-7 7-3-3z" />
  <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
  <path d="M2 2l7.586 7.586" />
  <circle cx="11" cy="11" r="2" />
</svg>
)

const COLORS = [
{ name: 'أسود', value: '#000000' },
{ name: 'أحمر', value: '#FF0000' },
{ name: 'أزرق', value: '#0000FF' },
{ name: 'أخضر', value: '#008000' },
]

export default function DrawingCanvas({ onSave, onClose, initialData = null }) {
const canvasRef = useRef(null)
const [isDrawing, setIsDrawing] = useState(false)
const [ctx, setCtx] = useState(null)

// Tools state
const [tool, setTool] = useState('freehand') // freehand, rectangle, circle
const [color, setColor] = useState('#000000') // stroke color
const [isFilled, setIsFilled] = useState(false) // fill shape (cavity)

// Drawing state
const [startPos, setStartPos] = useState({ x: 0, y: 0 })
const [snapshot, setSnapshot] = useState(null)

// Initialize canvas
useEffect(() => {
  const canvas = canvasRef.current
  if (!canvas) return
  
  // Set canvas dimensions based on container or fixed size
  canvas.width = 600
  canvas.height = 400
  
  const context = canvas.getContext('2d')
  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.strokeStyle = color // Initial color
  context.lineWidth = 2
  
  // Initial background
  context.fillStyle = 'white'
  context.fillRect(0, 0, canvas.width, canvas.height)
  
  setCtx(context)
  
  // Load initial data if available
  if (initialData) {
      const img = new Image()
      img.onload = () => {
          context.drawImage(img, 0, 0)
      }
      img.src = initialData
  }
}, [])

// Update context when color changes
useEffect(() => {
    if (ctx) {
        ctx.strokeStyle = color
        ctx.fillStyle = isFilled ? '#000000' : 'transparent' // Fill works for shapes
    }
}, [color, isFilled, ctx])

const getCoords = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    }
}

const startDrawing = (e) => {
  if (!ctx) return
  setIsDrawing(true)
  const coords = getCoords(e)
  setStartPos(coords)
  
  // Save snapshot for shape tools to restore background while dragging
  if (tool !== 'freehand') {
      setSnapshot(ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height))
  }
  
  ctx.beginPath()
  ctx.moveTo(coords.x, coords.y)
}

const draw = (e) => {
  if (!isDrawing || !ctx) return
  const coords = getCoords(e)
  
  if (tool === 'freehand') {
      ctx.lineTo(coords.x, coords.y)
      ctx.stroke()
  } else if (snapshot) {
      // Restore the snapshot to "erase" the previous drag frame
      ctx.putImageData(snapshot, 0, 0)
      
      const width = coords.x - startPos.x
      const height = coords.y - startPos.y
      
      ctx.beginPath()
      
      if (tool === 'rectangle') {
          ctx.rect(startPos.x, startPos.y, width, height)
      } else if (tool === 'circle') {
          // Calculate radius based on distance
          const radius = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2))
          ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI)
      }
      
      // Apply styles
      ctx.strokeStyle = color
      ctx.stroke()
      
      if (isFilled) {
          ctx.fillStyle = '#000000' // Always black for cavity as requested, or could use current color
          ctx.fill()
      }
  }
}

const finishDrawing = () => {
  setIsDrawing(false)
  ctx.beginPath()
  // No need to clear snapshot, just ignore it until next start
}

const handleClear = () => {
    if (!ctx || !canvasRef.current) return
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height)
}

const handleSave = () => {
    if (!canvasRef.current) return
    const dataUrl = canvasRef.current.toDataURL('image/png')
    onSave(dataUrl)
}

return (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, p: 2 }}>
      
      {/* Toolbar */}
      <Stack direction="row" spacing={2} sx={{ mb: 1, p: 1, border: '1px solid #eee', borderRadius: 2 }}>
          
          <ToggleButtonGroup
              value={tool}
              exclusive
              onChange={(e, newTool) => newTool && setTool(newTool)}
              aria-label="drawing tools"
              size="small"
          >
              <ToggleButton value="freehand" aria-label="freehand">
                  <Tooltip title="رسم حر"><PencilIcon /></Tooltip>
              </ToggleButton>
              <ToggleButton value="rectangle" aria-label="rectangle">
                  <Tooltip title="مستطيل"><SquareIcon /></Tooltip>
              </ToggleButton>
              <ToggleButton value="circle" aria-label="circle">
                  <Tooltip title="دائرة"><CircleIcon /></Tooltip>
              </ToggleButton>
          </ToggleButtonGroup>

          <Divider orientation="vertical" flexItem />

          <ToggleButtonGroup
              value={isFilled}
              onChange={() => setIsFilled(!isFilled)}
              aria-label="fill setting"
              size="small"
          >
               <ToggleButton value={true} selected={isFilled} aria-label="fill">
                  <Tooltip title="ملء الشكل (تجويف)"><Typography>{isFilled ? '⬛' : '🔲'}</Typography></Tooltip>
              </ToggleButton>
          </ToggleButtonGroup>

          <Divider orientation="vertical" flexItem />

          <Stack direction="row" spacing={1} alignItems="center">
              {COLORS.map((c) => (
                  <Tooltip key={c.value} title={c.name}>
                      <Box
                          onClick={() => setColor(c.value)}
                          sx={{
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              backgroundColor: c.value,
                              cursor: 'pointer',
                              border: color === c.value ? '2px solid #333' : '1px solid #ccc',
                              boxShadow: color === c.value ? '0 0 4px rgba(0,0,0,0.3)' : 'none'
                          }}
                      />
                  </Tooltip>
              ))}
          </Stack>
      </Stack>

      {/* Canvas Area */}
      <Box 
          sx={{ 
              border: '2px solid #ccc', 
              borderRadius: 2, 
              overflow: 'hidden',
              touchAction: 'none',
              cursor: 'crosshair',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
      >
          <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseUp={finishDrawing}
              onMouseMove={draw}
              onMouseLeave={finishDrawing}
              onTouchStart={startDrawing}
              onTouchEnd={finishDrawing}
              onTouchMove={draw}
              style={{ display: 'block' }}
          />
      </Box>
      
      {/* Action Buttons */}
      <Stack direction="row" spacing={2} sx={{ width: '100%', justifyContent: 'center' }}>
          <Button variant="outlined" color="error" onClick={handleClear}>
              مسح بالكامل
          </Button>
          <Button variant="outlined" color="inherit" onClick={onClose}>
              إلغاء
          </Button>
          <Button variant="contained" color="primary" onClick={handleSave}>
              حفظ الرسم
          </Button>
      </Stack>
  </Box>
)
}
