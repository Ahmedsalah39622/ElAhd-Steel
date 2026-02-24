'use client'

// React Imports
import { useEffect, useState, useRef } from 'react'

// MUI Imports
import { styled, useTheme } from '@mui/material/styles'
import Skeleton from '@mui/material/Skeleton'

// Styled Components
const ApexChartWrapper = styled('div')(({ theme }) => ({
  '& .apexcharts-canvas': {
    "& line[stroke='transparent']": {
      display: 'none'
    },
    '& .apexcharts-tooltip': {
      boxShadow: theme.shadows[3],
      borderColor: theme.palette.divider,
      background: theme.palette.background.paper,
      '& .apexcharts-tooltip-title': {
        fontWeight: 600,
        borderColor: theme.palette.divider,
        background: theme.palette.background.paper
      },
      '&.apexcharts-theme-light': {
        color: theme.palette.text.primary
      },
      '&.apexcharts-theme-dark': {
        color: theme.palette.text.primary
      },
      '& .apexcharts-tooltip-series-group:first-of-type': {
        paddingBlockEnd: 0
      },
      '& .apexcharts-tooltip-text-y-value': {
        marginInlineStart: 0,
        fontWeight: 500
      }
    },
    '& .apexcharts-xaxistooltip': {
      borderColor: theme.palette.divider,
      background: theme.palette.mode === 'light' ? theme.palette.grey[50] : theme.palette.customColors?.bodyBg
    },
    '& .apexcharts-yaxistooltip': {
      borderColor: theme.palette.divider,
      background: theme.palette.mode === 'light' ? theme.palette.grey[50] : theme.palette.customColors?.bodyBg
    },
    '& .apexcharts-xaxistooltip-text, & .apexcharts-yaxistooltip-text': {
      color: theme.palette.text.primary
    },
    '& .apexcharts-datalabels-group .apexcharts-text': {
      fill: theme.palette.text.primary
    },
    '& .apexcharts-text, & .apexcharts-tooltip-text, & .apexcharts-datalabel-label, & .apexcharts-datalabel, & .apexcharts-xaxistooltip-text, & .apexcharts-yaxistooltip-text, & .apexcharts-legend-text':
      {
        fontFamily: `${theme.typography.fontFamily} !important`
      },
    '& .apexcharts-pie-label': {
      filter: 'none'
    },
    '& .apexcharts-marker': {
      boxShadow: 'none'
    }
  }
}))

const AppReactApexCharts = props => {
  const theme = useTheme()
  const [Chart, setChart] = useState(null)
  const [ready, setReady] = useState(false)
  const containerRef = useRef(null)

  // Wait for DOM to be ready
  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM is painted
    const frame = requestAnimationFrame(() => {
      if (containerRef.current) {
        setReady(true)
      }
    })

    return () => cancelAnimationFrame(frame)
  }, [])

  // Load chart library after DOM is ready
  useEffect(() => {
    if (ready) {
      import('react-apexcharts').then(mod => {
        setChart(() => mod.default)
      })
    }
  }, [ready])

  const { width, height, ...chartProps } = props

  return (
    <ApexChartWrapper
      ref={containerRef}
      style={{
        width: width || '100%',
        height: height || 100,
        minHeight: height || 100
      }}
    >
      {Chart && ready ? (
        <Chart width={width} height={height} {...chartProps} />
      ) : (
        <Skeleton variant='rectangular' width='100%' height='100%' sx={{ borderRadius: 1 }} />
      )}
    </ApexChartWrapper>
  )
}

AppReactApexCharts.displayName = 'AppReactApexCharts'

export default AppReactApexCharts
