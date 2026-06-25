'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Post, Dream } from '@/lib/types'
import PostCard from './PostCard'
import CreatePostModal from './CreatePostModal'

export default function FeedClient({
  initialPosts,
  currentUserId,
  myDreams,
}: {
  initialPosts: Post[]
  currentUserId: string
  myDreams: Dream[]
}) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [showModal, setShowModal] = useState(false)

  function handleCreated(post: Post) {
    setPosts((prev) => [post, ...prev])
    setShowModal(false)
  }

  function handleDeleted(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id))
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
          <Link href="/dream/new" className="bg-[#6D28D9] hover:bg-[#8B5CF6] text-white px-4 py-2 rounded-xl text-sm font-medium shrink-0">
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
