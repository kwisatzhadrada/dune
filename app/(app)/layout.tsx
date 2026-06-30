export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/nav/Sidebar'
import BottomNav from '@/components/nav/BottomNav'
import InstallPrompt from '@/components/pwa/InstallPrompt'
import PullToRefresh from '@/components/pwa/PullToRefresh'
import { Profile } from '@/lib/types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  console.log('>>> [AppLayout] ENTRY')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  console.log('>>> [AppLayout] user:', user?.id ?? 'null')
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/onboarding')
  if (!profile.onboarding_complete) redirect('/onboarding')

  // Unread message count
  const { count: unreadCount } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('receiver_id', user.id)
    .eq('read', false)

  return (
    <div className="min-h-screen bg-[#08081C]">
      <Sidebar profile={profile as Profile} unreadCount={unreadCount || 0} />
      <main className="lg:pl-64 lg:pb-0" style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))' }}>
        <PullToRefresh>
          <div className="max-w-3xl mx-auto px-4 py-6">{children}</div>
        </PullToRefresh>
      </main>
      <BottomNav unreadCount={unreadCount || 0} isAdmin={!!profile.is_admin} />
      <InstallPrompt />
    </div>
  )
}
