import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Dream, DreamMilestone, Post } from '@/lib/types'
import { getDreamStageColor, getDreamStageIcon, DREAM_STAGES, formatTimeAgo, getInitials } from '@/lib/utils'
import DreamActions from '@/components/dreams/DreamActions'
import DreamPostList from '@/components/dreams/DreamPostList'

export const dynamic = 'force-dynamic'

export default async function DreamPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  console.log('>>> [DreamPage] ENTRY params raw:', JSON.stringify(resolvedParams))
  const id = resolvedParams?.id
  console.log('>>> [DreamPage] id:', id)
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  console.log('>>> [DreamPage] user:', user?.id, 'userError:', userError?.message)
  if (!user) redirect('/login')

  const [{ data: dream, error: dreamError }, { data: milestones }, { data: dreamPosts }, { data: collaborators }, { data: following }, { data: likedIds }, { data: savedIds }] = await Promise.all([
    supabase.from('dreams').select('*, profiles!dreams_user_id_fkey(*)').eq('id', id).maybeSingle(),
    supabase.from('dream_milestones').select('*').eq('dream_id', id).order('created_at', { ascending: true }),
    supabase.from('posts').select('*, profiles(*), dreams(*)').eq('dream_id', id).order('created_at', { ascending: false }).limit(20),
    supabase.from('dream_collaborators').select('*, profiles(*)').eq('dream_id', id),
    supabase.from('dream_followers').select('user_id').eq('dream_id', id).eq('user_id', user.id),
    supabase.from('post_likes').select('post_id').eq('user_id', user.id),
    supabase.from('post_saves').select('post_id').eq('user_id', user.id),
  ])

  console.log('>>> [DreamPage] dream:', dream?.id ?? 'null', 'dreamError:', dreamError?.code, dreamError?.message)
  if (!dream) notFound()

  const likedSet = new Set((likedIds || []).map((l) => l.post_id))
  const savedSet = new Set((savedIds || []).map((s) => s.post_id))
  const enrichedPosts: Post[] = (dreamPosts || []).map((p) => ({
    ...p,
    user_has_liked: likedSet.has(p.id),
    user_has_saved: savedSet.has(p.id),
  }))

  const isOwner = dream.user_id === user.id
  const isFollowing = (following || []).length > 0
  const stageIndex = DREAM_STAGES.indexOf(dream.current_stage as Dream['current_stage'])

  return (
    <div className="max-w-2xl mx-auto">
      {/* Dream header */}
      <div className="bg-[#0C0D22] border border-[#3C3A58]/30 rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            {dream.profiles?.avatar_url ? (
              <Image src={dream.profiles.avatar_url} alt="" width={40} height={40} className="rounded-full object-cover w-10 h-10" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#6D28D9] flex items-center justify-center font-semibold text-white">
                {getInitials(dream.profiles?.full_name || null)}
              </div>
            )}
            <div>
              <Link href={`/profile/${dream.user_id}`} className="font-medium hover:underline text-sm">{dream.profiles?.full_name || 'Builder'}</Link>
              <div className="text-xs text-[#8A88A8]">@{dream.profiles?.username} · {formatTimeAgo(dream.created_at)}</div>
            </div>
          </div>
          {isOwner && (
            <Link href={`/dream/${dream.id}/edit`} className="text-sm text-[#8A88A8] hover:text-[#EDEAF8] bg-[#121428] border border-[#3C3A58] px-3 py-1.5 rounded-lg">
              Edit
            </Link>
          )}
        </div>

        <h1 className="font-['Space_Grotesk'] text-2xl font-bold text-[#EDEAF8] mb-2">{dream.title}</h1>
        <p className="text-[#EDEAF8] mb-4 leading-relaxed">{dream.description}</p>

        {dream.why_it_matters && (
          <div className="bg-[#6D28D9]/10 border border-[#6D28D9]/20 rounded-xl p-4 mb-4">
            <div className="text-xs font-semibold text-[#8B5CF6] uppercase tracking-wide mb-1">Why this matters</div>
            <p className="text-[#EDEAF8] text-sm leading-relaxed">{dream.why_it_matters}</p>
          </div>
        )}

        {/* Dream Arc — progress through stages */}
        <div className="mb-4">
          <div className="text-xs font-semibold text-[#8A88A8] uppercase tracking-wide mb-2">Dream Arc</div>
          <div className="flex items-center gap-1 mb-3">
            {DREAM_STAGES.map((s, i) => (
              <div key={s} className="flex items-center gap-1 flex-1">
                <div className={`flex-1 h-1.5 rounded-full ${i <= stageIndex ? 'bg-[#6D28D9]' : 'bg-[#3C3A58]'}`} />
                {i === stageIndex && (
                  <span className={`text-xs px-1.5 py-0.5 rounded border whitespace-nowrap ${getDreamStageColor(s)}`}>
                    {getDreamStageIcon(s)} {s}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-[#3C3A58] rounded-full h-2">
              <div className="bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] h-2 rounded-full transition-all" style={{ width: `${dream.progress_percentage}%` }} />
            </div>
            <span className="text-sm font-medium text-[#8B5CF6]">{dream.progress_percentage}%</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          {dream.current_obstacle && (
            <div className="bg-[#121428] rounded-xl p-3">
              <div className="text-xs font-semibold text-orange-400 mb-1">🧱 Current Obstacle</div>
              <p className="text-sm text-[#EDEAF8]">{dream.current_obstacle}</p>
            </div>
          )}
          {dream.next_milestone && (
            <div className="bg-[#121428] rounded-xl p-3">
              <div className="text-xs font-semibold text-yellow-400 mb-1">🎯 Next Milestone</div>
              <p className="text-sm text-[#EDEAF8]">{dream.next_milestone}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-[#8A88A8]">👥 {dream.followers_count} followers</div>
          <DreamActions dreamId={dream.id} currentUserId={user.id} isFollowing={isFollowing} isOwner={isOwner} />
        </div>
      </div>

      {/* Milestones */}
      {(milestones || []).length > 0 && (
        <div className="bg-[#0C0D22] border border-[#3C3A58]/30 rounded-2xl p-5 mb-6">
          <h2 className="font-['Space_Grotesk'] font-bold text-lg mb-4">Milestones</h2>
          <div className="space-y-3">
            {(milestones as DreamMilestone[]).map((m) => (
              <div key={m.id} className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center ${m.completed ? 'border-green-500 bg-green-500' : 'border-[#3C3A58]'}`}>
                  {m.completed && <span className="text-white text-xs">✓</span>}
                </div>
                <div>
                  <div className={`font-medium text-sm ${m.completed ? 'text-[#8A88A8] line-through' : 'text-[#EDEAF8]'}`}>{m.title}</div>
                  {m.description && <div className="text-xs text-[#8A88A8] mt-0.5">{m.description}</div>}
                  {m.target_date && <div className="text-xs text-[#8A88A8] mt-0.5">Target: {m.target_date}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collaborators */}
      {(collaborators || []).length > 0 && (
        <div className="bg-[#0C0D22] border border-[#3C3A58]/30 rounded-2xl p-5 mb-6">
          <h2 className="font-['Space_Grotesk'] font-bold text-lg mb-3">Collaborators</h2>
          <div className="flex flex-wrap gap-3">
            {(collaborators || []).map((c: any) => (
              <Link key={c.user_id} href={`/profile/${c.user_id}`} className="flex items-center gap-2 bg-[#121428] border border-[#3C3A58] hover:border-[#6D28D9] rounded-xl px-3 py-2">
                {c.profiles?.avatar_url ? (
                  <Image src={c.profiles.avatar_url} alt="" width={24} height={24} className="rounded-full w-6 h-6 object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#6D28D9] flex items-center justify-center text-xs font-semibold text-white">
                    {getInitials(c.profiles?.full_name || null)}
                  </div>
                )}
                <span className="text-sm">{c.profiles?.full_name || 'Builder'}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Journey Posts */}
      <div>
        <h2 className="font-['Space_Grotesk'] font-bold text-lg mb-4">Journey Posts</h2>
        <DreamPostList posts={enrichedPosts} currentUserId={user.id} />
      </div>
    </div>
  )
}
