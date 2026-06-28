'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Post, Dream } from '@/lib/types'
import PostCard from './PostCard'
import CreatePostModal from './CreatePostModal'

const PAGE_SIZE = 20

export default function FeedClient({
  initialPosts,
  currentUserId,
  myDreams,
}: {
  initialPosts: Post[]
  currentUserId: string
  myDreams: Dream[]
}) {
  const supabase = createClient()
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [showModal, setShowModal] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(initialPosts.length === PAGE_SIZE)
  const [loadMoreError, setLoadMoreError] = useState(false)

  function handleCreated(post: Post) {
    setPosts((prev) => [post, ...prev])
    setShowModal(false)
  }

  function handleDeleted(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id))
  }

  async function loadMore() {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    setLoadMoreError(false)
    const oldest = posts[posts.length - 1]?.created_at
    const [{ data: rawPosts, error }, { data: likedIds }, { data: savedIds }] = await Promise.all([
      supabase.from('posts').select('*, profiles(*), dreams(*)')
        .order('created_at', { ascending: false })
        .lt('created_at', oldest)
        .limit(PAGE_SIZE),
      supabase.from('post_likes').select('post_id').eq('user_id', currentUserId),
      supabase.from('post_saves').select('post_id').eq('user_id', currentUserId),
    ])
    if (error) {
      setLoadMoreError(true)
      setLoadingMore(false)
      return
    }
    const likedSet = new Set((likedIds || []).map((l) => l.post_id))
    const savedSet = new Set((savedIds || []).map((s) => s.post_id))
    const newPosts: Post[] = (rawPosts || []).map((p) => ({
      ...p,
      user_has_liked: likedSet.has(p.id),
      user_has_saved: savedSet.has(p.id),
    }))
    setPosts((prev) => [...prev, ...newPosts])
    setHasMore(newPosts.length === PAGE_SIZE)
    setLoadingMore(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-['Space_Grotesk'] text-2xl font-bold">Feed</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#6D28D9] hover:bg-[#8B5CF6] text-white px-4 py-2 rounded-xl font-medium text-sm"
        >
          + Post
        </button>
      </div>

      {myDreams.length === 0 && (
        <div className="mb-6 bg-gradient-to-r from-[#6D28D9]/20 to-[#8B5CF6]/10 border border-[#6D28D9]/30 rounded-2xl p-4 flex items-center gap-4">
          <span className="text-3xl">✨</span>
          <div className="flex-1">
            <div className="font-semibold text-[#EDEAF8]">Share your Dream</div>
            <div className="text-sm text-[#8A88A8]">Create a Dream to give your posts context and connect with the right people.</div>
          </div>
          <Link href="/dreams/new" className="bg-[#6D28D9] hover:bg-[#8B5CF6] text-white px-4 py-2 rounded-xl text-sm font-medium shrink-0">
            Create Dream
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center text-[#8A88A8] py-16">No posts yet. Be the first!</div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} currentUserId={currentUserId} onDeleted={handleDeleted} />
          ))
        )}
      </div>

      {loadMoreError && (
        <div className="mt-4 text-center text-[#EF4444] text-sm">Failed to load more posts.</div>
      )}
      {hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="bg-[#0C0D22] border border-[#3C3A58] hover:border-[#6D28D9] text-[#8A88A8] hover:text-[#EDEAF8] px-6 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {loadingMore ? 'Loading...' : loadMoreError ? 'Retry' : 'Load more'}
          </button>
        </div>
      )}

      {showModal && (
        <CreatePostModal
          currentUserId={currentUserId}
          dreams={myDreams}
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}
