'use client'

import { useRef, useState, DragEvent } from 'react'
import { validateImageFile, validateVideoFile, MAX_IMAGES_PER_POST } from '@/lib/media'

export type MediaFile = {
  id: string
  file: File
  preview: string
  type: 'image' | 'video'
}

export default function MediaUploader({
  accept,
  maxFiles = MAX_IMAGES_PER_POST,
  files,
  onChange,
  disabled,
}: {
  accept: 'images' | 'video'
  maxFiles?: number
  files: MediaFile[]
  onChange: (files: MediaFile[]) => void
  disabled?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function makeMediaFile(file: File): MediaFile | null {
    const isImage = file.type.startsWith('image/')
    const validationErr = isImage ? validateImageFile(file) : validateVideoFile(file)
    if (validationErr) { setError(validationErr); return null }
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      preview: URL.createObjectURL(file),
      type: isImage ? 'image' : 'video',
    }
  }

  function addFiles(incoming: FileList | File[]) {
    setError(null)
    const arr = Array.from(incoming)
    if (accept === 'video' && arr.length > 1) {
      setError('Only one video per post.')
      return
    }
    const remaining = maxFiles - files.length
    if (arr.length > remaining) {
      setError(`You can add up to ${maxFiles} images per post.`)
      return
    }
    const newFiles = arr.map(makeMediaFile).filter(Boolean) as MediaFile[]
    if (newFiles.length > 0) onChange([...files, ...newFiles])
  }

  function remove(id: string) {
    const updated = files.filter((f) => f.id !== id)
    const removed = files.find((f) => f.id === id)
    if (removed) URL.revokeObjectURL(removed.preview)
    onChange(updated)
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    if (disabled) return
    addFiles(e.dataTransfer.files)
  }

  const acceptAttr = accept === 'images'
    ? 'image/jpeg,image/png,image/webp,image/gif'
    : 'video/mp4,video/quicktime,video/webm'

  const isEmpty = files.length === 0

  return (
    <div>
      {isEmpty ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            dragging
              ? 'border-[#8B5CF6] bg-[#8B5CF6]/10'
              : 'border-[#3C3A58] hover:border-[#6D28D9] bg-[#121428]/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="text-3xl mb-2">{accept === 'images' ? '📸' : '🎬'}</div>
          <div className="text-sm font-semibold text-[#EDEAF8] mb-1">
            {accept === 'images' ? 'Drop photos here or click to browse' : 'Drop video here or click to browse'}
          </div>
          <div className="text-xs text-[#8A88A8]">
            {accept === 'images'
              ? `JPEG, PNG, WebP, GIF · Up to ${maxFiles} images · 10 MB each`
              : 'MP4, MOV, WebM · 100 MB max'}
          </div>
        </div>
      ) : (
        <div>
          <div className={`grid gap-2 mb-2 ${
            files.length === 1 ? 'grid-cols-1' :
            files.length === 2 ? 'grid-cols-2' :
            'grid-cols-3'
          }`}>
            {files.map((f) => (
              <div key={f.id} className="relative rounded-lg overflow-hidden aspect-square group">
                {f.type === 'image' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.preview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <video src={f.preview} className="w-full h-full object-cover" muted />
                )}
                <button
                  onClick={() => remove(f.id)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                >
                  ×
                </button>
              </div>
            ))}
            {accept === 'images' && files.length < maxFiles && (
              <button
                onClick={() => !disabled && inputRef.current?.click()}
                className="aspect-square rounded-lg border-2 border-dashed border-[#3C3A58] hover:border-[#6D28D9] text-[#8A88A8] hover:text-[#EDEAF8] flex items-center justify-center text-2xl transition-colors"
              >
                +
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-[#EF4444] mt-2">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={acceptAttr}
        multiple={accept === 'images'}
        className="hidden"
        onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = '' }}
      />
    </div>
  )
}
