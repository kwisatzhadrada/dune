'use client'

import { useCallback, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Post } from '@/lib/types'
import PostCard from './PostCard'
import CreatePostModal from './CreatePostModal'
import { POST_TYPES } from '@/lib/utils'

const PAGE_SIZE = 20

const FILTERS = [{ value: 'all', label: 'All' }, ...POST_TYPES.map((t) => ({ value: t.value, label: t.label }))]

export default function PostFeed({ initialPosts, currentUserId }: { initialPosts: Post[]; currentUserId: string }) {
  const supabase = createClient()
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [filter, setFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(initialPosts.length >= PAGE_SIZE)

  const filtered = filter === 'all' ? posts : posts.filter((p) => p.post_type === filter)

  const loadMore = useCallback(async () => {
    setLoadingMore(true)
    const last = posts[posts.length - 1]
    let query = supabase
      .from('posts')
      .select('*, profiles(*)')
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)
    if (last) query = query.lt('created_at', last.created_at)

    const { data } = await query
    if (data) {
      const likedIds = posts.filter((p) => p.user_has_liked).map((p) => p.id)
      const savedIds = posts.filter((p) => p.user_has_saved).map((p) => p.id)
      const { data: likes } = await supabase.from('post_likes').select('post_id').eq('user_id', currentUserId).in('post_id', data.map((d: any) => d.id))
      const { data: saves } = await supabase.from('post_saves').select('post_id').eq('user_id', currentUserId).in('post_id', data.map((d: any) => d.id))
      const lset = new Set([...(likes || []).map((l) => l.post_id), ...likedIds])
      const sset = new Set([...(saves || []).map((s) => s.post_id), ...savedIds])
      const more: Post[] = data.map((p: any) => ({ ...p, user_has_liked: lset.has(p.id), user_has_saved: sset.has(p.id) }))
      setPosts((prev) => [...prev, ...more])
      setHasMore(data.length >= PAGE_SIZE)
    }
    setLoadingMore(false)
  }, [posts, supabase, currentUserId])

  function onCreated(post: Post) {
    setPosts((prev) => [post, ...prev])
    setShowCreate(false)
  }

  function onDeleted(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-['Space_Grotesk'] text-2xl font-bold">Feed</h1>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-1 px-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-sm border transition-colors ${
              filter === f.value
                ? 'bg-[#6D28D9] border-[#6D28D9] text-white'
                : 'bg-[#0C0D22] border-[#3C3A58] text-[#8A88A8] hover:border-[#6D28D9]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center text-[#8A88A8] py-16">No posts yet. Be the first to share!</div>
        ) : (
          filtered.map((post) => (
            <PostCard key={post.id} post={post} currentUserId={currentUserId} onDeleted={onDeleted} />
          ))
        )}
      </div>

      {hasMore && filter === 'all' && (
        <div className="text-center mt-6">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="bg-[#0C0D22] border border-[#3C3A58] hover:border-[#6D28D9] text-[#EDEAF8] px-6 py-2.5 rounded-xl font-medium disabled:opacity-50"
          >
            {loadingMore ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowCreate(true)}
        className="fixed bottom-24 lg:bottom-8 right-6 z-30 w-14 h-14 rounded-full bg-[#6D28D9] hover:bg-[#8B5CF6] text-white text-2xl flex items-center justify-center shadow-[0_0_30px_rgba(109,40,217,0.5)] transition-all hover:scale-105"
        aria-label="Create post"
      >
        +
      </button>

      {showCreate && (
        <CreatePostModal currentUserId={currentUserId} onClose={() => setShowCreate(false)} onCreated={onCreated} />
      )}
    </div>
  )
}
