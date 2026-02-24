// Client-safe helpers (no next/headers)
import themeConfig from '@configs/themeConfig'

// Dummy implementations for client-side usage
export const getSettingsFromCookie = async () => {
  return {}
}

export const getMode = async () => {
  return themeConfig.mode
}

export const getSystemMode = async () => {
  return themeConfig.mode
}

export const getServerMode = async () => {
  return themeConfig.mode
}

export const getSkin = async () => {
  return themeConfig.skin
}
