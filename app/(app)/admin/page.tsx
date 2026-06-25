import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { getInitials, formatTimeAgo, getPostTypeLabel } from '@/lib/utils'
import { Profile, Post } from '@/lib/types'
import AdminPostActions from '@/components/admin/AdminPostActions'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!me?.is_admin) redirect('/feed')

  const [{ count: userCount }, { count: postCount }, { count: messageCount }, { count: connectionCount }] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('posts').select('id', { count: 'exact', head: true }),
    supabase.from('messages').select('id', { count: 'exact', head: true }),
    supabase.from('connections').select('id', { count: 'exact', head: true }),
  ])

  const { data: recentUsers } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: recentPosts } = await supabase
    .from('posts')
    .select('*, profiles(*)')
    .order('created_at', { ascending: false })
    .limit(15)

  const stats = [
    { label: 'Users', value: userCount || 0, color: 'text-[#8B5CF6]' },
    { label: 'Posts', value: postCount || 0, color: 'text-[#22C55E]' },
    { label: 'Messages', value: messageCount || 0, color: 'text-[#3B82F6]' },
    { label: 'Connections', value: connectionCount || 0, color: 'text-[#F59E0B]' },
  ]

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">🛡️</span>
        <h1 className="font-['Space_Grotesk'] text-2xl font-bold">Admin Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-[#0C0D22] border border-[#3C3A58]/30 rounded-2xl p-5">
            <div className={`font-['Space_Grotesk'] text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[#8A88A8] text-sm mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <h2 className="font-['Space_Grotesk'] text-lg font-bold mb-3">Recent users</h2>
      <div className="bg-[#0C0D22] border border-[#3C3A58]/30 rounded-2xl overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[#8A88A8] border-b border-[#3C3A58]/30">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell">Industry</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell">Joined</th>
              <th className="px-4 py-3 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {(recentUsers as Profile[] || []).map((u) => (
              <tr key={u.id} className="border-b border-[#3C3A58]/20 last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/profile/${u.id}`} className="flex items-center gap-2 hover:underline">
                    {u.avatar_url ? (
                      <Image src={u.avatar_url} alt="" width={28} height={28} className="rounded-full object-cover w-7 h-7" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-[#6D28D9] flex items-center justify-center text-xs font-semibold text-white">
                        {getInitials(u.full_name)}
                      </div>
                    )}
                    <span>{u.full_name || u.username || 'Unnamed'}</span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-[#8A88A8] hidden sm:table-cell">{u.industry || '—'}</td>
                <td className="px-4 py-3 text-[#8A88A8] hidden sm:table-cell">{formatTimeAgo(u.created_at)}</td>
                <td className="px-4 py-3 text-right">
                  {u.is_admin ? (
                    <span className="text-[#8B5CF6] text-xs">Admin</span>
                  ) : u.onboarding_complete ? (
                    <span className="text-[#22C55E] text-xs">Active</span>
                  ) : (
                    <span className="text-[#F59E0B] text-xs">Pending</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="font-['Space_Grotesk'] text-lg font-bold mb-3">Recent posts — moderation</h2>
      <div className="space-y-3">
        {(recentPosts as Post[] || []).map((post) => (
          <div key={post.id} className="bg-[#0C0D22] border border-[#3C3A58]/30 rounded-2xl p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{post.profiles?.full_name || 'Anonymous'}</span>
                <span className="text-[#8A88A8]">· {getPostTypeLabel(post.post_type)}</span>
                <span className="text-[#8A88A8]">· {formatTimeAgo(post.created_at)}</span>
              </div>
              <AdminPostActions postId={post.id} />
            </div>
            <p className="text-sm text-[#EDEAF8] whitespace-pre-wrap line-clamp-3">{post.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
