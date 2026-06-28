'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { INDUSTRIES } from '@/lib/utils'
import { trackEvent } from '@/lib/analytics'

const TOTAL_STEPS = 4

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [location, setLocation] = useState('')
  const [industry, setIndustry] = useState('')
  const [currentGoal, setCurrentGoal] = useState('')
  const [currentBlocker, setCurrentBlocker] = useState('')
  const [skillInput, setSkillInput] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [bio, setBio] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserId(user.id)
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profile) {
        if (profile.onboarding_complete) {
          router.push('/feed')
          return
        }
        setFullName(profile.full_name || '')
        setUsername(profile.username || '')
        setLocation(profile.location || '')
        setIndustry(profile.industry || '')
        setCurrentGoal(profile.current_goal || '')
        setCurrentBlocker(profile.current_blocker || '')
        setSkills(profile.skills || [])
        setBio(profile.bio || '')
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function addSkill() {
    const s = skillInput.trim()
    if (s && !skills.includes(s)) {
      setSkills([...skills, s])
    }
    setSkillInput('')
  }

  function canProceed() {
    if (step === 1) return fullName.trim() && username.trim()
    if (step === 2) return industry && currentGoal.trim()
    if (step === 3) return currentBlocker.trim()
    return true
  }

  async function finish() {
    if (!userId) return
    setLoading(true)
    setError(null)
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        username: username.trim().toLowerCase().replace(/\s+/g, '_'),
        location: location.trim() || null,
        industry,
        current_goal: currentGoal.trim(),
        current_blocker: currentBlocker.trim(),
        skills,
        bio: bio.trim() || null,
        onboarding_complete: true,
      })
      .eq('id', userId)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    trackEvent('onboarding_completed')
    router.push('/feed')
    router.refresh()
  }

  const inputCls = 'w-full bg-[#121428] border border-[#3C3A58] focus:border-[#6D28D9] text-[#EDEAF8] placeholder-[#3C3A58] rounded-xl px-4 py-3 outline-none transition-colors'

  return (
    <div className="min-h-screen bg-[#08081C] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${i < step ? 'bg-[#6D28D9]' : 'bg-[#3C3A58]'}`}
            />
          ))}
        </div>

        <div className="bg-[#0C0D22] border border-[#3C3A58]/50 rounded-2xl p-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-4 py-3 mb-6 text-sm">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-['Space_Grotesk'] text-2xl font-bold mb-1">Welcome! Let&apos;s set you up</h2>
                <p className="text-[#8A88A8] text-sm">Tell us who you are.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#8A88A8] mb-1.5">Full name</label>
                <input className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ada Lovelace" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#8A88A8] mb-1.5">Username</label>
                <input className={inputCls} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ada" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#8A88A8] mb-1.5">Location (optional)</label>
                <input className={inputCls} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="San Francisco, CA" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-['Space_Grotesk'] text-2xl font-bold mb-1">What are you building?</h2>
                <p className="text-[#8A88A8] text-sm">Your industry and current goal.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#8A88A8] mb-1.5">Industry</label>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRIES.map((ind) => (
                    <button
                      key={ind}
                      type="button"
                      onClick={() => setIndustry(ind)}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                        industry === ind
                          ? 'bg-[#6D28D9] border-[#6D28D9] text-white'
                          : 'bg-[#121428] border-[#3C3A58] text-[#8A88A8] hover:border-[#6D28D9]'
                      }`}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#8A88A8] mb-1.5">Current goal</label>
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={3}
                  value={currentGoal}
                  onChange={(e) => setCurrentGoal(e.target.value)}
                  placeholder="Reach $10k MRR by Q4..."
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-['Space_Grotesk'] text-2xl font-bold mb-1">What&apos;s blocking you?</h2>
                <p className="text-[#8A88A8] text-sm">We&apos;ll match you with people who can help.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#8A88A8] mb-1.5">Current blocker</label>
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={3}
                  value={currentBlocker}
                  onChange={(e) => setCurrentBlocker(e.target.value)}
                  placeholder="Struggling with marketing and finding first customers..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#8A88A8] mb-1.5">Your skills (what can you help others with?)</label>
                <div className="flex gap-2 mb-2">
                  <input
                    className={inputCls}
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
                    placeholder="e.g. Marketing, Sales, React"
                  />
                  <button type="button" onClick={addSkill} className="bg-[#6D28D9] hover:bg-[#8B5CF6] text-white px-4 rounded-xl font-medium">
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s) => (
                    <span key={s} className="inline-flex items-center gap-1 bg-[#6D28D9]/10 border border-[#6D28D9]/20 text-[#8B5CF6] px-3 py-1 rounded-lg text-sm">
                      {s}
                      <button type="button" onClick={() => setSkills(skills.filter((x) => x !== s))} className="hover:text-white">×</button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-['Space_Grotesk'] text-2xl font-bold mb-1">Last step — your bio</h2>
                <p className="text-[#8A88A8] text-sm">A short intro for your profile.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#8A88A8] mb-1.5">Bio (optional)</label>
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Founder building in public. Love coffee and shipping fast."
                />
              </div>
              <div className="bg-[#121428] rounded-xl p-4 text-sm text-[#8A88A8]">
                <div className="text-[#EDEAF8] font-medium">{fullName || 'Your name'} <span className="text-[#8A88A8]">@{username || 'username'}</span></div>
                <div className="mt-1">{industry}{location ? ` · ${location}` : ''}</div>
                <div className="mt-1 text-[#8B5CF6]">🎯 {currentGoal || '—'}</div>
                <div className="mt-1 text-[#F59E0B]">🧱 {currentBlocker || '—'}</div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-8">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className="text-[#8A88A8] hover:text-[#EDEAF8] disabled:opacity-30 px-4 py-2"
            >
              Back
            </button>
            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={() => canProceed() && setStep((s) => s + 1)}
                disabled={!canProceed()}
                className="bg-[#6D28D9] hover:bg-[#8B5CF6] disabled:opacity-40 text-white px-6 py-2.5 rounded-xl font-semibold"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={finish}
                disabled={loading}
                className="bg-[#6D28D9] hover:bg-[#8B5CF6] disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-semibold"
              >
                {loading ? 'Finishing...' : 'Enter DreamLink'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
