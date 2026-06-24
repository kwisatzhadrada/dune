import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ChatWindow from '@/components/messages/ChatWindow'

export const dynamic = 'force-dynamic'

export default async function GroupChatPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: messages } = await supabase
    .from('group_messages')
    .select('*, profiles(*)')
    .order('created_at', { ascending: true })
    .limit(200)

  const initialMessages = (messages || []).map((m: any) => ({
    id: m.id,
    content: m.content,
    created_at: m.created_at,
    user_id: m.user_id,
  }))

  const initialProfiles: Record<string, any> = {}
  ;(messages || []).forEach((m: any) => {
    if (m.profiles) initialProfiles[m.user_id] = m.profiles
  })

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#3C3A58]/30">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6D28D9] to-[#8B5CF6] flex items-center justify-center text-lg">🌐</div>
        <div>
          <div className="font-medium">Community Group Chat</div>
          <div className="text-xs text-[#8A88A8]">Live help from all builders</div>
        </div>
      </div>
      <ChatWindow mode="group" currentUserId={user.id} initialMessages={initialMessages} initialProfiles={initialProfiles} />
    </div>
  )
}
