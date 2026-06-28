import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Profile, Dream } from '@/lib/types'
import { generateMatchScore } from '@/lib/utils'
import MatchCard from '@/components/matches/MatchCard'

export const dynamic = 'force-dynamic'

export default async function MatchesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!me) redirect('/login')
  const { data: people } = await supabase
    .from('profiles')
    .select('*')
    .neq('id', user.id)
    .eq('onboarding_complete', true)
    .limit(200)

  const { data: connections } = await supabase
    .from('connections')
    .select('requester_id, addressee_id, status')
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

  // Fetch dreams: mine and all people's active dreams
  const peopleIds = ((people as Profile[]) || []).map((p) => p.id)
  const [{ data: myDreams }, { data: theirDreams }] = await Promise.all([
    supabase.from('dreams').select('*').eq('user_id', user.id).eq('status', 'active').order('created_at', { ascending: false }).limit(1),
    peopleIds.length > 0
      ? supabase.from('dreams').select('*').in('user_id', peopleIds).eq('status', 'active')
      : Promise.resolve({ data: [] }),
  ])

  const myDream: Dream | null = (myDreams && myDreams.length > 0) ? myDreams[0] as Dream : null

  // Build a map of user_id -> their most recent active dream
  const dreamByUser: Record<string, Dream> = {}
  for (const d of (theirDreams as Dream[] || [])) {
    if (!dreamByUser[d.user_id]) {
      dreamByUser[d.user_id] = d
    }
  }

  const connectionMap: Record<string, string> = {}
  ;(connections || []).forEach((c) => {
    const other = c.requester_id === user.id ? c.addressee_id : c.requester_id
    connectionMap[other] = c.status
  })

  const meProfile = me as Profile

  const ranked = ((people as Profile[]) || [])
    .map((p) => ({ person: p, score: generateMatchScore(meProfile, p, myDream, dreamByUser[p.id] || null) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 30)

  return (
    <div>
      <h1 className="font-['Space_Grotesk'] text-2xl font-bold mb-1">Your matches</h1>
      <p className="text-[#8A88A8] mb-6">People who can help with your blocker — or who you can help.</p>

      <div className="space-y-4">
        {ranked.length === 0 ? (
          <div className="text-center text-[#8A88A8] py-16">No matches yet. Complete your profile to improve matching.</div>
        ) : (
          ranked.map(({ person, score }) => (
            <MatchCard
              key={person.id}
              person={person}
              me={meProfile}
              score={score}
              currentUserId={user.id}
              initialStatus={connectionMap[person.id]}
            />
          ))
        )}
      </div>
    </div>
  )
}
