import { createClient } from '@/lib/supabase/server'
import PostFeed from '@/components/feed/PostFeed'
import { Post } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function FeedPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: posts } = await supabase
    .from('posts')
    .select('*, profiles(*)')
    .order('created_at', { ascending: false })
    .limit(20)

  let likedIds: string[] = []
  let savedIds: string[] = []
  if (user) {
    const { data: likes } = await supabase.from('post_likes').select('post_id').eq('user_id', user.id)
    const { data: saves } = await supabase.from('post_saves').select('post_id').eq('user_id', user.id)
    likedIds = (likes || []).map((l) => l.post_id)
    savedIds = (saves || []).map((s) => s.post_id)
  }

  const enriched: Post[] = (posts || []).map((p: any) => ({
    ...p,
    user_has_liked: likedIds.includes(p.id),
    user_has_saved: savedIds.includes(p.id),
  }))

  return <PostFeed initialPosts={enriched} currentUserId={user!.id} />
}
