'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/lib/types'
import { INDUSTRIES, getInitials } from '@/lib/utils'

export default function ProfileEditor({ profile }: { profile: Profile }) {
  const supabase = createClient()
  const router = useRouter()

  const [fullName, setFullName] = useState(profile.full_name || '')
  const [username, setUsername] = useState(profile.username || '')
  const [location, setLocation] = useState(profile.location || '')
  const [industry, setIndustry] = useState(profile.industry || '')
  const [currentGoal, setCurrentGoal] = useState(profile.current_goal || '')
  const [currentBlocker, setCurrentBlocker] = useState(profile.current_blocker || '')
  const [bio, setBio] = useState(profile.bio || '')
  const [linkedin, setLinkedin] = useState(profile.linkedin_url || '')
  const [twitter, setTwitter] = useState(profile.twitter_url || '')
  const [website, setWebsite] = useState(profile.website_url || '')
  const [skills, setSkills] = useState<string[]>(profile.skills || [])
  const [skillInput, setSkillInput] = useState('')
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '')

  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const inputCls = 'w-full bg-[#121428] border border-[#3C3A58] focus:border-[#6D28D9] text-[#EDEAF8] placeholder-[#3C3A58] rounded-xl px-4 py-3 outline-none transition-colors'

  function addSkill() {
    const s = skillInput.trim()
    if (s && !skills.includes(s)) setSkills([...skills, s])
    setSkillInput('')
  }

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setMessage(null)
    const ext = file.name.split('.').pop()
    const path = `${profile.id}/avatar-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (error) {
      setMessage({ type: 'err', text: error.message })
      setUploading(false)
      return
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    setAvatarUrl(data.publicUrl)
    setUploading(false)
  }

  async function save() {
    setSaving(true)
    setMessage(null)
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        username: username.trim().toLowerCase().replace(/\s+/g, '_'),
        location: location.trim() || null,
        industry: industry || null,
        current_goal: currentGoal.trim() || null,
        current_blocker: currentBlocker.trim() || null,
        bio: bio.trim() || null,
        linkedin_url: linkedin.trim() || null,
        twitter_url: twitter.trim() || null,
        website_url: website.trim() || null,
        skills,
        avatar_url: avatarUrl || null,
      })
      .eq('id', profile.id)

    if (error) {
      setMessage({ type: 'err', text: error.message })
      setSaving(false)
      return
    }
    setMessage({ type: 'ok', text: 'Profile saved!' })
    setSaving(false)
    router.refresh()
  }

  return (
    <div className="bg-[#0C0D22] border border-[#3C3A58]/30 rounded-2xl p-6 space-y-5">
      {message && (
        <div className={`rounded-lg px-4 py-3 text-sm ${message.type === 'ok' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
          {message.text}
        </div>
      )}

      <div className="flex items-center gap-4">
        {avatarUrl ? (
          <Image src={avatarUrl} alt="" width={72} height={72} className="rounded-full object-cover w-[72px] h-[72px]" />
        ) : (
          <div className="w-[72px] h-[72px] rounded-full bg-[#6D28D9] flex items-center justify-center text-2xl font-semibold text-white">
            {getInitials(fullName)}
          </div>
        )}
        <label className="bg-[#121428] border border-[#3C3A58] hover:border-[#6D28D9] text-[#EDEAF8] px-4 py-2 rounded-xl text-sm font-medium cursor-pointer">
          {uploading ? 'Uploading...' : 'Change avatar'}
          <input type="file" accept="image/*" onChange={uploadAvatar} className="hidden" disabled={uploading} />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#8A88A8] mb-1.5">Full name</label>
          <input className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#8A88A8] mb-1.5">Username</label>
          <input className={inputCls} value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#8A88A8] mb-1.5">Location</label>
          <input className={inputCls} value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#8A88A8] mb-1.5">Industry</label>
          <select className={inputCls} value={industry} onChange={(e) => setIndustry(e.target.value)}>
            <option value="">None</option>
            {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#8A88A8] mb-1.5">Bio</label>
        <textarea className={`${inputCls} resize-none`} rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#8A88A8] mb-1.5">Current goal</label>
        <textarea className={`${inputCls} resize-none`} rows={2} value={currentGoal} onChange={(e) => setCurrentGoal(e.target.value)} />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#8A88A8] mb-1.5">Current blocker</label>
        <textarea className={`${inputCls} resize-none`} rows={2} value={currentBlocker} onChange={(e) => setCurrentBlocker(e.target.value)} />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#8A88A8] mb-1.5">Skills</label>
        <div className="flex gap-2 mb-2">
          <input
            className={inputCls}
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
            placeholder="Add a skill"
          />
          <button onClick={addSkill} className="bg-[#6D28D9] hover:bg-[#8B5CF6] text-white px-4 rounded-xl font-medium">Add</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {skills.map((s) => (
            <span key={s} className="inline-flex items-center gap-1 bg-[#6D28D9]/10 border border-[#6D28D9]/20 text-[#8B5CF6] px-3 py-1 rounded-lg text-sm">
              {s}
              <button onClick={() => setSkills(skills.filter((x) => x !== s))} className="hover:text-white">×</button>
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#8A88A8] mb-1.5">LinkedIn</label>
          <input className={inputCls} value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#8A88A8] mb-1.5">Twitter</label>
          <input className={inputCls} value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="https://..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#8A88A8] mb-1.5">Website</label>
          <input className={inputCls} value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="bg-[#6D28D9] hover:bg-[#8B5CF6] disabled:opacity-50 text-white px-6 py-3 rounded-xl font-semibold"
      >
        {saving ? 'Saving...' : 'Save changes'}
      </button>
    </div>
  )
}
