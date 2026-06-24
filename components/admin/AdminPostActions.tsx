'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminPostActions({ postId }: { postId: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [deleted, setDeleted] = useState(false)

  async function remove() {
    if (!confirm('Delete this post permanently?')) return
    setDeleting(true)
    const { error } = await supabase.from('posts').delete().eq('id', postId)
    if (!error) {
      setDeleted(true)
      router.refresh()
    }
    setDeleting(false)
  }

  if (deleted) return <span className="text-xs text-[#8A88A8]">Deleted</span>

  return (
    <button
      onClick={remove}
      disabled={deleting}
      className="text-xs text-[#EF4444] hover:text-[#DC2626] border border-[#EF4444]/30 hover:border-[#EF4444] px-2.5 py-1 rounded-lg disabled:opacity-50"
    >
      {deleting ? 'Removing...' : 'Remove'}
    </button>
  )
}
