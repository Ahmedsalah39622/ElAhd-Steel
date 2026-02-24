'use client'

import React from 'react'
import Link from 'next/link'

export default function PriceReview() {
  return (
    <div className='p-6'>
      <div className='flex items-center justify-between mb-4'>
        <h1 className='text-2xl font-semibold'>Price Review</h1>
        <Link href='/'>
          <button className='bg-gray-200 px-3 py-1 rounded'>Back</button>
        </Link>
      </div>

      <div className='border p-4'>
        <p>This is a placeholder for the Price Review page. Implement your review UI here.</p>
      </div>
    </div>
  )
}
