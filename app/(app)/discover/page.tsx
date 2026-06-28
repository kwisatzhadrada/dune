import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DiscoverFilters from '@/components/discover/DiscoverFilters'
import { Profile } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function DiscoverPage() {
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
    .order('created_at', { ascending: false })
    .limit(100)

  const { data: connections } = await supabase
    .from('connections')
    .select('requester_id, addressee_id, status')
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

  const connectionMap: Record<string, string> = {}
  ;(connections || []).forEach((c) => {
    const other = c.requester_id === user.id ? c.addressee_id : c.requester_id
    connectionMap[other] = c.status
  })

  return (
    <DiscoverFilters
      me={me as Profile}
      people={(people as Profile[]) || []}
      currentUserId={user.id}
      connectionMap={connectionMap}
    />
  )
}
