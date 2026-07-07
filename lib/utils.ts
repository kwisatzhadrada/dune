import { type ClassValue, clsx } from 'clsx'
import { formatDistanceToNow } from 'date-fns'
import { Profile, Post, Dream } from './types'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatTimeAgo(date: string | null | undefined): string {
  if (!date) return ''
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  } catch {
    return ''
  }
}

export function getInitials(name: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const DREAM_STAGES: Dream['current_stage'][] = ['Idea', 'Building', 'Launching', 'Growing', 'Scaling']

export function getDreamStageColor(stage: string): string {
  switch (stage) {
    case 'Idea': return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
    case 'Building': return 'text-purple-400 bg-purple-400/10 border-purple-400/20'
    case 'Launching': return 'text-orange-400 bg-orange-400/10 border-orange-400/20'
    case 'Growing': return 'text-green-400 bg-green-400/10 border-green-400/20'
    case 'Scaling': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
    default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20'
  }
}

export function getDreamStageIcon(stage: string): string {
  switch (stage) {
    case 'Idea': return '💡'
    case 'Building': return '🔨'
    case 'Launching': return '🚀'
    case 'Growing': return '📈'
    case 'Scaling': return '⚡'
    default: return '✨'
  }
}

export function generateMatchScore(currentUser: Profile, otherUser: Profile, myDream?: Dream | null, theirDream?: Dream | null): number {
  let score = 0

  // Blocker vs skills (their skills can help my blocker)
  if (currentUser.current_blocker && otherUser.skills.length > 0) {
    const blockerWords = currentUser.current_blocker.toLowerCase().split(' ')
    const skillMatches = otherUser.skills.filter((skill) =>
      blockerWords.some((word) => skill.toLowerCase().includes(word) || word.includes(skill.toLowerCase()))
    )
    score += skillMatches.length * 20
  }

  // My skills can help their blocker
  if (otherUser.current_blocker && currentUser.skills.length > 0) {
    const blockerWords = otherUser.current_blocker.toLowerCase().split(' ')
    const skillMatches = currentUser.skills.filter((skill) =>
      blockerWords.some((word) => skill.toLowerCase().includes(word) || word.includes(skill.toLowerCase()))
    )
    score += skillMatches.length * 15
  }

  // Same industry
  if (currentUser.industry && otherUser.industry && currentUser.industry === otherUser.industry) {
    score += 20
  }

  // Goal word overlap
  if (currentUser.current_goal && otherUser.current_goal) {
    const myGoalWords = currentUser.current_goal.toLowerCase().split(' ').filter((w) => w.length > 4)
    const theirGoalWords = otherUser.current_goal.toLowerCase().split(' ')
    const overlap = myGoalWords.filter((w) => theirGoalWords.includes(w))
    score += overlap.length * 10
  }

  // Dream stage compatibility (adjacent stages = complementary)
  if (myDream && theirDream) {
    const stages = DREAM_STAGES
    const myIdx = stages.indexOf(myDream.current_stage)
    const theirIdx = stages.indexOf(theirDream.current_stage)
    const stageDiff = Math.abs(myIdx - theirIdx)
    if (stageDiff === 0) score += 10 // same stage — peers
    else if (stageDiff === 1) score += 15 // adjacent — mentor/mentee potential

    // Dream obstacle vs their skills
    if (myDream.current_obstacle && otherUser.skills.length > 0) {
      const obstacleWords = myDream.current_obstacle.toLowerCase().split(' ')
      const skillMatches = otherUser.skills.filter((skill) =>
        obstacleWords.some((w) => skill.toLowerCase().includes(w) || w.includes(skill.toLowerCase()))
      )
      score += skillMatches.length * 15
    }
  }

  return Math.min(100, score)
}

export function getMatchReasons(currentUser: Profile, otherUser: Profile, myDream?: Dream | null, theirDream?: Dream | null): string[] {
  const reasons: string[] = []
  if (currentUser.industry && otherUser.industry && currentUser.industry === otherUser.industry) {
    reasons.push(`Both in ${otherUser.industry}`)
  }
  if (currentUser.current_blocker && otherUser.skills.length > 0) {
    const blockerWords = currentUser.current_blocker.toLowerCase().split(' ')
    const skillMatches = otherUser.skills.filter((skill) =>
      blockerWords.some((word) => skill.toLowerCase().includes(word) || word.includes(skill.toLowerCase()))
    )
    if (skillMatches.length > 0) {
      reasons.push(`Can help with: ${skillMatches.slice(0, 2).join(', ')}`)
    }
  }
  if (myDream && theirDream) {
    const stages = DREAM_STAGES
    const myIdx = stages.indexOf(myDream.current_stage)
    const theirIdx = stages.indexOf(theirDream.current_stage)
    if (Math.abs(myIdx - theirIdx) === 1) {
      reasons.push(`${theirDream.current_stage} stage — great mentor/peer fit`)
    }
    if (myIdx === theirIdx) {
      reasons.push(`Both ${theirDream.current_stage} — peers`)
    }
  }
  if (currentUser.location && otherUser.location && currentUser.location === otherUser.location) {
    reasons.push(`Both in ${otherUser.location}`)
  }
  if (reasons.length === 0) {
    reasons.push('Ambitious builder like you')
  }
  return reasons
}

export function getPostTypeColor(postType: string): string {
  switch (postType) {
    case 'win':          return 'text-green-400 bg-green-400/10 border-green-400/20'
    case 'obstacle':     return 'text-orange-400 bg-orange-400/10 border-orange-400/20'
    case 'lesson':       return 'text-purple-400 bg-purple-400/10 border-purple-400/20'
    case 'question':     return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
    case 'milestone':    return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
    case 'reflection':   return 'text-pink-400 bg-pink-400/10 border-pink-400/20'
    case 'dream_update': return 'text-violet-400 bg-violet-400/10 border-violet-400/20'
    case 'build_log':    return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20'
    case 'intro':        return 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20'
    default:             return 'text-gray-400 bg-gray-400/10 border-gray-400/20'
  }
}

export function getPostTypeLabel(postType: string): string {
  switch (postType) {
    case 'win':          return '🏆 Win'
    case 'obstacle':     return '🧱 Obstacle'
    case 'lesson':       return '💡 Lesson'
    case 'question':     return '❓ Question'
    case 'milestone':    return '🎯 Milestone'
    case 'reflection':   return '🔮 Reflection'
    case 'dream_update': return '✨ Dream Update'
    case 'build_log':    return '🔨 Build Log'
    case 'intro':        return '👋 Intro'
    default:             return postType
  }
}

export const INDUSTRIES = [
  'SaaS', 'E-commerce', 'Fintech', 'Healthtech', 'AI/ML', 'Marketplace',
  'Consumer', 'Developer Tools', 'Web3', 'Education', 'Climate', 'Other',
]

// Text-only post types (no media upload zone)
export const TEXT_POST_TYPES: { value: Post['post_type']; label: string }[] = [
  { value: 'win', label: '🏆 Win' },
  { value: 'obstacle', label: '🧱 Obstacle' },
  { value: 'lesson', label: '💡 Lesson' },
  { value: 'question', label: '❓ Question' },
  { value: 'milestone', label: '🎯 Milestone' },
  { value: 'reflection', label: '🔮 Reflection' },
  { value: 'build_log', label: '🔨 Build Log' },
  { value: 'intro', label: '👋 Intro' },
]

// Legacy export kept for any existing code that references POST_TYPES
export const POST_TYPES = TEXT_POST_TYPES

export function getAgentStatusColor(status: string): string {
  switch (status) {
    case 'active': return 'text-green-400 bg-green-400/10 border-green-400/20'
    case 'inactive': return 'text-gray-400 bg-gray-400/10 border-gray-400/20'
    case 'suspended': return 'text-red-400 bg-red-400/10 border-red-400/20'
    default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20'
  }
}

export function formatCurrency(amount: number, currency: string = 'credits'): string {
  const formatted = amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return currency === 'credits' ? `${formatted} credits` : `${formatted} ${currency}`
}
