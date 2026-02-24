'use client'

import { useEffect, useState, useRef } from 'react'

/**
 * Animated counting number component
 * @param {number} end - The final number to count to
 * @param {number} start - Starting number (default 0)
 * @param {number} duration - Duration of animation in ms (default 2000)
 * @param {string} prefix - Text before the number (e.g., '$')
 * @param {string} suffix - Text after the number (e.g., '%')
 * @param {number} decimals - Number of decimal places (default 0)
 * @param {boolean} separator - Whether to use thousand separators (default true)
 */
const CountUp = ({
  end,
  start = 0,
  duration = 2000,
  prefix = '',
  suffix = '',
  decimals = 0,
  separator = true,
  className = ''
}) => {
  const [count, setCount] = useState(start)
  const [isVisible, setIsVisible] = useState(false)
  const countRef = useRef(null)
  const hasAnimated = useRef(false)

  // Intersection observer to trigger animation when visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !hasAnimated.current) {
            setIsVisible(true)
            hasAnimated.current = true
          }
        })
      },
      { threshold: 0.3 }
    )

    if (countRef.current) {
      observer.observe(countRef.current)
    }

    return () => observer.disconnect()
  }, [])

  // Animate the count
  useEffect(() => {
    if (!isVisible) return

    const startTime = performance.now()
    const startValue = start
    const endValue = typeof end === 'number' ? end : parseFloat(String(end).replace(/[^0-9.-]/g, '')) || 0

    const animate = currentTime => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function for smooth animation (easeOutExpo)
      const easeOutExpo = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      const currentValue = startValue + (endValue - startValue) * easeOutExpo

      setCount(currentValue)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [isVisible, end, start, duration])

  // Format the number
  const formatNumber = num => {
    const fixed = num.toFixed(decimals)

    if (separator) {
      const parts = fixed.split('.')

      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')

      return parts.join('.')
    }

    return fixed
  }

  return (
    <span ref={countRef} className={`count-up-number ${className}`}>
      {prefix}
      {formatNumber(count)}
      {suffix}
    </span>
  )
}

export default CountUp
