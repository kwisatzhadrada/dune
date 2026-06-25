'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DreamActions({
  dreamId,
  currentUserId,
  isFollowing: initialFollowing,
  isOwner,
}: {
  dreamId: string
  currentUserId: string
  isFollowing: boolean
  isOwner: boolean
}) {
  const supabase = createClient()
  const [following, setFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)

  async function toggleFollow() {
    if (isOwner) return
    setLoading(true)
    if (following) {
      await supabase.from('dream_followers').delete().eq('dream_id', dreamId).eq('user_id', currentUserId)
      await supabase.rpc('decrement_dream_followers', { dream_id: dreamId })
      setFollowing(false)
    } else {
      await supabase.from('dream_followers').insert({ dream_id: dreamId, user_id: currentUserId })
      await supabase.rpc('increment_dream_followers', { dream_id: dreamId })
      setFollowing(true)
    }
    setLoading(false)
  }

  if (isOwner) return null

  return (
    <button
      onClick={toggleFollow}
      disabled={loading}
      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${
        following
          ? 'bg-[#6D28D9]/20 border border-[#6D28D9]/40 text-[#8B5CF6] hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400'
          : 'bg-[#6D28D9] hover:bg-[#8B5CF6] text-white'
      }`}
    >
      {following ? 'Following ✓' : '+ Follow Dream'}
    </button>
  )
}
