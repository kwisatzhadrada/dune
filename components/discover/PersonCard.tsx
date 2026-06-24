'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/lib/types'
import { getInitials, generateMatchScore, getMatchReasons } from '@/lib/utils'

export default function PersonCard({
  person,
  me,
  currentUserId,
  initialStatus,
}: {
  person: Profile
  me: Profile
  currentUserId: string
  initialStatus?: string
}) {
  const supabase = createClient()
  const [status, setStatus] = useState<string | undefined>(initialStatus)
  const score = generateMatchScore(me, person)
  const reasons = getMatchReasons(me, person)

  async function connect() {
    setStatus('pending')
    await supabase.from('connections').upsert(
      { requester_id: currentUserId, addressee_id: person.id, status: 'pending' },
      { onConflict: 'requester_id,addressee_id' }
    )
  }

  return (
    <div className="bg-[#0C0D22] border border-[#3C3A58]/30 rounded-2xl p-5 flex flex-col">
      <div className="flex items-start gap-3">
        <Link href={`/profile/${person.id}`}>
          {person.avatar_url ? (
            <Image src={person.avatar_url} alt="" width={48} height={48} className="rounded-full object-cover w-12 h-12" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-[#6D28D9] flex items-center justify-center font-semibold text-white">
              {getInitials(person.full_name)}
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/profile/${person.id}`} className="font-medium hover:underline block truncate">
            {person.full_name}
          </Link>
          <div className="text-sm text-[#8A88A8] truncate">
            {person.industry || 'Builder'}{person.location ? ` · ${person.location}` : ''}
          </div>
        </div>
        {score > 0 && (
          <div className="text-right">
            <div className="text-[#22C55E] font-bold text-sm">{score}%</div>
            <div className="text-[10px] text-[#8A88A8]">match</div>
          </div>
        )}
      </div>

      {person.current_goal && (
        <div className="mt-3 text-sm text-[#8B5CF6]">🎯 {person.current_goal}</div>
      )}
      {person.current_blocker && (
        <div className="mt-1 text-sm text-[#F59E0B]">🧱 {person.current_blocker}</div>
      )}

      {person.skills && person.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {person.skills.slice(0, 4).map((s) => (
            <span key={s} className="text-xs bg-[#121428] border border-[#3C3A58] text-[#8A88A8] px-2 py-0.5 rounded-md">{s}</span>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {reasons.map((r) => (
          <span key={r} className="text-[11px] text-[#22C55E] bg-[#16A34A]/10 border border-[#16A34A]/20 px-2 py-0.5 rounded-md">{r}</span>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        {status === 'accepted' ? (
          <Link href={`/messages/${person.id}`} className="flex-1 text-center bg-[#121428] border border-[#3C3A58] hover:border-[#6D28D9] text-[#EDEAF8] py-2 rounded-xl text-sm font-medium">
            Message
          </Link>
        ) : (
          <button
            onClick={connect}
            disabled={!!status}
            className="flex-1 bg-[#6D28D9] hover:bg-[#8B5CF6] disabled:opacity-50 text-white py-2 rounded-xl text-sm font-medium"
          >
            {status === 'pending' ? 'Requested' : '+ Connect'}
          </button>
        )}
        <Link href={`/profile/${person.id}`} className="bg-[#121428] border border-[#3C3A58] hover:border-[#6D28D9] text-[#EDEAF8] px-4 py-2 rounded-xl text-sm font-medium">
          View
        </Link>
      </div>
    </div>
  )
}
