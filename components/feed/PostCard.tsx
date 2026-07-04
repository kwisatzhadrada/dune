'use client'

import { useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Post, PostReply } from '@/lib/types'
import { formatTimeAgo, getInitials, getPostTypeColor, getPostTypeLabel } from '@/lib/utils'
import { trackEvent } from '@/lib/analytics'
import { sanitizeEmbedUrl } from '@/lib/media'

const MAX_REPLY_LENGTH = 1000

// ── Avatar ─────────────────────────────────────────────────────────────────

function Avatar({ url, name, size = 44, eager }: { url?: string | null; name?: string | null; size?: number; eager?: boolean }) {
  const [errored, setErrored] = useState(false)
  const cls = `rounded-full object-cover shrink-0`
  const style = { width: size, height: size }
  if (url && !errored) {
    return (
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        className={cls}
        style={style}
        onError={() => setErrored(true)}
      />
    )
  }
  return (
    <div
      className="rounded-full bg-[#6D28D9] flex items-center justify-center font-semibold text-white shrink-0"
      style={{ ...style, fontSize: size * 0.36 }}
    >
      {getInitials(name || null)}
    </div>
  )
}

// ── ProgressRing ───────────────────────────────────────────────────────────

function ProgressRing({ pct, size = 56 }: { pct: number; size?: number }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const dash = circ * (pct / 100)
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#3C3A58" strokeWidth={4} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="#8B5CF6" strokeWidth={4}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
      />
      <text
        x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        className="rotate-90" fill="#EDEAF8" fontSize={size * 0.22}
        style={{ transform: `rotate(90deg) translate(0, 0)`, transformOrigin: 'center' }}
      />
    </svg>
  )
}

function ProgressRingLabel({ pct }: { pct: number }) {
  return (
    <div className="relative shrink-0" style={{ width: 56, height: 56 }}>
      <ProgressRing pct={pct} size={56} />
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#EDEAF8]">
        {pct}%
      </span>
    </div>
  )
}

// ── ImageGrid + Lightbox ───────────────────────────────────────────────────

function Lightbox({ urls, startIdx, onClose }: { urls: string[]; startIdx: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIdx)
  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-white text-3xl leading-none"
        onClick={onClose}
      >×</button>
      <div className="relative w-full max-w-3xl max-h-[80vh] flex items-center justify-center px-12"
        onClick={(e) => e.stopPropagation()}>
        <img src={urls[idx]} alt="" className="max-w-full max-h-[80vh] object-contain rounded-xl" />
        {urls.length > 1 && (
          <>
            <button
              className="absolute left-0 text-white text-2xl px-3 py-8 hover:bg-white/10 rounded-l-xl h-full flex items-center"
              onClick={() => setIdx((i) => (i - 1 + urls.length) % urls.length)}
            >‹</button>
            <button
              className="absolute right-0 text-white text-2xl px-3 py-8 hover:bg-white/10 rounded-r-xl h-full flex items-center"
              onClick={() => setIdx((i) => (i + 1) % urls.length)}
            >›</button>
          </>
        )}
      </div>
      {urls.length > 1 && (
        <div className="flex gap-1.5 mt-4">
          {urls.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setIdx(i) }}
              className={`w-2 h-2 rounded-full transition-colors ${i === idx ? 'bg-white' : 'bg-white/30'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ImageGrid({ urls }: { urls: string[] }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  if (urls.length === 0) return null

  const open = (i: number) => setLightboxIdx(i)

  const gridClass =
    urls.length === 1 ? 'grid-cols-1' :
    urls.length === 2 ? 'grid-cols-2' :
    urls.length === 3 ? 'grid-cols-2' :
    'grid-cols-2'

  const shown = urls.slice(0, 4)
  const overflow = urls.length - 4

  return (
    <>
      <div className={`grid gap-1 mt-3 rounded-xl overflow-hidden ${gridClass}`}>
        {shown.map((url, i) => {
          const isLast = i === 3 && overflow > 0
          const spanClass = urls.length === 3 && i === 0 ? 'row-span-2' : ''
          return (
            <button
              key={i}
              onClick={() => open(i)}
              className={`relative aspect-square overflow-hidden bg-[#121428] ${spanClass} ${urls.length === 3 && i === 0 ? 'aspect-auto' : ''}`}
            >
              <img src={url} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
              {isLast && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-2xl font-bold">
                  +{overflow + 1}
                </div>
              )}
            </button>
          )
        })}
      </div>
      {lightboxIdx !== null && (
        <Lightbox urls={urls} startIdx={lightboxIdx} onClose={() => setLightboxIdx(null)} />
      )}
    </>
  )
}

