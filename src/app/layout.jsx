// MUI Imports
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'

// Third-party Imports
import 'react-perfect-scrollbar/dist/css/styles.css'

// Util Imports
import { getSystemMode } from '@core/utils/serverHelpers'

// Style Imports
import '@/app/globals.css'
import '@/app/animations.css'

export const metadata = {
  title: 'Ahd',
  description: 'القاهرة',
  keywords: ['Ahd Steel', 'System', 'حديد', 'صلب', 'نظام إدارة'],
  icons: {
    icon: '/images/logos/company-favicon.png',
    apple: '/images/logos/company-favicon.png'
  }
}

import Providers from '@components/Providers'
import { Analytics } from '@vercel/analytics/react'

const RootLayout = async props => {
  const { children } = props

  // Vars
  const systemMode = await getSystemMode()
  const direction = 'rtl'

  return (
    <html id='__next' lang='ar' dir={direction} suppressHydrationWarning>
      <body className='flex is-full min-bs-full flex-auto flex-col'>
        <InitColorSchemeScript attribute='data' defaultMode={systemMode} />
        <Providers direction={direction}>{children}</Providers>
        <Analytics />
      </body>
    </html>
  )
}

export default RootLayout
