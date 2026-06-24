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

export type Post = {
  id: string
  user_id: string
  content: string
  post_type: 'question' | 'win' | 'obstacle' | 'lesson' | 'milestone' | 'reflection'
  industry: string | null
  tags: string[]
  likes_count: number
  replies_count: number
  saves_count: number
  created_at: string
  updated_at: string
  profiles?: Profile
  user_has_liked?: boolean
  user_has_saved?: boolean
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
