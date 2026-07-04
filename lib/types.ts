export type Profile = {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  location: string | null
  industry: string | null
  current_goal: string | null
  current_blocker: string | null
  skills: string[]
  bio: string | null
  linkedin_url: string | null
  twitter_url: string | null
  website_url: string | null
  is_admin: boolean
  onboarding_complete: boolean
  created_at: string
  updated_at: string
}

export type Dream = {
  id: string
  user_id: string
  title: string
  description: string
  why_it_matters: string | null
  current_stage: 'Idea' | 'Building' | 'Launching' | 'Growing' | 'Scaling'
  progress_percentage: number
  current_obstacle: string | null
  next_milestone: string | null
  status: 'active' | 'archived' | 'completed'
  followers_count: number
  created_at: string
  updated_at: string
  profiles?: Profile
  user_is_following?: boolean
  user_has_saved?: boolean
}

export type DreamMilestone = {
  id: string
  dream_id: string
  title: string
  description: string | null
  completed: boolean
  target_date: string | null
  completed_at: string | null
  created_at: string
}

export type DreamCollaborator = {
  dream_id: string
  user_id: string
  role: string
  created_at: string
  profiles?: Profile
}

export type PostType =
  | 'question' | 'win' | 'obstacle' | 'lesson' | 'milestone' | 'reflection'
  | 'dream_update' | 'build_log' | 'intro'

export type EmbedType = 'youtube' | 'tiktok' | 'x'

export type Post = {
  id: string
  user_id: string
  dream_id: string | null
  content: string
  post_type: PostType
  industry: string | null
  tags: string[]
  likes_count: number
  replies_count: number
  saves_count: number
  shares_count: number
  // Media (added in migration 005/006 — default to safe values if not yet migrated)
  image_urls: string[]
  video_url: string | null
  thumbnail_url: string | null
  embed_url: string | null
  embed_type: EmbedType | null
  created_at: string
  updated_at: string
  profiles?: Profile
  dreams?: Dream | null
  user_has_liked?: boolean
  user_has_saved?: boolean
  // Client-only scoring field for For You tab
  feed_score?: number
}

export type Message = {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  read: boolean
  created_at: string
  sender?: Profile
}

export type GroupMessage = {
  id: string
  user_id: string
  content: string
  created_at: string
  profiles?: Profile
}

export type Connection = {
  id: string
  requester_id: string
  addressee_id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  requester?: Profile
  addressee?: Profile
}

export type PostReply = {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  profiles?: Profile
}
