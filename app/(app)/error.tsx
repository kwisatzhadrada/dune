'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[AppError]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#08081C] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-4xl mb-4">⚠️</div>
        <h1 className="font-['Space_Grotesk'] text-xl font-bold text-[#EDEAF8] mb-2">Something went wrong</h1>
        <p className="text-[#8A88A8] text-sm mb-6">
          We hit an unexpected error. Your data is safe.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-[#6D28D9] hover:bg-[#8B5CF6] text-white px-4 py-2 rounded-xl text-sm font-medium"
          >
            Try again
          </button>
          <Link
            href="/feed"
            className="bg-[#121428] border border-[#3C3A58] hover:border-[#6D28D9] text-[#EDEAF8] px-4 py-2 rounded-xl text-sm font-medium"
          >
            Go to feed
          </Link>
        </div>
      </div>
    </div>
  )
}
