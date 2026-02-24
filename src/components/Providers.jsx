"use client"

// Context Imports
import { VerticalNavProvider } from '@menu/contexts/verticalNavContext'
import { SettingsProvider } from '@core/contexts/settingsContext'
import ThemeProvider from '@components/theme'
import { AuthProvider } from '@core/contexts/authContext'
import { useEffect } from 'react'

// Util Imports
import themeConfig from '@configs/themeConfig'

const Providers = props => {
  const { children, direction } = props

  // Use default config for client-side rendering
  const mode = themeConfig.mode
  const systemMode = themeConfig.mode
  const settingsCookie = {}

  useEffect(() => {
    try {
      import('@assets/iconify-icons/generated-icons.css')
        .then(() => {})
        .catch(() => {})
    } catch (e) {
      // ignore
    }
  }, [])

  return (
    <VerticalNavProvider>
      <SettingsProvider settingsCookie={settingsCookie} mode={mode}>
        <AuthProvider>
          <ThemeProvider direction={direction} systemMode={systemMode}>
            {children}
          </ThemeProvider>
        </AuthProvider>
      </SettingsProvider>
    </VerticalNavProvider>
  )
}


export default Providers
