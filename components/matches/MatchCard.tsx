'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/lib/types'
import { getInitials, getMatchReasons } from '@/lib/utils'

export default function MatchCard({
  person,
  me,
  score,
  currentUserId,
  initialStatus,
}: {
  person: Profile
  me: Profile
  score: number
  currentUserId: string
  initialStatus?: string
}) {
  const supabase = createClient()
  const [status, setStatus] = useState<string | undefined>(initialStatus)
  const reasons = getMatchReasons(me, person)

  async function connect() {
    setStatus('pending')
    await supabase.from('connections').upsert(
      { requester_id: currentUserId, addressee_id: person.id, status: 'pending' },
      { onConflict: 'requester_id,addressee_id' }
    )
  }

  return (
    <div className="bg-[#0C0D22] border border-[#3C3A58]/30 rounded-2xl p-5">
      <div className="flex items-start gap-4">
        <Link href={`/profile/${person.id}`}>
          {person.avatar_url ? (
            <Image src={person.avatar_url} alt="" width={52} height={52} className="rounded-full object-cover w-13 h-13" />
          ) : (
            <div className="w-13 h-13 w-[52px] h-[52px] rounded-full bg-[#6D28D9] flex items-center justify-center font-semibold text-white">
              {getInitials(person.full_name)}
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <Link href={`/profile/${person.id}`} className="font-medium hover:underline truncate">
              {person.full_name}
            </Link>
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-24 h-2 bg-[#121428] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#6D28D9] to-[#22C55E]" style={{ width: `${score}%` }} />
              </div>
              <span className="text-[#22C55E] font-bold text-sm w-10 text-right">{score}%</span>
            </div>
          </div>
          <div className="text-sm text-[#8A88A8] truncate">
            {person.industry || 'Builder'}{person.location ? ` · ${person.location}` : ''}
          </div>
          {person.current_blocker && (
            <div className="mt-2 text-sm text-[#F59E0B]">🧱 {person.current_blocker}</div>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {reasons.map((r) => (
              <span key={r} className="text-[11px] text-[#22C55E] bg-[#16A34A]/10 border border-[#16A34A]/20 px-2 py-0.5 rounded-md">{r}</span>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            {status === 'accepted' ? (
              <Link href={`/messages/${person.id}`} className="bg-[#121428] border border-[#3C3A58] hover:border-[#6D28D9] text-[#EDEAF8] px-4 py-2 rounded-xl text-sm font-medium">
                Message
              </Link>
            ) : (
              <button
                onClick={connect}
                disabled={!!status}
                className="bg-[#6D28D9] hover:bg-[#8B5CF6] disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-medium"
              >
                {status === 'pending' ? 'Requested' : '+ Connect'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