// ── Action Buttons ─────────────────────────────────────────────────────────

function SideActions({
  liked, likes, saved, saves, repliesCount, shared, shares,
  onLike, onSave, onComment, onShare,
}: {
  liked: boolean; likes: number; saved: boolean; saves: number
  repliesCount: number; shared: boolean; shares: number
  onLike: () => void; onSave: () => void; onComment: () => void; onShare: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <button onClick={onLike} className={`flex flex-col items-center gap-0.5 transition-transform active:scale-90 ${liked ? 'text-[#EF4444]' : 'text-[#8A88A8] hover:text-[#EF4444]'}`}>
        <span className="text-2xl">{liked ? '❤️' : '🤍'}</span>
        <span className="text-xs">{likes}</span>
      </button>
      <button onClick={onComment} className="flex flex-col items-center gap-0.5 text-[#8A88A8] hover:text-[#3B82F6] transition-transform active:scale-90">
        <span className="text-2xl">💬</span>
        <span className="text-xs">{repliesCount}</span>
      </button>
      <button onClick={onSave} className={`flex flex-col items-center gap-0.5 transition-transform active:scale-90 ${saved ? 'text-[#F59E0B]' : 'text-[#8A88A8] hover:text-[#F59E0B]'}`}>
        <span className="text-2xl">{saved ? '🔖' : '📑'}</span>
        <span className="text-xs">{saves}</span>
      </button>
      <button onClick={onShare} className={`flex flex-col items-center gap-0.5 transition-transform active:scale-90 ${shared ? 'text-[#8B5CF6]' : 'text-[#8A88A8] hover:text-[#8B5CF6]'}`}>
        <span className="text-2xl">🔗</span>
        <span className="text-xs">{shares}</span>
      </button>
    </div>
  )
}

function BottomActions({
  liked, likes, saved, saves, repliesCount, shared, shares,
  onLike, onSave, onComment, onShare,
}: {
  liked: boolean; likes: number; saved: boolean; saves: number
  repliesCount: number; shared: boolean; shares: number
  onLike: () => void; onSave: () => void; onComment: () => void; onShare: () => void
}) {
  return (
    <div className="flex items-center gap-5 mt-4 text-sm">
      <button onClick={onLike} className={`flex items-center gap-1.5 transition-colors active:scale-90 ${liked ? 'text-[#EF4444]' : 'text-[#8A88A8] hover:text-[#EF4444]'}`}>
        <span>{liked ? '❤️' : '🤍'}</span> {likes}
      </button>
      <button onClick={onComment} className="flex items-center gap-1.5 text-[#8A88A8] hover:text-[#3B82F6] transition-colors active:scale-90">
        <span>💬</span> {repliesCount}
      </button>
      <button onClick={onSave} className={`flex items-center gap-1.5 transition-colors active:scale-90 ${saved ? 'text-[#F59E0B]' : 'text-[#8A88A8] hover:text-[#F59E0B]'}`}>
        <span>{saved ? '🔖' : '📑'}</span> {saves}
      </button>
      <button onClick={onShare} className={`flex items-center gap-1.5 transition-colors active:scale-90 ${shared ? 'text-[#8B5CF6]' : 'text-[#8A88A8] hover:text-[#8B5CF6]'}`}>
        <span>🔗</span> {shares}
      </button>
    </div>
  )
}

// ── Reply Thread ────────────────────────────────────────────────────────────

