'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const THRESHOLD = 72
const MAX_PULL = 100

export default function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef(0)
  const pullDistanceRef = useRef(0)
  const pullingRef = useRef(false)
  const refreshingRef = useRef(false)
  const [displayPull, setDisplayPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  const triggerHaptic = useCallback(() => {
    if ('vibrate' in navigator) navigator.vibrate(8)
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY > 0 || refreshingRef.current) return
      startYRef.current = e.touches[0].clientY
      pullingRef.current = true
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!pullingRef.current) return
      const delta = e.touches[0].clientY - startYRef.current
      if (delta <= 0) {
        pullDistanceRef.current = 0
        setDisplayPull(0)
        return
      }
      if (window.scrollY === 0 && delta > 0) e.preventDefault()
      const clamped = Math.min(delta * 0.45, MAX_PULL)
      pullDistanceRef.current = clamped
      setDisplayPull(clamped)
      if (clamped >= THRESHOLD && pullDistanceRef.current < THRESHOLD + 1) triggerHaptic()
    }

    const onTouchEnd = async () => {
      if (!pullingRef.current) return
      pullingRef.current = false
      const dist = pullDistanceRef.current
      pullDistanceRef.current = 0
      setDisplayPull(0)

      if (dist >= THRESHOLD && !refreshingRef.current) {
        refreshingRef.current = true
        setRefreshing(true)
        triggerHaptic()
        router.refresh()
        await new Promise((r) => setTimeout(r, 900))
        setRefreshing(false)
        refreshingRef.current = false
      }
    }

    // passive: true on touchstart/touchend so scroll is never blocked there
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [router, triggerHaptic]) // ← no pullDistance in deps; we use a ref instead

  const progress = Math.min(displayPull / THRESHOLD, 1)
  const showIndicator = displayPull > 6 || refreshing

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Pull indicator — GPU composited, never causes layout */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 60,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
          transform: `translateY(${showIndicator ? Math.min(displayPull, 44) - 36 : -36}px)`,
          transition: refreshing ? 'none' : 'transform 0.08s linear',
          willChange: 'transform',
        }}
      >
        <div className="bg-[#1A1B3A] border border-[#3C3A58] rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
          {refreshing ? (
            <div className="w-3.5 h-3.5 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg
              width="14" height="14" viewBox="0 0 14 14" fill="none"
              style={{
                transform: `rotate(${progress * 180}deg)`,
                opacity: Math.max(0.3, progress),
                willChange: 'transform',
              }}
            >
              <path d="M7 2v10M3 8l4 4 4-4" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>

      <div
        style={{
          transform: `translateY(${displayPull}px)`,
          transition: pullingRef.current ? 'none' : 'transform 0.25s cubic-bezier(0.25,0.46,0.45,0.94)',
          willChange: 'transform',
        }}
      >
        {children}
      </div>
    </div>
  )
}
