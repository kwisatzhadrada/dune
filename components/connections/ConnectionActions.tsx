'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ConnectionActions({ connectionId }: { connectionId: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function respond(status: 'accepted' | 'declined') {
    setLoading(true)
    await supabase.from('connections').update({ status }).eq('id', connectionId)
    router.refresh()
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => respond('accepted')}
        disabled={loading}
        className="bg-[#6D28D9] hover:bg-[#8B5CF6] disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-medium"
      >
        Accept
      </button>
      <button
        onClick={() => respond('declined')}
        disabled={loading}
        className="bg-[#121428] border border-[#3C3A58] hover:border-red-500/40 hover:text-red-400 text-[#8A88A8] px-4 py-2 rounded-xl text-sm font-medium"
      >
        Decline
      </button>
    </div>
  )
}
