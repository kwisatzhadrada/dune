'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback } from 'react'

function IconFeed({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function IconDiscover({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function IconMatches({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function IconMessages({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      {active ? (
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      ) : (
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      )}
    </svg>
  )
}

function IconProfile({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

const links = [
  { href: '/feed',     label: 'Feed',     Icon: IconFeed },
  { href: '/discover', label: 'Discover', Icon: IconDiscover },
  { href: '/matches',  label: 'Matches',  Icon: IconMatches },
  { href: '/messages', label: 'Chats',    Icon: IconMessages },
  { href: '/profile',  label: 'Me',       Icon: IconProfile },
]

export default function BottomNav({ unreadCount, isAdmin }: { unreadCount: number; isAdmin: boolean }) {
  const pathname = usePathname()

  const haptic = useCallback(() => {
    if ('vibrate' in navigator) navigator.vibrate(5)
  }, [])

  return (
    <nav
      className="bottom-nav-fixed lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0C0D22]/98 backdrop-blur-xl border-t border-[#3C3A58]/25"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch justify-around h-14">
        {links.map(({ href, label, Icon }) => {
          const active =
            href === '/messages'
              ? pathname.startsWith('/messages')
              : href === '/profile'
              ? pathname === '/profile' || pathname.startsWith('/profile/')
              : pathname === href || pathname.startsWith(href + '/')

          return (
            <Link
              key={href}
              href={href}
              onClick={haptic}
              className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 transition-colors duration-100 active:opacity-50 ${
                active ? 'text-[#8B5CF6]' : 'text-[#6B6988]'
              }`}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#8B5CF6] rounded-full" />
              )}
              <Icon active={active} />
              <span className="text-[10px] font-medium tracking-tight">{label}</span>
              {href === '/messages' && unreadCount > 0 && (
                <span className="absolute top-2 right-[calc(50%-14px)] bg-[#7C3AED] text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
