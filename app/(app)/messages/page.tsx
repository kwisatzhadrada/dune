import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getInitials, formatTimeAgo } from '@/lib/utils'
import { Profile } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${user!.id},receiver_id.eq.${user!.id}`)
    .order('created_at', { ascending: false })
    .limit(500)

  const threads = new Map<string, { lastContent: string; lastAt: string; unread: number }>()
  ;(messages || []).forEach((m) => {
    const other = m.sender_id === user!.id ? m.receiver_id : m.sender_id
    if (!threads.has(other)) {
      threads.set(other, { lastContent: m.content, lastAt: m.created_at, unread: 0 })
    }
    const t = threads.get(other)!
    if (m.receiver_id === user!.id && !m.read) t.unread += 1
  })

  const otherIds = Array.from(threads.keys())
  let profiles: Profile[] = []
  if (otherIds.length > 0) {
    const { data } = await supabase.from('profiles').select('*').in('id', otherIds)
    profiles = (data as Profile[]) || []
  }
  const profileMap = new Map(profiles.map((p) => [p.id, p]))

  const sorted = otherIds.sort((a, b) => {
    return new Date(threads.get(b)!.lastAt).getTime() - new Date(threads.get(a)!.lastAt).getTime()
  })

  return (
    <div>
      <h1 className="font-['Space_Grotesk'] text-2xl font-bold mb-6">Messages</h1>

      <Link
        href="/messages/group"
        className="flex items-center gap-3 bg-[#0C0D22] border border-[#6D28D9]/30 hover:border-[#6D28D9] rounded-2xl p-4 mb-4 transition-colors"
      >
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6D28D9] to-[#8B5CF6] flex items-center justify-center text-xl">🌐</div>
        <div className="flex-1">
          <div className="font-medium">Community Group Chat</div>
          <div className="text-sm text-[#8A88A8]">24/7 live help from all builders</div>
        </div>
        <span className="text-[#8A88A8]">→</span>
      </Link>

      <div className="space-y-2">
        {sorted.length === 0 ? (
          <div className="text-center text-[#8A88A8] py-16">No conversations yet. Connect with builders to start chatting.</div>
        ) : (
          sorted.map((id) => {
            const t = threads.get(id)!
            const p = profileMap.get(id)
            return (
              <Link
                key={id}
                href={`/messages/${id}`}
                className="flex items-center gap-3 bg-[#0C0D22] border border-[#3C3A58]/30 hover:border-[#6D28D9] rounded-2xl p-4 transition-colors"
              >
                {p?.avatar_url ? (
                  <Image src={p.avatar_url} alt="" width={48} height={48} className="rounded-full object-cover w-12 h-12" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#6D28D9] flex items-center justify-center font-semibold text-white">
                    {getInitials(p?.full_name || null)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{p?.full_name || 'Builder'}</span>
                    <span className="text-xs text-[#8A88A8] shrink-0 ml-2">{formatTimeAgo(t.lastAt)}</span>
                  </div>
                  <div className="text-sm text-[#8A88A8] truncate">{t.lastContent}</div>
                </div>
                {t.unread > 0 && (
                  <span className="bg-[#6D28D9] text-white text-xs rounded-full px-2 py-0.5">{t.unread}</span>
                )}
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
