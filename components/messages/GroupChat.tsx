'use client'

import { Profile, GroupMessage } from '@/lib/types'
import ChatWindow from './ChatWindow'

interface GroupChatProps {
  initialMessages: GroupMessage[]
  currentUser: Profile
  currentUserId: string
}

export default function GroupChat({ initialMessages, currentUser, currentUserId }: GroupChatProps) {
  const normalized = initialMessages.map((m) => ({
    id: m.id,
    content: m.content,
    created_at: m.created_at,
    user_id: m.user_id,
  }))

  return (
    <div className="flex flex-col h-full">
      <div className="pb-4 mb-4 border-b border-[#3C3A58]/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6D28D9] to-[#8B5CF6] flex items-center justify-center text-xl">
            🌐
          </div>
          <div>
            <div className="font-medium text-[#EDEAF8]">Live Help Room</div>
            <div className="text-xs text-[#8A88A8]">Ask anything — the community answers 24/7</div>
          </div>
        </div>
      </div>

      <ChatWindow
        mode="group"
        currentUserId={currentUserId}
        initialMessages={normalized}
      />
    </div>
  )
}
