'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Post, PostReply } from '@/lib/types'
import { formatTimeAgo, getInitials, getPostTypeColor, getPostTypeLabel } from '@/lib/utils'
import { trackEvent } from '@/lib/analytics'

const MAX_REPLY_LENGTH = 1000

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
  const [submittingReply, setSubmittingReply] = useState(false)
  const [replyError, setReplyError] = useState(false)
  const [connectSent, setConnectSent] = useState(false)
  const [connectLoading, setConnectLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const likingRef = useRef(false)
  const savingRef = useRef(false)

  const author = post.profiles

  async function toggleLike() {
    if (likingRef.current) return
    likingRef.current = true
    const prevLiked = liked
    const prevLikes = likes
    if (prevLiked) {
      setLiked(false); setLikes((n) => n - 1)
      const { error } = await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', currentUserId)
      if (error) { setLiked(prevLiked); setLikes(prevLikes) }
    } else {
      setLiked(true); setLikes((n) => n + 1)
      const { error } = await supabase.from('post_likes').insert({ post_id: post.id, user_id: currentUserId })
      if (error) { setLiked(prevLiked); setLikes(prevLikes) }
    }
    likingRef.current = false
  }

  async function toggleSave() {
    if (savingRef.current) return
    savingRef.current = true
    const prevSaved = saved
    const prevSaves = saves
    if (prevSaved) {
      setSaved(false); setSaves((n) => n - 1)
      const { error } = await supabase.from('post_saves').delete().eq('post_id', post.id).eq('user_id', currentUserId)
      if (error) { setSaved(prevSaved); setSaves(prevSaves) }
    } else {
      setSaved(true); setSaves((n) => n + 1)
      const { error } = await supabase.from('post_saves').insert({ post_id: post.id, user_id: currentUserId })
      if (error) { setSaved(prevSaved); setSaves(prevSaves) }
    }
    savingRef.current = false
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
    if (!content || submittingReply) return
    if (content.length > MAX_REPLY_LENGTH) return
    setSubmittingReply(true)
    setReplyError(false)
    const { data, error } = await supabase
      .from('post_replies')
      .insert({ post_id: post.id, user_id: currentUserId, content })
      .select('*, profiles(*)')
      .single()
    if (error) {
      setReplyError(true)
      setSubmittingReply(false)
      return
    }
    if (data) {
      setReplies((prev) => [...prev, data as PostReply])
      setRepliesCount((n) => n + 1)
      setReplyText('')
    }
    setSubmittingReply(false)
  }

  async function connect() {
    if (!author || author.id === currentUserId || connectLoading) return
    setConnectLoading(true)
    const { error } = await supabase.from('connections').upsert(
      { requester_id: currentUserId, addressee_id: author.id, status: 'pending' },
      { onConflict: 'requester_id,addressee_id' }
    )
    if (error) {
      setConnectLoading(false)
    } else {
      setConnectSent(true)
      setConnectLoading(false)
      trackEvent('collaboration_request_sent')
    }
  }

  async function del() {
    setDeleting(true)
    const { error } = await supabase.from('posts').delete().eq('id', post.id)
    if (error) {
      setDeleting(false)
      setConfirmDelete(false)
    } else {
      onDeleted?.(post.id)
    }
  }

  return (
    <article className="bg-[#0C0D22] border border-[#3C3A58]/30 rounded-2xl p-5">
      <div className="flex items-start gap-3">
        <Link href={`/profile/${post.user_id}`}>
          {author?.avatar_url ? (
            <Image src={author.avatar_url} alt="" width={44} height={44} className="rounded-full object-cover w-11 h-11"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
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
            {author?.username && <span className="text-[#8A88A8] text-sm">@{author.username}</span>}
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
          <div className="shrink-0">
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs text-[#8A88A8] hover:text-[#EDEAF8] px-2 py-1 rounded-lg hover:bg-[#121428] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={del}
                  disabled={deleting}
                  className="text-xs text-[#EF4444] hover:text-white bg-[#EF4444]/10 hover:bg-[#EF4444] px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-[#8A88A8] hover:text-[#EF4444] text-sm transition-colors px-1"
              >
                ···
              </button>
            )}
          </div>
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
        <button
          onClick={toggleLike}
          className={`flex items-center gap-1.5 transition-colors active:scale-90 ${liked ? 'text-[#EF4444]' : 'text-[#8A88A8] hover:text-[#EF4444]'}`}
        >
          <span>{liked ? '❤️' : '🤍'}</span> {likes}
        </button>
        <button
          onClick={loadReplies}
          className="flex items-center gap-1.5 text-[#8A88A8] hover:text-[#3B82F6] transition-colors active:scale-90"
        >
          <span>💬</span> {repliesCount}
        </button>
        <button
          onClick={toggleSave}
          className={`flex items-center gap-1.5 transition-colors active:scale-90 ${saved ? 'text-[#F59E0B]' : 'text-[#8A88A8] hover:text-[#F59E0B]'}`}
        >
          <span>{saved ? '🔖' : '📑'}</span> {saves}
        </button>
        {author && author.id !== currentUserId && (
          <button
            onClick={connect}
            disabled={connectSent || connectLoading}
            className="ml-auto text-[#8B5CF6] hover:text-[#6D28D9] font-medium disabled:opacity-50 transition-colors"
          >
            {connectLoading ? 'Sending…' : connectSent ? 'Requested ✓' : '+ Connect'}
          </button>
        )}
      </div>

      {showReplies && (
        <div className="mt-4 border-t border-[#3C3A58]/30 pt-4 space-y-3">
          {loadingReplies ? (
            <div className="flex gap-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-10 bg-[#121428] rounded-xl animate-pulse flex-1" />
              ))}
            </div>
          ) : (
            replies.map((r) => (
              <div key={r.id} className="flex items-start gap-2">
                {r.profiles?.avatar_url ? (
                  <Image src={r.profiles.avatar_url} alt="" width={28} height={28} className="rounded-full object-cover w-7 h-7 shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#6D28D9] flex items-center justify-center text-xs font-semibold text-white shrink-0">
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
          {replyError && (
            <p className="text-xs text-[#EF4444]">Failed to send reply. Please try again.</p>
          )}
          <form onSubmit={submitReply} className="flex gap-2 mt-2">
            <input
              value={replyText}
              onChange={(e) => { setReplyText(e.target.value); setReplyError(false) }}
              placeholder="Write a reply…"
              maxLength={MAX_REPLY_LENGTH}
              className="flex-1 bg-[#121428] border border-[#3C3A58] focus:border-[#6D28D9] rounded-xl px-3 py-2 text-sm outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={submittingReply || !replyText.trim()}
              className="bg-[#6D28D9] hover:bg-[#8B5CF6] disabled:opacity-50 text-white px-4 rounded-xl text-sm font-medium transition-colors"
            >
              {submittingReply ? '…' : 'Reply'}
            </button>
          </form>
        </div>
      )}
    </article>
  )
}
