'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Post, PostType, Dream } from '@/lib/types'
import { TEXT_POST_TYPES, INDUSTRIES, DREAM_STAGES, getDreamStageIcon } from '@/lib/utils'
import { detectEmbed, uploadPostImages, uploadPostVideo } from '@/lib/media'
import MediaUploader, { MediaFile } from './MediaUploader'

type Format = 'text' | 'photo' | 'video' | 'dream_update' | 'milestone' | 'embed'

const FORMATS: { id: Format; icon: string; label: string }[] = [
  { id: 'text',         icon: '✍️', label: 'Text'         },
  { id: 'photo',        icon: '📸', label: 'Photo'        },
  { id: 'video',        icon: '🎬', label: 'Video'        },
  { id: 'dream_update', icon: '✨', label: 'Dream Update' },
  { id: 'milestone',    icon: '🏆', label: 'Milestone'    },
  { id: 'embed',        icon: '🔗', label: 'Link / Embed' },
]

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

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const [format, setFormat] = useState<Format>('text')
  const [postType, setPostType] = useState<PostType>('win')
  const [content, setContent] = useState('')
  const [industry, setIndustry] = useState('')
  const [dreamId, setDreamId] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [dreamStage, setDreamStage] = useState('')
  const [dreamProgress, setDreamProgress] = useState(0)
  const [milestoneType, setMilestoneType] = useState('')
  const [milestoneValue, setMilestoneValue] = useState('')
  const [imageFiles, setImageFiles] = useState<MediaFile[]>([])
  const [videoFiles, setVideoFiles] = useState<MediaFile[]>([])
  const [embedInput, setEmbedInput] = useState('')
  const [detectedEmbed, setDetectedEmbed] = useState<ReturnType<typeof detectEmbed>>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (format !== 'embed') setTimeout(() => textareaRef.current?.focus(), 50)
  }, [format])

  function handleFormatChange(f: Format) {
    setFormat(f)
    setError(null)
    if (f === 'dream_update') setPostType('dream_update')
    else if (f === 'milestone') setPostType('milestone')
    else setPostType('win')
  }

  function handleEmbedInput(value: string) {
    setEmbedInput(value)
    setDetectedEmbed(detectEmbed(value))
  }

  function addTag() {
    const t = tagInput.trim().replace(/^#/, '')
    if (t && !tags.includes(t)) setTags([...tags, t])
    setTagInput('')
  }

  async function submit() {
    const trimmed = content.trim()
    if (format === 'embed' && !detectedEmbed) {
      setError('Paste a YouTube, TikTok, or X link to embed it.')
      return
    }
    if (!trimmed && imageFiles.length === 0 && videoFiles.length === 0 && !detectedEmbed) {
      setError('Please write something.')
      return
    }
    if (trimmed.length > 2000) { setError('Post must be under 2000 characters.'); return }
    if (loading) return
    setLoading(true)
    setError(null)

    let image_urls: string[] = []
    let video_url: string | null = null
    let embed_url: string | null = null
    let embed_type: Post['embed_type'] = null

    if (format === 'photo' && imageFiles.length > 0) {
      const { urls, error: uploadErr } = await uploadPostImages(
        supabase, currentUserId, imageFiles.map((f) => f.file)
      )
      if (uploadErr) { setError(uploadErr); setLoading(false); return }
      image_urls = urls
    }

    if ((format === 'video' || format === 'dream_update') && videoFiles.length > 0) {
      const { url, error: uploadErr } = await uploadPostVideo(
        supabase, currentUserId, videoFiles[0].file
      )
      if (uploadErr) { setError(uploadErr); setLoading(false); return }
      video_url = url
    }

    if (format === 'dream_update' && imageFiles.length > 0) {
      const { urls, error: uploadErr } = await uploadPostImages(
        supabase, currentUserId, imageFiles.map((f) => f.file)
      )
      if (uploadErr) { setError(uploadErr); setLoading(false); return }
      image_urls = urls
    }

    if (format === 'embed' && detectedEmbed) {
      embed_url = detectedEmbed.originalUrl
      embed_type = detectedEmbed.type
    }

    const effectiveType: PostType =
      format === 'dream_update' ? 'dream_update' :
      format === 'milestone' ? 'milestone' :
      postType

    const { data, error: insertErr } = await supabase
      .from('posts')
      .insert({
        user_id: currentUserId,
        content: trimmed || (detectedEmbed ? `Sharing a ${detectedEmbed.type} link` : ''),
        post_type: effectiveType,
        industry: industry || null,
        tags,
        dream_id: dreamId || null,
        image_urls,
        video_url,
        embed_url,
        embed_type,
        shares_count: 0,
      })
      .select('*, profiles(*), dreams(*)')
      .single()

    if (insertErr) { setError(insertErr.message); setLoading(false); return }

    setLoading(false)
    onCreated({
      ...(data as Post),
      image_urls: data.image_urls ?? [],
      shares_count: data.shares_count ?? 0,
      user_has_liked: false,
      user_has_saved: false,
    })
  }

  const isDreamUpdate = format === 'dream_update'
  const isMilestone = format === 'milestone'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg bg-[#0C0D22] border border-[#3C3A58]/50 rounded-t-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#3C3A58]/40 sticky top-0 bg-[#0C0D22] z-10">
          <h2 className="font-['Space_Grotesk'] text-lg font-bold">Create Post</h2>
          <button onClick={onClose} className="text-[#8A88A8] hover:text-[#EDEAF8] text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#121428] transition-colors">×</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Format picker */}
          <div>
            <p className="text-[10px] font-bold text-[#8A88A8] uppercase tracking-widest mb-2">Format</p>
            <div className="grid grid-cols-3 gap-2">
              {FORMATS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => handleFormatChange(f.id)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-semibold transition-colors ${
                    format === f.id
                      ? 'bg-[#6D28D9]/15 border-[#6D28D9]/60 text-[#EDEAF8]'
                      : 'bg-[#121428] border-[#3C3A58] text-[#8A88A8] hover:border-[#6D28D9]/40 hover:text-[#EDEAF8]'
                  }`}
                >
                  <span className="text-base">{f.icon}</span>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-4 py-2.5 text-sm">{error}</div>
          )}

          {/* Text sub-type */}
          {(format === 'text' || format === 'photo' || format === 'video') && (
            <div className="flex flex-wrap gap-1.5">
              {TEXT_POST_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setPostType(t.value)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                    postType === t.value
                      ? 'bg-[#6D28D9] border-[#6D28D9] text-white'
                      : 'bg-[#121428] border-[#3C3A58] text-[#8A88A8] hover:border-[#6D28D9]/40'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {/* Photo uploader */}
          {format === 'photo' && (
            <MediaUploader accept="images" files={imageFiles} onChange={setImageFiles} disabled={loading} />
          )}

          {/* Video uploader */}
          {format === 'video' && (
            <MediaUploader accept="video" maxFiles={1} files={videoFiles} onChange={setVideoFiles} disabled={loading} />
          )}

          {/* Embed input */}
          {format === 'embed' && (
            <div>
              <label className="block text-[10px] font-bold text-[#8A88A8] uppercase tracking-widest mb-1.5">
                YouTube, TikTok or X link
              </label>
              <input
                autoFocus
                value={embedInput}
                onChange={(e) => handleEmbedInput(e.target.value)}
                placeholder="https://youtube.com/watch?v=…"
                className="w-full bg-[#121428] border border-[#3C3A58] focus:border-[#6D28D9] rounded-xl px-4 py-2.5 text-sm outline-none transition-colors"
              />
              {detectedEmbed && (
                <div className="mt-2 flex items-center gap-2 text-xs text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 rounded-lg px-3 py-2">
                  <span>✓</span>
                  <span>
                    {detectedEmbed.type === 'youtube' ? 'YouTube' : detectedEmbed.type === 'tiktok' ? 'TikTok' : 'X'} link detected
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Dream Update fields */}
          {isDreamUpdate && (
            <div className="space-y-3 bg-[#121428] border border-[#6D28D9]/30 rounded-xl p-4">
              <p className="text-[10px] font-bold text-[#8B5CF6] uppercase tracking-widest">Dream Update</p>
              {dreams.length > 0 ? (
                <select
                  value={dreamId}
                  onChange={(e) => setDreamId(e.target.value)}
                  className="w-full bg-[#0C0D22] border border-[#3C3A58] focus:border-[#6D28D9] rounded-xl px-4 py-2.5 text-sm outline-none"
                >
                  <option value="">Select a Dream</option>
                  {dreams.map((d) => (
                    <option key={d.id} value={d.id}>{d.title}</option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-[#8A88A8]">Create a Dream first to post Dream Updates.</p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {DREAM_STAGES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setDreamStage(s)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                      dreamStage === s
                        ? 'bg-[#6D28D9] border-[#6D28D9] text-white'
                        : 'bg-[#0C0D22] border-[#3C3A58] text-[#8A88A8] hover:border-[#6D28D9]/40'
                    }`}
                  >
                    {getDreamStageIcon(s)} {s}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-xs text-[#8A88A8] mb-1">Progress ({dreamProgress}%)</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={dreamProgress}
                  onChange={(e) => setDreamProgress(Number(e.target.value))}
                  className="w-full accent-[#6D28D9]"
                />
              </div>
              <MediaUploader
                accept="images"
                maxFiles={4}
                files={imageFiles}
                onChange={setImageFiles}
                disabled={loading}
              />
            </div>
          )}

          {/* Milestone fields */}
          {isMilestone && (
            <div className="space-y-3 bg-[#121428] border border-[#F59E0B]/25 rounded-xl p-4">
              <p className="text-[10px] font-bold text-[#F59E0B] uppercase tracking-widest">Milestone</p>
              <div className="grid grid-cols-2 gap-1.5">
                {['First Revenue', 'First 100 Users', 'First 1k Users', 'Product Launch', 'App Store', 'Press Feature'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setMilestoneType(t)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors text-left ${
                      milestoneType === t
                        ? 'bg-[#F59E0B]/15 border-[#F59E0B]/50 text-[#FCD34D]'
                        : 'bg-[#0C0D22] border-[#3C3A58] text-[#8A88A8] hover:border-[#F59E0B]/30'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <input
                value={milestoneValue}
                onChange={(e) => setMilestoneValue(e.target.value)}
                placeholder="e.g. $10,000 MRR, 1,000 users"
                className="w-full bg-[#0C0D22] border border-[#3C3A58] focus:border-[#F59E0B] rounded-xl px-4 py-2.5 text-sm outline-none transition-colors"
              />
              {dreams.length > 0 && (
                <select
                  value={dreamId}
                  onChange={(e) => setDreamId(e.target.value)}
                  className="w-full bg-[#0C0D22] border border-[#3C3A58] focus:border-[#6D28D9] rounded-xl px-4 py-2.5 text-sm outline-none"
                >
                  <option value="">Link to a Dream (optional)</option>
                  {dreams.map((d) => (
                    <option key={d.id} value={d.id}>{d.title}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Content textarea */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={isDreamUpdate || isMilestone ? 3 : 5}
              maxLength={2000}
              placeholder={
                isDreamUpdate ? 'What happened? What did you ship, learn, or unlock?' :
                isMilestone ? 'Tell the story behind this milestone…' :
                format === 'embed' ? 'Add your take on this…' :
                'A win, an obstacle, a lesson, a build update…'
              }
              className="w-full bg-[#121428] border border-[#3C3A58] focus:border-[#6D28D9] rounded-xl px-4 py-3 outline-none resize-none transition-colors"
            />
            <span className={`absolute bottom-2 right-3 text-[11px] ${content.length > 1800 ? 'text-[#EF4444]' : 'text-[#3C3A58]'}`}>
              {content.length}/2000
            </span>
          </div>

          {/* Dream link (text/photo/video) */}
          {(format === 'text' || format === 'photo' || format === 'video') && dreams.length > 0 && (
            <select
              value={dreamId}
              onChange={(e) => setDreamId(e.target.value)}
              className="w-full bg-[#121428] border border-[#3C3A58] focus:border-[#6D28D9] rounded-xl px-4 py-2.5 text-sm outline-none"
            >
              <option value="">Link to a Dream (optional)</option>
              {dreams.map((d) => (
                <option key={d.id} value={d.id}>{d.title}</option>
              ))}
            </select>
          )}

          {/* Industry */}
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="w-full bg-[#121428] border border-[#3C3A58] focus:border-[#6D28D9] rounded-xl px-4 py-2.5 text-sm outline-none"
          >
            <option value="">Industry (optional)</option>
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>

          {/* Tags */}
          <div>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                placeholder="Tags (press Enter to add)"
                className="flex-1 bg-[#121428] border border-[#3C3A58] focus:border-[#6D28D9] rounded-xl px-3 py-2 text-sm outline-none"
              />
              <button onClick={addTag} className="bg-[#121428] border border-[#3C3A58] hover:border-[#6D28D9] text-[#EDEAF8] px-3 rounded-xl text-sm transition-colors">Add</button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 bg-[#6D28D9]/10 border border-[#6D28D9]/20 text-[#8B5CF6] px-2.5 py-1 rounded-lg text-xs">
                    #{t}
                    <button onClick={() => setTags(tags.filter((x) => x !== t))} className="hover:text-white ml-0.5">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={submit}
            disabled={loading}
            className="w-full bg-[#6D28D9] hover:bg-[#8B5CF6] disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-colors"
          >
            {loading ? 'Posting…' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  )
}
