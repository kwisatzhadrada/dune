'use client'

import { useMemo, useState, useEffect } from 'react'
import { Profile } from '@/lib/types'
import { INDUSTRIES, generateMatchScore } from '@/lib/utils'
import PersonCard from './PersonCard'

export default function DiscoverFilters({
  me,
  people,
  currentUserId,
  connectionMap,
}: {
  me: Profile
  people: Profile[]
  currentUserId: string
  connectionMap: Record<string, string>
}) {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [industry, setIndustry] = useState('')
  const [sort, setSort] = useState<'match' | 'recent'>('match')

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 250)
    return () => clearTimeout(t)
  }, [searchInput])

  const filtered = useMemo(() => {
    let list = people.filter((p) => {
      if (industry && p.industry !== industry) return false
      if (search) {
        const q = search.toLowerCase()
        const hay = [
          p.full_name, p.username, p.bio, p.current_goal, p.current_blocker, p.location,
          ...(p.skills || []),
        ].filter(Boolean).join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
    if (sort === 'match') {
      list = [...list].sort((a, b) => generateMatchScore(me, b) - generateMatchScore(me, a))
    }
    return list
  }, [people, industry, search, sort, me])

  return (
    <div>
      <h1 className="font-['Space_Grotesk'] text-2xl font-bold mb-6">Discover builders</h1>

      <div className="space-y-3 mb-6">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name, skill, goal..."
          className="w-full bg-[#0C0D22] border border-[#3C3A58] focus:border-[#6D28D9] rounded-xl px-4 py-3 outline-none"
        />
        <div className="flex gap-3 flex-wrap">
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="bg-[#0C0D22] border border-[#3C3A58] focus:border-[#6D28D9] rounded-xl px-3 py-2 outline-none text-sm"
          >
            <option value="">All industries</option>
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={() => setSort('match')}
              className={`px-3 py-2 rounded-xl text-sm border ${sort === 'match' ? 'bg-[#6D28D9] border-[#6D28D9] text-white' : 'bg-[#0C0D22] border-[#3C3A58] text-[#8A88A8]'}`}
            >
              Best match
            </button>
            <button
              onClick={() => setSort('recent')}
              className={`px-3 py-2 rounded-xl text-sm border ${sort === 'recent' ? 'bg-[#6D28D9] border-[#6D28D9] text-white' : 'bg-[#0C0D22] border-[#3C3A58] text-[#8A88A8]'}`}
            >
              Recent
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center text-[#8A88A8] py-16">No builders found.</div>
        ) : (
          filtered.map((p) => (
            <PersonCard
              key={p.id}
              person={p}
              me={me}
              currentUserId={currentUserId}
              initialStatus={connectionMap[p.id]}
            />
          ))
        )}
      </div>
    </div>
  )
}
