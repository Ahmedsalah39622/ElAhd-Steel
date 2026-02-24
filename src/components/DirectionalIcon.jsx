// src/components/DirectionalIcon.jsx
import React from 'react'

// Simple placeholder icon component
const DirectionalIcon = ({ direction = 'right', ...props }) => {
  // You can replace this with any SVG or icon logic you want
  return (
    <span {...props} aria-label={`Arrow ${direction}`} role='img'>
      {direction === 'left' ? '←' : direction === 'up' ? '↑' : direction === 'down' ? '↓' : '→'}
    </span>
  )
}

export default DirectionalIcon
