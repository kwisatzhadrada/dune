'use client'

import { useState } from 'react'
import PostCard from '@/components/feed/PostCard'
import { Post } from '@/lib/types'

export default function DreamPostList({ posts, currentUserId }: { posts: Post[]; currentUserId: string }) {
  const [visible, setVisible] = useState<Post[]>(posts)

  return (
    <div className="space-y-4">
      {visible.length === 0 ? (
        <div className="text-center text-[#8A88A8] py-8">No posts linked to this dream yet.</div>
      ) : (
        visible.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={currentUserId}
            onDeleted={(id) => setVisible((prev) => prev.filter((p) => p.id !== id))}
          />
        ))
      )}
    </div>
  )
}