function ReplyThread({ postId, currentUserId, show }: { postId: string; currentUserId: string; show: boolean }) {
  const supabase = createClient()
  const [replies, setReplies] = useState<PostReply[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    if (loaded) return
    setLoading(true)
    const { data } = await supabase
      .from('post_replies')
      .select('*, profiles(*)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    setReplies((data as PostReply[]) || [])
    setLoaded(true)
    setLoading(false)
  }, [loaded, postId, supabase])

  if (show && !loaded && !loading) { load() }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const content = replyText.trim()
    if (!content || submitting || content.length > MAX_REPLY_LENGTH) return
    setSubmitting(true)
    setError(false)
    const { data, error: err } = await supabase
      .from('post_replies')
      .insert({ post_id: postId, user_id: currentUserId, content })
      .select('*, profiles(*)')
      .single()
    if (err) { setError(true); setSubmitting(false); return }
    if (data) { setReplies((prev) => [...prev, data as PostReply]); setReplyText('') }
    setSubmitting(false)
  }

  if (!show) return null

  return (
    <div className="border-t border-[#3C3A58]/30 pt-4 mt-4 space-y-3">
      {loading ? (
        <div className="h-8 bg-[#121428] rounded-xl animate-pulse" />
      ) : (
        replies.map((r) => (
          <div key={r.id} className="flex items-start gap-2">
            <Avatar url={r.profiles?.avatar_url} name={r.profiles?.full_name} size={28} />
            <div className="flex-1 bg-[#121428] rounded-xl px-3 py-2">
              <div className="text-xs text-[#8A88A8]">{r.profiles?.full_name} · {formatTimeAgo(r.created_at)}</div>
              <div className="text-sm mt-0.5 whitespace-pre-wrap">{r.content}</div>
            </div>
          </div>
        ))
      )}
      {error && <p className="text-xs text-[#EF4444]">Failed to send reply. Please try again.</p>}
      <form onSubmit={submit} className="flex gap-2">
        <input
          value={replyText}
          onChange={(e) => { setReplyText(e.target.value); setError(false) }}
          placeholder="Write a reply…"
          maxLength={MAX_REPLY_LENGTH}
          className="flex-1 bg-[#121428] border border-[#3C3A58] focus:border-[#6D28D9] rounded-xl px-3 py-2 text-sm outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={submitting || !replyText.trim()}
          className="bg-[#6D28D9] hover:bg-[#8B5CF6] disabled:opacity-50 text-white px-4 rounded-xl text-sm font-medium transition-colors"
        >
          {submitting ? '…' : 'Reply'}
        </button>
      </form>
    </div>
  )
}

