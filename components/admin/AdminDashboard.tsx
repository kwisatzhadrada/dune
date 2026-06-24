'use client'

import { useState } from 'react'
import { Profile, Post } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { formatTimeAgo, getInitials, getPostTypeLabel } from '@/lib/utils'

interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalPosts: number
  messagesSent: number
}

interface AdminDashboardProps {
  stats: AdminStats
  recentUsers: Profile[]
  recentPosts: any[]
}

export default function AdminDashboard({ stats, recentUsers, recentPosts: initialPosts }: AdminDashboardProps) {
  const supabase = createClient()
  const [posts, setPosts] = useState(initialPosts)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function deletePost(postId: string) {
    if (!confirm('Delete this post? This cannot be undone.')) return
    setDeletingId(postId)
    await supabase.from('posts').delete().eq('id', postId)
    setPosts((prev) => prev.filter((p) => p.id !== postId))
    setDeletingId(null)
  }

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, color: 'text-[#8B5CF6]', bg: 'bg-[#6D28D9]/10 border-[#6D28D9]/20' },
    { label: 'New Users (7d)', value: stats.activeUsers, color: 'text-[#22C55E]', bg: 'bg-[#16A34A]/10 border-[#16A34A]/20' },
    { label: 'Total Posts', value: stats.totalPosts, color: 'text-[#3B82F6]', bg: 'bg-[#1E40AF]/10 border-[#1E40AF]/20' },
    { label: 'Messages Sent', value: stats.messagesSent, color: 'text-[#F59E0B]', bg: 'bg-[#C2410C]/10 border-[#C2410C]/20' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-['Space_Grotesk'] text-2xl font-bold mb-1">Admin Dashboard</h1>
        <p className="text-[#8A88A8] text-sm">Platform overview and content moderation.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className={`${stat.bg} border rounded-2xl p-5`}>
            <div className={`font-['Space_Grotesk'] text-3xl font-bold ${stat.color}`}>
              {stat.value.toLocaleString()}
            </div>
            <div className="text-[#8A88A8] text-sm mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Users */}
      <div>
        <h2 className="font-['Space_Grotesk'] text-lg font-bold mb-4">Recent Users</h2>
        <div className="bg-[#0C0D22] border border-[#3C3A58]/30 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#3C3A58]/30">
                  <th className="text-left px-4 py-3 text-[#8A88A8] font-medium">User</th>
                  <th className="text-left px-4 py-3 text-[#8A88A8] font-medium hidden sm:table-cell">Industry</th>
                  <th className="text-left px-4 py-3 text-[#8A88A8] font-medium hidden md:table-cell">Goal</th>
                  <th className="text-left px-4 py-3 text-[#8A88A8] font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((user) => (
                  <tr key={user.id} className="border-b border-[#3C3A58]/20 hover:bg-[#121428]/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#6D28D9] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {getInitials(user.full_name)}
                        </div>
                        <div>
                          <div className="font-medium text-[#EDEAF8]">{user.full_name || 'Anonymous'}</div>
                          {user.username && <div className="text-xs text-[#8A88A8]">@{user.username}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#8A88A8] hidden sm:table-cell">
                      {user.industry || '—'}
                    </td>
                    <td className="px-4 py-3 text-[#8A88A8] hidden md:table-cell max-w-xs">
                      <span className="truncate block">{user.current_goal || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-[#8A88A8] whitespace-nowrap">
                      {formatTimeAgo(user.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Posts */}
      <div>
        <h2 className="font-['Space_Grotesk'] text-lg font-bold mb-4">Recent Posts</h2>
        <div className="space-y-3">
          {posts.map((post: any) => (
            <div key={post.id} className="bg-[#0C0D22] border border-[#3C3A58]/30 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-medium text-[#EDEAF8]">
                      {post.profiles?.full_name || 'Unknown'}
                    </span>
                    <span className="text-xs text-[#8A88A8]">
                      {getPostTypeLabel(post.post_type)}
                    </span>
                    <span className="text-xs text-[#8A88A8]">
                      {formatTimeAgo(post.created_at)}
                    </span>
                    <span className="text-xs text-[#8A88A8]">
                      ❤️ {post.likes_count} · 💬 {post.replies_count}
                    </span>
                  </div>
                  <p className="text-[#8A88A8] text-sm line-clamp-2">{post.content}</p>
                </div>
                <button
                  onClick={() => deletePost(post.id)}
                  disabled={deletingId === post.id}
                  className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  {deletingId === post.id ? '...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
