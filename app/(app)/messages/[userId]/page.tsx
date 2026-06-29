import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ChatWindow from '@/components/messages/ChatWindow'
import { getInitials } from '@/lib/utils'
import { Profile } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function DMPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (userId === user.id) redirect('/messages')

  const { data: other } = await supabase.from('profiles').select('*').eq('id', userId).single()
  if (!other) redirect('/messages')

  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`
    )
    .order('created_at', { ascending: true })
    .limit(500)

  const initialMessages = (messages || []).map((m) => ({
    id: m.id,
    content: m.content,
    created_at: m.created_at,
    user_id: m.sender_id,
  }))

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#3C3A58]/30">
        <Link href="/messages" className="text-[#8A88A8] hover:text-[#EDEAF8]">←</Link>
        <Link href={`/profile/${other.id}`} className="flex items-center gap-3">
          {other.avatar_url ? (
            <Image src={other.avatar_url} alt="" width={40} height={40} className="rounded-full object-cover w-10 h-10" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#6D28D9] flex items-center justify-center font-semibold text-white">
              {getInitials(other.full_name)}
            </div>
          )}
          <div>
            <div className="font-medium">{other.full_name}</div>
            <div className="text-xs text-[#8A88A8]">@{other.username}</div>
          </div>
        </Link>
      </div>
      <ChatWindow mode="dm" currentUserId={user.id} otherUser={other as Profile} initialMessages={initialMessages} />
    </div>
  )
}
