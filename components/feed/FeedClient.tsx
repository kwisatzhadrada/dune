'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Post, Dream } from '@/lib/types'
import { scoreFeedPost } from '@/lib/media'
import PostCard from './PostCard'
import CreatePostModal from './CreatePostModal'

const PAGE_SIZE = 20

type Tab = 'for_you' | 'following' | 'trending' | 'dream_updates'

const TABS: { id: Tab; label: string }[] = [
  { id: 'for_you', label: 'For You' },
  { id: 'following', label: 'Following' },
  { id: 'trending', label: 'Trending' },
  { id: 'dream_updates', label: '✨ Dream Updates' },
]

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="flex border-b border-[#3C3A58]/40 mb-5 -mx-1 overflow-x-auto scrollbar-hide">
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
            active === t.id
              ? 'border-[#8B5CF6] text-[#EDEAF8]'
              : 'border-transparent text-[#8A88A8] hover:text-[#EDEAF8]'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

function mergeLikesSaves(posts: Post[], likedSet: Set<string>, savedSet: Set<string>): Post[] {
  return posts.map((p) => ({
    ...p,
    user_has_liked: likedSet.has(p.id),
    user_has_saved: savedSet.has(p.id),
  }))
}

export default function FeedClient({
  initialPosts,
  currentUserId,
  myDreams,
  followingIds,
}: {
  initialPosts: Post[]
  currentUserId: string
  myDreams: Dream[]
  followingIds?: string[]
}) {
  const supabase = createClient()

  // per-tab post state
  const [tabPosts, setTabPosts] = useState<Record<Tab, Post[] | null>>({
    for_you: initialPosts,
    following: null,
    trending: null,
    dream_updates: null,
  })
  const [tabHasMore, setTabHasMore] = useState<Record<Tab, boolean>>({
    for_you: initialPosts.length === PAGE_SIZE,
    following: true,
    trending: true,
    dream_updates: true,
  })
  const [tabLoading, setTabLoading] = useState<Record<Tab, boolean>>({
    for_you: false,
    following: false,
    trending: false,
    dream_updates: false,
  })

  const [activeTab, setActiveTab] = useState<Tab>('for_you')
  const [showModal, setShowModal] = useState(false)
  const [loadMoreError, setLoadMoreError] = useState(false)

  const posts = tabPosts[activeTab]

  async function fetchLikeSaveSets() {
    const [{ data: likedIds }, { data: savedIds }] = await Promise.all([
      supabase.from('post_likes').select('post_id').eq('user_id', currentUserId),
      supabase.from('post_saves').select('post_id').eq('user_id', currentUserId),
    ])
    return {
      likedSet: new Set<string>((likedIds || []).map((l) => l.post_id)),
      savedSet: new Set<string>((savedIds || []).map((s) => s.post_id)),
    }
  }

  const loadTab = useCallback(async (tab: Tab) => {
    if (tabPosts[tab] !== null) return
    setTabLoading((prev) => ({ ...prev, [tab]: true }))
    const { likedSet, savedSet } = await fetchLikeSaveSets()

    let query = supabase.from('posts').select('*, profiles(*), dreams(*)')
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)

    if (tab === 'following') {
      const ids = followingIds?.length ? followingIds : ['__none__']
      query = query.in('user_id', ids)
    } else if (tab === 'trending') {
      const since = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()
      query = query.gte('created_at', since)
    } else if (tab === 'dream_updates') {
      query = query.in('post_type', ['dream_update', 'milestone'])
    }

    const { data, error } = await query
    if (error) {
      setTabLoading((prev) => ({ ...prev, [tab]: false }))
      return
    }

    let fetched = mergeLikesSaves((data as Post[]) || [], likedSet, savedSet)

    if (tab === 'for_you') {
      fetched = [...fetched].sort((a, b) => scoreFeedPost(b) - scoreFeedPost(a))
    } else if (tab === 'trending') {
      fetched = [...fetched].sort((a, b) =>
        (b.likes_count + b.saves_count * 3 + b.replies_count * 2 + (b.shares_count ?? 0) * 4) -
        (a.likes_count + a.saves_count * 3 + a.replies_count * 2 + (a.shares_count ?? 0) * 4)
      )
    }

    setTabPosts((prev) => ({ ...prev, [tab]: fetched }))
    setTabHasMore((prev) => ({ ...prev, [tab]: fetched.length === PAGE_SIZE }))
    setTabLoading((prev) => ({ ...prev, [tab]: false }))
  }, [tabPosts, followingIds, currentUserId]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleTabChange(tab: Tab) {
    setActiveTab(tab)
    loadTab(tab)
  }

  function handleCreated(post: Post) {
    setTabPosts((prev) => ({
      ...prev,
      for_you: prev.for_you ? [post, ...prev.for_you] : [post],
      following: null, // invalidate so it reloads
    }))
    setShowModal(false)
  }

  function handleDeleted(id: string) {
    setTabPosts((prev) => {
      const next = { ...prev }
      for (const tab of Object.keys(next) as Tab[]) {
        if (next[tab]) next[tab] = next[tab]!.filter((p) => p.id !== id)
      }
      return next
    })
  }

  async function loadMore() {
    if (tabLoading[activeTab] || !tabHasMore[activeTab]) return
    setTabLoading((prev) => ({ ...prev, [activeTab]: true }))
    setLoadMoreError(false)
    const current = tabPosts[activeTab] || []
    const oldest = current[current.length - 1]?.created_at
    const { likedSet, savedSet } = await fetchLikeSaveSets()

    let query = supabase.from('posts').select('*, profiles(*), dreams(*)')
      .order('created_at', { ascending: false })
      .lt('created_at', oldest)
      .limit(PAGE_SIZE)

    if (activeTab === 'following') {
      const ids = followingIds?.length ? followingIds : ['__none__']
      query = query.in('user_id', ids)
    } else if (activeTab === 'trending') {
      const since = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()
      query = query.gte('created_at', since)
    } else if (activeTab === 'dream_updates') {
      query = query.in('post_type', ['dream_update', 'milestone'])
    }

    const { data, error } = await query
    if (error) {
      setLoadMoreError(true)
      setTabLoading((prev) => ({ ...prev, [activeTab]: false }))
      return
    }
    const newPosts = mergeLikesSaves((data as Post[]) || [], likedSet, savedSet)
    setTabPosts((prev) => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), ...newPosts] }))
    setTabHasMore((prev) => ({ ...prev, [activeTab]: newPosts.length === PAGE_SIZE }))
    setTabLoading((prev) => ({ ...prev, [activeTab]: false }))
  }

  const loading = tabLoading[activeTab]
  const hasMore = tabHasMore[activeTab]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-['Space_Grotesk'] text-2xl font-bold">Feed</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#6D28D9] hover:bg-[#8B5CF6] text-white px-4 py-2 rounded-xl font-medium text-sm"
        >
          + Post
        </button>
      </div>

      <TabBar active={activeTab} onChange={handleTabChange} />

      {myDreams.length === 0 && activeTab === 'for_you' && (
        <div className="mb-5 bg-gradient-to-r from-[#6D28D9]/20 to-[#8B5CF6]/10 border border-[#6D28D9]/30 rounded-2xl p-4 flex items-center gap-4">
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

      {loading && posts === null ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#0C0D22] border border-[#3C3A58]/30 rounded-2xl p-5 animate-pulse">
              <div className="flex gap-3">
                <div className="w-11 h-11 rounded-full bg-[#121428]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[#121428] rounded w-1/3" />
                  <div className="h-3 bg-[#121428] rounded w-1/4" />
                </div>
              </div>
              <div className="mt-3 space-y-2">
                <div className="h-4 bg-[#121428] rounded" />
                <div className="h-4 bg-[#121428] rounded w-5/6" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {posts === null || posts.length === 0 ? (
            <div className="text-center text-[#8A88A8] py-16">
              {activeTab === 'following'
                ? 'Follow people to see their posts here.'
                : activeTab === 'trending'
                ? 'No trending posts yet — be the first to spark something!'
                : activeTab === 'dream_updates'
                ? 'No dream updates yet. Share your progress!'
                : 'No posts yet. Be the first!'}
            </div>
          ) : (
            posts.map((post) => (
              <PostCard key={post.id} post={post} currentUserId={currentUserId} onDeleted={handleDeleted} />
            ))
          )}
        </div>
      )}

      {loadMoreError && (
        <div className="mt-4 text-center text-[#EF4444] text-sm">Failed to load more posts.</div>
      )}
      {posts && hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="bg-[#0C0D22] border border-[#3C3A58] hover:border-[#6D28D9] text-[#8A88A8] hover:text-[#EDEAF8] px-6 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {loading ? 'Loading…' : loadMoreError ? 'Retry' : 'Load more'}
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
