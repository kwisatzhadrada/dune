import { type ClassValue, clsx } from 'clsx'
import { formatDistanceToNow } from 'date-fns'
import { Profile, Post } from './types'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatTimeAgo(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
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

export function generateMatchScore(currentUser: Profile, otherUser: Profile): number {
  let score = 0

  if (currentUser.current_blocker && otherUser.skills.length > 0) {
    const blockerWords = currentUser.current_blocker.toLowerCase().split(' ')
    const skillMatches = otherUser.skills.filter((skill) =>
      blockerWords.some((word) => skill.toLowerCase().includes(word) || word.includes(skill.toLowerCase()))
    )
    score += skillMatches.length * 20
  }

  if (otherUser.current_blocker && currentUser.skills.length > 0) {
    const blockerWords = otherUser.current_blocker.toLowerCase().split(' ')
    const skillMatches = currentUser.skills.filter((skill) =>
      blockerWords.some((word) => skill.toLowerCase().includes(word) || word.includes(skill.toLowerCase()))
    )
    score += skillMatches.length * 15
  }

  if (currentUser.industry && otherUser.industry && currentUser.industry === otherUser.industry) {
    score += 20
  }

  if (currentUser.current_goal && otherUser.current_goal) {
    const myGoalWords = currentUser.current_goal.toLowerCase().split(' ').filter((w) => w.length > 4)
    const theirGoalWords = otherUser.current_goal.toLowerCase().split(' ')
    const overlap = myGoalWords.filter((w) => theirGoalWords.includes(w))
    score += overlap.length * 10
  }

  return Math.min(100, score)
}

export function getMatchReasons(currentUser: Profile, otherUser: Profile): string[] {
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
    case 'win':
      return 'text-green-400 bg-green-400/10 border-green-400/20'
    case 'obstacle':
      return 'text-orange-400 bg-orange-400/10 border-orange-400/20'
    case 'lesson':
      return 'text-purple-400 bg-purple-400/10 border-purple-400/20'
    case 'question':
      return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
    case 'milestone':
      return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
    case 'reflection':
      return 'text-pink-400 bg-pink-400/10 border-pink-400/20'
    default:
      return 'text-gray-400 bg-gray-400/10 border-gray-400/20'
  }
}

export function getPostTypeLabel(postType: string): string {
  switch (postType) {
    case 'win': return '🏆 Win'
    case 'obstacle': return '🧱 Obstacle'
    case 'lesson': return '💡 Lesson'
    case 'question': return '❓ Question'
    case 'milestone': return '🎯 Milestone'
    case 'reflection': return '🔮 Reflection'
    default: return postType
  }
}

export const INDUSTRIES = [
  'SaaS', 'E-commerce', 'Fintech', 'Healthtech', 'AI/ML', 'Marketplace',
  'Consumer', 'Developer Tools', 'Web3', 'Education', 'Climate', 'Other',
]

export const POST_TYPES: { value: Post['post_type']; label: string }[] = [
  { value: 'win', label: '🏆 Win' },
  { value: 'obstacle', label: '🧱 Obstacle' },
  { value: 'lesson', label: '💡 Lesson' },
  { value: 'question', label: '❓ Question' },
  { value: 'milestone', label: '🎯 Milestone' },
  { value: 'reflection', label: '🔮 Reflection' },
]
