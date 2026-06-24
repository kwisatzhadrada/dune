import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getInitials, getPostTypeColor, getPostTypeLabel, formatTimeAgo } from '@/lib/utils'
import { Profile, Post } from '@/lib/types'
import ConnectButton from '@/components/profile/ConnectButton'

export const dynamic = 'force-dynamic'

export default async function UserProfilePage({ params }: { params: { userId: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (params.userId === user.id) redirect('/profile')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', params.userId).single()
  if (!profile) redirect('/discover')

  const { data: posts } = await supabase
    .from('posts')
    .select('*, profiles(*)')
    .eq('user_id', params.userId)
    .order('created_at', { ascending: false })
    .limit(20)

  const { data: conn } = await supabase
    .from('connections')
    .select('status')
    .or(`and(requester_id.eq.${user.id},addressee_id.eq.${params.userId}),and(requester_id.eq.${params.userId},addressee_id.eq.${user.id})`)
    .maybeSingle()

  const p = profile as Profile

  return (
    <div>
      <div className="bg-[#0C0D22] border border-[#3C3A58]/30 rounded-2xl p-6 mb-6">
        <div className="flex items-start gap-4">
          {p.avatar_url ? (
            <Image src={p.avatar_url} alt="" width={72} height={72} className="rounded-full object-cover w-18 h-18 w-[72px] h-[72px]" />
          ) : (
            <div className="w-[72px] h-[72px] rounded-full bg-[#6D28D9] flex items-center justify-center text-2xl font-semibold text-white">
              {getInitials(p.full_name)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="font-['Space_Grotesk'] text-xl font-bold">{p.full_name}</h2>
            <div className="text-[#8A88A8]">@{p.username}</div>
            <div className="text-sm text-[#8A88A8] mt-1">
              {p.industry}{p.location ? ` · ${p.location}` : ''}
            </div>
          </div>
          <ConnectButton currentUserId={user.id} targetId={p.id} initialStatus={conn?.status} />
        </div>

        {p.bio && <p className="mt-4 text-[#EDEAF8]">{p.bio}</p>}
        {p.current_goal && <div className="mt-3 text-sm text-[#8B5CF6]">🎯 {p.current_goal}</div>}
        {p.current_blocker && <div className="mt-1 text-sm text-[#F59E0B]">🧱 {p.current_blocker}</div>}

        {p.skills && p.skills.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {p.skills.map((s) => (
              <span key={s} className="text-xs bg-[#121428] border border-[#3C3A58] text-[#8A88A8] px-2.5 py-1 rounded-md">{s}</span>
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          {p.linkedin_url && <a href={p.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-[#3B82F6] hover:underline">LinkedIn</a>}
          {p.twitter_url && <a href={p.twitter_url} target="_blank" rel="noopener noreferrer" className="text-[#3B82F6] hover:underline">Twitter</a>}
          {p.website_url && <a href={p.website_url} target="_blank" rel="noopener noreferrer" className="text-[#3B82F6] hover:underline">Website</a>}
        </div>
      </div>

      <h3 className="font-['Space_Grotesk'] text-lg font-bold mb-3">Posts</h3>
      <div className="space-y-4">
        {(!posts || posts.length === 0) ? (
          <div className="text-center text-[#8A88A8] py-10">No posts yet.</div>
        ) : (
          (posts as Post[]).map((post) => (
            <div key={post.id} className="bg-[#0C0D22] border border-[#3C3A58]/30 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-block px-2 py-0.5 rounded-md text-xs border ${getPostTypeColor(post.post_type)}`}>
                  {getPostTypeLabel(post.post_type)}
                </span>
                <span className="text-xs text-[#8A88A8]">{formatTimeAgo(post.created_at)}</span>
              </div>
              <p className="whitespace-pre-wrap">{post.content}</p>
              <div className="mt-3 text-sm text-[#8A88A8] flex gap-4">
                <span>❤️ {post.likes_count}</span>
                <span>💬 {post.replies_count}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
