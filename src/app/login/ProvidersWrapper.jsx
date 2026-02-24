// src/app/login/ProvidersWrapper.jsx
'use client'
import Providers from '@components/Providers'

export default function ProvidersWrapper({ children }) {
  return <Providers direction='ltr'>{children}</Providers>
}
