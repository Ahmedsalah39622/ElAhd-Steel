// src/@core/utils/serverHelpers.server.js
// Only for use in Next.js Server Components
import { cookies } from 'next/headers'

import 'server-only'
import themeConfig from '@configs/themeConfig'

export const getSettingsFromCookie = async () => {
  const cookieStore = await cookies()
  const cookieName = themeConfig.settingsCookieName

  return JSON.parse(cookieStore.get(cookieName)?.value || '{}')
}

export const getMode = async () => {
  const settingsCookie = await getSettingsFromCookie()
  const _mode = settingsCookie.mode || themeConfig.mode

  return _mode
}

export const getSystemMode = async () => {
  const cookieStore = await cookies()
  const mode = await getMode()
  const colorPrefCookie = cookieStore.get('colorPref')?.value || 'light'

  return (mode === 'system' ? colorPrefCookie : mode) || 'light'
}

export const getServerMode = async () => {
  const mode = await getMode()
  const systemMode = await getSystemMode()

  return mode === 'system' ? systemMode : mode
}

export const getSkin = async () => {
  const settingsCookie = await getSettingsFromCookie()

  return settingsCookie.skin || themeConfig.skin
}
