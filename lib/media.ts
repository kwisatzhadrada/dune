import { SupabaseClient } from '@supabase/supabase-js'
import { EmbedType } from './types'

// ── Allowed embed domains (strict allowlist — no arbitrary iframes) ────────

const ALLOWED_EMBED_DOMAINS: Record<EmbedType, string[]> = {
  youtube: ['youtube.com', 'youtu.be'],
  tiktok: ['tiktok.com'],
  x: ['x.com', 'twitter.com'],
}

// ── File validation ────────────────────────────────────────────────────────

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']
const MAX_IMAGE_BYTES = 10 * 1024 * 1024   // 10 MB
const MAX_VIDEO_BYTES = 100 * 1024 * 1024  // 100 MB
export const MAX_IMAGES_PER_POST = 10

export function validateImageFile(file: File): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return 'Only JPEG, PNG, WebP and GIF images are allowed.'
  if (file.size > MAX_IMAGE_BYTES) return 'Each image must be under 10 MB.'
  return null
}

export function validateVideoFile(file: File): string | null {
  if (!VIDEO_TYPES.includes(file.type)) return 'Only MP4, MOV and WebM videos are allowed.'
  if (file.size > MAX_VIDEO_BYTES) return 'Video must be under 100 MB.'
  return null
}

// ── Storage uploads ────────────────────────────────────────────────────────

function randomSuffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export async function uploadPostImages(
  supabase: SupabaseClient,
  userId: string,
  files: File[]
): Promise<{ urls: string[]; error: string | null }> {
  const urls: string[] = []
  for (const file of files) {
    const err = validateImageFile(file)
    if (err) return { urls: [], error: err }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const path = `${userId}/${randomSuffix()}.${ext}`

    const { error } = await supabase.storage
      .from('post-media')
      .upload(path, file, { cacheControl: '31536000', upsert: false })

    if (error) return { urls: [], error: error.message }

    const { data } = supabase.storage.from('post-media').getPublicUrl(path)
    urls.push(data.publicUrl)
  }
  return { urls, error: null }
}

export async function uploadPostVideo(
  supabase: SupabaseClient,
  userId: string,
  file: File
): Promise<{ url: string | null; error: string | null }> {
  const err = validateVideoFile(file)
  if (err) return { url: null, error: err }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'mp4'
  const path = `${userId}/${randomSuffix()}.${ext}`

  const { error } = await supabase.storage
    .from('post-videos')
    .upload(path, file, { cacheControl: '31536000', upsert: false })

  if (error) return { url: null, error: error.message }

  const { data } = supabase.storage.from('post-videos').getPublicUrl(path)
  return { url: data.publicUrl, error: null }
}

// ── Embed detection ────────────────────────────────────────────────────────

export interface DetectedEmbed {
  type: EmbedType
  originalUrl: string
  embedUrl: string
  thumbnailUrl?: string
}

export function detectEmbed(text: string): DetectedEmbed | null {
  const matches = text.match(/https?:\/\/[^\s)>\]"']+/gi)
  if (!matches) return null

  for (const raw of matches) {
    try {
      const url = new URL(raw)
      const host = url.hostname.replace(/^www\./, '')

      // YouTube
      if (host === 'youtube.com' || host === 'youtu.be') {
        let vid = host === 'youtu.be' ? url.pathname.slice(1) : url.searchParams.get('v')
        // Support /shorts/ID
        if (!vid) {
          const m = url.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/)
          if (m) vid = m[1]
        }
        if (vid && /^[a-zA-Z0-9_-]{11}$/.test(vid)) {
          return {
            type: 'youtube',
            originalUrl: raw,
            embedUrl: `https://www.youtube.com/embed/${vid}`,
            thumbnailUrl: `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
          }
        }
      }

      // TikTok
      if (host === 'tiktok.com' || host === 'vm.tiktok.com') {
        const m = url.pathname.match(/\/video\/(\d+)/)
        if (m) {
          return {
            type: 'tiktok',
            originalUrl: raw,
            embedUrl: `https://www.tiktok.com/embed/v2/${m[1]}`,
          }
        }
      }

      // X / Twitter
      if (host === 'x.com' || host === 'twitter.com') {
        const m = url.pathname.match(/\/status\/(\d+)/)
        if (m) {
          return {
            type: 'x',
            originalUrl: raw,
            embedUrl: `https://platform.twitter.com/embed/Tweet.html?id=${m[1]}&theme=dark`,
          }
        }
      }
    } catch {
      // invalid URL — skip
    }
  }

  return null
}

export function sanitizeEmbedUrl(rawUrl: string, type: EmbedType): string | null {
  try {
    const url = new URL(rawUrl)
    if (url.protocol !== 'https:') return null
    const host = url.hostname.replace(/^www\./, '')
    const allowed = ALLOWED_EMBED_DOMAINS[type]
    if (!allowed.some((d) => host === d || host.endsWith(`.${d}`))) return null
    return rawUrl
  } catch {
    return null
  }
}

// ── Feed scoring (client-side For You ranking) ─────────────────────────────

export function scoreFeedPost(post: {
  post_type: string
  likes_count: number
  saves_count: number
  replies_count: number
  shares_count: number
  created_at: string
}): number {
  const ageHours = (Date.now() - new Date(post.created_at).getTime()) / 3_600_000
  const engagement = post.likes_count + post.saves_count * 3 + post.replies_count * 2 + post.shares_count * 4
  const typeBoost = ['dream_update', 'milestone'].includes(post.post_type) ? 2.0 : 1.0
  return (engagement * typeBoost) / Math.pow(ageHours + 2, 1.5)
}
