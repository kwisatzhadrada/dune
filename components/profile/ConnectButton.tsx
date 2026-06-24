'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ConnectButton({
  currentUserId,
  targetId,
  initialStatus,
}: {
  currentUserId: string
  targetId: string
  initialStatus?: string
}) {
  const supabase = createClient()
  const [status, setStatus] = useState<string | undefined>(initialStatus)

  async function connect() {
    setStatus('pending')
    await supabase.from('connections').upsert(
      { requester_id: currentUserId, addressee_id: targetId, status: 'pending' },
      { onConflict: 'requester_id,addressee_id' }
    )
  }

  if (status === 'accepted') {
    return (
      <Link href={`/messages/${targetId}`} className="bg-[#121428] border border-[#3C3A58] hover:border-[#6D28D9] text-[#EDEAF8] px-4 py-2 rounded-xl text-sm font-medium shrink-0">
        Message
      </Link>
    )
  }

  return (
    <div className="flex gap-2 shrink-0">
      <button
        onClick={connect}
        disabled={!!status}
        className="bg-[#6D28D9] hover:bg-[#8B5CF6] disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-medium"
      >
        {status === 'pending' ? 'Requested' : '+ Connect'}
      </button>
      <Link href={`/messages/${targetId}`} className="bg-[#121428] border border-[#3C3A58] hover:border-[#6D28D9] text-[#EDEAF8] px-4 py-2 rounded-xl text-sm font-medium">
        Message
      </Link>
    </div>
  )
}
