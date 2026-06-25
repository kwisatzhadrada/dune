'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Post, PostReply } from '@/lib/types'
import { formatTimeAgo, getInitials, getPostTypeColor, getPostTypeLabel } from '@/lib/utils'

export default function PostCard({
  post,
  currentUserId,
  onDeleted,
}: {
  post: Post
  currentUserId: string
  onDeleted?: (id: string) => void
}) {
  const supabase = createClient()
  const [liked, setLiked] = useState(!!post.user_has_liked)
  const [saved, setSaved] = useState(!!post.user_has_saved)
  const [likes, setLikes] = useState(post.likes_count)
  const [saves, setSaves] = useState(post.saves_count)
  const [repliesCount, setRepliesCount] = useState(post.replies_count)
  const [showReplies, setShowReplies] = useState(false)
  const [replies, setReplies] = useState<PostReply[]>([])
  const [replyText, setReplyText] = useState('')
  const [loadingReplies, setLoadingReplies] = useState(false)
  const [connectSent, setConnectSent] = useState(false)

  const author = post.profiles

  async function toggleLike() {
    if (liked) {
      setLiked(false); setLikes((n) => n - 1)
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', currentUserId)
      await supabase.rpc('decrement_likes', { post_id: post.id })
    } else {
      setLiked(true); setLikes((n) => n + 1)
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: currentUserId })
      await supabase.rpc('increment_likes', { post_id: post.id })
    }
  }

  async function toggleSave() {
    if (saved) {
      setSaved(false); setSaves((n) => n - 1)
      await supabase.from('post_saves').delete().eq('post_id', post.id).eq('user_id', currentUserId)
      await supabase.rpc('decrement_saves', { post_id: post.id })
    } else {
      setSaved(true); setSaves((n) => n + 1)
      await supabase.from('post_saves').insert({ post_id: post.id, user_id: currentUserId })
      await supabase.rpc('increment_saves', { post_id: post.id })
    }
  }

  async function loadReplies() {
    if (!showReplies && replies.length === 0) {
      setLoadingReplies(true)
      const { data } = await supabase
        .from('post_replies')
        .select('*, profiles(*)')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true })
      setReplies((data as PostReply[]) || [])
      setLoadingReplies(false)
    }
    setShowReplies((s) => !s)
  }

  async function submitReply(e: React.FormEvent) {
    e.preventDefault()
    const content = replyText.trim()
    if (!content) return
    const { data } = await supabase
      .from('post_replies')
      .insert({ post_id: post.id, user_id: currentUserId, content })
      .select('*, profiles(*)')
      .single()
    if (data) {
      setReplies((prev) => [...prev, data as PostReply])
      setRepliesCount((n) => n + 1)
      setReplyText('')
    }
  }

  async function connect() {
    if (!author || author.id === currentUserId) return
    setConnectSent(true)
    await supabase.from('connections').upsert(
      { requester_id: currentUserId, addressee_id: author.id, status: 'pending' },
      { onConflict: 'requester_id,addressee_id' }
    )
  }

  async function del() {
    if (!confirm('Delete this post?')) return
    await supabase.from('posts').delete().eq('id', post.id)
    onDeleted?.(post.id)
  }

  return (
    <article className="bg-[#0C0D22] border border-[#3C3A58]/30 rounded-2xl p-5">
      <div className="flex items-start gap-3">
        <Link href={`/profile/${post.user_id}`}>
          {author?.avatar_url ? (
            <Image src={author.avatar_url} alt="" width={44} height={44} className="rounded-full object-cover w-11 h-11" />
          ) : (
            <div className="w-11 h-11 rounded-full bg-[#6D28D9] flex items-center justify-center font-semibold text-white">
              {getInitials(author?.full_name || null)}
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/profile/${post.user_id}`} className="font-medium hover:underline">
              {author?.full_name || 'Anonymous'}
            </Link>
            <span className="text-[#8A88A8] text-sm">@{author?.username}</span>
            <span className="text-[#3C3A58]">·</span>
            <span className="text-[#8A88A8] text-sm">{formatTimeAgo(post.created_at)}</span>
          </div>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className={`inline-block px-2 py-0.5 rounded-md text-xs border ${getPostTypeColor(post.post_type)}`}>
              {getPostTypeLabel(post.post_type)}
            </span>
            {post.industry && (
              <span className="inline-block px-2 py-0.5 rounded-md text-xs bg-[#121428] border border-[#3C3A58] text-[#8A88A8]">
                {post.industry}
              </span>
            )}
          </div>
        </div>
        {post.user_id === currentUserId && (
          <button onClick={del} className="text-[#8A88A8] hover:text-[#EF4444] text-sm">Delete</button>
        )}
      </div>

      <p className="mt-3 text-[#EDEAF8] whitespace-pre-wrap leading-relaxed">{post.content}</p>

      {post.tags && post.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {post.tags.map((t) => (
            <span key={t} className="text-xs text-[#8B5CF6]">#{t}</span>
          ))}
        </div>
      )}

      {post.dreams && (
        <div className="mt-3 flex items-center gap-2 bg-[#121428] border border-[#3C3A58]/50 rounded-xl px-3 py-2">
          <span className="text-sm">✨</span>
          <Link href={`/dream/${post.dreams.id}`} className="text-sm text-[#8B5CF6] hover:underline font-medium truncate">
            {post.dreams.title}
          </Link>
          <span className="text-xs text-[#8A88A8] shrink-0">{post.dreams.current_stage}</span>
          <div className="ml-auto w-16 bg-[#3C3A58] rounded-full h-1">
            <div className="bg-[#6D28D9] h-1 rounded-full" style={{ width: `${post.dreams.progress_percentage}%` }} />
          </div>
          <span className="text-xs text-[#8A88A8] shrink-0">{post.dreams.progress_percentage}%</span>
        </div>
      )}

      <div className="mt-4 flex items-center gap-5 text-sm">
        <button onClick={toggleLike} className={`flex items-center gap-1.5 transition-colors ${liked ? 'text-[#EF4444]' : 'text-[#8A88A8] hover:text-[#EF4444]'}`}>
          <span>{liked ? '❤️' : '🤍'}</span> {likes}
        </button>
        <button onClick={loadReplies} className="flex items-center gap-1.5 text-[#8A88A8] hover:text-[#3B82F6] transition-colors">
          <span>💬</span> {repliesCount}
        </button>
        <button onClick={toggleSave} className={`flex items-center gap-1.5 transition-colors ${saved ? 'text-[#F59E0B]' : 'text-[#8A88A8] hover:text-[#F59E0B]'}`}>
          <span>{saved ? '🔖' : '📑'}</span> {saves}
        </button>
        {author && author.id !== currentUserId && (
          <button
            onClick={connect}
            disabled={connectSent}
            className="ml-auto text-[#8B5CF6] hover:text-[#6D28D9] font-medium disabled:opacity-50"
          >
            {connectSent ? 'Requested' : '+ Connect'}
          </button>
        )}
      </div>

      {showReplies && (
        <div className="mt-4 border-t border-[#3C3A58]/30 pt-4 space-y-3">
          {loadingReplies ? (
            <div className="text-[#8A88A8] text-sm">Loading replies...</div>
          ) : (
            replies.map((r) => (
              <div key={r.id} className="flex items-start gap-2">
                {r.profiles?.avatar_url ? (
                  <Image src={r.profiles.avatar_url} alt="" width={28} height={28} className="rounded-full object-cover w-7 h-7" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#6D28D9] flex items-center justify-center text-xs font-semibold text-white">
                    {getInitials(r.profiles?.full_name || null)}
                  </div>
                )}
                <div className="flex-1 bg-[#121428] rounded-xl px-3 py-2">
                  <div className="text-xs text-[#8A88A8]">
                    {r.profiles?.full_name} · {formatTimeAgo(r.created_at)}
                  </div>
                  <div className="text-sm mt-0.5 whitespace-pre-wrap">{r.content}</div>
                </div>
              </div>
            ))
          )}
          <form onSubmit={submitReply} className="flex gap-2">
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              className="flex-1 bg-[#121428] border border-[#3C3A58] focus:border-[#6D28D9] rounded-xl px-3 py-2 text-sm outline-none"
            />
            <button type="submit" className="bg-[#6D28D9] hover:bg-[#8B5CF6] text-white px-4 rounded-xl text-sm font-medium">
              Reply
            </button>
          </form>
        </div>
      )}
    </article>
  )
}
