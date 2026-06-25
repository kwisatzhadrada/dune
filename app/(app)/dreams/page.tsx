import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Dream } from '@/lib/types'
import { getDreamStageColor, getDreamStageIcon, formatTimeAgo, getInitials } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function DreamsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: dreams } = await supabase
    .from('dreams')
    .select('*, profiles(*)')
    .eq('status', 'active')
    .order('followers_count', { ascending: false })
    .limit(50)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-['Space_Grotesk'] text-2xl font-bold">Dreams</h1>
          <p className="text-[#8A88A8] text-sm mt-1">Follow the journeys that inspire you.</p>
        </div>
        <Link href="/dream/new" className="bg-[#6D28D9] hover:bg-[#8B5CF6] text-white px-4 py-2 rounded-xl font-medium text-sm">
          + New Dream
        </Link>
      </div>

      <div className="space-y-4">
        {(dreams as Dream[] || []).length === 0 ? (
          <div className="text-center text-[#8A88A8] py-16">No dreams yet. Be the first to share yours!</div>
        ) : (
          (dreams as Dream[]).map((dream) => (
            <Link key={dream.id} href={`/dream/${dream.id}`} className="block bg-[#0C0D22] border border-[#3C3A58]/30 hover:border-[#6D28D9]/40 rounded-2xl p-5 transition-colors">
              <div className="flex items-start gap-3">
                {dream.profiles?.avatar_url ? (
                  <Image src={dream.profiles.avatar_url} alt="" width={40} height={40} className="rounded-full object-cover w-10 h-10 shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#6D28D9] flex items-center justify-center font-semibold text-white shrink-0">
                    {getInitials(dream.profiles?.full_name || null)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-medium text-sm">{dream.profiles?.full_name || 'Builder'}</span>
                    <span className="text-[#8A88A8] text-xs">@{dream.profiles?.username}</span>
                    <span className="text-[#3C3A58]">·</span>
                    <span className="text-[#8A88A8] text-xs">{formatTimeAgo(dream.created_at)}</span>
                  </div>
                  <h2 className="font-['Space_Grotesk'] font-bold text-lg text-[#EDEAF8] mb-1">{dream.title}</h2>
                  <p className="text-[#8A88A8] text-sm line-clamp-2 mb-3">{dream.description}</p>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border ${getDreamStageColor(dream.current_stage)}`}>
                      {getDreamStageIcon(dream.current_stage)} {dream.current_stage}
                    </span>
                    <div className="flex-1 max-w-[120px] bg-[#3C3A58] rounded-full h-1.5">
                      <div className="bg-[#6D28D9] h-1.5 rounded-full" style={{ width: `${dream.progress_percentage}%` }} />
                    </div>
                    <span className="text-xs text-[#8A88A8]">{dream.progress_percentage}%</span>
                    <span className="text-xs text-[#8A88A8] ml-auto">👥 {dream.followers_count} followers</span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
