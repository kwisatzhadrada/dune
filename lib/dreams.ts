import { SupabaseClient } from '@supabase/supabase-js'

export async function followDream(
  supabase: SupabaseClient,
  userId: string,
  dreamId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('dream_followers')
    .insert({ user_id: userId, dream_id: dreamId })

  // 23505 = unique_violation (already following) — treat as success
  if (error && error.code !== '23505') return { error: error.message }

  if (!error) {
    await supabase.rpc('increment_dream_followers', { dream_id: dreamId })
  }

  return { error: null }
}

export async function unfollowDream(
  supabase: SupabaseClient,
  userId: string,
  dreamId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('dream_followers')
    .delete()
    .eq('user_id', userId)
    .eq('dream_id', dreamId)

  if (error) return { error: error.message }

  await supabase.rpc('decrement_dream_followers', { dream_id: dreamId })

  return { error: null }
}

export async function checkFollowingDream(
  supabase: SupabaseClient,
  userId: string,
  dreamId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('dream_followers')
    .select('dream_id')
    .eq('user_id', userId)
    .eq('dream_id', dreamId)
    .maybeSingle()
  return !!data
}
