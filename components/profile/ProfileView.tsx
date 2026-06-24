'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Profile } from '@/lib/types'
import { getInitials } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface ProfileViewProps {
  profile: Profile | null
  isOwn: boolean
  connectionStatus?: string
  currentUserId?: string
  postsCount?: number
  connectionsCount?: number
}

export default function ProfileView({
  profile,
  isOwn,
  connectionStatus,
  currentUserId,
  postsCount = 0,
  connectionsCount = 0,
}: ProfileViewProps) {
  const supabase = createClient()
  const [connStatus, setConnStatus] = useState(connectionStatus)
  const [connecting, setConnecting] = useState(false)

  if (!profile) return null

  async function handleConnect() {
    if (!currentUserId || !profile) return
    setConnecting(true)
    const { error } = await supabase.from('connections').insert({
      requester_id: currentUserId,
      addressee_id: profile.id,
      status: 'pending',
    })
    if (!error) setConnStatus('pending')
    setConnecting(false)
  }

  return (
    <div className="bg-[#0C0D22] border border-[#3C3A58]/30 rounded-2xl overflow-hidden">
      {/* Cover / header bg */}
      <div className="h-24 bg-gradient-to-r from-[#6D28D9]/30 to-[#8B5CF6]/10" />

      <div className="px-6 pb-6">
        {/* Avatar row */}
        <div className="flex items-end justify-between -mt-10 mb-4">
          <div>
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || ''}
                className="w-20 h-20 rounded-full border-4 border-[#0C0D22] object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full border-4 border-[#0C0D22] bg-[#6D28D9] flex items-center justify-center text-white text-2xl font-bold">
                {getInitials(profile.full_name)}
              </div>
            )}
          </div>
          <div className="flex gap-2 mb-1">
            {isOwn ? (
              <span className="text-xs bg-[#121428] border border-[#3C3A58] text-[#8A88A8] px-3 py-1.5 rounded-lg">
                Edit below ↓
              </span>
            ) : (
              <>
                {connStatus === 'accepted' ? (
                  <Link
                    href={`/messages/${profile.id}`}
                    className="bg-[#6D28D9] hover:bg-[#8B5CF6] text-white px-4 py-2 rounded-xl text-sm font-medium"
                  >
                    Message
                  </Link>
                ) : connStatus === 'pending' ? (
                  <span className="bg-[#121428] border border-[#3C3A58] text-[#8A88A8] px-4 py-2 rounded-xl text-sm">
                    Pending
                  </span>
                ) : (
                  <button
                    onClick={handleConnect}
                    disabled={connecting}
                    className="bg-[#6D28D9] hover:bg-[#8B5CF6] disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-medium"
                  >
                    {connecting ? '...' : 'Connect'}
                  </button>
                )}
                <Link
                  href={`/messages/${profile.id}`}
                  className="bg-[#121428] border border-[#3C3A58] hover:border-[#6D28D9] text-[#EDEAF8] px-4 py-2 rounded-xl text-sm font-medium"
                >
                  DM
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Name & identity */}
        <div className="mb-4">
          <h1 className="font-['Space_Grotesk'] text-2xl font-bold text-[#EDEAF8]">
            {profile.full_name || 'Anonymous'}
          </h1>
          {profile.username && (
            <div className="text-[#8A88A8] text-sm">@{profile.username}</div>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {profile.industry && (
              <span className="text-xs bg-[#6D28D9]/10 border border-[#6D28D9]/20 text-[#8B5CF6] px-2.5 py-1 rounded-lg">
                {profile.industry}
              </span>
            )}
            {profile.location && (
              <span className="text-xs bg-[#121428] border border-[#3C3A58] text-[#8A88A8] px-2.5 py-1 rounded-lg">
                📍 {profile.location}
              </span>
            )}
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-[#8A88A8] text-sm leading-relaxed mb-4">{profile.bio}</p>
        )}

        {/* Stats */}
        <div className="flex gap-6 mb-4 text-center">
          <div>
            <div className="font-['Space_Grotesk'] font-bold text-lg text-[#EDEAF8]">{postsCount}</div>
            <div className="text-xs text-[#8A88A8]">Posts</div>
          </div>
          <div>
            <div className="font-['Space_Grotesk'] font-bold text-lg text-[#EDEAF8]">{connectionsCount}</div>
            <div className="text-xs text-[#8A88A8]">Connections</div>
          </div>
        </div>

        {/* Goal */}
        {profile.current_goal && (
          <div className="bg-[#121428] rounded-xl p-4 mb-3">
            <div className="text-xs font-medium text-[#8A88A8] uppercase tracking-wide mb-1">🎯 Current Goal</div>
            <div className="text-[#EDEAF8] text-sm">{profile.current_goal}</div>
          </div>
        )}

        {/* Blocker */}
        {profile.current_blocker && (
          <div className="bg-[#121428] border border-[#C2410C]/20 rounded-xl p-4 mb-3">
            <div className="text-xs font-medium text-[#F59E0B] uppercase tracking-wide mb-1">⚡ Current Blocker</div>
            <div className="text-[#EDEAF8] text-sm">{profile.current_blocker}</div>
          </div>
        )}

        {/* Skills */}
        {profile.skills && profile.skills.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-medium text-[#8A88A8] uppercase tracking-wide mb-2">Skills I can help with</div>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="text-xs bg-[#6D28D9]/10 border border-[#6D28D9]/20 text-[#8B5CF6] px-2.5 py-1 rounded-lg"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Social links */}
        <div className="flex gap-3">
          {profile.linkedin_url && (
            <a
              href={profile.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#8A88A8] hover:text-[#8B5CF6] transition-colors"
            >
              LinkedIn →
            </a>
          )}
          {profile.twitter_url && (
            <a
              href={profile.twitter_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#8A88A8] hover:text-[#8B5CF6] transition-colors"
            >
              Twitter →
            </a>
          )}
          {profile.website_url && (
            <a
              href={profile.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#8A88A8] hover:text-[#8B5CF6] transition-colors"
            >
              Website →
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
