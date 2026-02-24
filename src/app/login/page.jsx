'use client'

import React, { Suspense } from 'react'
import ProvidersWrapper from './ProvidersWrapper'
import LoginV2 from 'src/views/LoginV2'

export default function LoginPage() {
  return (
    <ProvidersWrapper>
      <Suspense fallback={<div />}>
        <LoginV2 />
      </Suspense>
    </ProvidersWrapper>
  )
}
