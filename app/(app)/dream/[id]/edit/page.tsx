import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DreamEditor from '@/components/dreams/DreamEditor'

export const dynamic = 'force-dynamic'

export default async function EditDreamPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: dream } = await supabase.from('dreams').select('*').eq('id', params.id).single()
  if (!dream || dream.user_id !== user.id) notFound()

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-['Space_Grotesk'] text-2xl font-bold mb-6">Edit Dream</h1>
      <DreamEditor dream={dream} />
    </div>
  )
}