// ── PostCard ────────────────────────────────────────────────────────────────

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
  const [shared, setShared] = useState(false)
  const [likes, setLikes] = useState(post.likes_count)
  const [saves, setSaves] = useState(post.saves_count)
  const [shares, setShares] = useState(post.shares_count ?? 0)
  const [repliesCount, setRepliesCount] = useState(post.replies_count)
  const [showReplies, setShowReplies] = useState(false)
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
    const prev = liked; const prevN = likes
    if (prev) {
      setLiked(false); setLikes((n) => n - 1)
      const { error } = await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', currentUserId)
      if (error) { setLiked(prev); setLikes(prevN) }
    } else {
      setLiked(true); setLikes((n) => n + 1)
      const { error } = await supabase.from('post_likes').insert({ post_id: post.id, user_id: currentUserId })
      if (error) { setLiked(prev); setLikes(prevN) }
    }
    likingRef.current = false
  }

  async function toggleSave() {
    if (savingRef.current) return
    savingRef.current = true
    const prev = saved; const prevN = saves
    if (prev) {
      setSaved(false); setSaves((n) => n - 1)
      const { error } = await supabase.from('post_saves').delete().eq('post_id', post.id).eq('user_id', currentUserId)
      if (error) { setSaved(prev); setSaves(prevN) }
    } else {
      setSaved(true); setSaves((n) => n + 1)
      const { error } = await supabase.from('post_saves').insert({ post_id: post.id, user_id: currentUserId })
      if (error) { setSaved(prev); setSaves(prevN) }
    }
    savingRef.current = false
  }

  async function handleShare() {
    const url = `${window.location.origin}/post/${post.id}`
    try {
      if (navigator.share) {
        await navigator.share({ title: post.content?.slice(0, 60), url })
      } else {
        await navigator.clipboard.writeText(url)
      }
      setShared(true)
      setShares((n) => n + 1)
      await supabase.rpc('increment_shares', { post_id: post.id })
    } catch {
      // user cancelled share — do nothing
    }
  }

  async function connect() {
    if (!author || author.id === currentUserId || connectLoading) return
    setConnectLoading(true)
    const { error } = await supabase.from('connections').upsert(
      { requester_id: currentUserId, addressee_id: author.id, status: 'pending' },
      { onConflict: 'requester_id,addressee_id' }
    )
    if (error) { setConnectLoading(false) }
    else { setConnectSent(true); setConnectLoading(false); trackEvent('collaboration_request_sent') }
  }

  async function del() {
    setDeleting(true)
    const { error } = await supabase.from('posts').delete().eq('id', post.id)
    if (error) { setDeleting(false); setConfirmDelete(false) }
    else { onDeleted?.(post.id) }
  }

  const isMedia = (post.image_urls?.length ?? 0) > 0 || !!post.video_url
  const isEmbed = !!post.embed_url && !!post.embed_type
  const isDreamUpdate = post.post_type === 'dream_update'
  const isMilestone = post.post_type === 'milestone'

  const actionProps = {
    liked, likes, saved, saves, repliesCount,
    shared, shares,
    onLike: toggleLike,
    onSave: toggleSave,
    onComment: () => setShowReplies((s) => !s),
    onShare: handleShare,
  }

  const Header = () => (
    <div className="flex items-start gap-3">
      <Link href={`/profile/${post.user_id}`}>
        <Avatar url={author?.avatar_url} name={author?.full_name} size={44} />
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
        <div className="mt-1 flex items-center gap-2 flex-wrap">
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
      <div className="shrink-0 flex items-center gap-2">
        {author && author.id !== currentUserId && (
          <button
            onClick={connect}
            disabled={connectSent || connectLoading}
            className="text-xs text-[#8B5CF6] hover:text-[#6D28D9] font-medium disabled:opacity-50 transition-colors"
          >
            {connectLoading ? '…' : connectSent ? 'Requested ✓' : '+ Connect'}
          </button>
        )}
        {post.user_id === currentUserId && (
          confirmDelete ? (
            <div className="flex items-center gap-1">
              <button onClick={() => setConfirmDelete(false)} className="text-xs text-[#8A88A8] hover:text-[#EDEAF8] px-2 py-1 rounded-lg hover:bg-[#121428] transition-colors">Cancel</button>
              <button onClick={del} disabled={deleting} className="text-xs text-[#EF4444] hover:text-white bg-[#EF4444]/10 hover:bg-[#EF4444] px-2 py-1 rounded-lg transition-colors disabled:opacity-50">
                {deleting ? '…' : 'Delete'}
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="text-[#8A88A8] hover:text-[#EF4444] text-sm px-1 transition-colors">···</button>
          )
        )}
      </div>
    </div>
  )

  const DreamChip = () => post.dreams ? (
    <div className="flex items-center gap-2 bg-[#121428] border border-[#3C3A58]/50 rounded-xl px-3 py-2 mt-3">
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
  ) : null

  const Tags = () => post.tags && post.tags.length > 0 ? (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {post.tags.map((t) => <span key={t} className="text-xs text-[#8B5CF6]">#{t}</span>)}
    </div>
  ) : null

  const cardStyle: React.CSSProperties = { contentVisibility: 'auto', containIntrinsicSize: '0 200px' }

  // ── Dream Update card ────────────────────────────────────────────────────
  if (isDreamUpdate) {
    return (
      <article style={cardStyle} className="bg-gradient-to-br from-[#0C0D22] to-[#130F2A] border border-violet-500/20 rounded-2xl p-4 sm:p-5">
        <Header />
        <div className="mt-3 flex items-start gap-3">
          {post.dreams && (
            <ProgressRingLabel pct={post.dreams.progress_percentage ?? 0} />
          )}
          <div className="flex-1 min-w-0">
            {post.dreams && (
              <Link href={`/dream/${post.dreams.id}`} className="text-violet-400 font-semibold hover:underline text-sm">
                ✨ {post.dreams.title}
              </Link>
            )}
            <p className="mt-1 text-[#EDEAF8] whitespace-pre-wrap leading-relaxed">{post.content}</p>
          </div>
        </div>
        {(post.image_urls?.length ?? 0) > 0 && <ImageGrid urls={post.image_urls!} />}
        <Tags />
        <BottomActions {...actionProps} />
        <ReplyThread postId={post.id} currentUserId={currentUserId} show={showReplies} />
      </article>
    )
  }

  // ── Milestone card ───────────────────────────────────────────────────────
  if (isMilestone) {
    return (
      <article style={cardStyle} className="bg-gradient-to-br from-[#0C0D22] to-[#1A1500] border border-yellow-500/20 rounded-2xl p-4 sm:p-5">
        <Header />
        <div className="mt-3 flex items-start gap-3">
          <span className="text-4xl shrink-0">🎯</span>
          <div className="flex-1 min-w-0">
            <p className="text-[#EDEAF8] whitespace-pre-wrap leading-relaxed font-medium">{post.content}</p>
          </div>
        </div>
        <DreamChip />
        {(post.image_urls?.length ?? 0) > 0 && <ImageGrid urls={post.image_urls!} />}
        <Tags />
        <BottomActions {...actionProps} />
        <ReplyThread postId={post.id} currentUserId={currentUserId} show={showReplies} />
      </article>
    )
  }

  // ── Media card (images / video) ───────────────────────────────────────────
  if (isMedia) {
    return (
      <article style={cardStyle} className="bg-[#0C0D22] border border-[#3C3A58]/30 rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-5 pb-3">
          <Header />
          {post.content && <p className="mt-3 text-[#EDEAF8] whitespace-pre-wrap leading-relaxed">{post.content}</p>}
        </div>
        <div className="flex gap-3">
          <div className="flex-1 min-w-0">
            {post.video_url ? (
              <video
                src={post.video_url}
                controls
                className="w-full max-h-[480px] object-contain bg-black"
                poster={post.thumbnail_url ?? undefined}
              />
            ) : (
              <div className="px-5 pb-1">
                <ImageGrid urls={post.image_urls ?? []} />
              </div>
            )}
          </div>
          <div className="pr-3 pb-3 flex items-end">
            <SideActions {...actionProps} />
          </div>
        </div>
        <div className="px-5 pb-4">
          <DreamChip />
          <Tags />
        </div>
        <ReplyThread postId={post.id} currentUserId={currentUserId} show={showReplies} />
      </article>
    )
  }

  // ── Embed card ───────────────────────────────────────────────────────────
  if (isEmbed) {
    const safeUrl = sanitizeEmbedUrl(post.embed_url!, post.embed_type!)
    return (
      <article style={cardStyle} className="bg-[#0C0D22] border border-[#3C3A58]/30 rounded-2xl p-4 sm:p-5">
        <Header />
        {post.content && <p className="mt-3 text-[#EDEAF8] whitespace-pre-wrap leading-relaxed">{post.content}</p>}
        {safeUrl && (
          <div className="mt-3 rounded-xl overflow-hidden" style={{ paddingTop: post.embed_type === 'tiktok' ? '177%' : '56.25%', position: 'relative' }}>
            <iframe
              src={safeUrl}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
              title="Embedded content"
            />
          </div>
        )}
        <DreamChip />
        <Tags />
        <BottomActions {...actionProps} />
        <ReplyThread postId={post.id} currentUserId={currentUserId} show={showReplies} />
      </article>
    )
  }

  // ── Text card (default) ──────────────────────────────────────────────────
  return (
    <article style={cardStyle} className="bg-[#0C0D22] border border-[#3C3A58]/30 rounded-2xl p-4 sm:p-5">
      <Header />
      <p className="mt-3 text-[#EDEAF8] whitespace-pre-wrap leading-relaxed">{post.content}</p>
      <DreamChip />
      <Tags />
      <BottomActions {...actionProps} />
      <ReplyThread postId={post.id} currentUserId={currentUserId} show={showReplies} />
    </article>
  )
}
