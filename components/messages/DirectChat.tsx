'use client'

import Link from 'next/link'
import { Profile } from '@/lib/types'
import { getInitials } from '@/lib/utils'
import ChatWindow from './ChatWindow'

interface DirectChatProps {
  initialMessages: Array<{
    id: string
    content: string
    created_at: string
    sender_id: string
    receiver_id: string
    read: boolean
    sender?: Profile
  }>
  otherUser: Profile
  currentUserId: string
}

export default function DirectChat({ initialMessages, otherUser, currentUserId }: DirectChatProps) {
  // Normalize messages to ChatWindow format
  const normalized = initialMessages.map((m) => ({
    id: m.id,
    content: m.content,
    created_at: m.created_at,
    user_id: m.sender_id,
  }))

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 mb-4 border-b border-[#3C3A58]/30">
        <Link href="/messages" className="text-[#8A88A8] hover:text-[#EDEAF8] mr-1">
          ←
        </Link>
        {otherUser.avatar_url ? (
          <img src={otherUser.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#6D28D9] flex items-center justify-center text-white font-semibold">
            {getInitials(otherUser.full_name)}
          </div>
        )}
        <div>
          <div className="font-medium text-[#EDEAF8]">{otherUser.full_name}</div>
          {otherUser.industry && (
            <div className="text-xs text-[#8A88A8]">{otherUser.industry}</div>
          )}
        </div>
        <div className="ml-auto">
          <Link
            href={`/profile/${otherUser.id}`}
            className="text-xs text-[#8B5CF6] hover:underline"
          >
            View Profile
          </Link>
        </div>
      </div>

      <ChatWindow
        mode="dm"
        currentUserId={currentUserId}
        otherUser={otherUser}
        initialMessages={normalized}
      />
    </div>
  )
}
