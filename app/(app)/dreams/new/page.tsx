'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DREAM_STAGES, getDreamStageIcon } from '@/lib/utils'
import { trackEvent } from '@/lib/analytics'

export default function NewDreamPage() {
  const supabase = createClient()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [whyItMatters, setWhyItMatters] = useState('')
  const [stage, setStage] = useState<string>('Idea')
  const [progress, setProgress] = useState(0)
  const [obstacle, setObstacle] = useState('')
  const [nextMilestone, setNextMilestone] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inputCls = 'w-full bg-[#121428] border border-[#3C3A58] focus:border-[#6D28D9] text-[#EDEAF8] placeholder-[#3C3A58] rounded-xl px-4 py-3 outline-none transition-colors'

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required.')
      return
    }
    setSaving(true)
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    console.log('[NewDream] Creating dream for user:', user.id)
    const { data, error } = await supabase
      .from('dreams')
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        why_it_matters: whyItMatters.trim() || null,
        current_stage: stage,
        progress_percentage: progress,
        current_obstacle: obstacle.trim() || null,
        next_milestone: nextMilestone.trim() || null,
      })
      .select()
      .single()

    console.log('[NewDream] Insert result — data:', data, '| error:', error)
    if (error) {
      console.error('[NewDream] Insert failed:', error.code, error.message, error.details, error.hint)
      setError(error.message)
      setSaving(false)
      return
    }
    console.log('[NewDream] Created dream ID:', data?.id)
    const redirectPath = `/dream/${data.id}`
    console.log('[NewDream] Redirecting to:', redirectPath)
    trackEvent('dream_created', { stage })
    setSaving(false)
    router.push(redirectPath)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="font-['Space_Grotesk'] text-2xl font-bold">Create your Dream</h1>
        <p className="text-[#8A88A8] text-sm mt-1">Your dream is the North Star for your journey on DreamLink.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-4 py-3 mb-5 text-sm">{error}</div>
      )}

      <form onSubmit={submit} className="bg-[#0C0D22] border border-[#3C3A58]/30 rounded-2xl p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-[#8A88A8] mb-1.5">Dream title *</label>
          <input className={inputCls} maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Build the world's best remote team tool" />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#8A88A8] mb-1.5">Description *</label>
          <textarea className={`${inputCls} resize-none`} rows={3} maxLength={3000} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What are you building and who is it for?" />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#8A88A8] mb-1.5">Why does this matter to you?</label>
          <textarea className={`${inputCls} resize-none`} rows={3} maxLength={2000} value={whyItMatters} onChange={(e) => setWhyItMatters(e.target.value)} placeholder="What's the deeper reason you're building this?" />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#8A88A8] mb-2">Current stage</label>
          <div className="flex flex-wrap gap-2">
            {DREAM_STAGES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStage(s)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  stage === s ? 'bg-[#6D28D9] border-[#6D28D9] text-white' : 'bg-[#121428] border-[#3C3A58] text-[#8A88A8] hover:border-[#6D28D9]'
                }`}
              >
                {getDreamStageIcon(s)} {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#8A88A8] mb-1.5">Progress ({progress}%)</label>
          <input type="range" min={0} max={100} value={progress} onChange={(e) => setProgress(Number(e.target.value))}
            className="w-full accent-[#6D28D9]" />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#8A88A8] mb-1.5">Current obstacle</label>
          <textarea className={`${inputCls} resize-none`} rows={2} maxLength={1000} value={obstacle} onChange={(e) => setObstacle(e.target.value)} placeholder="What's blocking you right now?" />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#8A88A8] mb-1.5">Next milestone</label>
          <input className={inputCls} maxLength={500} value={nextMilestone} onChange={(e) => setNextMilestone(e.target.value)} placeholder="What's the next thing you want to achieve?" />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-[#6D28D9] hover:bg-[#8B5CF6] disabled:opacity-50 text-white py-3 rounded-xl font-semibold"
        >
          {saving ? 'Creating...' : 'Create Dream ✨'}
        </button>
      </form>
    </div>
  )
}
