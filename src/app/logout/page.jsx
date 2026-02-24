'use client'

import React, { useState } from 'react'
import { Button, Box, Typography } from '@mui/material'
import { useRouter } from 'next/navigation'
import { useAuth } from '@core/contexts/authContext'

export default function LogoutPage() {
  const { logout } = useAuth()
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setLoading(true)
    try {
      await logout()
      // Ensure we land on the login page after logout
      router.push('/login')
    } catch (e) {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box className='min-h-screen flex items-center justify-center'>
      <Box sx={{ width: 360, p: 4, boxShadow: 3, borderRadius: 2 }}>
        <Typography variant='h6' align='center' sx={{ mb: 2 }}>
          Logout
        </Typography>
        <Typography variant='body2' align='center' color='text.secondary' sx={{ mb: 3 }}>
          Click the button below to log out and return to the public home page.
        </Typography>
        <Button fullWidth variant='contained' color='error' size='large' onClick={handleLogout} disabled={loading}>
          {loading ? 'Logging out...' : 'Logout'}
        </Button>
      </Box>
    </Box>
  )
}
