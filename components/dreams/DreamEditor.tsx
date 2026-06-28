'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Dream } from '@/lib/types'
import { DREAM_STAGES, getDreamStageIcon } from '@/lib/utils'
import { trackEvent } from '@/lib/analytics'

export default function DreamEditor({ dream }: { dream: Dream }) {
  const supabase = createClient()
  const router = useRouter()
  const [title, setTitle] = useState(dream.title)
  const [description, setDescription] = useState(dream.description)
  const [whyItMatters, setWhyItMatters] = useState(dream.why_it_matters || '')
  const [stage, setStage] = useState(dream.current_stage)
  const [progress, setProgress] = useState(dream.progress_percentage)
  const [obstacle, setObstacle] = useState(dream.current_obstacle || '')
  const [nextMilestone, setNextMilestone] = useState(dream.next_milestone || '')
  const [status, setStatus] = useState(dream.status)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inputCls = 'w-full bg-[#121428] border border-[#3C3A58] focus:border-[#6D28D9] text-[#EDEAF8] placeholder-[#3C3A58] rounded-xl px-4 py-3 outline-none transition-colors'

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !description.trim()) { setError('Title and description are required.'); return }
    setSaving(true)
    setError(null)
    const { error } = await supabase.from('dreams').update({
      title: title.trim(),
      description: description.trim(),
      why_it_matters: whyItMatters.trim() || null,
      current_stage: stage,
      progress_percentage: progress,
      current_obstacle: obstacle.trim() || null,
      next_milestone: nextMilestone.trim() || null,
      status,
    }).eq('id', dream.id)

    if (error) { setError(error.message); setSaving(false); return }
    trackEvent('dream_updated', { stage })
    router.push(`/dream/${dream.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={save} className="bg-[#0C0D22] border border-[#3C3A58]/30 rounded-2xl p-6 space-y-5">
      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-4 py-3 text-sm">{error}</div>}

      <div>
        <label className="block text-sm font-medium text-[#8A88A8] mb-1.5">Title *</label>
        <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#8A88A8] mb-1.5">Description *</label>
        <textarea className={`${inputCls} resize-none`} rows={3} maxLength={3000} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#8A88A8] mb-1.5">Why it matters</label>
        <textarea className={`${inputCls} resize-none`} rows={3} maxLength={2000} value={whyItMatters} onChange={(e) => setWhyItMatters(e.target.value)} />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#8A88A8] mb-2">Stage</label>
        <div className="flex flex-wrap gap-2">
          {DREAM_STAGES.map((s) => (
            <button key={s} type="button" onClick={() => setStage(s as Dream['current_stage'])}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${stage === s ? 'bg-[#6D28D9] border-[#6D28D9] text-white' : 'bg-[#121428] border-[#3C3A58] text-[#8A88A8] hover:border-[#6D28D9]'}`}>
              {getDreamStageIcon(s)} {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#8A88A8] mb-1.5">Progress ({progress}%)</label>
        <input type="range" min={0} max={100} value={progress} onChange={(e) => setProgress(Number(e.target.value))} className="w-full accent-[#6D28D9]" />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#8A88A8] mb-1.5">Current obstacle</label>
        <textarea className={`${inputCls} resize-none`} rows={2} maxLength={1000} value={obstacle} onChange={(e) => setObstacle(e.target.value)} />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#8A88A8] mb-1.5">Next milestone</label>
        <input className={inputCls} maxLength={500} value={nextMilestone} onChange={(e) => setNextMilestone(e.target.value)} />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#8A88A8] mb-2">Status</label>
        <div className="flex gap-2">
          {(['active', 'archived', 'completed'] as const).map((s) => (
            <button key={s} type="button" onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-sm border capitalize transition-colors ${status === s ? 'bg-[#6D28D9] border-[#6D28D9] text-white' : 'bg-[#121428] border-[#3C3A58] text-[#8A88A8] hover:border-[#6D28D9]'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <button type="submit" disabled={saving} className="w-full bg-[#6D28D9] hover:bg-[#8B5CF6] disabled:opacity-50 text-white py-3 rounded-xl font-semibold">
        {saving ? 'Saving...' : 'Save changes'}
      </button>
    </form>
  )
}
