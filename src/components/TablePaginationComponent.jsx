'use client'

import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

const TablePaginationComponent = ({ table }) => {
  try {
    const page = table.getState().pagination.pageIndex || 0
    const pageSize = table.getState().pagination.pageSize || 0
    const total = table.getFilteredRowModel ? table.getFilteredRowModel().rows.length : 0
    const from = total === 0 ? 0 : page * pageSize + 1
    const to = Math.min((page + 1) * pageSize, total)

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1 }}>
        <Typography variant='body2' color='text.secondary'>
          Showing {from} - {to} of {total}
        </Typography>
      </Box>
    )
  } catch (e) {
    return null
  }
}

export default TablePaginationComponent
