'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useRealtime } from '@/lib/hooks/useRealtime'
import { getInitials, formatTimeAgo } from '@/lib/utils'
import { Profile } from '@/lib/types'

type ChatMsg = {
  id: string
  content: string
  created_at: string
  user_id: string // sender
}

export default function ChatWindow({
  mode,
  currentUserId,
  otherUser,
  initialMessages,
  initialProfiles = {},
}: {
  mode: 'dm' | 'group'
  currentUserId: string
  otherUser?: Profile | null
  initialMessages: ChatMsg[]
  initialProfiles?: Record<string, Profile>
}) {
  const supabase = createClient()
  const [messages, setMessages] = useState<ChatMsg[]>(initialMessages)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [profileCache, setProfileCache] = useState<Record<string, Profile>>(initialProfiles)

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Mark DM messages read
  useEffect(() => {
    if (mode === 'dm' && otherUser) {
      supabase
        .from('messages')
        .update({ read: true })
        .eq('sender_id', otherUser.id)
        .eq('receiver_id', currentUserId)
        .eq('read', false)
        .then(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useRealtime({
    table: mode === 'dm' ? 'messages' : 'group_messages',
    event: 'INSERT',
    onData: async (payload) => {
      const row = payload.new
      if (mode === 'dm') {
        const isThisThread =
          (row.sender_id === currentUserId && row.receiver_id === otherUser?.id) ||
          (row.sender_id === otherUser?.id && row.receiver_id === currentUserId)
        if (!isThisThread) return
        if (row.sender_id === currentUserId) return // already added locally
        setMessages((prev) => {
          if (prev.some((m) => m.id === row.id)) return prev
          return [...prev, { id: row.id, content: row.content, created_at: row.created_at, user_id: row.sender_id }]
        })
        await supabase.from('messages').update({ read: true }).eq('id', row.id)
      } else {
        if (row.user_id === currentUserId) return
        if (!profileCache[row.user_id]) {
          const { data } = await supabase.from('profiles').select('*').eq('id', row.user_id).single()
          if (data) setProfileCache((c) => ({ ...c, [row.user_id]: data as Profile }))
        }
        setMessages((prev) => {
          if (prev.some((m) => m.id === row.id)) return prev
          return [...prev, { id: row.id, content: row.content, created_at: row.created_at, user_id: row.user_id }]
        })
      }
    },
  })

  async function send(e: React.FormEvent) {
    e.preventDefault()
    const content = text.trim()
    if (!content || sending) return
    if (content.length > 2000) return
    setSending(true)
    setSendError(false)
    setText('')

    if (mode === 'dm' && otherUser) {
      const { data, error } = await supabase
        .from('messages')
        .insert({ sender_id: currentUserId, receiver_id: otherUser.id, content })
        .select()
        .single()
      if (error) { setText(content); setSendError(true) }
      else if (data) {
        setMessages((prev) => [...prev, { id: data.id, content: data.content, created_at: data.created_at, user_id: currentUserId }])
      }
    } else {
      const { data, error } = await supabase
        .from('group_messages')
        .insert({ user_id: currentUserId, content })
        .select()
        .single()
      if (error) { setText(content); setSendError(true) }
      else if (data) {
        setMessages((prev) => [...prev, { id: data.id, content: data.content, created_at: data.created_at, user_id: currentUserId }])
      }
    }
    setSending(false)
  }

  function senderProfile(uid: string): Profile | undefined {
    if (uid === otherUser?.id) return otherUser || undefined
    return profileCache[uid]
  }

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)] lg:h-[calc(100vh-3rem)]">
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.length === 0 && (
          <div className="text-center text-[#8A88A8] py-16">No messages yet. Say hi! 👋</div>
        )}
        {messages.map((m) => {
          const mine = m.user_id === currentUserId
          const p = mode === 'group' ? senderProfile(m.user_id) : undefined
          return (
            <div key={m.id} className={`flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
              {!mine && mode === 'group' && (
                p?.avatar_url ? (
                  <Image src={p.avatar_url} alt="" width={28} height={28} className="rounded-full object-cover w-7 h-7" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#6D28D9] flex items-center justify-center text-xs font-semibold text-white shrink-0">
                    {getInitials(p?.full_name || null)}
                  </div>
                )
              )}
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${mine ? 'bg-[#6D28D9] text-white' : 'bg-[#121428] text-[#EDEAF8]'}`}>
                {mode === 'group' && !mine && (
                  <div className="text-[11px] text-[#8B5CF6] mb-0.5">{p?.full_name || 'Builder'}</div>
                )}
                <div className="whitespace-pre-wrap break-words">{m.content}</div>
                <div className={`text-[10px] mt-1 ${mine ? 'text-white/60' : 'text-[#8A88A8]'}`}>{formatTimeAgo(m.created_at)}</div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {sendError && (
        <div className="text-[#EF4444] text-xs px-1 pb-1">Failed to send. Please try again.</div>
      )}
      <form onSubmit={send} className="flex gap-2 border-t border-[#3C3A58]/30 pt-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          maxLength={2000}
          className="flex-1 bg-[#121428] border border-[#3C3A58] focus:border-[#6D28D9] rounded-xl px-4 py-3 outline-none"
        />
        <button type="submit" disabled={sending} className="bg-[#6D28D9] hover:bg-[#8B5CF6] disabled:opacity-50 text-white px-5 rounded-xl font-medium">
          Send
        </button>
      </form>
    </div>
  )
}
