'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/lib/types'
import { getInitials } from '@/lib/utils'

const links = [
  { href: '/feed', label: 'Feed', icon: '📣' },
  { href: '/discover', label: 'Discover', icon: '🔍' },
  { href: '/matches', label: 'Matches', icon: '🤝' },
  { href: '/messages', label: 'Messages', icon: '💬' },
  { href: '/messages/group', label: 'Group Chat', icon: '🌐' },
  { href: '/profile', label: 'Profile', icon: '👤' },
]

export default function Sidebar({ profile, unreadCount }: { profile: Profile; unreadCount: number }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 bg-[#0C0D22] border-r border-[#3C3A58]/30 z-40">
      <div className="p-6">
        <Link href="/feed" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#6D28D9] flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
          </div>
          <span className="font-['Space_Grotesk'] font-bold text-xl">DreamLink</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {links.map((link) => {
          const active = pathname === link.href || (link.href !== '/messages' && pathname.startsWith(link.href) && link.href !== '/feed') || (link.href === '/feed' && pathname === '/feed')
          const isActive = pathname === link.href || (link.href === '/messages' && pathname.startsWith('/messages') && !pathname.startsWith('/messages/group')) || (link.href === '/profile' && pathname.startsWith('/profile')) || active
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                isActive ? 'bg-[#6D28D9]/15 text-[#EDEAF8]' : 'text-[#8A88A8] hover:bg-[#121428] hover:text-[#EDEAF8]'
              }`}
            >
              <span className="text-lg">{link.icon}</span>
              <span className="font-medium">{link.label}</span>
              {link.href === '/messages' && unreadCount > 0 && (
                <span className="ml-auto bg-[#6D28D9] text-white text-xs rounded-full px-2 py-0.5">{unreadCount}</span>
              )}
            </Link>
          )
        })}
        {profile.is_admin && (
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
              pathname.startsWith('/admin') ? 'bg-[#6D28D9]/15 text-[#EDEAF8]' : 'text-[#8A88A8] hover:bg-[#121428] hover:text-[#EDEAF8]'
            }`}
          >
            <span className="text-lg">🛡️</span>
            <span className="font-medium">Admin</span>
          </Link>
        )}
      </nav>

      <div className="p-3 border-t border-[#3C3A58]/30">
        <div className="flex items-center gap-3 px-2 py-2">
          {profile.avatar_url ? (
            <Image src={profile.avatar_url} alt="" width={36} height={36} className="rounded-full object-cover w-9 h-9" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-[#6D28D9] flex items-center justify-center text-sm font-semibold text-white">
              {getInitials(profile.full_name)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{profile.full_name}</div>
            <div className="text-xs text-[#8A88A8] truncate">@{profile.username}</div>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full mt-2 text-sm text-[#8A88A8] hover:text-[#EF4444] px-3 py-2 rounded-lg hover:bg-[#121428] transition-colors text-left"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
