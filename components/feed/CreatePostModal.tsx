'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Post, Dream } from '@/lib/types'
import { POST_TYPES, INDUSTRIES } from '@/lib/utils'

export default function CreatePostModal({
  currentUserId,
  dreams = [],
  onClose,
  onCreated,
}: {
  currentUserId: string
  dreams?: Dream[]
  onClose: () => void
  onCreated: (post: Post) => void
}) {
  const supabase = createClient()
  const [postType, setPostType] = useState<Post['post_type']>('win')
  const [content, setContent] = useState('')
  const [industry, setIndustry] = useState('')
  const [dreamId, setDreamId] = useState<string>('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function addTag() {
    const t = tagInput.trim().replace(/^#/, '')
    if (t && !tags.includes(t)) setTags([...tags, t])
    setTagInput('')
  }

  async function submit() {
    if (!content.trim()) {
      setError('Please write something.')
      return
    }
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: currentUserId,
        content: content.trim(),
        post_type: postType,
        industry: industry || null,
        tags,
        dream_id: dreamId || null,
      })
      .select('*, profiles(*), dreams(*)')
      .single()

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    onCreated({ ...(data as Post), user_has_liked: false, user_has_saved: false })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div
        className="w-full sm:max-w-lg bg-[#0C0D22] border border-[#3C3A58]/50 rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-['Space_Grotesk'] text-xl font-bold">Share with the community</h2>
          <button onClick={onClose} className="text-[#8A88A8] hover:text-[#EDEAF8] text-xl">×</button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-4 py-2.5 mb-4 text-sm">{error}</div>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          {POST_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setPostType(t.value)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                postType === t.value
                  ? 'bg-[#6D28D9] border-[#6D28D9] text-white'
                  : 'bg-[#121428] border-[#3C3A58] text-[#8A88A8] hover:border-[#6D28D9]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {dreams.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#8A88A8] mb-1.5">Link to a Dream (optional)</label>
            <select
              value={dreamId}
              onChange={(e) => setDreamId(e.target.value)}
              className="w-full bg-[#121428] border border-[#3C3A58] focus:border-[#6D28D9] rounded-xl px-4 py-2.5 outline-none"
            >
              <option value="">No dream</option>
              {dreams.map((d) => (
                <option key={d.id} value={d.id}>{d.title}</option>
              ))}
            </select>
          </div>
        )}

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          placeholder="What's on your mind? Share a win, an obstacle, a lesson..."
          className="w-full bg-[#121428] border border-[#3C3A58] focus:border-[#6D28D9] rounded-xl px-4 py-3 outline-none resize-none mb-4"
        />

        <div className="mb-4">
          <label className="block text-sm font-medium text-[#8A88A8] mb-1.5">Industry (optional)</label>
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="w-full bg-[#121428] border border-[#3C3A58] focus:border-[#6D28D9] rounded-xl px-4 py-2.5 outline-none"
          >
            <option value="">None</option>
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-[#8A88A8] mb-1.5">Tags (optional)</label>
          <div className="flex gap-2 mb-2">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
              placeholder="growth"
              className="flex-1 bg-[#121428] border border-[#3C3A58] focus:border-[#6D28D9] rounded-xl px-3 py-2 text-sm outline-none"
            />
            <button onClick={addTag} className="bg-[#121428] border border-[#3C3A58] hover:border-[#6D28D9] text-[#EDEAF8] px-3 rounded-xl text-sm">Add</button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 bg-[#6D28D9]/10 border border-[#6D28D9]/20 text-[#8B5CF6] px-2.5 py-1 rounded-lg text-xs">
                #{t}
                <button onClick={() => setTags(tags.filter((x) => x !== t))} className="hover:text-white">×</button>
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={submit}
          disabled={loading}
          className="w-full bg-[#6D28D9] hover:bg-[#8B5CF6] disabled:opacity-50 text-white py-3 rounded-xl font-semibold"
        >
          {loading ? 'Posting...' : 'Post'}
        </button>
      </div>
    </div>
  )
}
