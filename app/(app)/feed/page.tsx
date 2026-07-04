import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Post, Dream } from '@/lib/types'
import FeedClient from '@/components/feed/FeedClient'

export const dynamic = 'force-dynamic'

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: rawPosts }, { data: likedIds }, { data: savedIds }, { data: myDreams }, { data: acceptedConnections }] = await Promise.all([
    supabase
      .from('posts')
      .select('*, profiles(*), dreams(*)')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', user.id),
    supabase
      .from('post_saves')
      .select('post_id')
      .eq('user_id', user.id),
    supabase
      .from('dreams')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
    supabase
      .from('connections')
      .select('requester_id, addressee_id')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`),
  ])

  const followingIds = (acceptedConnections || []).map((c) =>
    c.requester_id === user.id ? c.addressee_id : c.requester_id
  )

  const likedSet = new Set((likedIds || []).map((l) => l.post_id))
  const savedSet = new Set((savedIds || []).map((s) => s.post_id))
  const posts: Post[] = (rawPosts || []).map((p) => ({
    ...p,
    user_has_liked: likedSet.has(p.id),
    user_has_saved: savedSet.has(p.id),
  }))

  return (
    <FeedClient
      initialPosts={posts}
      currentUserId={user.id}
      myDreams={(myDreams as Dream[]) || []}
      followingIds={followingIds}
    />
  )
}
