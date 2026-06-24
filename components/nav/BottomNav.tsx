'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/feed', label: 'Feed', icon: '📣' },
  { href: '/discover', label: 'Discover', icon: '🔍' },
  { href: '/matches', label: 'Matches', icon: '🤝' },
  { href: '/messages', label: 'Chats', icon: '💬' },
  { href: '/profile', label: 'Profile', icon: '👤' },
]

export default function BottomNav({ unreadCount, isAdmin }: { unreadCount: number; isAdmin: boolean }) {
  const pathname = usePathname()
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0C0D22] border-t border-[#3C3A58]/30">
      <div className="flex items-center justify-around">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(link.href + '/')
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`relative flex flex-col items-center gap-0.5 py-2 px-3 flex-1 ${active ? 'text-[#8B5CF6]' : 'text-[#8A88A8]'}`}
            >
              <span className="text-xl">{link.icon}</span>
              <span className="text-[10px] font-medium">{link.label}</span>
              {link.href === '/messages' && unreadCount > 0 && (
                <span className="absolute top-1 right-1/4 bg-[#6D28D9] text-white text-[9px] rounded-full px-1.5 py-0.5">{unreadCount}</span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
