import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Connection } from '@/lib/types'
import ConnectionActions from '@/components/connections/ConnectionActions'
import Image from 'next/image'
import Link from 'next/link'
import { getInitials, formatTimeAgo } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function ConnectionsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: incoming }, { data: accepted }, { data: outgoing }] = await Promise.all([
    supabase.from('connections').select('*, requester:profiles!connections_requester_id_fkey(*)').eq('addressee_id', user.id).eq('status', 'pending'),
    supabase.from('connections').select('*, requester:profiles!connections_requester_id_fkey(*), addressee:profiles!connections_addressee_id_fkey(*)').or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`).eq('status', 'accepted'),
    supabase.from('connections').select('*, addressee:profiles!connections_addressee_id_fkey(*)').eq('requester_id', user.id).eq('status', 'pending'),
  ])

  return (
    <div>
      <h1 className="font-['Space_Grotesk'] text-2xl font-bold mb-6">Connections</h1>

      {(incoming || []).length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Pending requests ({incoming!.length})</h2>
          <div className="space-y-3">
            {(incoming as Connection[]).map((c) => (
              <div key={c.id} className="bg-[#0C0D22] border border-[#6D28D9]/30 rounded-2xl p-4 flex items-center gap-4">
                <Link href={`/profile/${c.requester_id}`}>
                  {c.requester?.avatar_url ? (
                    <Image src={c.requester.avatar_url} alt="" width={44} height={44} className="rounded-full object-cover w-11 h-11" />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-[#6D28D9] flex items-center justify-center font-semibold text-white">
                      {getInitials(c.requester?.full_name || null)}
                    </div>
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/profile/${c.requester_id}`} className="font-medium hover:underline">{c.requester?.full_name || 'Builder'}</Link>
                  <div className="text-sm text-[#8A88A8]">@{c.requester?.username} · {c.requester?.industry || ''}</div>
                  <div className="text-xs text-[#8A88A8]">{formatTimeAgo(c.created_at)}</div>
                </div>
                <ConnectionActions connectionId={c.id} />
              </div>
            ))}
          </div>
        </div>
      )}

      {(outgoing || []).length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Sent requests</h2>
          <div className="space-y-3">
            {(outgoing as Connection[]).map((c) => (
              <div key={c.id} className="bg-[#0C0D22] border border-[#3C3A58]/30 rounded-2xl p-4 flex items-center gap-4">
                <Link href={`/profile/${c.addressee_id}`}>
                  {c.addressee?.avatar_url ? (
                    <Image src={c.addressee.avatar_url} alt="" width={40} height={40} className="rounded-full object-cover w-10 h-10" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#6D28D9] flex items-center justify-center font-semibold text-white text-sm">
                      {getInitials(c.addressee?.full_name || null)}
                    </div>
                  )}
                </Link>
                <div className="flex-1">
                  <Link href={`/profile/${c.addressee_id}`} className="font-medium hover:underline">{c.addressee?.full_name || 'Builder'}</Link>
                  <div className="text-sm text-[#8A88A8]">Request sent {formatTimeAgo(c.created_at)}</div>
                </div>
                <span className="text-xs text-[#8A88A8] bg-[#121428] border border-[#3C3A58] px-2 py-1 rounded-lg">Pending</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-3">Connected ({(accepted || []).length})</h2>
        {(accepted || []).length === 0 ? (
          <div className="text-center text-[#8A88A8] py-8">No connections yet. Discover people in Matches!</div>
        ) : (
          <div className="space-y-3">
            {(accepted as Connection[]).map((c) => {
              const other = c.requester_id === user.id ? c.addressee : c.requester
              const otherId = c.requester_id === user.id ? c.addressee_id : c.requester_id
              return (
                <div key={c.id} className="bg-[#0C0D22] border border-[#3C3A58]/30 rounded-2xl p-4 flex items-center gap-4">
                  <Link href={`/profile/${otherId}`}>
                    {other?.avatar_url ? (
                      <Image src={other.avatar_url} alt="" width={40} height={40} className="rounded-full object-cover w-10 h-10" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#6D28D9] flex items-center justify-center font-semibold text-white text-sm">
                        {getInitials(other?.full_name || null)}
                      </div>
                    )}
                  </Link>
                  <div className="flex-1">
                    <Link href={`/profile/${otherId}`} className="font-medium hover:underline">{other?.full_name || 'Builder'}</Link>
                    <div className="text-sm text-[#8A88A8]">@{other?.username} · {other?.industry || ''}</div>
                  </div>
                  <Link href={`/messages/${otherId}`} className="text-sm text-[#8B5CF6] hover:text-[#6D28D9] bg-[#6D28D9]/10 border border-[#6D28D9]/20 px-3 py-1.5 rounded-lg">
                    Message
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
