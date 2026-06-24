import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileEditor from '@/components/profile/ProfileEditor'
import { Profile } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function MyProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/onboarding')

  return (
    <div>
      <h1 className="font-['Space_Grotesk'] text-2xl font-bold mb-6">Your profile</h1>
      <ProfileEditor profile={profile as Profile} />
    </div>
  )
}
